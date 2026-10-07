const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all properties
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, query, minPrice, maxPrice, bedrooms, bathrooms, propertyType, city, state, landlord_id, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;
        let conditions = ["active = 1", "COALESCE(moderation_status, 'approved') = 'approved'", "(expires_at IS NULL OR expires_at >= now())"];
        let params = [];

        if (landlord_id) { conditions.push('landlord_id = ?'); params.push(landlord_id); }
        if (query) { conditions.push('(title LIKE ? OR description LIKE ?)'); params.push('%' + query + '%', '%' + query + '%'); }
        if (minPrice) { conditions.push('rent >= ?'); params.push(Number(minPrice)); }
        if (maxPrice) { conditions.push('rent <= ?'); params.push(Number(maxPrice)); }
        if (bedrooms) { conditions.push('bedrooms >= ?'); params.push(Number(bedrooms)); }
        if (bathrooms) { conditions.push('bathrooms >= ?'); params.push(Number(bathrooms)); }
        if (propertyType) { conditions.push('property_type = ?'); params.push(propertyType); }
        if (city) { conditions.push('city LIKE ?'); params.push('%' + city + '%'); }
        if (state) { conditions.push('state LIKE ?'); params.push('%' + state + '%'); }

        const where = conditions.join(' AND ');
        const allowedSort = ['rent', 'created_at', 'bedrooms', 'bathrooms'];
        const sort = allowedSort.includes(sortBy) ? sortBy : 'created_at';
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

        const countResult = await db.query('SELECT COUNT(*) as count FROM properties WHERE ' + where, params);
        const totalProperties = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalProperties / limit);

        const properties = await db.query('SELECT * FROM properties WHERE ' + where + ' ORDER BY ' + sort + ' ' + order + ' LIMIT ? OFFSET ?', params.concat([Number(limit), offset]));

        res.json({ success: true, data: { properties: properties.rows, pagination: { currentPage: parseInt(page), totalPages, totalProperties, hasNextPage: page < totalPages, hasPrevPage: page > 1 } } });
    } catch (error) {
        console.error('Get properties error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Get single property (with public landlord contact details)
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, u.first_name || ' ' || u.last_name as landlord_name,
                    u.phone as landlord_phone, u.is_verified as landlord_verified, u.email as landlord_email
             FROM properties p JOIN users u ON p.landlord_id = u.id
             WHERE p.id = ? AND p.active = 1`,
            [req.params.id],
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' } });
        res.json({ success: true, data: { property: result.rows[0] } });
    } catch (error) {
        console.error('Get property error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Create new property
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, rent, propertyType, bedrooms, bathrooms, area, address, city, state, zipCode, amenities, images } = req.body;
        const id = uuidv4();
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        const moderationStatus = 'approved';
        await db.query('INSERT INTO properties (id, landlord_id, title, description, rent, property_type, bedrooms, bathrooms, area, address, city, state, zip_code, amenities, images, active, moderation_status, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)', [id, req.user.userId, title, description, rent, propertyType || 'apartment', bedrooms || 0, bathrooms || 0, area || null, address || '', city || '', state || '', zipCode || '', JSON.stringify(amenities || []), JSON.stringify(images || []), moderationStatus, expiresAt]);
        const result = await db.query('SELECT * FROM properties WHERE id = ?', [id]);
        res.status(201).json({ success: true, data: { property: result.rows[0] } });
    } catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Update property
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const check = await db.query('SELECT landlord_id FROM properties WHERE id = ?', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } });
        if (check.rows[0].landlord_id !== req.user.userId) return res.status(403).json({ success: false, error: { code: 'NOT_AUTHORIZED', message: 'Not authorized' } });
        const { title, description, rent, propertyType, bedrooms, bathrooms, area, address, city, state, zipCode, amenities, images } = req.body;
        await db.query("UPDATE properties SET title=?, description=?, rent=?, property_type=?, bedrooms=?, bathrooms=?, area=?, address=?, city=?, state=?, zip_code=?, amenities=?, images=?, updated_at=now() WHERE id=?", [title, description, rent, propertyType, bedrooms, bathrooms, area, address, city, state, zipCode, JSON.stringify(amenities || []), JSON.stringify(images || []), req.params.id]);
        const result = await db.query('SELECT * FROM properties WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: { property: result.rows[0] } });
    } catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

// Delete property (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const check = await db.query('SELECT landlord_id FROM properties WHERE id = ?', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } });
        if (check.rows[0].landlord_id !== req.user.userId) return res.status(403).json({ success: false, error: { code: 'NOT_AUTHORIZED', message: 'Not authorized' } });
        await db.query("UPDATE properties SET active = 0, updated_at = now() WHERE id = ?", [req.params.id]);
        res.json({ success: true, data: { message: 'Property deleted' } });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

module.exports = router;
