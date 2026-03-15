import 'dotenv/config';
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

async function createSuperAdmin() {
  try {
    console.log('🔧 Creating Super Admin user...');

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superAdminEmail || !superAdminPassword) {
      console.error('❌ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not found in .env file');
      process.exit(1);
    }

    console.log(`📧 Email: ${superAdminEmail}`);
    console.log(`🔑 Password: ${superAdminPassword}`);

    // Check if super admin already exists
    const existingUser = await (prisma as any).school_User.findUnique({
      where: { email: superAdminEmail },
    });

    if (existingUser) {
      console.log('✅ Super admin already exists in database');
      console.log('📋 Login credentials:');
      console.log(`   Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
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

    console.log('✅ Super admin created successfully!');
    console.log('📋 Login credentials:');
    console.log(`   Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
    console.log(`   User ID: ${superAdmin.id}`);
    console.log(`   Created: ${superAdmin.createdAt}`);

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
