require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Add it to backend/.env to use Supabase/Postgres.');
}

// Supabase's transaction pooler (port 6543) multiplexes many clients over one
// connection, so serverless concurrency has to stay low and named prepared
// statements have to be off. The direct connection (5432) is happier with a
// slightly larger pool.
const isPooler = Boolean(connectionString && /pooler|:6543|:6432/i.test(connectionString));

const pool = new Pool({
  connectionString,
  ssl: connectionString && /supabase|pooler/i.test(connectionString)
    ? { rejectUnauthorized: false }
    : undefined,
  max: isPooler || process.env.VERCEL ? 2 : 10,
  // Required by the pooler, which cannot track named prepared statements.
  options: '-c statement_cache_size=0',
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Postgres pool error:', err.message);
});

// Routes author placeholders as ? (the legacy SQLite convention).
// Postgres expects $1, $2, ... — converts in order of appearance.
function toPg(sql, params = []) {
  let i = 0;
  const converted = sql.replace(/\?/g, () => `$${++i}`);
  return { text: converted, values: params };
}

async function query(sql, params) {
  const { text, values } = toPg(sql, params);
  const result = await pool.query(text, values);
  const trimmed = sql.trim().toUpperCase();
  const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('EXPLAIN');
  const hasReturning = /RETURNING/i.test(sql);
  if (isSelect || hasReturning) {
    return { rows: result.rows, rowCount: result.rowCount };
  }
  return { rows: [], rowCount: result.rowCount, lastID: result.rows[0] ? result.rows[0].id : undefined };
}

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Postgres connected successfully');
    console.log('🌐 ' + (connectionString ? connectionString.replace(/:[^:@]+@/, ':***@') : 'no DATABASE_URL'));
    return true;
  } catch (error) {
    console.error('❌ Postgres connection failed:', error.message);
    return false;
  }
}

const healthCheck = async () => {
  try {
    await pool.query('SELECT 1');
    return { status: 'healthy', connected: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', connected: false, error: error.message, timestamp: new Date().toISOString() };
  }
};

const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ Postgres pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const execFn = async (fn) => fn({ query: async (sql, p) => {
      const { text, values } = toPg(sql, p);
      const r = await client.query(text, values);
      const t = sql.trim().toUpperCase();
      if (/^(SELECT|WITH|EXPLAIN)/.test(t) || /RETURNING/i.test(sql)) return { rows: r.rows, rowCount: r.rowCount };
      return { rows: [], rowCount: r.rowCount };
    } });
    const out = await execFn(callback);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, testConnection, healthCheck, closePool, transaction };
