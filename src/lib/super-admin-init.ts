import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { saasPrisma } from '@/lib/prisma';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

let isInitialized = false;

export async function ensureSuperAdmin() {
  // Prevent multiple initializations in the same process
  if (isInitialized) {
    console.log('ℹ️ [SUPER ADMIN] Already initialized in this process');
    return;
  }

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    console.log('🔧 [SUPER ADMIN] Starting super admin verification...');
    console.log(`📧 [SUPER ADMIN] Configured email: ${superAdminEmail || 'NOT_SET'}`);
    console.log(`🔑 [SUPER ADMIN] Password configured: ${superAdminPassword ? 'YES' : 'NO'}`);

    // Case 1: No credentials in .env
    if (!superAdminEmail || !superAdminPassword) {
      console.log('⚠️ [SUPER ADMIN] No credentials found in .env file');
      console.log('📝 [SUPER ADMIN] Please set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env');
      isInitialized = true;
      return;
    }

    // Case 2: Check if super admin already exists in SaaS User table
    console.log('🔍 [SUPER ADMIN] Checking existing super admin in SaaS User table...');
    const existingUser = await (saasPrisma as any).user.findUnique({
      where: { email: superAdminEmail },
    });

    if (existingUser) {
      console.log('✅ [SUPER ADMIN] Super admin already exists in SaaS User table');
      console.log(`📧 [SUPER ADMIN] Email: ${existingUser.email}`);
      console.log(`🆔 [SUPER ADMIN] ID: ${existingUser.id}`);
      console.log(`👤 [SUPER ADMIN] Role: ${existingUser.role}`);
      console.log(`📅 [SUPER ADMIN] Created: ${existingUser.createdAt}`);
      isInitialized = true;
      return;
    }

    // Case 3: Super admin doesn't exist, create it
    console.log('⚠️ [SUPER ADMIN] No super admin found, creating new one...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    console.log('🔐 [SUPER ADMIN] Password hashed successfully');

    // Create super admin user in SaaS User table
    const superAdmin = await (saasPrisma as any).user.create({
      data: {
        email: superAdminEmail,
        name: 'Super Admin',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        isSuperAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Store password separately in school_User table for authentication
    const schoolAdmin = await (prisma as any).school_User.create({
      data: {
        id: 'super-admin-' + Date.now(),
        email: superAdminEmail,
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('🎉 [SUPER ADMIN] Super admin created successfully!');
    console.log(`📧 [SUPER ADMIN] Email: ${superAdminEmail}`);
    console.log(`🆔 [SUPER ADMIN] SaaS User ID: ${superAdmin.id}`);
    console.log(`🆔 [SUPER ADMIN] School User ID: ${schoolAdmin.id}`);
    console.log(`📅 [SUPER ADMIN] Created: ${superAdmin.createdAt}`);
    console.log('✅ [SUPER ADMIN] Ready for login');

  } catch (error: any) {
    console.error('❌ [SUPER ADMIN] Error during super admin creation:', error);
    console.error('❌ [SUPER ADMIN] Error details:', error.message);
    
    // Don't throw error, allow app to continue
    console.log('⚠️ [SUPER ADMIN] Application will continue without super admin');
  } finally {
    isInitialized = true;
    await prisma.$disconnect();
  }
}
