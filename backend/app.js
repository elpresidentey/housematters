const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Behind Vercel/any proxy, so req.ip and the rate limiter see the real client.
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// FRONTEND_URL accepts a comma-separated list so preview deployments work too.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// NOTE: this limit is per serverless instance, so it is approximate on Vercel.
// Put a real rate limit in front of the deployment for anything stricter.
const limiter = rateLimit({ windowSize: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const authRoutes = require('./routes/auth.routes');
const propertyRoutes = require('./routes/property.routes');
const bookingRoutes = require('./routes/booking.routes');
const messageRoutes = require('./routes/message.routes');
const uploadRoutes = require('./routes/upload.routes');
const profileRoutes = require('./routes/profile.routes');
const savedHomesRoutes = require('./routes/saved-homes.routes');
const savedSearchRoutes = require('./routes/saved-search.routes');
const notificationRoutes = require('./routes/notification.routes');
const agreementRoutes = require('./routes/agreement.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const reviewRoutes = require('./routes/review.routes');

// Uploaded property photos. On Vercel these live in Supabase Storage and the
// URL is absolute, so this only serves images written by local dev runs.
const path = require('path');
const { useSupabase, LOCAL_DIR } = require('./config/storage');
if (!useSupabase) {
  app.use('/uploads', express.static(LOCAL_DIR));
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/saved-homes', savedHomesRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
const { healthCheck } = require('./config/database');
app.get('/health', async (req, res) => {
  const dbHealth = await healthCheck();
  res.json({ status: dbHealth.connected ? 'OK' : 'DEGRADED', environment: process.env.NODE_ENV || 'development', uptime: process.uptime(), version: '1.0.0', database: dbHealth });
});

app.get('/api', (req, res) => {
  res.json({ message: 'House Matters API is running!', version: '1.0.0', endpoints: { health: '/health', auth: '/api/auth/*', properties: '/api/properties/*' } });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } });
  res.status(err.status || 500).json({ success: false, error: { code: err.code || 'SERVER_ERROR', message: err.message || 'Something went wrong' } });
});

app.use((req, res) => { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }); });

module.exports = app;