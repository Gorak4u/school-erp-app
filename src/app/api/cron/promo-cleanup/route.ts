import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

/**
 * Cron job endpoint to handle expired promo codes and cleanup
 * This should be called daily to maintain promo code hygiene
 */
export async function POST() {
  try {
    const now = new Date();
    const results = {
      expiredDeactivated: 0,
      usageLimitReached: 0,
      notificationsSent: 0,
      errors: [] as string[]
    };

    // 1. Deactivate expired promo codes
    const expiredPromos = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        validTo: {
          lt: now
        }
      }
    });

    if (expiredPromos.length > 0) {
      await saasPrisma.promoCode.updateMany({
        where: {
          id: { in: expiredPromos.map(p => p.id) }
        },
        data: {
          isActive: false
        }
      });
      results.expiredDeactivated = expiredPromos.length;
    }

    // 2. Deactivate promo codes that reached usage limit
    const exhaustedPromos = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        usageLimit: {
          not: null
        },
        usageCount: {
          gte: saasPrisma.promoCode.fields.usageLimit
        }
      }
    });

    if (exhaustedPromos.length > 0) {
      await saasPrisma.promoCode.updateMany({
        where: {
          id: { in: exhaustedPromos.map(p => p.id) }
        },
        data: {
          isActive: false
        }
      });
      results.usageLimitReached = exhaustedPromos.length;
    }

    // 3. Find promos expiring soon (next 7 days)
    const expiringSoon = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        validTo: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        subscriptionPromos: true
      }
    });

    // 4. Find promos with low usage (less than 5 uses remaining)
    const lowUsagePromos = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        usageLimit: {
          not: null
        },
        validTo: {
          gte: now
        }
      },
      include: {
        subscriptionPromos: true
      }
    }).then(promos => 
      promos.filter(promo => {
        const remaining = promo.usageLimit! - promo.usageCount;
        return remaining <= 5 && remaining > 0;
      })
    );

    // 5. Log cleanup activities (could be extended to send notifications)
    console.log('🧹 Promo code cleanup completed:', {
      timestamp: now.toISOString(),
      expiredDeactivated: results.expiredDeactivated,
      usageLimitReached: results.usageLimitReached,
      expiringSoonCount: expiringSoon.length,
      lowUsageCount: lowUsagePromos.length
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
      alerts: {
        expiringSoon: expiringSoon.map(p => ({
          code: p.code,
          description: p.description,
          validTo: p.validTo,
          usageCount: p.usageCount,
          usageLimit: p.usageLimit
        })),
        lowUsage: lowUsagePromos.map(p => ({
          code: p.code,
          description: p.description,
          remaining: p.usageLimit! - p.usageCount,
          validTo: p.validTo
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Promo code cleanup failed:', error);
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Get cleanup status and statistics
 */
export async function GET() {
  try {
    const now = new Date();
    
    const stats = {
      total: await saasPrisma.promoCode.count(),
      active: await saasPrisma.promoCode.count({ where: { isActive: true } }),
      expired: await saasPrisma.promoCode.count({ where: { validTo: { lt: now } } }),
      expiringSoon: await saasPrisma.promoCode.count({
        where: {
          isActive: true,
          validTo: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      exhausted: await saasPrisma.promoCode.count({
        where: {
          isActive: true,
          usageLimit: {
            not: null
          },
          usageCount: {
            gte: saasPrisma.promoCode.fields.usageLimit
          }
        }
      }),
      totalUsage: await saasPrisma.subscriptionPromo.count(),
      totalDiscountAmount: await saasPrisma.subscriptionPromo.aggregate({
        _sum: {
          discountAmount: true
        }
      })
    };

    return NextResponse.json({
      success: true,
      stats,
      lastCleanup: new Date().toISOString(), // This could be stored in DB for real tracking
      nextCleanup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error: any) {
    console.error('❌ Failed to get cleanup status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get cleanup status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
