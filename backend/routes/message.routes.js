const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Send a message
router.post('/', authenticateToken, (req, res) => {
    try {
        const { receiverId, message, propertyId } = req.body;
        const senderId = req.user.userId;

        const receiverCheck = db.query('SELECT id FROM users WHERE id = ?', [receiverId]);
        if (receiverCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Recipient not found' } });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_RECIPIENT', message: 'Cannot send message to yourself' } });
        }

        if (propertyId) {
            const propertyCheck = db.query('SELECT id FROM properties WHERE id = ? AND active = 1', [propertyId]);
            if (propertyCheck.rows.length === 0) {
                return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' } });
            }
        }

        const id = uuidv4();
        db.query(
            'INSERT INTO messages (id, sender_id, receiver_id, content, property_id) VALUES (?, ?, ?, ?, ?)',
            [id, senderId, receiverId, message, propertyId || null]
        );

        const result = db.query('SELECT * FROM messages WHERE id = ?', [id]);
        res.status(201).json({ success: true, data: { message: result.rows[0] } });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Get conversation history with a user
router.get('/conversations/:userId', authenticateToken, (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.userId;

        const messages = db.query(
            `SELECT m.*,
                sender.first_name || ' ' || sender.last_name as sender_name,
                sender.email as sender_email,
                receiver.first_name || ' ' || receiver.last_name as receiver_name,
                receiver.email as receiver_email
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?)
            OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC`,
            [currentUserId, otherUserId, otherUserId, currentUserId]
        );

        db.query(
            "UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0",
            [currentUserId, otherUserId]
        );

        res.json({ success: true, data: { messages: messages.rows } });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Get all user conversations
router.get('/conversations', authenticateToken, (req, res) => {
    try {
        const conversations = db.query(
            `SELECT m.*,
                CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
                u.first_name || ' ' || u.last_name as other_user_name,
                u.email as other_user_email,
                (SELECT COUNT(*) FROM messages m2 WHERE m2.receiver_id = ? AND m2.sender_id = m.sender_id AND m2.is_read = 0) as unread_count
            FROM messages m
            JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            GROUP BY other_user_id
            ORDER BY m.created_at DESC`,
            [req.user.userId, req.user.userId, req.user.userId, req.user.userId, req.user.userId]
        );
        res.json({ success: true, data: { conversations: conversations.rows } });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Get unread messages count
router.get('/unread-count', authenticateToken, (req, res) => {
    try {
        const result = db.query(
            'SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = ? AND is_read = 0',
            [req.user.userId]
        );
        res.json({ success: true, data: { unreadCount: parseInt(result.rows[0].unread_count) } });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Mark message as read
router.put('/:messageId/read', authenticateToken, (req, res) => {
    try {
        const messageCheck = db.query('SELECT * FROM messages WHERE id = ? AND receiver_id = ?', [req.params.messageId, req.user.userId]);
        if (messageCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'MESSAGE_NOT_FOUND', message: 'Message not found' } });
        }

        db.query("UPDATE messages SET is_read = 1 WHERE id = ?", [req.params.messageId]);
        const result = db.query('SELECT * FROM messages WHERE id = ?', [req.params.messageId]);
        res.json({ success: true, data: { message: result.rows[0] } });
    } catch (error) {
        console.error('Mark message read error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

module.exports = router;