import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

const DEFAULT_PLANS = [
  {
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for very small schools getting started',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'INR',
    maxStudents: 50,
    maxTeachers: 2,
    features: JSON.stringify([
      'attendance',
      'exams',
      'assignments'
    ]),
    isActive: true,
    sortOrder: 0,
    trialDays: 0,
  },
  {
    name: 'basic',
    displayName: 'Basic',
    description: 'Perfect for small schools with essential features',
    priceMonthly: 999,
    priceYearly: 9999,
    currency: 'INR',
    maxStudents: 200,
    maxTeachers: 5,
    features: JSON.stringify([
      'attendance',
      'fees', 
      'exams',
      'assignments',
      'timetable'
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
    maxStudents: 500,
    maxTeachers: 15,
    features: JSON.stringify([
      'attendance',
      'fees',
      'exams',
      'assignments',
      'timetable',
      'library',
      'transport',
      'analytics',
      'sms',
      'parent_portal'
    ]),
    isActive: true,
    sortOrder: 2,
    trialDays: 21,
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Complete solution for large institutions',
    priceMonthly: 7499,
    priceYearly: 74999,
    currency: 'INR',
    maxStudents: 2000,
    maxTeachers: 30,
    features: JSON.stringify([
      'attendance',
      'fees',
      'exams',
      'assignments',
      'timetable',
      'library',
      'transport',
      'hostel',
      'hr',
      'analytics',
      'sms',
      'parent_portal',
      'api_access'
    ]),
    isActive: true,
    sortOrder: 3,
    trialDays: 30,
  },
  {
    name: 'unlimited',
    displayName: 'Unlimited',
    description: 'Ultimate solution with unlimited scale and premium features',
    priceMonthly: 14999,
    priceYearly: 125000,
    currency: 'INR',
    maxStudents: 99999,
    maxTeachers: 100,
    features: JSON.stringify([
      'attendance',
      'fees',
      'exams',
      'assignments',
      'timetable',
      'library',
      'transport',
      'hostel',
      'hr',
      'analytics',
      'sms',
      'parent_portal',
      'api_access',
      'custom_domain',
      'white_label',
      'dedicated_support',
      'custom_training'
    ]),
    isActive: true,
    sortOrder: 4,
    trialDays: 30,
  },
];

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
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
    console.error('POST /api/admin/plans/seed:', err);
    return NextResponse.json({ error: 'Failed to seed default plans' }, { status: 500 });
  }
}
