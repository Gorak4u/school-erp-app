import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the super admin's school and convert subscription to active
    const user = await (saasPrisma as any).user.findUnique({
      where: { email: session.user.email },
      include: { school: { include: { subscription: true } } },
    });

    if (!user?.school?.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Update subscription to active with enterprise plan
    await (saasPrisma as any).subscription.update({
      where: { schoolId: user.school.id },
      data: {
        plan: 'enterprise',
        status: 'active',
        trialEndsAt: null,
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        maxStudents: 999999,
        maxTeachers: 999999,
      },
    });

    return NextResponse.json({ success: true, message: 'Subscription activated as Enterprise plan' });
  } catch (error: any) {
    console.error('Activate subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
