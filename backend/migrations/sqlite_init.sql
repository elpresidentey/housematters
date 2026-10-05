-- SQLite migration: Create all tables for House Matters

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('landlord', 'tenant')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    profile_image TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_token_expires TEXT,
    password_reset_token TEXT,
    password_reset_expires TEXT,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    landlord_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    rent REAL NOT NULL CHECK (rent > 0),
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
    amenities TEXT DEFAULT '[]',
    images TEXT DEFAULT '[]',
    is_available INTEGER DEFAULT 1,
    latitude REAL,
    longitude REAL,
    views_count INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    property_type TEXT DEFAULT 'apartment',
    price REAL,
    area REAL,
    zip_code TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_rent ON properties(rent);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES users(id),
    receiver_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT REFERENCES properties(id),
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id),
    requested_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    confirmed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT REFERENCES properties(id),
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT DEFAULT 'pending',
    stripe_payment_id TEXT,
    paystack_reference TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    reviewer_id TEXT NOT NULL REFERENCES users(id),
    reviewee_id TEXT NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_homes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_homes_user ON saved_homes(user_id);

-- Saved searches (drive new-listing alerts)
CREATE TABLE IF NOT EXISTS saved_searches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters TEXT DEFAULT '{}',
    alerts_enabled INTEGER DEFAULT 1,
    last_alerted_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- Listing lifecycle / moderation
ALTER TABLE properties ADD COLUMN moderation_status TEXT DEFAULT 'approved';
ALTER TABLE properties ADD COLUMN expires_at TEXT;

-- Tenancy agreements generated from a confirmed booking
CREATE TABLE IF NOT EXISTS agreements (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES users(id),
    landlord_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id),
    annual_rent REAL NOT NULL,
    service_charge REAL DEFAULT 0,
    caution_deposit REAL DEFAULT 0,
    duration_months INTEGER DEFAULT 12,
    start_date TEXT NOT NULL,
    terms TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'void')),
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_agreements_tenant ON agreements(tenant_id);

-- Payment records linked to an agreement/booking
ALTER TABLE payments ADD COLUMN booking_id TEXT REFERENCES bookings(id);
ALTER TABLE payments ADD COLUMN agreement_id TEXT REFERENCES agreements(id);
ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'rent';
ALTER TABLE payments ADD COLUMN reference TEXT;
ALTER TABLE payments ADD COLUMN paid_at TEXT;

CREATE TABLE IF NOT EXISTS migration_history (
    filename TEXT PRIMARY KEY,
    checksum TEXT,
    execution_time_ms INTEGER,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    applied_at TEXT DEFAULT (datetime('now'))
);
