import { createCronJobResult } from '@/lib/cron/job-contract';
import { saasPrisma } from '@/lib/prisma';

export async function runPromoCleanupJob() {
  const now = new Date();
  const errors: string[] = [];
  let expiredDeactivated = 0;
  let usageLimitReached = 0;
  let expiringSoonCount = 0;
  let lowUsageCount = 0;

  try {
    const expiredPromos = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        validTo: { lt: now },
      },
      select: { id: true },
    });

    if (expiredPromos.length > 0) {
      const result = await saasPrisma.promoCode.updateMany({
        where: { id: { in: expiredPromos.map((promo) => promo.id) } },
        data: { isActive: false },
      });
      expiredDeactivated = result.count;
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to deactivate expired promo codes');
  }

  try {
    const exhaustedPromos = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        usageLimit: { not: null },
      },
      select: { id: true, usageLimit: true, usageCount: true },
    });

    const exhaustedIds = exhaustedPromos
      .filter((promo) => typeof promo.usageLimit === 'number' && promo.usageCount >= promo.usageLimit)
      .map((promo) => promo.id);

    if (exhaustedIds.length > 0) {
      const result = await saasPrisma.promoCode.updateMany({
        where: { id: { in: exhaustedIds } },
        data: { isActive: false },
      });
      usageLimitReached = result.count;
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to deactivate exhausted promo codes');
  }

  try {
    expiringSoonCount = await saasPrisma.promoCode.count({
      where: {
        isActive: true,
        validTo: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to count expiring promo codes');
  }

  try {
    const lowUsagePromos = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        usageLimit: { not: null },
        validTo: { gte: now },
      },
      select: { usageLimit: true, usageCount: true },
    });

    lowUsageCount = lowUsagePromos.filter((promo) => {
      if (typeof promo.usageLimit !== 'number') return false;
      const remaining = promo.usageLimit - promo.usageCount;
      return remaining <= 5 && remaining > 0;
    }).length;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to count low-usage promo codes');
  }

  const processed = expiredDeactivated + usageLimitReached;
  const success = errors.length === 0;

  return createCronJobResult({
    success,
    jobName: 'promo-cleanup',
    scope: 'saas',
    message: success ? 'Promo cleanup completed' : 'Promo cleanup completed with errors',
    processed,
    attempted: 4,
    delivered: success ? 4 : Math.max(0, 4 - errors.length),
    skipped: 0,
    failed: errors.length,
    stats: {
      expiredDeactivated,
      usageLimitReached,
      expiringSoonCount,
      lowUsageCount,
    },
    errors,
  });
}
