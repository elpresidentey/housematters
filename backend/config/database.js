const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', 'house_matters.db');

const sqlite = new Database(DB_PATH);

// WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Convert $1, $2... placeholders to ? and return { rows } like pg
function query(sql, params) {
  if (!params) params = [];

  // Convert $N placeholders to ? (only if present)
  let boundParams = params;
  let converted = sql;
  if (sql.includes('$1')) {
    let i = 0;
    converted = sql.replace(/\$\d+/g, () => params[i++] || null);
    boundParams = params.slice(0, i);
  }

  // Detect SELECT queries
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('EXPLAIN')) {
    const rows = sqlite.prepare(converted).all(...boundParams);
    return { rows, rowCount: rows.length };
  }

  // INSERT returning
  if (trimmed.includes('RETURNING')) {
    const rows = sqlite.prepare(converted).all(...boundParams);
    return { rows, rowCount: rows.length };
  }

  // INSERT / UPDATE / DELETE
  const result = sqlite.prepare(converted).run(...boundParams);
  // Try to get the inserted row if it has RETURNING
  return { rows: [], rowCount: result.changes, lastID: result.lastInsertRowid };
}

function testConnection() {
  try {
    sqlite.prepare('SELECT 1').get();
    console.log('✅ SQLite database connected successfully');
    console.log(`📁 Database file: ${DB_PATH}`);
    return true;
  } catch (error) {
    console.error('❌ SQLite connection failed:', error.message);
    return false;
  }
}

const healthCheck = async () => {
  try {
    sqlite.prepare('SELECT 1').get();
    return { status: 'healthy', connected: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', connected: false, error: error.message, timestamp: new Date().toISOString() };
  }
};

const closePool = async () => {
  try {
    sqlite.close();
    console.log('✅ SQLite database closed');
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
};

// Transaction wrapper matching pg pool interface
const transaction = async (callback) => {
  const execFn = sqlite.transaction(async (fn) => {
    return await fn({ query });
  });
  return execFn(callback);
};

module.exports = { pool: sqlite, query, testConnection, healthCheck, closePool, transaction };
