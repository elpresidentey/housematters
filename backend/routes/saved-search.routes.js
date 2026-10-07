const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Build the same WHERE clause used by /api/properties from saved-search filters.
function buildConditions(filters) {
  const conditions = ['p.active = 1', "COALESCE(p.moderation_status, 'approved') = 'approved'"];
  const params = [];
  const add = (sql, ...values) => { conditions.push(sql); params.push(...values); };

  if (filters.query) add('(p.title LIKE ? OR p.description LIKE ?)', `%${filters.query}%`, `%${filters.query}%`);
  if (filters.city) add('p.city LIKE ?', `%${filters.city}%`);
  if (filters.state) add('p.state LIKE ?', `%${filters.state}%`);
  if (filters.propertyType) add('p.property_type = ?', filters.propertyType);
  if (filters.minPrice) add('p.rent >= ?', Number(filters.minPrice));
  if (filters.maxPrice) add('p.rent <= ?', Number(filters.maxPrice));
  if (filters.bedrooms) add('p.bedrooms >= ?', Number(filters.bedrooms));
  if (filters.bathrooms) add('p.bathrooms >= ?', Number(filters.bathrooms));

  return { where: conditions.join(' AND '), params };
}

function matches(filters, property) {
  const text = `${property.title || ''} ${property.description || ''}`.toLowerCase();
  if (filters.query && !text.includes(String(filters.query).toLowerCase())) return false;
  if (filters.city && !String(property.city || '').toLowerCase().includes(String(filters.city).toLowerCase())) return false;
  if (filters.state && !String(property.state || '').toLowerCase().includes(String(filters.state).toLowerCase())) return false;
  if (filters.propertyType && property.property_type !== filters.propertyType) return false;
  if (filters.minPrice && property.rent < Number(filters.minPrice)) return false;
  if (filters.maxPrice && property.rent > Number(filters.maxPrice)) return false;
  if (filters.bedrooms && property.bedrooms < Number(filters.bedrooms)) return false;
  if (filters.bathrooms && property.bathrooms < Number(filters.bathrooms)) return false;
  return true;
}

// GET /api/saved-searches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId],
    ).rows.map(r => ({ ...r, filters: JSON.parse(r.filters || '{}') }));
    res.json({ success: true, data: { savedSearches: rows } });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not load saved searches' } });
  }
});

// POST /api/saved-searches
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, filters = {}, alertsEnabled = true } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELD', message: 'name is required' } });
    }
    const id = uuidv4();
    await db.query(
      'INSERT INTO saved_searches (id, user_id, name, filters, alerts_enabled) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.userId, name, JSON.stringify(filters), alertsEnabled ? 1 : 0],
    );
    const row = await db.query('SELECT * FROM saved_searches WHERE id = ?', [id]).rows[0];
    res.status(201).json({ success: true, data: { savedSearch: { ...row, filters: JSON.parse(row.filters || '{}') } } });
  } catch (error) {
    console.error('Create saved search error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not save search' } });
  }
});

// DELETE /api/saved-searches/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await db.query('SELECT id FROM saved_searches WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Saved search not found' } });
    }
    await db.query('DELETE FROM saved_searches WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Saved search deleted' } });
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not delete saved search' } });
  }
});

// POST /api/saved-searches/:id/run — run now and report live matches
router.post('/:id/run', authenticateToken, async (req, res) => {
  try {
    const row = await db.query('SELECT * FROM saved_searches WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]).rows[0];
    if (!row) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Saved search not found' } });
    }
    const filters = JSON.parse(row.filters || '{}');
    const { where, params } = buildConditions(filters);
    const properties = await db.query(
      `SELECT * FROM properties p WHERE ${where} ORDER BY p.created_at DESC LIMIT 50`,
      params,
    ).rows;
    res.json({ success: true, data: { properties, filters } });
  } catch (error) {
    console.error('Run saved search error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not run saved search' } });
  }
});

// POST /api/saved-searches/check-alerts — create notifications for new matches
router.post('/check-alerts', authenticateToken, async (req, res) => {
  try {
    const searches = await db.query('SELECT * FROM saved_searches WHERE user_id = ? AND alerts_enabled = 1', [req.user.userId]).rows;
    let created = 0;

    for (const search of searches) {
      const filters = JSON.parse(search.filters || '{}');
      const { where, params } = buildConditions(filters);
      const properties = await db.query(
        `SELECT p.* FROM properties p WHERE ${where} AND p.created_at > COALESCE(?, p.created_at) ORDER BY p.created_at DESC LIMIT 20`,
        [search.last_alerted_at, ...params],
      ).rows;

      if (search.last_alerted_at) {
        properties.push(...await db.query(
          `SELECT p.* FROM properties p WHERE ${where} AND p.created_at > ? ORDER BY p.created_at DESC LIMIT 20`,
          [...params, search.last_alerted_at],
        ).rows);
      }

      const seen = new Set();
      for (const property of properties) {
        if (seen.has(property.id)) continue;
        if (!matches(filters, property)) continue;
        seen.add(property.id);

        const existing = await db.query(
          "SELECT id FROM notifications WHERE user_id = ? AND type = 'new_listing' AND link = ?",
          [req.user.userId, `/property/${property.id}`],
        );
        if (existing.rows.length > 0) continue;

        await db.query(
          'INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), req.user.userId, 'new_listing', `New match: ${property.title}`,
            `${property.city} · ₦${Number(property.rent).toLocaleString('en-NG')}/year`, `/property/${property.id}`],
        );
        created++;
      }
      await db.query("UPDATE saved_searches SET last_alerted_at = now() WHERE id = ?", [search.id]);
    }

    res.json({ success: true, data: { created } });
  } catch (error) {
    console.error('Check alerts error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not check alerts' } });
  }
});

module.exports = router;
