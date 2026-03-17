const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/add_leave_management_tables.sql'),
      'utf8'
    );

    console.log('Applying leave management tables migration...');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('Leave management tables have been created.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
