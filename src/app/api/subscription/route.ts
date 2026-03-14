import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await (schoolPrisma as any).school_User.findUnique({
      where: { email: session.user.email },
    });

    
    if (!user) {
      return NextResponse.json({ error: 'school_User not found' }, { status: 404 });
    }

    // Get school and subscription separately since they're in different schemas
    let school = null;
    let studentsUsed = 0;
    let teachersUsed = 0;
    
    if (user?.schoolId) {
      // Get school and subscription from SaaS schema
      school = await (saasPrisma as any).school.findUnique({
        where: { id: user.schoolId },
        include: {
          subscription: true,
        },
      });

      // Count students and teachers from school schema separately
      const [studentCount, teacherCount] = await Promise.all([
        (schoolPrisma as any).student.count({ where: { schoolId: user.schoolId } }),
        (schoolPrisma as any).teacher.count({ where: { schoolId: user.schoolId } }),
      ]);
      
      studentsUsed = studentCount;
      teachersUsed = teacherCount;
    }

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Super admin always has active enterprise — no trial banner
    if (isSuperAdmin(session.user.email)) {
      return NextResponse.json({
        hasSchool: !!school,
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
          studentsUsed: studentsUsed,
          teachersUsed: teachersUsed,
          features: ['all'],
          currentPeriodEnd: null,
        },
      });
    }

    // school_User without school (legacy)
    if (!school) {
      return NextResponse.json({
        hasSchool: false,
        subscription: null,
        message: 'No school associated with this account',
      });
    }

    const sub = school.subscription;
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
        studentsUsed: studentsUsed,
        teachersUsed: teachersUsed,
        features: JSON.parse(sub.features || '[]'),
        currentPeriodEnd: sub.currentPeriodEnd,
      },
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
      },
    });
  } catch (error: any) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
