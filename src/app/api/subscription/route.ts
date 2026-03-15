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
    
    // Only calculate trial info if trial is actually active
    let trialDaysLeft = null;
    let trialStartedAt = null;
    
    if (isTrial && trialEndsAt) {
      // Check if trial has ended
      if (trialEndsAt >= now) {
        trialDaysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate trial start date (assuming 14-day trial period)
        const trialDurationDays = 14;
        trialStartedAt = new Date(trialEndsAt.getTime() - (trialDurationDays * 24 * 60 * 60 * 1000));
      }
    }
    
    const isTrialExpired = isTrial && trialEndsAt && trialEndsAt < now;
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    const isPeriodExpired = periodEnd && periodEnd < now && sub.status !== 'trial';
    const isExpired = isTrialExpired || isPeriodExpired || sub.status === 'expired' || sub.status === 'cancelled';
    const isActive = !isExpired;

    // Calculate subscription dates for users who upgraded during trial
    let subscriptionStartDate = now;
    let subscriptionEndDate = null;
    let nextBillingDate = null;
    
    if (!isTrial && trialEndsAt && trialEndsAt >= now) {
      // User upgraded during trial - calculate subscription dates
      subscriptionStartDate = now; // Subscription starts now
      subscriptionEndDate = trialEndsAt; // Use trial end as first billing date
      nextBillingDate = trialEndsAt; // Next billing when trial would have ended
    } else if (sub.currentPeriodEnd) {
      // Regular subscription with existing period
      subscriptionEndDate = new Date(sub.currentPeriodEnd);
      nextBillingDate = new Date(sub.currentPeriodEnd);
    }

    return NextResponse.json({
      hasSchool: true,
      subscription: {
        plan: sub.plan,
        status: sub.status,
        isActive,
        isTrial,
        isExpired: !!isExpired,
        trialDaysLeft,
        trialEndsAt: sub.trialEndsAt, // Keep trial data for users who upgraded during trial
        trialStartedAt: trialStartedAt?.toISOString(),
        maxStudents: sub.maxStudents,
        maxTeachers: sub.maxTeachers,
        studentsUsed: studentsUsed,
        teachersUsed: teachersUsed,
        features: JSON.parse(sub.features || '[]'),
        currentPeriodEnd: subscriptionEndDate?.toISOString(),
        nextBillingDate: nextBillingDate?.toISOString(),
        amount: sub.amount || null,
        billingCycle: sub.billingCycle || 'monthly',
        autoRenew: sub.autoRenew,
        upgradedFromTrial: !isTrial && trialEndsAt && trialEndsAt >= now, // Flag for users who upgraded during active trial
        subscriptionStartDate: subscriptionStartDate.toISOString(), // When subscription actually started
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
