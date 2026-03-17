const { schoolPrisma } = require('../src/lib/prisma');

async function createTables() {
  try {
    console.log('Creating leave management tables...');
    
    // Test if we can connect to the database
    await schoolPrisma.$connect();
    console.log('✅ Connected to database');
    
    // Try to query a leave type to see if tables exist
    try {
      await schoolPrisma.leaveType.findFirst();
      console.log('✅ Leave management tables already exist!');
    } catch (error) {
      if (error.code === 'P2021') {
        console.log('❌ Tables do not exist. Please run the SQL migration manually.');
        console.log('Migration file: prisma/migrations/add_leave_management_tables.sql');
        console.log('');
        console.log('To apply the migration, you can:');
        console.log('1. Use your database admin tool to run the SQL file');
        console.log('2. Or run: npx prisma db push --force-reset (WARNING: This will reset your database)');
        console.log('3. Or contact your database administrator to apply the migration');
      } else {
        console.log('❌ Error checking tables:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await schoolPrisma.$disconnect();
  }
}

createTables();
