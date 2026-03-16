import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
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

    // Verify Razorpay payment signature
    if (orderId && paymentId && signature) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keySecret) {
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(orderId + '|' + paymentId)
          .digest('hex');
        if (signature !== expectedSignature) {
          return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }
      }
    }

    // Update subscription and user in transaction
    const result = await (saasPrisma as any).$transaction(async (tx: any) => {
      // 1. Find school and subscription
      const school = await tx.school.findUnique({
        where: { id: schoolId },
        include: { subscription: true, User: true },
      });

      if (!school || !school.subscription) {
        throw new Error('School or subscription not found');
      }

      // 2. Update subscription to active
      const now = new Date();
      // Use billingCycle from the outer body (already parsed at top)
      const billingCycle = body.billingCycle || 'monthly';
      const daysToAdd = billingCycle === 'yearly' ? 365 : 30;

      // Calculate new period end date
      let newPeriodEnd: Date;
      
      if (school.subscription.currentPeriodEnd && new Date(school.subscription.currentPeriodEnd) > now) {
        // If current period hasn't ended, add remaining days to new period
        const currentEnd = new Date(school.subscription.currentPeriodEnd);
        const remainingDays = Math.ceil((currentEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        // New period starts when current period ends, plus the new duration
        newPeriodEnd = new Date(currentEnd.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        
        console.log(`Early renewal: ${remainingDays} days remaining + ${daysToAdd} new days = ${Math.ceil((newPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))} total days`);
      } else {
        // If current period has ended or doesn't exist, start from now
        newPeriodEnd = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        
        console.log(`Normal renewal: ${daysToAdd} days from now`);
      }

      const subscription = await tx.subscription.update({
        where: { id: school.subscription.id },
        data: {
          status: 'active',
          currentPeriodStart: school.subscription.currentPeriodEnd && new Date(school.subscription.currentPeriodEnd) > now 
            ? new Date(school.subscription.currentPeriodEnd) // Start after current period
            : now, // Start now if no current period or expired
          currentPeriodEnd: newPeriodEnd,
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

      // 4. Activate all users for this school (need to use schoolPrisma since school_User is in school schema)
      await (schoolPrisma as any).school_User.updateMany({
        where: { schoolId: school.id },
        data: { isActive: true },
      });

      return { school, subscription, wasEarlyRenewal: school.subscription.currentPeriodEnd && new Date(school.subscription.currentPeriodEnd) > now };
    });

    // 5. Send payment confirmation email (non-blocking)
    // Get payment details from SubscriptionPayment
    const p = saasPrisma as any;
    const paymentRecord = await p.subscriptionPayment.findFirst({
      where: { orderId: orderId },
    });

    if (paymentRecord && result.school.User && result.school.User.length > 0) {
      const adminUser = result.school.User.find((u: any) => u.role === 'admin') || result.school.User[0];
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
      message: result.wasEarlyRenewal 
        ? 'Payment verified! Your remaining days have been added to your new subscription period.'
        : 'Payment verified and account activated',
      subscription: {
        status: result.subscription.status,
        currentPeriodEnd: result.subscription.currentPeriodEnd,
        wasEarlyRenewal: result.wasEarlyRenewal,
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
