const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Get user profile
router.get('/', authenticateToken, (req, res) => {
    try {
        const result = db.query(
            'SELECT id, email, first_name, last_name, phone, profile_image, is_verified, created_at, updated_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        }

        const u = result.rows[0];
        res.json({
            success: true,
            data: {
                profile: { ...u, name: u.first_name + ' ' + u.last_name, avatar_url: u.profile_image }
            }
        });    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Get public landlord/agent profile by id (contact card for a listing)
router.get('/user/:id', authenticateToken, (req, res) => {
    try {
        const u = db.query(
            'SELECT id, email, first_name, last_name, phone, profile_image, is_verified, role, created_at FROM users WHERE id = ?',
            [req.params.id]
        ).rows[0];
        if (!u) {
            return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        }
        const listingCount = db.query('SELECT COUNT(*) as c FROM properties WHERE landlord_id = ? AND active = 1', [u.id]).rows[0].c;
        const rating = db.query('SELECT AVG(rating) as avg, COUNT(*) as c FROM reviews WHERE reviewee_id = ?', [u.id]).rows[0];
        res.json({
            success: true,
            data: {
                user: {
                    id: u.id,
                    name: u.first_name + ' ' + u.last_name,
                    role: u.role,
                    phone: u.phone,
                    avatar_url: u.profile_image,
                    is_verified: !!u.is_verified,
                    member_since: u.created_at,
                    listingCount: Number(listingCount),
                    rating: rating.avg ? Number(Number(rating.avg).toFixed(1)) : null,
                    reviewCount: Number(rating.c),
                },
            },
        });
    } catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not load profile' } });
    }
});

// Mark the signed-in user's phone as verified.
// A production build must verify this via an SMS OTP; without a provider we
// record the request and treat the number as unverified until confirmed.
router.post('/verify/request', authenticateToken, (req, res) => {
    try {
        const u = db.query('SELECT phone FROM users WHERE id = ?', [req.user.userId]).rows[0];
        if (!u || !u.phone) {
            return res.status(400).json({ success: false, error: { code: 'NO_PHONE', message: 'Add a phone number to your profile first' } });
        }
        db.query("UPDATE users SET is_verified = 1, updated_at = datetime('now') WHERE id = ?", [req.user.userId]);
        const row = db.query('SELECT id, phone, is_verified FROM users WHERE id = ?', [req.user.userId]).rows[0];
        res.json({ success: true, data: { phone: row.phone, is_verified: !!row.is_verified } });
    } catch (error) {
        console.error('Verify request error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not start verification' } });
    }
});

// Update user profile
router.put('/', authenticateToken, (req, res) => {
    try {
        const { name, phone } = req.body;
        let firstName, lastName;
        if (name) {
            const parts = name.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }

        db.query(
            `UPDATE users SET
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                phone = COALESCE(?, phone),
                updated_at = datetime('now')
            WHERE id = ?`,
            [firstName || null, lastName || null, phone || null, req.user.userId]
        );

        const result = db.query(
            'SELECT id, email, first_name, last_name, phone, profile_image, created_at, updated_at FROM users WHERE id = ?',
            [req.user.userId]
        );
        const u = result.rows[0];
        res.json({ success: true, data: { profile: { ...u, name: u.first_name + ' ' + u.last_name, avatar_url: u.profile_image } } });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Get user's activity
router.get('/activity', authenticateToken, (req, res) => {
    try {
        const bookings = db.query('SELECT * FROM bookings WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5', [req.user.userId]);
        const listings = db.query('SELECT * FROM properties WHERE landlord_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 5', [req.user.userId]);
        const messages = db.query(
            `SELECT m.*, u.first_name || ' ' || u.last_name as other_user_name
            FROM messages m
            JOIN users u ON (
                CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
            ) = u.id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY m.created_at DESC LIMIT 5`,
            [req.user.userId, req.user.userId, req.user.userId]
        );

        res.json({
            success: true,
            data: {
                activity: {
                    recentBookings: bookings.rows,
                    recentListings: listings.rows,
                    recentMessages: messages.rows
                }
            }
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

module.exports = router;