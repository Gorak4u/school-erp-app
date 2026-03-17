import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { sendPaymentConfirmationEmail } from '@/lib/payment-confirmation-email';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { schoolId, paymentId, orderId, signature, billingCycle: billingCycleFromBody } = body;

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, paymentId, signature' },
        { status: 400 }
      );
    }

    const paymentConfig = await getSaasPaymentConfig();
    const keyId = paymentConfig.razorpay_key_id || process.env.RAZORPAY_KEY_ID;
    const keySecret = paymentConfig.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const paymentRecord = await (saasPrisma as any).subscriptionPayment.findFirst({
      where: { orderId },
      include: {
        subscription: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!paymentRecord?.subscription) {
      return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
    }

    if (schoolId && schoolId !== paymentRecord.subscription.schoolId) {
      return NextResponse.json({ error: 'Payment does not belong to this school' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    let orderDetails: any = null;
    try {
      orderDetails = await razorpay.orders.fetch(orderId);
    } catch (orderError) {
      console.error('Failed to fetch Razorpay order details:', orderError);
    }

    const resolvedPlanName = orderDetails?.notes?.plan || paymentRecord.subscription.plan;
    const resolvedBillingCycle = (orderDetails?.notes?.billingCycle || billingCycleFromBody || paymentRecord.subscription.billingCycle || 'monthly') as 'monthly' | 'yearly';
    const selectedPlan = await (saasPrisma as any).plan.findUnique({
      where: { name: resolvedPlanName },
    });

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Plan not found for this payment' }, { status: 400 });
    }

    const recurringPrice = resolvedBillingCycle === 'yearly'
      ? Number(selectedPlan.priceYearly || 0)
      : Number(selectedPlan.priceMonthly || 0);
    const daysToAdd = resolvedBillingCycle === 'yearly' ? 365 : 30;

    const result = await (saasPrisma as any).$transaction(async (tx: any) => {
      const subscription = await tx.subscription.findUnique({
        where: { id: paymentRecord.subscriptionId },
        include: { school: true },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const now = new Date();
      const hasActivePeriod = !!(subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now);
      const periodStart = hasActivePeriod ? new Date(subscription.currentPeriodEnd) : now;
      const periodEnd = new Date(periodStart.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          plan: selectedPlan.name,
          billingCycle: resolvedBillingCycle,
          price: recurringPrice,
          maxStudents: selectedPlan.maxStudents,
          maxTeachers: selectedPlan.maxTeachers,
          features: selectedPlan.features || subscription.features,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          cancelledAt: null,
        },
      });

      await tx.subscriptionPayment.updateMany({
        where: { orderId },
        data: {
          paymentId,
          status: 'completed',
          paymentDate: now.toISOString().split('T')[0],
        },
      });

      const latestPendingInvoice = await tx.invoice.findFirst({
        where: {
          subscriptionId: subscription.id,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (latestPendingInvoice) {
        await tx.invoice.update({
          where: { id: latestPendingInvoice.id },
          data: {
            status: 'paid',
            paymentMethod: 'razorpay',
            transactionId: paymentId,
            paidAt: now,
          },
        });
      }

      return {
        school: subscription.school,
        subscription: updatedSubscription,
        wasEarlyRenewal: hasActivePeriod,
      };
    });

    await (schoolPrisma as any).school_User.updateMany({
      where: { schoolId: paymentRecord.subscription.schoolId },
      data: { isActive: true },
    });

    const adminUser = await (schoolPrisma as any).school_User.findFirst({
      where: { schoolId: paymentRecord.subscription.schoolId, role: 'admin' },
    });

    if (adminUser && result.school) {
      sendPaymentConfirmationEmail(
        adminUser,
        result.school,
        result.subscription,
        paymentRecord.amount,
        resolvedBillingCycle
      ).catch((error) => {
        console.error('Payment confirmation email failed:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: result.wasEarlyRenewal
        ? 'Payment verified! Your remaining days have been added to your new subscription period.'
        : 'Payment verified and account activated',
      subscription: {
        status: result.subscription.status,
        currentPeriodEnd: result.subscription.currentPeriodEnd,
        wasEarlyRenewal: result.wasEarlyRenewal,
        plan: result.subscription.plan,
        billingCycle: result.subscription.billingCycle,
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
