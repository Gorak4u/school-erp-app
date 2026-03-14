import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await (prisma as any).user.findUnique({
      where: { email: session.user.email },
      include: {
        school: {
          include: {
            subscription: true,
            _count: { select: { students: true, teachers: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Super admin always has active enterprise — no trial banner
    if (isSuperAdmin(session.user.email)) {
      return NextResponse.json({
        hasSchool: !!user.school,
        subscription: {
          plan: 'enterprise',
          status: 'active',
          isActive: true,
          isTrial: false,
          isExpired: false,
          trialDaysLeft: null,
          trialEndsAt: null,
          maxStudents: 999999,
          maxTeachers: 999999,
          studentsUsed: user.school?._count?.students || 0,
          teachersUsed: user.school?._count?.teachers || 0,
          features: ['all'],
          currentPeriodEnd: null,
        },
      });
    }

    // User without school (legacy)
    if (!user.school) {
      return NextResponse.json({
        hasSchool: false,
        subscription: null,
        message: 'No school associated with this account',
      });
    }

    const sub = user.school.subscription;
    if (!sub) {
      return NextResponse.json({
        hasSchool: true,
        subscription: null,
        message: 'No subscription found',
      });
    }

    const now = new Date();
    const isTrial = sub.status === 'trial';
    const trialEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;
    const isTrialExpired = isTrial && trialEndsAt && trialEndsAt < now;
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    const isPeriodExpired = periodEnd && periodEnd < now && sub.status !== 'trial';
    const isExpired = isTrialExpired || isPeriodExpired || sub.status === 'expired' || sub.status === 'cancelled';
    const isActive = !isExpired;

    return NextResponse.json({
      hasSchool: true,
      subscription: {
        plan: sub.plan,
        status: sub.status,
        isActive,
        isTrial,
        isExpired: !!isExpired,
        trialDaysLeft,
        trialEndsAt: sub.trialEndsAt,
        maxStudents: sub.maxStudents,
        maxTeachers: sub.maxTeachers,
        studentsUsed: user.school._count.students,
        teachersUsed: user.school._count.teachers,
        features: JSON.parse(sub.features || '[]'),
        currentPeriodEnd: sub.currentPeriodEnd,
      },
      school: {
        id: user.school.id,
        name: user.school.name,
        slug: user.school.slug,
      },
    });
  } catch (error: any) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
