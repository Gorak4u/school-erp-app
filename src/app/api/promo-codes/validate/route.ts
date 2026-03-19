import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { code, plan } = await req.json();

    if (!code || !plan) {
      return NextResponse.json({
        error: 'Missing required fields: code, plan'
      }, { status: 400 });
    }

    // Find promo code
    const promoCode = await saasPrisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promoCode) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json({ error: 'Promo code is inactive' }, { status: 400 });
    }

    // Check expiry
    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validTo) {
      return NextResponse.json({ error: 'Promo code has expired' }, { status: 400 });
    }

    // Check usage limit
    if (promoCode.usageLimit) {
      const usageCount = await saasPrisma.subscriptionPromo.count({
        where: { promoCodeId: promoCode.id }
      });

      if (usageCount >= promoCode.usageLimit) {
        return NextResponse.json({ error: 'Promo code usage limit exceeded' }, { status: 400 });
      }
    }

    // Check plan compatibility
    if (promoCode.applicablePlans !== 'all') {
      const applicablePlans = JSON.parse(promoCode.applicablePlans);
      if (!applicablePlans.includes(plan)) {
        return NextResponse.json({
          error: 'Promo code not applicable to this plan'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      valid: true,
      discount: {
        type: promoCode.discountType,
        value: promoCode.discountValue,
        maxAmount: promoCode.maxDiscountAmount
      }
    });
  } catch (error: any) {
    console.error('Promo validation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
