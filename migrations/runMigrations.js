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

    const migrationFiles = ['001_create_tables.sql', '002_irembopay.sql', '003_trip_service_type.sql', '004_features.sql'];

    await client.query('BEGIN');
    for (const name of migrationFiles) {
      const p = path.join(__dirname, name);
      if (!fs.existsSync(p)) continue;
      const migrationSQL = fs.readFileSync(p, 'utf8');
      await client.query(migrationSQL);
    }
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
