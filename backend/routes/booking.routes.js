const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { notify } = require('./notification.routes');

// Create a booking request
router.post('/', authenticateToken, (req, res) => {
    try {
        const { propertyId, startDate, endDate, notes } = req.body;

        const propertyCheck = db.query(
            'SELECT landlord_id FROM properties WHERE id = ? AND active = 1',
            [propertyId]
        );

        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found or is not available' } });
        }

        if (propertyCheck.rows[0].landlord_id === req.user.userId) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_BOOKING', message: 'You cannot book your own property' } });
        }

        const id = uuidv4();
        db.query(
            'INSERT INTO bookings (id, tenant_id, property_id, requested_date, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id, req.user.userId, propertyId, startDate, notes || '', 'pending']
        );

        const result = db.query('SELECT * FROM bookings WHERE id = ?', [id]);
        const property = db.query('SELECT title, landlord_id FROM properties WHERE id = ?', [propertyId]).rows[0];
        notify(
            property.landlord_id,
            'booking_request',
            'New booking request',
            `A tenant requested ${property.title}.`,
            '/dashboard',
        );
        res.status(201).json({ success: true, data: { booking: result.rows[0] } });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Get user's bookings (as tenant)
router.get('/my-bookings', authenticateToken, (req, res) => {
    try {
        const result = db.query(
            `SELECT b.*, p.title as property_title, p.images as property_images, p.address as property_address, p.city as property_city
            FROM bookings b
            JOIN properties p ON b.property_id = p.id
            WHERE b.tenant_id = ?
            ORDER BY b.created_at DESC`,
            [req.user.userId]
        );
        res.json({ success: true, data: { bookings: result.rows } });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Get property bookings (as owner)
router.get('/property/:propertyId', authenticateToken, (req, res) => {
    try {
        const propertyCheck = db.query('SELECT landlord_id FROM properties WHERE id = ?', [req.params.propertyId]);
        if (propertyCheck.rows.length === 0 || propertyCheck.rows[0].landlord_id !== req.user.userId) {
            return res.status(403).json({ success: false, error: { code: 'NOT_AUTHORIZED', message: 'Not authorized' } });
        }

        const result = db.query(
            `SELECT b.*, u.first_name || ' ' || u.last_name as tenant_name, u.email as tenant_email
            FROM bookings b
            JOIN users u ON b.tenant_id = u.id
            WHERE b.property_id = ?
            ORDER BY b.created_at DESC`,
            [req.params.propertyId]
        );
        res.json({ success: true, data: { bookings: result.rows } });
    } catch (error) {
        console.error('Get property bookings error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Update booking status (approve/reject)
router.put('/:id/status', authenticateToken, (req, res) => {
    try {
        const { status } = req.body;
        if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status' } });
        }

        const bookingCheck = db.query(
            `SELECT p.landlord_id FROM bookings b JOIN properties p ON b.property_id = p.id WHERE b.id = ?`,
            [req.params.id]
        );

        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' } });
        }

        if (bookingCheck.rows[0].landlord_id !== req.user.userId) {
            return res.status(403).json({ success: false, error: { code: 'NOT_AUTHORIZED', message: 'Not authorized' } });
        }

        db.query("UPDATE bookings SET status = ?, confirmed_at = datetime('now') WHERE id = ?", [status, req.params.id]);

        const detail = db.query(
            `SELECT b.*, p.title as property_title, p.landlord_id
             FROM bookings b JOIN properties p ON b.property_id = p.id WHERE b.id = ?`,
            [req.params.id],
        ).rows[0];
        const targetId = status === 'cancelled' ? detail.tenant_id : detail.landlord_id;
        notify(
            targetId,
            `booking_${status}`,
            `Booking ${status}`,
            `${detail.property_title} — booking ${status}.`,
            '/dashboard',
        );
        if (status === 'confirmed') {
          notify(detail.tenant_id, 'booking_confirmed', 'Booking confirmed', `${detail.property_title} was confirmed by the landlord.`, '/dashboard');
          notify(detail.landlord_id, 'booking_agreed', 'Next step', 'Create the tenancy agreement for this booking.', '/dashboard');
        }

        const result = db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: { booking: result.rows[0] } });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

module.exports = router;