import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { schoolId, promoCode, plan, billingCycle } = await req.json();

    if (!schoolId || !promoCode || !plan || !billingCycle) {
      return NextResponse.json({
        error: 'Missing required fields: schoolId, promoCode, plan, billingCycle'
      }, { status: 400 });
    }

    // Validate promo code
    const promoValidation = await fetch(`${process.env.NEXTAUTH_URL}/api/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoCode, plan })
    });

    const validationData = await promoValidation.json();

    if (!promoValidation.ok || !validationData.valid) {
      return NextResponse.json({ error: validationData.error || 'Invalid promo code' }, { status: 400 });
    }

    // Get plan pricing
    const plansResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/plans?cache=true`);
    const plansData = await plansResponse.json();
    const planData = plansData.plans.find((p: any) => p.name === plan);

    if (!planData) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const originalPrice = billingCycle === 'monthly' ? planData.priceMonthly : planData.priceYearly;
    const discount = validationData.discount;
    let discountedPrice = originalPrice;

    // Calculate discounted price
    if (discount.type === 'percentage') {
      discountedPrice = originalPrice * (1 - discount.value / 100);
      if (discount.maxAmount && discountedPrice < originalPrice - discount.maxAmount) {
        discountedPrice = originalPrice - discount.maxAmount;
      }
    } else if (discount.type === 'fixed') {
      discountedPrice = Math.max(0, originalPrice - discount.value);
    }

    discountedPrice = Math.round(discountedPrice);

    // Check if promo already used for this subscription
    const existingSubscription = await saasPrisma.subscription.findUnique({
      where: { schoolId },
      include: { 
        promoCodes: {
          include: {
            promoCode: true
          }
        }
      }
    });

    if (existingSubscription?.promoCodes.some(p => p.promoCode.code === promoCode.toUpperCase())) {
      return NextResponse.json({ error: 'Promo code already used for this subscription' }, { status: 400 });
    }

    // Get promo code details
    const promoCodeDetails = await saasPrisma.promoCode.findUnique({
      where: { code: promoCode.toUpperCase() }
    });

    if (!promoCodeDetails) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    // Create subscription promo record
    if (existingSubscription) {
      await saasPrisma.subscriptionPromo.create({
        data: {
          subscriptionId: existingSubscription.id,
          promoCodeId: promoCodeDetails.id,
          discountAmount: originalPrice - discountedPrice,
        }
      });
    }

    return NextResponse.json({
      success: true,
      originalPrice,
      discountedPrice,
      discountAmount: originalPrice - discountedPrice,
      discount: validationData.discount
    });

  } catch (error: any) {
    console.error('Apply promo error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
