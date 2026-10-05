const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, userType } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email, password, and name are required' } });
        }

        const existingUser = db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'A user with this email already exists' } });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const id = uuidv4();
        const firstName = name.split(' ')[0] || name;
        const lastName = name.split(' ').slice(1).join(' ') || '';

        db.query('INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)', [id, email, hashedPassword, userType || 'tenant', firstName, lastName]);

        const token = jwt.sign({ userId: id, email: email, name: `${firstName} ${lastName}`.trim(), userType: userType || 'tenant' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ success: true, data: { user: { id, email, name, userType: userType || 'tenant' }, token } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'An error occurred during registration' } });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } });
        }

        const result = db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
        }

        const token = jwt.sign({ userId: user.id, email: user.email, name: user.first_name + ' ' + user.last_name, userType: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.first_name + ' ' + user.last_name, userType: user.role }, token } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'An error occurred during login' } });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'No token provided' } });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = db.query('SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ?', [decoded.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        }
        const user = result.rows[0];
        res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.first_name + ' ' + user.last_name, userType: user.role, createdAt: user.created_at } } });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'An error occurred while fetching user data' } });
    }
});

module.exports = router;