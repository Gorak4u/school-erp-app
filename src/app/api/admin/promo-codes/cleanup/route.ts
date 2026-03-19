import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const expiredPromos = await saasPrisma.promoCode.findMany({
      where: {
        isActive: true,
        validTo: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        code: true,
        description: true,
        validTo: true,
        usageCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      expiredPromos,
      count: expiredPromos.length,
    });
  } catch (error: any) {
    console.error('Error fetching expired promos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expired promos' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, promoIds } = body;

    if (action === 'deactivate_expired') {
      const result = await saasPrisma.promoCode.updateMany({
        where: {
          isActive: true,
          validTo: {
            lt: new Date(),
          },
        },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Deactivated ${result.count} expired promo codes`,
        deactivatedCount: result.count,
      });
    }

    if (action === 'cleanup_usage') {
      // Clean up promo codes that have reached their usage limit
      const result = await saasPrisma.promoCode.updateMany({
        where: {
          isActive: true,
          usageLimit: {
            not: null,
          },
          usageCount: {
            gte: saasPrisma.promoCode.fields.usageLimit,
          },
        },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Deactivated ${result.count} promo codes that reached usage limit`,
        deactivatedCount: result.count,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in promo cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform cleanup' },
      { status: 500 }
    );
  }
}
