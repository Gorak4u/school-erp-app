import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const p = prisma as any;

    const [
      totalSchools,
      activeSchools,
      demoSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      subscriptions,
    ] = await Promise.all([
      p.school.count(),
      p.school.count({ where: { isActive: true } }),
      p.school.count({ where: { isDemo: true } }),
      p.user.count(),
      p.student.count(),
      p.teacher.count(),
      p.subscription.findMany({
        select: { plan: true, status: true },
      }),
    ]);

    const subByPlan: Record<string, number> = {};
    const subByStatus: Record<string, number> = {};
    for (const s of subscriptions) {
      subByPlan[s.plan] = (subByPlan[s.plan] || 0) + 1;
      subByStatus[s.status] = (subByStatus[s.status] || 0) + 1;
    }

    return NextResponse.json({
      totalSchools,
      activeSchools,
      demoSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalSubscriptions: subscriptions.length,
      subscriptionsByPlan: subByPlan,
      subscriptionsByStatus: subByStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
