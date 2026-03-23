import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export type PlanName = string; // Dynamic from database
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'cancelled';

// Discount calculation utilities
export interface DiscountInfo {
  type: 'percentage' | 'fixed';
  value: number;
  maxAmount?: number;
}

export interface PriceCalculation {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
}

// Calculate discount for a given price and discount info
export function calculateDiscount(originalPrice: number, discount: DiscountInfo): PriceCalculation {
  let discountAmount = 0;
  let discountedPrice = originalPrice;

  if (discount.type === 'percentage') {
    discountAmount = originalPrice * (discount.value / 100);
    if (discount.maxAmount && discountAmount > discount.maxAmount) {
      discountAmount = discount.maxAmount;
    }
  } else if (discount.type === 'fixed') {
    discountAmount = discount.value;
  }

  discountedPrice = Math.max(0, originalPrice - discountAmount);
  discountAmount = Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  discountedPrice = Math.round(discountedPrice * 100) / 100;

  return {
    originalPrice,
    discountedPrice,
    discountAmount,
    hasDiscount: discountAmount > 0
  };
}

// Validate and get promo code details
export async function validatePromoCode(code: string, plan: string): Promise<{ valid: boolean; discount?: DiscountInfo; error?: string }> {
  try {
    const promoCode = await saasPrisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promoCode) {
      return { valid: false, error: 'Invalid promo code' };
    }

    // Check if active
    if (!promoCode.isActive) {
      return { valid: false, error: 'Promo code is inactive' };
    }

    // Check expiry
    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validTo) {
      return { valid: false, error: 'Promo code has expired' };
    }

    // Check usage limit
    if (promoCode.usageLimit) {
      const usageCount = await saasPrisma.subscriptionPromo.count({
        where: { promoCodeId: promoCode.id }
      });

      if (usageCount >= promoCode.usageLimit) {
        return { valid: false, error: 'Promo code usage limit exceeded' };
      }
    }

    // Check plan compatibility
    if (promoCode.applicablePlans !== 'all') {
      const applicablePlans = JSON.parse(promoCode.applicablePlans);
      if (!applicablePlans.includes(plan)) {
        return { valid: false, error: 'Promo code not applicable to this plan' };
      }
    }

    return {
      valid: true,
      discount: {
        type: promoCode.discountType as 'percentage' | 'fixed',
        value: promoCode.discountValue,
        maxAmount: promoCode.maxDiscountAmount || undefined
      }
    };
  } catch (error) {
    logger.error('Promo validation error', { error, promoCode: code });
    return { valid: false, error: 'Failed to validate promo code' };
  }
}

// Apply promo code to subscription
export async function applyPromoToSubscription(
  subscriptionId: string,
  promoCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await saasPrisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { 
        promoCodes: {
          include: {
            promoCode: true
          }
        }
      }
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Check if promo already used
    if (subscription.promoCodes.some(p => p.promoCode.code === promoCode.toUpperCase())) {
      return { success: false, error: 'Promo code already used for this subscription' };
    }

    // Get promo code details
    const promoCodeDetails = await saasPrisma.promoCode.findUnique({
      where: { code: promoCode.toUpperCase() }
    });

    if (!promoCodeDetails) {
      return { success: false, error: 'Promo code not found' };
    }

    // Validate promo code for this subscription's plan
    const validation = await validatePromoCode(promoCode, subscription.plan);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create subscription promo record
    await saasPrisma.subscriptionPromo.create({
      data: {
        subscriptionId,
        promoCodeId: promoCodeDetails.id,
        discountAmount: 0, // Will be calculated when invoice is generated
      }
    });

    return { success: true };
  } catch (error) {
    logger.error('Apply promo error', { error, subscriptionId, promoCode });
    return { success: false, error: 'Failed to apply promo code' };
  }
}

// Fetch plan limits from database
export async function getPlanLimits(planName: string): Promise<{ maxStudents: number; maxTeachers: number }> {
  const plan = await (saasPrisma as any).plan.findUnique({
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
  const plan = await (saasPrisma as any).plan.findUnique({
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
  const plans = await (saasPrisma as any).plan.findMany({
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
    const user = await (schoolPrisma as any).school_User.findUnique({
      where: { id: userId },
      include: {
        CustomRole: true,
      },
    });

    // Get school and subscription separately since they're in different schemas
    let sub = null;
    if (user?.schoolId) {
      const school = await (saasPrisma as any).school.findUnique({
        where: { id: user.schoolId },
        include: { subscription: true },
      });
      sub = school?.subscription;
    }

    if (!sub) {
      return null;
    }
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
    logger.error('Error getting subscription info', { error, userId });
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
  // Get school and subscription from SaaS schema
  const school = await (saasPrisma as any).school.findUnique({
    where: { id: schoolId },
    include: {
      subscription: true,
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

  // Count students and teachers from school schema separately
  const [studentCount, teacherCount] = await Promise.all([
    (schoolPrisma as any).student.count({ where: { schoolId } }),
    (schoolPrisma as any).teacher.count({ where: { schoolId } }),
  ]);

  return {
    studentsUsed: studentCount,
    studentsMax: school.subscription.maxStudents,
    teachersUsed: teacherCount,
    teachersMax: school.subscription.maxTeachers,
    canAddStudent: studentCount < school.subscription.maxStudents,
    canAddTeacher: teacherCount < school.subscription.maxTeachers,
  };
}
