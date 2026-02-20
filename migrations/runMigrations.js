const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

/**
 * Run database migrations. Safe to call multiple times (migration is idempotent).
 * @param {object} options - { exit: true } to exit process and close pool when done (CLI use)
 * @returns {Promise<void>}
 */
async function runMigrations(options = {}) {
  const { exit = false } = options;
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '001_create_tables.sql'),
      'utf8'
    );

    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');

    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    if (exit) {
      await pool.end();
    }
  }
}

// When run directly (npm run migrate), run and exit
if (require.main === module) {
  runMigrations({ exit: true })
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = runMigrations;
