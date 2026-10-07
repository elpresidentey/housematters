const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// GET /api/reviews/user/:id — public reviews for a landlord
router.get('/user/:id', authenticateToken, async (req, res) => {
    try {
        const rows = await db.query(
            `SELECT r.*, u.first_name || ' ' || u.last_name as reviewer_name
             FROM reviews r JOIN users u ON r.reviewer_id = u.id
             WHERE r.reviewee_id = ?
             ORDER BY r.created_at DESC`,
            [req.params.id]
        ).rows;
        const stats = await db.query(
            'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE reviewee_id = ?',
            [req.params.id]
        ).rows[0];
        res.json({
            success: true,
            data: {
                reviews: rows,
                rating: stats.avg ? Number(Number(stats.avg).toFixed(1)) : null,
                count: Number(stats.count),
            },
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not load reviews' } });
    }
});

// POST /api/reviews — leave a review (must have interacted with the landlord)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { revieweeId, rating, comment } = req.body;
        const value = Number(rating);
        if (!revieweeId) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_FIELD', message: 'revieweeId is required' } });
        }
        if (!value || value < 1 || value > 5) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5' } });
        }
        if (revieweeId === req.user.userId) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_REVIEW', message: 'You cannot review yourself' } });
        }
        if (!await db.query('SELECT id FROM users WHERE id = ?', [revieweeId]).rows.length) {
            return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        }

        const hasInteraction = await db.query(
            `SELECT b.id FROM bookings b
             JOIN properties p ON b.property_id = p.id
             WHERE p.landlord_id = ? AND b.tenant_id = ? AND b.status IN ('confirmed', 'completed')
             LIMIT 1`,
            [revieweeId, req.user.userId]
        );
        if (hasInteraction.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: { code: 'NOT_ELIGIBLE', message: 'Only tenants with a confirmed booking can review' },
            });
        }

        const id = uuidv4();
        await db.query(
            'INSERT INTO reviews (id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [id, req.user.userId, revieweeId, value, (comment || '').trim()]
        );
        const row = await db.query('SELECT * FROM reviews WHERE id = ?', [id]).rows[0];
        res.status(201).json({ success: true, data: { review: row } });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not save review' } });
    }
});

module.exports = router;
