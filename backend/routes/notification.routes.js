const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.userId],
    ).rows;
    const unread = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.userId],
    ).rows[0].count;
    res.json({ success: true, data: { notifications, unreadCount: Number(unread) } });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not load notifications' } });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const row = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.userId],
    ).rows[0];
    res.json({ success: true, data: { unreadCount: Number(row.count) } });
  } catch (error) {
    console.error('Notification count error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not load notification count' } });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const row = await db.query('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    if (row.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    }
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not update notification' } });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.userId]);
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (error) {
    console.error('Read all error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not update notifications' } });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    res.json({ success: true, data: { message: 'Notification deleted' } });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not delete notification' } });
  }
});

// Internal helper exported for other routes (booking status, etc.)
async function notify(userId, type, title, body, link) {
  await db.query(
    'INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), userId, type, title, body || null, link || null],
  );
}

module.exports = router;
module.exports.notify = notify;
