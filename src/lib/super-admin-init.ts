import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

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

    // Check if super admin already exists
    const existingUser = await (prisma as any).school_User.findUnique({
      where: { email: superAdminEmail },
    });

    if (existingUser) {
      console.log('✅ Super admin already exists');
      isInitialized = true;
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

    // Create super admin user
    const superAdmin = await (prisma as any).school_User.create({
      data: {
        id: 'super-admin-' + Date.now(),
        email: superAdminEmail,
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('🔧 Super admin created automatically on startup');
    console.log(`📧 Email: ${superAdminEmail}`);
    console.log(`🆔 User ID: ${superAdmin.id}`);
    console.log(`📅 Created: ${superAdmin.createdAt}`);

  } catch (error) {
    console.error('❌ Error creating super admin on startup:', error);
  } finally {
    isInitialized = true;
    await prisma.$disconnect();
  }
}
