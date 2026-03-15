import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function createTestSchool() {
  try {
    console.log('🏫 Creating test school...');

    // Create a test school
    const school = await prisma.school.create({
      data: {
        name: 'Test School for Auto-Renewal',
        slug: 'test-school-auto-renewal',
        email: 'admin@testschool.com',
        phone: '9876543210',
        address: '123 Test Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pinCode: '560001',
      }
    });

    console.log('✅ School created:', school.name);

    // Create a subscription for the school
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const subscription = await prisma.subscription.create({
      data: {
        schoolId: school.id,
        plan: 'basic',
        status: 'active',
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
        maxStudents: 200,
        maxTeachers: 20,
        features: JSON.stringify([
          'Student Management',
          'Teacher Management',
          'Attendance Tracking',
          'Fee Management',
          'Basic Reports'
        ]),
      }
    });

    console.log('✅ Subscription created');

    // Create a school admin user
    const adminUser = await (prisma as any).school_User.create({
      data: {
        schoolId: school.id,
        email: 'admin@testschool.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // admin123
        name: 'Test Admin',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
      }
    });

    console.log('✅ Admin user created:', adminUser.email);

    console.log('\n🎉 Test setup complete!');
    console.log('📝 You can now test auto-renewal with:');
    console.log('   School: Test School for Auto-Renewal');
    console.log('   Admin: admin@testschool.com / admin123');
    console.log('   Subscription: Basic plan, autoRenew: false');

  } catch (error) {
    console.error('❌ Error creating test school:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSchool();
