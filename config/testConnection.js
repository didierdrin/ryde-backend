const pool = require('./database');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Successfully connected to Neon PostgreSQL!');
    console.log('Current time:', result.rows[0].now);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
