import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { saasPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// Get SaaS payment settings from database
async function getSaasPaymentConfig() {
  const p = saasPrisma as any;
  const settings = await p.saasSetting.findMany({
    where: { group: 'saas_payment' },
  });
  const config: Record<string, string> = {};
  for (const s of settings) config[s.key] = s.value;
  return config;
}

export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await req.json();
    const { plan, amount, currency = 'INR' } = body;

    if (!plan || !amount) {
      return NextResponse.json(
        { error: 'Plan and amount are required' },
        { status: 400 }
      );
    }

    // Get SaaS payment configuration
    const paymentConfig = await getSaasPaymentConfig();
    const keyId = paymentConfig.razorpay_key_id;
    const keySecret = paymentConfig.razorpay_key_secret;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay not configured in SaaS settings' },
        { status: 500 }
      );
    }

    // Initialize Razorpay with SaaS settings
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Get user's subscription
    const subscription = await saasPrisma.subscription.findFirst({
      where: {
        schoolId: ctx.schoolId!,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `rec_${subscription.id.slice(0, 20)}_${Date.now().toString().slice(-6)}`,
      notes: {
        subscriptionId: subscription.id,
        schoolId: ctx.schoolId!,
        userId: ctx.userId,
        plan,
        type: 'subscription_payment',
        billingCycle: body.billingCycle || 'monthly',
      },
    });

    // Store subscription payment order details
    const p = saasPrisma as any;
    await p.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        orderId: order.id,
        amount,
        currency,
        status: 'pending',
        paymentMethod: 'razorpay',
        receiptNumber: order.receipt || `rec_${order.id.slice(0, 20)}`,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      key_id: keyId,
    });
  } catch (error: any) {
    console.error('Create payment order error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
