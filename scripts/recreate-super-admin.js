#!/usr/bin/env node

/**
 * Emergency Super Admin Recreation Script
 * Usage: node scripts/recreate-super-admin.js <email> <password>
 */

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

async function recreateSuperAdmin(email, password) {
  try {
    console.log('🔧 Starting super admin recreation...');
    console.log(`📧 Email: ${email}`);

    // Check if user already exists
    const existingUser = await prisma.school_User.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      console.log('❌ User with this email already exists');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('🔐 Password hashed successfully');

    // Create super admin user
    const superAdmin = await prisma.school_User.create({
      data: {
        id: 'super-admin-' + Date.now(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Super admin created successfully!');
    console.log(`🆔 User ID: ${superAdmin.id}`);
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`👤 Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`📅 Created: ${superAdmin.createdAt}`);

    // Update environment variables reminder
    console.log('\n📝 Don\'t forget to update your .env file:');
    console.log(`SUPER_ADMIN_EMAIL=${email}`);
    console.log(`SUPER_ADMIN_PASSWORD=${password}`);
    console.log(`SUPER_ADMIN_EMAILS=${email}`);

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node scripts/recreate-super-admin.js <email> <password>');
  console.log('Example: node scripts/recreate-super-admin.js admin@example.com mySecurePassword123');
  process.exit(1);
}

const [email, password] = args;

// Validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.log('❌ Invalid email format');
  process.exit(1);
}

// Validate password
if (password.length < 8) {
  console.log('❌ Password must be at least 8 characters long');
  process.exit(1);
}

// Run the recreation
recreateSuperAdmin(email, password);
