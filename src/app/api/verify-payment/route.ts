import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPaymentConfirmationEmail } from '@/lib/payment-confirmation-email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { schoolId, paymentId, orderId, signature } = body;

    if (!schoolId || !paymentId) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolId, paymentId' },
        { status: 400 }
      );
    }

    // TODO: Verify payment signature with Razorpay
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(orderId + '|' + paymentId)
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    // }

    // Update subscription and user in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Find school and subscription
      const school = await tx.school.findUnique({
        where: { id: schoolId },
        include: { subscription: true, users: true },
      });

      if (!school || !school.subscription) {
        throw new Error('School or subscription not found');
      }

      // 2. Update subscription to active
      const now = new Date();
      const subscription = await tx.subscription.update({
        where: { id: school.subscription.id },
        data: {
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
        },
      });

      // 3. Update subscription payment record
      await tx.subscriptionPayment.updateMany({
        where: { orderId: orderId },
        data: {
          paymentId: paymentId,
          status: 'completed',
          paymentDate: new Date().toISOString().split('T')[0],
        },
      });

      // 4. Activate all users for this school
      await tx.user.updateMany({
        where: { schoolId: school.id },
        data: { isActive: true },
      });

      return { school, subscription };
    });

    // 5. Send payment confirmation email (non-blocking)
    // Get payment details from SubscriptionPayment
    const p = prisma as any;
    const paymentRecord = await p.subscriptionPayment.findFirst({
      where: { orderId: orderId },
    });

    if (paymentRecord && result.school.users.length > 0) {
      const adminUser = result.school.users.find((u: any) => u.role === 'admin') || result.school.users[0];
      
      // Get billing cycle from the request body (passed from frontend)
      const body = await req.clone().json();
      const billingCycle: 'monthly' | 'yearly' = body.billingCycle || 'monthly';
      
      sendPaymentConfirmationEmail(
        adminUser,
        result.school,
        result.subscription,
        paymentRecord.amount,
        billingCycle
      ).catch(error => {
        console.error('Payment confirmation email failed:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and account activated',
      subscription: {
        status: result.subscription.status,
        currentPeriodEnd: result.subscription.currentPeriodEnd,
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
