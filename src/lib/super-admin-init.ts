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
  // Prevent multiple initializations
  if (isInitialized) {
    return;
  }

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    // Skip if credentials not provided
    if (!superAdminEmail || !superAdminPassword) {
      console.log('ℹ️ Super admin credentials not found in .env - skipping auto-creation');
      isInitialized = true;
      return;
    }

    // Check if super admin already exists in SaaS User table
    const existingUser = await (saasPrisma as any).user.findUnique({
      where: { email: superAdminEmail },
    });

    if (existingUser) {
      console.log('✅ Super admin already exists in SaaS User table');
      isInitialized = true;
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

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

    console.log('🔧 Super admin created automatically on startup');
    console.log(`📧 Email: ${superAdminEmail}`);
    console.log(`🆔 SaaS User ID: ${superAdmin.id}`);
    console.log(`🆔 School User ID: ${schoolAdmin.id}`);
    console.log(`📅 Created: ${superAdmin.createdAt}`);

  } catch (error) {
    console.error('❌ Error creating super admin on startup:', error);
  } finally {
    isInitialized = true;
    await prisma.$disconnect();
  }
}
