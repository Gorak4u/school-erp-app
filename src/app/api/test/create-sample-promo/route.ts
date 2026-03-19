import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

/**
 * Public test endpoint to create a sample promo code
 * This is for testing purposes only - remove in production
 */
export async function POST() {
  try {
    // Check if WELCOME20 already exists
    const existingPromo = await saasPrisma.promoCode.findUnique({
      where: { code: 'WELCOME20' }
    });

    if (existingPromo) {
      return NextResponse.json({
        success: true,
        message: 'WELCOME20 promo code already exists',
        promoCode: existingPromo
      });
    }

    // Create sample promo code
    const promoCode = await saasPrisma.promoCode.create({
      data: {
        code: 'WELCOME20',
        description: 'Welcome discount for new schools',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 5000,
        applicablePlans: 'all',
        usageLimit: 100,
        validFrom: new Date(),
        validTo: new Date('2026-12-31T23:59:59.999Z'),
        isActive: true,
        createdBy: 'test@example.com'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test promo code WELCOME20 created successfully',
      promoCode
    });

  } catch (error: any) {
    console.error('Failed to create test promo code:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test promo code',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const promoCodes = await saasPrisma.promoCode.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      promoCodes,
      count: promoCodes.length
    });

  } catch (error: any) {
    console.error('Failed to fetch promo codes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch promo codes',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
