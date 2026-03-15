import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function forceLogoutAllUsers() {
  try {
    console.log('🔒 Forcing logout for all users...');

    // Method 1: Clear all sessions (already done)
    const deletedSessions = await (prisma as any).session.deleteMany({});
    console.log(`✅ Deleted ${deletedSessions.count} database sessions`);

    // Method 2: Update JWT secret to invalidate all existing tokens
    console.log('\n📋 To force logout all users immediately:');
    console.log('1. Update your .env file with a new NEXTAUTH_SECRET:');
    console.log('   NEXTAUTH_SECRET="school-erp-super-secret-key-' + Date.now() + '"');
    console.log('2. Restart the development server:');
    console.log('   npm run dev');
    console.log('3. All existing JWT tokens will become invalid');
    console.log('4. Users will be forced to log in again');

    // Method 3: Check current users
    const currentUsers = await (prisma as any).school_User.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      take: 10,
    });

    console.log('\n👥 Current users in database:');
    if (currentUsers.length === 0) {
      console.log('   No users found - database is empty');
    } else {
      currentUsers.forEach((user: any) => {
        console.log(`   • ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
      });
    }

    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   • JWT tokens are stateless and stored in browser cookies');
    console.log('   • Deleting users from database does NOT invalidate existing tokens');
    console.log('   • Users remain logged in until their JWT token expires');
    console.log('   • Changing JWT secret is the most reliable way to force logout');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

forceLogoutAllUsers();
