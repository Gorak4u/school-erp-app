import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Use SaaS database URL for seeding SaaS schema
const pool = new Pool({
  connectionString: process.env.SAAS_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const saasPrisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding SaaS schema...');

  try {
    // ─── PLANS ───────────────────────────────────────────────────────────────────
    console.log('Creating pricing plans...');
    
    await (saasPrisma as any).plan.upsert({
      where: { name: 'trial' },
      update: {},
      create: {
        name: 'trial',
        displayName: 'Free Trial',
        description: 'Try all features free for 14 days',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'INR',
        maxStudents: 50,
        maxTeachers: 5,
        features: JSON.stringify(['Student Management', 'Attendance Tracking', 'Basic Reports', 'Email Support']),
        trialDays: 14,
        sortOrder: 1,
        isActive: true,
      },
    });

    await (saasPrisma as any).plan.upsert({
      where: { name: 'basic' },
      update: {},
      create: {
        name: 'basic',
        displayName: 'Basic',
        description: 'Perfect for small schools',
        priceMonthly: 999,
        priceYearly: 9999,
        currency: 'INR',
        maxStudents: 100,
        maxTeachers: 10,
        features: JSON.stringify(['Student Management', 'Attendance Tracking', 'Fee Management', 'Basic Reports', 'Email Support']),
        trialDays: 0,
        sortOrder: 2,
        isActive: true,
      },
    });

    await (saasPrisma as any).plan.upsert({
      where: { name: 'professional' },
      update: {},
      create: {
        name: 'professional',
        displayName: 'Professional',
        description: 'Ideal for growing schools',
        priceMonthly: 1999,
        priceYearly: 19999,
        currency: 'INR',
        maxStudents: 500,
        maxTeachers: 25,
        features: JSON.stringify(['Student Management', 'Attendance Tracking', 'Fee Management', 'Advanced Reports', 'Email Support', 'API Access']),
        trialDays: 0,
        sortOrder: 3,
        isActive: true,
      },
    });

    await (saasPrisma as any).plan.upsert({
      where: { name: 'enterprise' },
      update: {},
      create: {
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'Complete solution for large institutions',
        priceMonthly: 4999,
        priceYearly: 49999,
        currency: 'INR',
        maxStudents: 2000,
        maxTeachers: 100,
        features: JSON.stringify(['All Features', 'Priority Support', 'Custom Integrations', 'Dedicated Account Manager', 'White-label Options']),
        trialDays: 0,
        sortOrder: 4,
        isActive: true,
      },
    });

    console.log('✅ Pricing plans created');

    // ─── SaaS SETTINGS ───────────────────────────────────────────────────────────
    console.log('Creating SaaS settings...');
    
    const saasSettings = [
      // Payment Settings
      { group: 'saas_payment', key: 'razorpay_key_id', value: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key' },
      { group: 'saas_payment', key: 'razorpay_key_secret', value: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_demo_secret' },
      { group: 'saas_payment', key: 'bank_name', value: 'Demo Bank' },
      { group: 'saas_payment', key: 'bank_account_number', value: '1234567890' },
      { group: 'saas_payment', key: 'bank_ifsc', value: 'DEMO0001234' },
      { group: 'saas_payment', key: 'business_name', value: 'School ERP Demo' },
      { group: 'saas_payment', key: 'business_email', value: 'billing@schoolerp.demo' },
      { group: 'saas_payment', key: 'business_phone', value: '+919876543210' },
      { group: 'saas_payment', key: 'business_address', value: '123 Demo Street, Demo City, 123456' },
      
      // Platform Settings
      { group: 'saas_platform', key: 'default_trial_days', value: '14' },
      { group: 'saas_platform', key: 'max_schools_per_admin', value: '10' },
      { group: 'saas_platform', key: 'enable_auto_trial_extension', value: 'true' },
      { group: 'saas_platform', key: 'trial_extension_days', value: '7' },
      
      // Email Settings
      { group: 'saas_email', key: 'from_email', value: 'noreply@schoolerp.demo' },
      { group: 'saas_email', key: 'from_name', value: 'School ERP Platform' },
      { group: 'saas_email', key: 'support_email', value: 'support@schoolerp.demo' },
    ];

    for (const setting of saasSettings) {
      await (saasPrisma as any).saasSetting.upsert({
        where: { group_key: { group: setting.group, key: setting.key } },
        update: { value: setting.value },
        create: setting,
      });
    }

    console.log('✅ SaaS settings created');

    // ─── SAMPLE SCHOOLS (for testing) ─────────────────────────────────────────────────
    console.log('Creating sample schools...');
    
    const demoSchool = await (saasPrisma as any).school.upsert({
      where: { slug: 'demo-school' },
      update: {},
      create: {
        name: 'Demo School',
        slug: 'demo-school',
        domain: 'demo.schoolerp.demo',
        email: 'admin@demo.schoolerp.demo',
        phone: '+919876543210',
        address: '123 Demo Street, Demo City, 123456',
        isActive: true,
      },
    });

    // Create trial subscription for demo school
    await (saasPrisma as any).subscription.upsert({
      where: { schoolId: demoSchool.id },
      update: {},
      create: {
        schoolId: demoSchool.id,
        plan: 'trial',
        status: 'trial',
        maxStudents: 50,
        maxTeachers: 5,
        features: JSON.stringify(['Student Management', 'Attendance Tracking', 'Basic Reports', 'Email Support']),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    console.log('✅ Sample schools created');

    // ─── SAMPLE ANNOUNCEMENTS ─────────────────────────────────────────────────────
    console.log('Creating sample announcements...');
    
    const announcements = [
      {
        title: 'Welcome to School ERP Platform',
        message: 'We are excited to have you on board! Explore all the features available during your trial period.',
        type: 'info',
        targetPlans: JSON.stringify(['trial', 'basic', 'professional', 'enterprise']),
        isActive: true,
        createdBy: 'system',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        title: 'New Features Released',
        message: 'Check out our latest features including enhanced reporting and improved attendance tracking.',
        type: 'feature',
        targetPlans: JSON.stringify(['professional', 'enterprise']),
        isActive: true,
        createdBy: 'system',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
      {
        title: 'Scheduled Maintenance',
        message: 'Platform will undergo maintenance on Sunday 2AM - 4AM IST. Services may be temporarily unavailable.',
        type: 'maintenance',
        targetPlans: JSON.stringify(['trial', 'basic', 'professional', 'enterprise']),
        isActive: true,
        createdBy: 'system',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    ];

    for (const announcement of announcements) {
      await (saasPrisma as any).saasAnnouncement.upsert({
        where: { title: announcement.title },
        update: announcement,
        create: announcement,
      });
    }

    console.log('✅ Sample announcements created');

    console.log('\n🎉 SaaS schema seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log('   - 4 Pricing plans (trial, basic, professional, enterprise)');
    console.log('   - 17 SaaS settings (payment, platform, email)');
    console.log('   - 1 Sample school with trial subscription');
    console.log('   - 3 Sample announcements');

  } catch (error) {
    console.error('❌ Error seeding SaaS schema:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await (saasPrisma as any).$disconnect();
  });
