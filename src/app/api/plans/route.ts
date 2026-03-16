import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await (saasPrisma as any).plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        name: true,
        displayName: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
        currency: true,
        maxStudents: true,
        maxTeachers: true,
        features: true,
        trialDays: true,
        isActive: true,
        sortOrder: true,
      },
    });
    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Public plans GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
