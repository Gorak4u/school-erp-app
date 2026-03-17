import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

const DEFAULT_PLANS = [
  {
    name: 'basic',
    displayName: 'Basic',
    description: 'Perfect for small schools with essential features',
    priceMonthly: 999,
    priceYearly: 9999,
    currency: 'INR',
    maxStudents: 50,
    maxTeachers: 5,
    features: JSON.stringify([
      'Student Management',
      'Teacher Management', 
      'Attendance Tracking',
      'Basic Reports',
      'Email Support'
    ]),
    isActive: true,
    sortOrder: 1,
    trialDays: 14,
  },
  {
    name: 'professional',
    displayName: 'Professional',
    description: 'Ideal for growing schools with advanced features',
    priceMonthly: 2499,
    priceYearly: 24999,
    currency: 'INR',
    maxStudents: 200,
    maxTeachers: 15,
    features: JSON.stringify([
      'Student Management',
      'Teacher Management',
      'Attendance Tracking',
      'Fee Management',
      'Exam Management',
      'Advanced Reports',
      'Parent Portal',
      'SMS Integration',
      'Priority Support'
    ]),
    isActive: true,
    sortOrder: 2,
    trialDays: 21,
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Complete solution for large institutions',
    priceMonthly: 4999,
    priceYearly: 49999,
    currency: 'INR',
    maxStudents: 1000,
    maxTeachers: 50,
    features: JSON.stringify([
      'Student Management',
      'Teacher Management',
      'Attendance Tracking',
      'Fee Management',
      'Exam Management',
      'Advanced Reports',
      'Parent Portal',
      'SMS Integration',
      'Transport Management',
      'Library Management',
      'Hostel Management',
      'API Access',
      'Dedicated Support',
      'Custom Training'
    ]),
    isActive: true,
    sortOrder: 3,
    trialDays: 30,
  },
];

export async function POST() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can seed default plans' }, { status: 403 });
    }

    const results = [];

    for (const planTemplate of DEFAULT_PLANS) {
      const existing = await (saasPrisma as any).plan.findFirst({
        where: { name: planTemplate.name },
      });

      if (existing) {
        results.push({ name: planTemplate.name, status: 'already_exists', id: existing.id });
        continue;
      }

      const created = await (saasPrisma as any).plan.create({
        data: planTemplate,
      });

      results.push({ name: planTemplate.name, status: 'created', id: created.id });
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('POST /api/plans/seed-defaults:', err);
    return NextResponse.json({ error: 'Failed to seed default plans' }, { status: 500 });
  }
}
