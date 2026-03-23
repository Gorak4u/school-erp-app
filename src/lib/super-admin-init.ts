import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { saasPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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
    logger.info('Super admin already initialized in this process');
    return;
  }

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    logger.info('Starting super admin verification', {
      emailConfigured: !!superAdminEmail,
      passwordConfigured: !!superAdminPassword,
      email: superAdminEmail || 'NOT_SET'
    });

    // Case 1: No credentials in .env
    if (!superAdminEmail || !superAdminPassword) {
      logger.warn('No super admin credentials found in .env', {
        emailConfigured: !!superAdminEmail,
        passwordConfigured: !!superAdminPassword,
        solution: 'Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env'
      });
      isInitialized = true;
      return;
    }

    // Hash the password first
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    logger.info('Super admin password hashed successfully');

    // Use upsert to handle concurrent creation gracefully
    logger.info('Creating or updating super admin in SaaS User table');
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

      logger.info('Super admin ready in SaaS User table', {
        email: superAdmin.email,
        id: superAdmin.id,
        role: superAdmin.role
      });

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
        logger.info('Super admin ready in school_User table');
      } catch (schoolError: any) {
        logger.warn('Could not sync super admin to school_User table', { error: schoolError.message });
      }

      logger.info('Super admin initialization complete');
      logger.info('Super admin ready for login');
    } catch (createError: any) {
      logger.error('Error during super admin initialization', {
        error: createError,
        code: createError.code,
        message: createError.message
      });
      logger.warn('Application will continue without super admin');
    }
    
    isInitialized = true;
    await prisma.$disconnect();
  } catch (error: any) {
    logger.error('Error during super admin creation', {
      error,
      message: error.message
    });
    
    // Don't throw error, allow app to continue
    logger.warn('Application will continue without super admin');
    isInitialized = true;
  }
}
