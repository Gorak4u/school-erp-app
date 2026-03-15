#!/usr/bin/env node

/**
 * Fix Super Admin SchoolId Script
 * 
 * This script deletes the existing super admin and recreates it with schoolId: null
 * Usage: node scripts/fix-super-admin-schoolid.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Import saasPrisma
const saasPrisma = new PrismaClient({
  adapter: adapter
});

async function fixSuperAdmin() {
  console.log('🔧 [FIX] Starting super admin schoolId fix...');
  console.log('=' .repeat(60));

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superAdminEmail || !superAdminPassword) {
      console.log('❌ [FIX] Super admin credentials not found in .env');
      process.exit(1);
    }

    console.log(`📧 [FIX] Working with email: ${superAdminEmail}`);

    // Step 1: Delete existing super admin from SaaS User table
    console.log('🗑️ [FIX] Deleting existing super admin from SaaS User table...');
    const deletedSaaSUser = await saasPrisma.user.deleteMany({
      where: { email: superAdminEmail },
    });
    console.log(`✅ [FIX] Deleted ${deletedSaaSUser.count} records from SaaS User table`);

    // Step 2: Delete existing super admin from school_User table
    console.log('🗑️ [FIX] Deleting existing super admin from school_User table...');
    const deletedSchoolUser = await prisma.school_User.deleteMany({
      where: { email: superAdminEmail },
    });
    console.log(`✅ [FIX] Deleted ${deletedSchoolUser.count} records from school_User table`);

    // Step 3: Recreate super admin with correct schoolId: null
    console.log('🔧 [FIX] Recreating super admin with schoolId: null...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    console.log('🔐 [FIX] Password hashed successfully');

    // Create super admin user in SaaS User table
    const superAdmin = await saasPrisma.user.create({
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

    // Store password in school_User table for authentication with schoolId: null
    const schoolAdmin = await prisma.school_User.create({
      data: {
        id: 'super-admin-' + Date.now(),
        email: superAdminEmail,
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        schoolId: null, // Super admin has no school association
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('🎉 [FIX] Super admin recreated successfully!');
    console.log(`📧 [FIX] Email: ${superAdminEmail}`);
    console.log(`🆔 [FIX] SaaS User ID: ${superAdmin.id}`);
    console.log(`🆔 [FIX] School User ID: ${schoolAdmin.id}`);
    console.log(`🏫 [FIX] School ID: ${schoolAdmin.schoolId} (should be null)`);
    console.log(`📅 [FIX] Created: ${superAdmin.createdAt}`);
    console.log('');
    console.log('✅ [FIX] Super admin now has schoolId: null as expected');

  } catch (error) {
    console.error('❌ [FIX] Error during super admin fix:', error);
    console.error('❌ [FIX] Error details:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await saasPrisma.$disconnect();
    console.log('=' .repeat(60));
    console.log('🏁 [FIX] Super admin schoolId fix completed');
  }
}

// Run the function
fixSuperAdmin();
