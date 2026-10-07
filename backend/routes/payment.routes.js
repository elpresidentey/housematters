const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// GET /api/payments — records visible to the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT pay.*, p.title as property_title
       FROM payments pay
       LEFT JOIN properties p ON pay.property_id = p.id
       WHERE pay.user_id = ?
       ORDER BY pay.created_at DESC`,
      [req.user.userId],
    ).rows;
    res.json({ success: true, data: { payments: rows } });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not load payments' } });
  }
});

// POST /api/payments — record a rent/deposit payment against an agreement.
// This is the ledger; a live gateway (Paystack/Flutterwave) would confirm
// these server-side before they are marked paid.
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { agreementId, amount, paymentType = 'rent', reference, status = 'pending' } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'A positive amount is required' } });
    }

    let propertyId = null;
    let bookingId = null;

    if (agreementId) {
      const agreement = await db.query('SELECT * FROM agreements WHERE id = ?', [agreementId]).rows[0];
      if (!agreement) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agreement not found' } });
      }
      if (agreement.tenant_id !== req.user.userId && agreement.landlord_id !== req.user.userId) {
        return res.status(403).json({ success: false, error: { code: 'NOT_AUTHORIZED', message: 'Not a party to this agreement' } });
      }
      propertyId = agreement.property_id;
      bookingId = agreement.booking_id;
    }

    const id = uuidv4();
    const paid = status === 'paid' ? new Date().toISOString() : null;
    await db.query(
      `INSERT INTO payments (id, user_id, property_id, booking_id, agreement_id, amount, currency, payment_type, reference, status, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, 'NGN', ?, ?, ?, ?)`,
      [id, req.user.userId, propertyId, bookingId, agreementId || null, Number(amount), paymentType, reference || null, status, paid],
    );

    const row = await db.query('SELECT * FROM payments WHERE id = ?', [id]).rows[0];
    res.status(201).json({ success: true, data: { payment: row } });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not record payment' } });
  }
});

// PUT /api/payments/:id/status — mark pending/paid/failed
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'paid', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status' } });
    }
    const payment = await db.query('SELECT * FROM payments WHERE id = ?', [req.params.id]).rows[0];
    if (!payment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    }
    if (payment.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: { code: 'NOT_AUTHORIZED', message: 'Not your payment' } });
    }
    const paid = status === 'paid' ? new Date().toISOString() : null;
    await db.query('UPDATE payments SET status = ?, paid_at = ? WHERE id = ?', [status, paid, req.params.id]);
    const row = await db.query('SELECT * FROM payments WHERE id = ?', [req.params.id]).rows[0];
    res.json({ success: true, data: { payment: row } });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Could not update payment' } });
  }
});

module.exports = router;
