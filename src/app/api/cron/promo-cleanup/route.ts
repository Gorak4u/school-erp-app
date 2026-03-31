import { NextRequest, NextResponse } from 'next/server';
import { runPromoCleanupJob } from '@/lib/cron/jobs/promo-cleanup-job';
import { saasPrisma } from '@/lib/prisma';
import { cronUnauthorizedResponse, isCronAuthorized } from '@/lib/cron/route-helpers';

export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  const result = await runPromoCleanupJob();
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
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
