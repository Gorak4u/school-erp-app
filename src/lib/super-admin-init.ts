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

    // Hash the password first
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    console.log('🔐 [SUPER ADMIN] Password hashed successfully');

    // Use upsert to handle concurrent creation gracefully
    console.log('🔍 [SUPER ADMIN] Creating or updating super admin in SaaS User table...');
    try {
      const superAdmin = await (saasPrisma as any).user.upsert({
        where: { email: superAdminEmail },
        update: {
          // If user exists, just update the role to ensure it's super_admin
          role: 'super_admin',
          isSuperAdmin: true,
          isActive: true,
        },
        create: {
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

      console.log('✅ [SUPER ADMIN] Super admin ready in SaaS User table');
      console.log(`📧 [SUPER ADMIN] Email: ${superAdmin.email}`);
      console.log(`🆔 [SUPER ADMIN] ID: ${superAdmin.id}`);
      console.log(`� [SUPER ADMIN] Role: ${superAdmin.role}`);

      // Try to create or update in school_User table
      try {
        await (prisma as any).school_User.upsert({
          where: { email: superAdminEmail },
          update: {
            password: hashedPassword,
            role: 'admin',
            isActive: true,
          },
          create: {
            id: 'super-admin-' + Date.now(),
            email: superAdminEmail,
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'admin',
            isActive: true,
            schoolId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        console.log('✅ [SUPER ADMIN] Super admin ready in school_User table');
      } catch (schoolError: any) {
        console.warn('⚠️ [SUPER ADMIN] Could not sync to school_User table:', schoolError.message);
      }

      console.log('🎉 [SUPER ADMIN] Super admin initialization complete!');
      console.log('✅ [SUPER ADMIN] Ready for login');
    } catch (createError: any) {
      console.error('❌ [SUPER ADMIN] Error during super admin initialization:', createError);
      console.error('❌ [SUPER ADMIN] Error code:', createError.code);
      console.error('❌ [SUPER ADMIN] Error details:', createError.message);
      console.log('⚠️ [SUPER ADMIN] Application will continue without super admin');
    }
    
    isInitialized = true;
    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ [SUPER ADMIN] Error during super admin creation:', error);
    console.error('❌ [SUPER ADMIN] Error details:', error.message);
    
    // Don't throw error, allow app to continue
    console.log('⚠️ [SUPER ADMIN] Application will continue without super admin');
    isInitialized = true;
  }
}
