const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/20260316072000_add_discount_request_indexes/migration.sql'),
      'utf8'
    );

    console.log('Applying discount request indexes migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration applied successfully!');
    
    // Verify indexes were created
    const result = await pool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'school' 
      AND tablename IN ('DiscountRequest', 'DiscountRequestAuditLog', 'DiscountApplication')
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n📊 Created indexes:');
    result.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
