const { PrismaClient } = require('@prisma/client');

async function initMessengerDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test if we can access the school schema
    await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'school'`;
    
    console.log('Database connection successful!');
    console.log('Messenger tables should be created via Prisma migration.');
    console.log('If you see table not found errors, run:');
    console.log('npx prisma migrate dev --name add_messenger_tables');
    
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Please check your DATABASE_URL and ensure the database exists.');
  } finally {
    await prisma.$disconnect();
  }
}

initMessengerDB();
