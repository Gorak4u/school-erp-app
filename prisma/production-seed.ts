// @ts-nocheck
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Use the same adapter setup as the main app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function productionSeed() {
  console.log('🌱 Production seed: Creating SaaS system with plans, school, and admin...');

  try {
    // 0. Create Subscription Plans
    const planData = [
      {
        name: 'trial',
        displayName: 'Free Trial',
        description: 'Try everything free for 30 days',
        priceMonthly: 0,
        priceYearly: 0,
        maxStudents: 50,
        maxTeachers: 5,
        features: JSON.stringify(['student-management', 'attendance-tracking', 'fee-management', 'basic-reports']),
        trialDays: 30,
        sortOrder: 0,
      },
      {
        name: 'basic',
        displayName: 'Basic',
        description: 'For small schools getting started',
        priceMonthly: 2999,
        priceYearly: 28790,
        maxStudents: 200,
        maxTeachers: 15,
        features: JSON.stringify(['student-management', 'attendance-tracking', 'fee-management', 'basic-reports', 'advanced-reports', 'sms-notifications', 'parent-portal']),
        trialDays: 0,
        sortOrder: 1,
      },
      {
        name: 'professional',
        displayName: 'Professional',
        description: 'For growing schools with advanced needs',
        priceMonthly: 7999,
        priceYearly: 76790,
        maxStudents: 1000,
        maxTeachers: 50,
        features: JSON.stringify(['student-management', 'attendance-tracking', 'fee-management', 'basic-reports', 'advanced-reports', 'sms-notifications', 'parent-portal', 'exam-management', 'timetable-management', 'library-management', 'api-access']),
        trialDays: 0,
        sortOrder: 2,
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'For large institutions with custom needs',
        priceMonthly: 0,
        priceYearly: 0,
        maxStudents: 999999,
        maxTeachers: 999999,
        features: JSON.stringify(['student-management', 'attendance-tracking', 'fee-management', 'basic-reports', 'advanced-reports', 'sms-notifications', 'parent-portal', 'exam-management', 'timetable-management', 'library-management', 'api-access', 'white-label', 'custom-integrations', 'dedicated-support']),
        trialDays: 0,
        sortOrder: 3,
      },
    ];

    for (const plan of planData) {
      await prisma.plan.upsert({
        where: { name: plan.name },
        update: plan,
        create: plan,
      });
    }
    console.log('  ✅ Subscription plans created');

    // 1. Create Academic Year (current year)
    const currentYear = new Date().getFullYear();
    const academicYear = await prisma.academicYear.upsert({
      where: { year: currentYear.toString() },
      update: {},
      create: {
        name: `Academic Year ${currentYear}-${currentYear + 1}`,
        year: currentYear.toString(),
        startDate: `${currentYear}-04-01`, // April 1
        endDate: `${currentYear + 1}-03-31`, // March 31
        isActive: true,
      },
    });

    // 2. Create basic school structure (empty, ready for real data)
    const board = await prisma.board.upsert({
      where: { code: 'CBSE' },
      update: {},
      create: {
        name: 'Central Board of Secondary Education',
        code: 'CBSE',
        description: 'National education board',
        isActive: true,
      },
    });

    const medium = await prisma.medium.upsert({
      where: { code: 'ENG' },
      update: {},
      create: {
        name: 'English',
        code: 'ENG',
        description: 'English medium instruction',
        isActive: true,
        academicYearId: academicYear.id,
      },
    });

    // Create basic class levels (no sections yet)
    const classes = [];
    for (let i = 1; i <= 12; i++) {
      const classData = await prisma.class.upsert({
        where: { code: `CLS${i}` },
        update: {},
        create: {
          name: `Class ${i}`,
          code: `CLS${i}`,
          level: i.toString(),
          isActive: true,
          academicYearId: academicYear.id,
          mediumId: medium.id,
        },
      });
      classes.push(classData);
    }

    // 3. Create school settings (basic configuration)
    const settings = [
      // School details
      { group: 'school_details', key: 'name', value: 'Your School Name' },
      { group: 'school_details', key: 'address', value: 'School Address, City, State - Pincode' },
      { group: 'school_details', key: 'phone', value: '+91-XXXXXXXXXX' },
      { group: 'school_details', key: 'email', value: 'contact@yourschool.com' },
      
      // Fee configuration
      { group: 'fee_config', key: 'late_fee_per_day', value: '50' },
      { group: 'fee_config', key: 'grace_period_days', value: '5' },
      { group: 'fee_config', key: 'receipt_prefix', value: 'RCPT' },
      
      // Academic settings
      { group: 'academic', key: 'current_session', value: currentYear.toString() },
      { group: 'academic', key: 'passing_percentage', value: '40' },
      { group: 'academic', key: 'attendance_threshold', value: '75' },
    ];

    await prisma.schoolSetting.createMany({
      data: settings,
      skipDuplicates: true,
    });

    // 4. Create school timings
    const timings = [
      { name: 'Morning Assembly', startTime: '08:00', endTime: '08:15', type: 'assembly', dayOfWeek: 'all', sortOrder: 1 },
      { name: 'Period 1', startTime: '08:15', endTime: '09:00', type: 'period', dayOfWeek: 'all', sortOrder: 2 },
      { name: 'Period 2', startTime: '09:00', endTime: '09:45', type: 'period', dayOfWeek: 'all', sortOrder: 3 },
      { name: 'Short Break', startTime: '09:45', endTime: '10:00', type: 'break', dayOfWeek: 'all', sortOrder: 4 },
      { name: 'Period 3', startTime: '10:00', endTime: '10:45', type: 'period', dayOfWeek: 'all', sortOrder: 5 },
      { name: 'Period 4', startTime: '10:45', endTime: '11:30', type: 'period', dayOfWeek: 'all', sortOrder: 6 },
      { name: 'Lunch Break', startTime: '11:30', endTime: '12:00', type: 'break', dayOfWeek: 'all', sortOrder: 7 },
      { name: 'Period 5', startTime: '12:00', endTime: '12:45', type: 'period', dayOfWeek: 'all', sortOrder: 8 },
      { name: 'Period 6', startTime: '12:45', endTime: '13:30', type: 'period', dayOfWeek: 'all', sortOrder: 9 },
      { name: 'Period 7', startTime: '13:30', endTime: '14:15', type: 'period', dayOfWeek: 'all', sortOrder: 10 },
      { name: 'Period 8', startTime: '14:15', endTime: '15:00', type: 'period', dayOfWeek: 'all', sortOrder: 11 },
    ];

    await prisma.schoolTiming.createMany({
      data: timings.map(t => ({ ...t, isActive: true })),
      skipDuplicates: true,
    });

    // 5. Create demo school with trial subscription
    const demoSchool = await prisma.school.upsert({
      where: { slug: 'demo-school' },
      update: {},
      create: {
        name: 'Demo School',
        slug: 'demo-school',
        email: 'admin@schoolerp.com',
        phone: '+91-9876543210',
        address: 'Demo Address, City',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        isActive: true,
        isDemo: true,
      },
    });

    // Create trial subscription for demo school (30 days from now)
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.upsert({
      where: { schoolId: demoSchool.id },
      update: {},
      create: {
        schoolId: demoSchool.id,
        plan: 'trial',
        status: 'trial',
        trialEndsAt,
        maxStudents: 50,
        maxTeachers: 5,
        features: JSON.stringify(['student-management', 'attendance-tracking', 'fee-management', 'basic-reports']),
        billingEmail: 'admin@schoolerp.com',
      },
    });
    console.log('  ✅ Demo school with trial subscription created');

    // 6. Create admin user with hashed password linked to school
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@schoolerp.com' },
      update: { schoolId: demoSchool.id },
      create: {
        email: 'admin@schoolerp.com',
        firstName: 'School',
        lastName: 'Administrator',
        role: 'admin',
        password: hashedPassword,
        isActive: true,
        schoolId: demoSchool.id,
      },
    });
    
    // 7. Create NextAuth Account record for the admin user
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'credentials',
          providerAccountId: adminUser.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: adminUser.id,
      },
    });

    console.log('✅ Production seed completed successfully!');
    console.log('\n📋 What was created:');
    console.log(`  - Subscription Plans: 4 (trial, basic, professional, enterprise)`);
    console.log(`  - Demo School: ${demoSchool.name} (slug: ${demoSchool.slug})`);
    console.log(`  - Trial Subscription: expires ${trialEndsAt.toLocaleDateString()}`);
    console.log(`  - Academic Year: ${academicYear.name}`);
    console.log(`  - Board: ${board.name}`);
    console.log(`  - Medium: ${medium.name}`);
    console.log(`  - Classes: ${classes.length} (Class 1-12)`);
    console.log(`  - School Settings: ${settings.length} configuration items`);
    console.log(`  - School Timings: ${timings.length} periods`);
    console.log(`  - Admin User: ${adminUser.email}`);
    console.log('\n🔐 Default Admin Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123`);
    console.log('\n🌐 SaaS URLs:');
    console.log(`   Pricing:  /pricing`);
    console.log(`   Register: /register`);
    console.log(`   Login:    /login`);
    console.log('\n✨ SaaS system is ready!');

  } catch (error) {
    console.error('❌ Production seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  productionSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export default productionSeed;
