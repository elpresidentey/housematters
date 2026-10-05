const { query, testConnection, closePool } = require('../config/database');

const TABLES = `
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
`;

const COLUMNS = [
  ['properties', 'moderation_status', "TEXT DEFAULT 'approved'"],
  ['properties', 'expires_at', 'TEXT'],
  ['payments', 'booking_id', 'TEXT REFERENCES bookings(id)'],
  ['payments', 'agreement_id', 'TEXT REFERENCES agreements(id)'],
  ['payments', 'payment_type', "TEXT DEFAULT 'rent'"],
  ['payments', 'reference', 'TEXT'],
  ['payments', 'paid_at', 'TEXT'],
];

function columnsOf(table) {
  return query(`PRAGMA table_info(${table})`).rows.map(r => r.name);
}

function main() {
  if (!testConnection()) { console.error('Database connection failed'); process.exit(1); }

  for (const stmt of TABLES.split(';').map(s => s.trim()).filter(Boolean)) {
    query(stmt);
  }
  console.log('tables ensured');

  for (const [table, column, definition] of COLUMNS) {
    const existing = columnsOf(table);
    if (existing.includes(column)) { console.log(`skip ${table}.${column}`); continue; }
    query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`added ${table}.${column}`);
  }

  const now = new Date().toISOString();
  query("UPDATE properties SET moderation_status = 'approved' WHERE moderation_status IS NULL");
  query("UPDATE properties SET expires_at = datetime('now', '+90 days') WHERE expires_at IS NULL AND active = 1");
  console.log('backfilled moderation + expiry');

  console.log('Migration 002 complete');
  closePool();
}

main();
