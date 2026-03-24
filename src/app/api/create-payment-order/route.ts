import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Razorpay from 'razorpay';
import { saasPrisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function getSaasPaymentConfig() {
  const p = saasPrisma as any;
  const settings = await p.saasSetting.findMany({
    where: { group: 'saas_payment' },
  });
  const config: Record<string, string> = {};
  for (const setting of settings) {
    config[setting.key] = setting.value;
  }
  return config;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any;
    const body = await req.json();
    const {
      plan,
      amount,
      currency = 'INR',
      billingCycle = 'monthly',
      schoolId: schoolIdFromBody,
      isRenewal = false,
    } = body;

    if (!plan || !amount) {
      return NextResponse.json({ error: 'Plan and amount are required' }, { status: 400 });
    }

    const targetSchoolId = schoolIdFromBody || (session?.user as any)?.schoolId || null;
    if (!targetSchoolId) {
      return NextResponse.json({ error: 'schoolId is required to start payment' }, { status: 400 });
    }

    const paymentConfig = await getSaasPaymentConfig();
    const keyId = paymentConfig.razorpay_key_id || process.env.RAZORPAY_KEY_ID;
    const keySecret = paymentConfig.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        error: 'Razorpay is not configured. Please configure SaaS payment settings before accepting payments.',
        details: 'Missing Razorpay API keys'
      }, { status: 500 });
    }

    // Validate Razorpay credentials format
    if (!keyId.startsWith('rzp_') || keySecret.length < 20) {
      return NextResponse.json({
        error: 'Invalid Razorpay credentials. Please check your API keys.',
        details: 'Key ID should start with "rzp_" and secret should be at least 20 characters'
      }, { status: 500 });
    }

    const planRecord = await (saasPrisma as any).plan.findUnique({
      where: { name: plan },
    });

    if (!planRecord || !planRecord.isActive) {
      return NextResponse.json({ error: 'Selected plan is not available' }, { status: 400 });
    }

    const minimumAmount = billingCycle === 'yearly' ? Number(planRecord.priceYearly || 0) : Number(planRecord.priceMonthly || 0);
    if (Number(amount) < minimumAmount) {
      return NextResponse.json({ error: 'Invalid payment amount for selected plan' }, { status: 400 });
    }

    const subscription = await (saasPrisma as any).subscription.findUnique({
      where: { schoolId: targetSchoolId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const normalizedAmount = Number(amount);

    // Initialize Razorpay with production-ready configuration
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(normalizedAmount * 100),
      currency,
      receipt: `rec_${subscription.id.slice(0, 20)}_${Date.now().toString().slice(-6)}`,
      notes: {
        subscriptionId: subscription.id,
        schoolId: targetSchoolId,
        userId: (session?.user as any)?.id || 'registration-flow',
        plan,
        type: isRenewal ? 'subscription_renewal' : 'subscription_payment',
        billingCycle,
      },
    });

    await (saasPrisma as any).subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        orderId: order.id,
        amount: normalizedAmount,
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
      schoolId: targetSchoolId,
    });
  } catch (error: any) {
    console.error('Create payment order error:', error);
    
    // Provide more specific error messages
    if (error.statusCode === 401) {
      return NextResponse.json({ 
        error: 'Razorpay authentication failed. Please check your API keys.', 
        details: 'Invalid or expired Razorpay credentials'
      }, { status: 500 });
    }
    
    if (error.statusCode === 400) {
      return NextResponse.json({ 
        error: 'Invalid payment request. Please check the payment details.', 
        details: error.error?.description || 'Bad request to Razorpay'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create payment order',
      details: error.error?.description || 'Unknown error occurred'
    }, { status: 500 });
  }
}
