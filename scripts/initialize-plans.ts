import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function initializePlans() {
  try {
    console.log('📦 Initializing subscription plans...');

    const plans = [
      {
        name: 'basic',
        displayName: 'Basic Plan',
        description: 'Perfect for small schools getting started',
        priceMonthly: 2999,
        priceYearly: 29990,
        currency: 'INR',
        maxStudents: 200,
        maxTeachers: 20,
        features: JSON.stringify([
          'Student Management',
          'Teacher Management',
          'Attendance Tracking',
          'Fee Management',
          'Basic Reports'
        ]),
        trialDays: 14,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'professional',
        displayName: 'Professional Plan',
        description: 'Ideal for growing educational institutions',
        priceMonthly: 5999,
        priceYearly: 59990,
        currency: 'INR',
        maxStudents: 500,
        maxTeachers: 50,
        features: JSON.stringify([
          'Student Management',
          'Teacher Management',
          'Advanced Attendance',
          'Complete Fee Management',
          'Exam Management',
          'Grade Reports',
          'Parent Portal',
          'Mobile App Access'
        ]),
        trialDays: 14,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise Plan',
        description: 'Complete solution for large institutions',
        priceMonthly: 14999,
        priceYearly: 149990,
        currency: 'INR',
        maxStudents: 999999,
        maxTeachers: 999999,
        features: JSON.stringify([
          'All Professional Features',
          'Unlimited Students & Teachers',
          'Advanced Analytics',
          'Custom Reports',
          'API Access',
          'Priority Support',
          'White-label Options',
          'Advanced Security'
        ]),
        trialDays: 30,
        isActive: true,
        sortOrder: 3,
      }
    ];

    for (const plan of plans) {
      await (prisma as any).plan.upsert({
        where: { name: plan.name },
        update: plan,
        create: plan,
      });
      console.log(`✅ ${plan.displayName} created/updated`);
    }

    console.log('🎉 Subscription plans initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing plans:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializePlans();
