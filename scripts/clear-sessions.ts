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

async function clearAllSessions() {
  try {
    console.log('🧹 Clearing all sessions and forcing logout...');

    // Clear all sessions from database
    const deletedSessions = await (prisma as any).session.deleteMany({});
    console.log(`✅ Deleted ${deletedSessions.count} sessions from database`);

    // Clear all verification tokens
    const deletedTokens = await (prisma as any).school_VerificationToken.deleteMany({});
    console.log(`✅ Deleted ${deletedTokens.count} verification tokens`);

    // Clear all accounts (OAuth tokens, etc.)
    const deletedAccounts = await (prisma as any).account.deleteMany({});
    console.log(`✅ Deleted ${deletedAccounts.count} account connections`);

    console.log('\n🎉 All sessions cleared successfully!');
    console.log('\n📋 What this does:');
    console.log('   • Invalidates all existing JWT tokens');
    console.log('   • Clears server-side sessions');
    console.log('   • Removes OAuth connections');
    console.log('   • Forces all users to re-login');
    console.log('\n⚠️  Users will need to log in again on their next visit');

  } catch (error) {
    console.error('❌ Error clearing sessions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSessions();
