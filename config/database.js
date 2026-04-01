const { Pool } = require('pg');
require('dotenv').config();

function getConnectionString() {
  let url = process.env.DATABASE_URL;
  // Use DATABASE_URL only if it looks like a real connection string (not a placeholder)
  if (url && (url.startsWith('postgres://') || url.startsWith('postgresql://')) && url.length > 20) {
    return url;
  }
  // Build from components (e.g. Railway, Render often provide PGHOST, PGUSER, etc.)
  const host = process.env.PGHOST || process.env.PG_HOST;
  const user = process.env.PGUSER || process.env.PG_USER;
  const password = process.env.PGPASSWORD || process.env.PG_PASSWORD;
  const database = process.env.PGDATABASE || process.env.PG_DATABASE || 'neondb';
  const port = process.env.PGPORT || process.env.PG_PORT || '5432';
  if (host && user && password) {
    const ssl = process.env.PGSSLMODE === 'require' || process.env.DATABASE_SSL === 'true' ? '?sslmode=require' : '';
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}${ssl}`;
  }
  throw new Error(
    'Database configuration missing. Set DATABASE_URL to a valid PostgreSQL URL (e.g. postgresql://user:password@host:5432/dbname?sslmode=require) in your environment variables.'
  );
}

const connectionString = getConnectionString();

// Neon PostgreSQL requires SSL
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') || process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
