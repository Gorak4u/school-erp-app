import { prisma } from '@/lib/prisma';

export type PlanName = string; // Dynamic from database
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'cancelled';

// Fetch plan limits from database
export async function getPlanLimits(planName: string): Promise<{ maxStudents: number; maxTeachers: number }> {
  const plan = await (prisma as any).plan.findUnique({
    where: { name: planName },
    select: { maxStudents: true, maxTeachers: true }
  });
  
  if (!plan) {
    // Fallback to trial defaults
    return { maxStudents: 50, maxTeachers: 5 };
  }
  
  return {
    maxStudents: plan.maxStudents || 50,
    maxTeachers: plan.maxTeachers || 5
  };
}

// Fetch plan features from database
export async function getPlanFeatures(planName: string): Promise<string[]> {
  const plan = await (prisma as any).plan.findUnique({
    where: { name: planName },
    select: { features: true }
  });
  
  if (!plan || !plan.features) {
    // Fallback to trial features
    return ['student-management', 'attendance-tracking', 'fee-management', 'basic-reports'];
  }
  
  try {
    return JSON.parse(plan.features);
  } catch {
    return ['student-management', 'attendance-tracking', 'fee-management', 'basic-reports'];
  }
}

// Get all active plans from database
export async function getActivePlans() {
  const plans = await (prisma as any).plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });
  return plans;
}

export interface SubscriptionInfo {
  plan: PlanName;
  status: SubscriptionStatus;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  trialDaysLeft: number | null;
  maxStudents: number;
  maxTeachers: number;
  features: string[];
  schoolId: string;
  schoolName: string;
}

export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user?.school?.subscription) {
      return null;
    }

    const sub = user.school.subscription;
    const now = new Date();

    const isTrial = sub.status === 'trial';
    const trialEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    // Check if trial expired
    const isTrialExpired = isTrial && trialEndsAt && trialEndsAt < now;

    // Check if subscription period expired
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    const isPeriodExpired = periodEnd && periodEnd < now && sub.status !== 'trial';

    const isExpired = isTrialExpired || isPeriodExpired || sub.status === 'expired' || sub.status === 'cancelled';
    const isActive = !isExpired && (sub.status === 'active' || (sub.status === 'trial' && !isTrialExpired));

    let features: string[] = [];
    try {
      features = JSON.parse(sub.features || '[]');
    } catch {
      features = await getPlanFeatures(sub.plan);
    }

    return {
      plan: sub.plan as PlanName,
      status: sub.status as SubscriptionStatus,
      isActive,
      isTrial,
      isExpired: !!isExpired,
      trialDaysLeft,
      maxStudents: sub.maxStudents,
      maxTeachers: sub.maxTeachers,
      features,
      schoolId: user.school.id,
      schoolName: user.school.name,
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return null;
  }
}

export function hasFeature(subscriptionInfo: SubscriptionInfo, feature: string): boolean {
  return subscriptionInfo.features.includes(feature);
}

export async function checkUserLimits(schoolId: string): Promise<{
  studentsUsed: number;
  studentsMax: number;
  teachersUsed: number;
  teachersMax: number;
  canAddStudent: boolean;
  canAddTeacher: boolean;
}> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      subscription: true,
      _count: {
        select: {
          students: true,
          teachers: true,
        },
      },
    },
  });

  if (!school?.subscription) {
    return {
      studentsUsed: 0,
      studentsMax: 0,
      teachersUsed: 0,
      teachersMax: 0,
      canAddStudent: false,
      canAddTeacher: false,
    };
  }

  return {
    studentsUsed: school._count.students,
    studentsMax: school.subscription.maxStudents,
    teachersUsed: school._count.teachers,
    teachersMax: school.subscription.maxTeachers,
    canAddStudent: school._count.students < school.subscription.maxStudents,
    canAddTeacher: school._count.teachers < school.subscription.maxTeachers,
  };
}
