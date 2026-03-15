#!/usr/bin/env node

/**
 * Ensure Super Admin Script
 * 
 * This script can be run independently to ensure super admin exists.
 * Usage: node scripts/ensure-super-admin.js
 * 
 * It will:
 * 1. Check if super admin exists in SaaS User table
 * 2. Create it if it doesn't exist (from .env credentials)
 * 3. Provide detailed logging
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

// Import saasPrisma (same as in the main app)
const saasPrisma = new PrismaClient({
  adapter: adapter
});

async function ensureSuperAdmin() {
  console.log('🚀 [SCRIPT] Starting super admin verification...');
  console.log('=' .repeat(60));

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    console.log(`📧 [SCRIPT] Configured email: ${superAdminEmail || 'NOT_SET'}`);
    console.log(`🔑 [SCRIPT] Password configured: ${superAdminPassword ? 'YES' : 'NO'}`);

    // Case 1: No credentials in .env
    if (!superAdminEmail || !superAdminPassword) {
      console.log('⚠️ [SCRIPT] No credentials found in .env file');
      console.log('📝 [SCRIPT] Please set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env');
      console.log('');
      console.log('Example .env configuration:');
      console.log('SUPER_ADMIN_EMAIL=admin@example.com');
      console.log('SUPER_ADMIN_PASSWORD=SecurePassword123');
      console.log('SUPER_ADMIN_EMAILS=admin@example.com');
      process.exit(1);
    }

    // Case 2: Check if super admin already exists in SaaS User table
    console.log('🔍 [SCRIPT] Checking existing super admin in SaaS User table...');
    const existingUser = await saasPrisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (existingUser) {
      console.log('✅ [SCRIPT] Super admin already exists in SaaS User table');
      console.log(`📧 [SCRIPT] Email: ${existingUser.email}`);
      console.log(`🆔 [SCRIPT] ID: ${existingUser.id}`);
      console.log(`👤 [SCRIPT] Role: ${existingUser.role}`);
      console.log(`📅 [SCRIPT] Created: ${existingUser.createdAt}`);
      console.log(`✅ [SCRIPT] Super admin is ready for login`);
      console.log('=' .repeat(60));
      return;
    }

    // Case 3: Super admin doesn't exist, create it
    console.log('⚠️ [SCRIPT] No super admin found, creating new one...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    console.log('🔐 [SCRIPT] Password hashed successfully');

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

    // Store password separately in school_User table for authentication
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

    console.log('🎉 [SCRIPT] Super admin created successfully!');
    console.log(`📧 [SCRIPT] Email: ${superAdminEmail}`);
    console.log(`🆔 [SCRIPT] SaaS User ID: ${superAdmin.id}`);
    console.log(`🆔 [SCRIPT] School User ID: ${schoolAdmin.id}`);
    console.log(`📅 [SCRIPT] Created: ${superAdmin.createdAt}`);
    console.log('✅ [SCRIPT] Super admin is ready for login');
    console.log('');
    console.log('🔐 [SCRIPT] Login credentials:');
    console.log(`   Email: ${superAdminEmail}`);
    console.log(`   Password: ${superAdminPassword}`);
    console.log(`   URL: http://localhost:3000/login`);

  } catch (error) {
    console.error('❌ [SCRIPT] Error during super admin creation:', error);
    console.error('❌ [SCRIPT] Error details:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await saasPrisma.$disconnect();
    console.log('=' .repeat(60));
    console.log('🏁 [SCRIPT] Super admin verification completed');
  }
}

// Run the function
ensureSuperAdmin();
