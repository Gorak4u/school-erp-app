import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';

/**
 * Subscription payment verification endpoint with promo code support
 * 
 * This handles subscription payments (not fee payments) and applies promo codes
 * after successful payment verification.
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      billingCycle,
      schoolId,
      plan,
      promoCode,
    } = body;

    // Input validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ 
        error: 'Missing required payment verification parameters' 
      }, { status: 400 });
    }

    if (!schoolId || !plan || !billingCycle) {
      return NextResponse.json({ 
        error: 'Missing subscription parameters' 
      }, { status: 400 });
    }

    // Get Razorpay credentials from school settings
    const razorpayKeySecret = await getSchoolSetting('payment_gateway', 'api_secret');

    if (!razorpayKeySecret) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('❌ Invalid Razorpay signature');
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Process subscription activation in transaction
    const result = await saasPrisma.$transaction(async (tx) => {
      // Get subscription details
      const subscription = await tx.subscription.findUnique({
        where: { schoolId },
        include: { promoCodes: true }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status !== 'pending_payment') {
        throw new Error('Subscription is not in pending payment status');
      }

      // Get plan details
      const planConfig = await tx.plan.findUnique({
        where: { name: plan }
      });

      if (!planConfig) {
        throw new Error('Plan not found');
      }

      // Calculate subscription period
      const now = new Date();
      const periodStart = now;
      let periodEnd: Date;

      if (billingCycle === 'yearly') {
        periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else {
        periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      // Calculate pricing
      const basePrice = billingCycle === 'yearly' ? planConfig.priceYearly : planConfig.priceMonthly;
      let finalPrice = basePrice;
      let discountAmount = 0;

      // Apply promo code if provided
      if (promoCode) {
        const promoValidation = await fetch(`${process.env.NEXTAUTH_URL}/api/promo-codes/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoCode, plan })
        });

        const validationData = await promoValidation.json();

        if (promoValidation.ok && validationData.valid) {
          const discount = validationData.discount;
          
          if (discount.type === 'percentage') {
            discountAmount = basePrice * (discount.value / 100);
            if (discount.maxAmount && discountAmount > discount.maxAmount) {
              discountAmount = discount.maxAmount;
            }
          } else if (discount.type === 'fixed') {
            discountAmount = discount.value;
          }

          finalPrice = Math.max(0, basePrice - discountAmount);

          // Apply promo to subscription
          const promoCodeDetails = await tx.promoCode.findUnique({
            where: { code: promoCode.toUpperCase() }
          });

          if (promoCodeDetails) {
            await tx.subscriptionPromo.create({
              data: {
                subscriptionId: subscription.id,
                promoCodeId: promoCodeDetails.id,
                discountAmount: discountAmount,
              }
            });

            // Update promo usage count
            await tx.promoCode.update({
              where: { id: promoCodeDetails.id },
              data: { usageCount: { increment: 1 } }
            });
          }
        }
      }

      // Update subscription
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          price: finalPrice,
          originalAmount: basePrice,
          discountAmount: discountAmount,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: now,
        }
      });

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          subscriptionId: subscription.id,
          amount: finalPrice,
          originalAmount: basePrice,
          discountAmount: discountAmount,
          promoCodeId: promoCode ? (await tx.promoCode.findUnique({
            where: { code: promoCode.toUpperCase() }
          }))?.id : null,
          currency: 'INR',
          status: 'paid',
          description: `${planConfig.displayName} - ${billingCycle}`,
          paymentMethod: 'razorpay',
          transactionId: razorpay_payment_id,
          paidAt: now,
          dueDate: periodEnd,
        }
      });

      // Store Razorpay order details
      await tx.razorpayPaymentOrder.update({
        where: { id: razorpay_order_id },
        data: {
          status: 'paid',
          updatedAt: now,
        }
      });

      // Log audit trail
      await tx.razorpayAuditLog.create({
        data: {
          action: 'subscription_payment_verified',
          entityType: 'subscription',
          entityId: subscription.id,
          oldValues: undefined,
          newValues: {
            status: 'active',
            amount: finalPrice,
            discountAmount,
            billingCycle,
            paymentId: razorpay_payment_id,
            verifiedAt: now,
          },
          userEmail: session.user.email,
          ipAddress: '127.0.0.1', // Get from request headers
          userAgent: 'Razorpay API', // Get from request headers
        }
      });

      return {
        subscription: updatedSubscription,
        invoice,
        discountAmount,
        finalPrice,
      };
    });

    console.log('✅ Subscription payment verified:', {
      schoolId,
      plan,
      billingCycle,
      paymentId: razorpay_payment_id,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
    });

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      invoice: result.invoice,
      discount: result.discountAmount > 0 ? {
        originalAmount: result.finalPrice + result.discountAmount,
        discountAmount: result.discountAmount,
        finalAmount: result.finalPrice,
      } : null,
    });

  } catch (error: any) {
    console.error('❌ Subscription payment verification failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to verify subscription payment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get school setting
 */
async function getSchoolSetting(group: string, key: string): Promise<string> {
  try {
    const setting = await schoolPrisma.schoolSetting.findFirst({
      where: { group, key },
    });
    return setting?.value || '';
  } catch (error) {
    console.error('Error fetching school setting:', error);
    return '';
  }
}
