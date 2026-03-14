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

    const schools = await (prisma as any).school.findMany({
      include: {
        subscription: true,
        _count: { select: { users: true, students: true, teachers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ schools });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'School ID required' }, { status: 400 });

    const p = prisma as any;

    if (action === 'block') {
      await p.school.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ success: true, message: 'School blocked' });
    }
    if (action === 'unblock') {
      await p.school.update({ where: { id }, data: { isActive: true } });
      return NextResponse.json({ success: true, message: 'School unblocked' });
    }
    if (action === 'extend_trial') {
      const days = data.days || 30;
      const sub = await p.subscription.findUnique({ where: { schoolId: id } });
      if (sub) {
        const currentEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
        const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
        await p.subscription.update({
          where: { schoolId: id },
          data: { trialEndsAt: newEnd, status: 'trial' },
        });
        return NextResponse.json({ success: true, message: `Trial extended by ${days} days` });
      }
    }
    if (action === 'change_plan') {
      const { plan, maxStudents, maxTeachers } = data;
      await p.subscription.update({
        where: { schoolId: id },
        data: {
          plan,
          status: 'active',
          ...(maxStudents && { maxStudents }),
          ...(maxTeachers && { maxTeachers }),
        },
      });
      return NextResponse.json({ success: true, message: `Plan changed to ${plan}` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
