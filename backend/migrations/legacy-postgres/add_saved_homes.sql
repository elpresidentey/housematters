-- Migration: Add saved_homes table

CREATE TABLE IF NOT EXISTS saved_homes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_homes_user ON saved_homes(user_id);
