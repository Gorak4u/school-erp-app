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

async function addTokenBlacklist() {
  try {
    console.log('🔒 Adding token blacklist for production...');

    // Check if TokenBlacklist model exists
    try {
      await (prisma as any).tokenBlacklist.findFirst();
      console.log('✅ TokenBlacklist model already exists');
    } catch (error) {
      console.log('⚠️  TokenBlacklist model not found');
      console.log('📝 Add this to your prisma/schema.prisma:');
      console.log(`
model TokenBlacklist {
  id        String    @id @default(cuid())
  token     String    @unique
  expiresAt DateTime
  createdAt DateTime  @default(now())
  
  @@index([expiresAt])
}
      `);
      console.log('🔄 Then run: npx prisma db push');
      return;
    }

    console.log('\n📋 Production Token Blacklist Strategy:');
    console.log('1. Add TokenBlacklist model to schema');
    console.log('2. Update NextAuth callbacks to check blacklist');
    console.log('3. Add tokens to blacklist when users are deleted');
    console.log('4. Clean up expired tokens automatically');

    console.log('\n🔧 NextAuth Callback Updates Needed:');
    console.log(`
// Add to callbacks in [...nextauth]/route.ts
async jwt({ token, user }) {
  // Check if token is blacklisted
  if (token.jti) {
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token: token.jti }
    });
    if (blacklisted) {
      return null; // Invalidate token
    }
  }
  // ... existing logic
  return token;
}
    `);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTokenBlacklist();
