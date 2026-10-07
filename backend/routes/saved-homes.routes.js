const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get user's saved homes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, sh.created_at as saved_at
            FROM saved_homes sh
            JOIN properties p ON sh.property_id = p.id
            WHERE sh.user_id = ?
            ORDER BY sh.created_at DESC`,
            [req.user.userId]
        );
        res.json({ success: true, data: { savedHomes: result.rows } });
    } catch (error) {
        console.error('Get saved homes error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Save a property
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { propertyId } = req.body;

        if (!propertyId) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_FIELD', message: 'propertyId is required' } });
        }

        const propertyCheck = await db.query('SELECT id FROM properties WHERE id = ?', [propertyId]);
        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' } });
        }

        const existing = await db.query(
            'SELECT id FROM saved_homes WHERE user_id = ? AND property_id = ?',
            [req.user.userId, propertyId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, error: { code: 'ALREADY_SAVED', message: 'Property already saved' } });
        }

        const id = uuidv4();
        await db.query(
            'INSERT INTO saved_homes (id, user_id, property_id) VALUES (?, ?, ?)',
            [id, req.user.userId, propertyId]
        );

        res.status(201).json({ success: true, data: { savedHome: { id, userId: req.user.userId, propertyId } } });
    } catch (error) {
        console.error('Save property error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Unsave a property
router.delete('/:propertyId', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM saved_homes WHERE user_id = ? AND property_id = ?',
            [req.user.userId, req.params.propertyId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_SAVED', message: 'Property not in saved homes' } });
        }

        res.json({ success: true, data: { message: 'Property removed from saved homes' } });
    } catch (error) {
        console.error('Unsave property error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

module.exports = router;
