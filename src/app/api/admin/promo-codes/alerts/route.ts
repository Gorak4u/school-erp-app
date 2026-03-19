import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const expiringSoon = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        validTo: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
      select: {
        id: true,
        code: true,
        description: true,
        validTo: true,
        usageCount: true,
        usageLimit: true,
        discountType: true,
        discountValue: true,
      },
      orderBy: {
        validTo: 'asc',
      },
    });

    const lowUsage = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        usageLimit: {
          not: null,
        },
        validTo: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        code: true,
        description: true,
        usageCount: true,
        usageLimit: true,
        validTo: true,
      },
    }).then(promos => 
      promos.filter(promo => {
        const remaining = promo.usageLimit! - promo.usageCount;
        return remaining <= 5 && remaining > 0; // Less than 5 uses remaining
      })
    );

    return NextResponse.json({
      success: true,
      expiringSoon,
      lowUsage,
      alerts: {
        expiringCount: expiringSoon.length,
        lowUsageCount: lowUsage.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching promo alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo alerts' },
      { status: 500 }
    );
  }
}
