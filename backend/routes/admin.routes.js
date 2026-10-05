const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Admin access = the seeded admin account (admin@housematters.com).
function requireAdmin(req, res, next) {
  const row = db.query('SELECT email, role FROM users WHERE id = ?', [req.user.userId]).rows[0];
  if (!row || row.email !== 'admin@housematters.com') {
    return res.status(403).json({ success: false, error: { code: 'NOT_AUTHORIZED', message: 'Admin access required' } });
  }
  next();
}

router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const users = db.query("SELECT COUNT(*) as c FROM users").rows[0].c;
    const landlords = db.query("SELECT COUNT(*) as c FROM users WHERE role = 'landlord'").rows[0].c;
    const properties = db.query('SELECT COUNT(*) as c FROM properties').rows[0].c;
    const active = db.query('SELECT COUNT(*) as c FROM properties WHERE active = 1').rows[0].c;
    const expired = db.query("SELECT COUNT(*) as c FROM properties WHERE expires_at IS NOT NULL AND expires_at < datetime('now')").rows[0].c;
    const pending = db.query("SELECT COUNT(*) as c FROM properties WHERE moderation_status = 'pending'").rows[0].c;
    const bookings = db.query('SELECT COUNT(*) as c FROM bookings').rows[0].c;
    const openBookings = db.query("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'").rows[0].c;
    const flagged = db.query("SELECT COUNT(*) as c FROM properties WHERE moderation_status = 'flagged'").rows[0].c;
    res.json({ success: true, data: { users, landlords, properties, active, expired, pending, flagged, bookings, openBookings } });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not load stats' } });
  }
});

// GET /api/admin/properties — moderation queue
router.get('/properties', (req, res) => {
  try {
    const status = req.query.status;
    const where = status ? 'WHERE p.moderation_status = ?' : '';
    const params = status ? [status] : [];
    const rows = db.query(
      `SELECT p.*, u.first_name || ' ' || u.last_name as landlord_name, u.email as landlord_email
       FROM properties p JOIN users u ON p.landlord_id = u.id
       ${where}
       ORDER BY p.created_at DESC LIMIT 200`,
      params,
    ).rows;
    res.json({ success: true, data: { properties: rows } });
  } catch (error) {
    console.error('Admin properties error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not load properties' } });
  }
});

// PUT /api/admin/properties/:id/moderate
router.put('/properties/:id/moderate', (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['pending', 'approved', 'flagged', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid moderation status' } });
    }
    const existing = db.query('SELECT id FROM properties WHERE id = ?', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } });
    }
    db.query("UPDATE properties SET moderation_status = ?, updated_at = datetime('now') WHERE id = ?", [status, req.params.id]);

    if (status === 'flagged' || status === 'rejected') {
      const note = reason || (status === 'flagged' ? 'Listing needs review' : 'Listing rejected');
      db.query(
        'INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), db.query('SELECT landlord_id FROM properties WHERE id = ?', [req.params.id]).rows[0].landlord_id,
          'listing_' + status, `Listing ${status}: ${note}`, 'Review the listing details and update them.', `/dashboard`],
      );
    }
    res.json({ success: true, data: { id: req.params.id, moderation_status: status } });
  } catch (error) {
    console.error('Moderate property error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not moderate listing' } });
  }
});

// POST /api/admin/properties/expire — deactivate listings past their expiry
router.post('/properties/expire', (req, res) => {
  try {
    const result = db.query(
      "UPDATE properties SET active = 0, updated_at = datetime('now') WHERE active = 1 AND expires_at IS NOT NULL AND expires_at < datetime('now')",
    );
    res.json({ success: true, data: { expired: result.rowCount || 0 } });
  } catch (error) {
    console.error('Expire listings error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not expire listings' } });
  }
});

module.exports = router;
