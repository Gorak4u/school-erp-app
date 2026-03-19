import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { schoolPrisma } from '@/lib/prisma';

/**
 * Production-ready Razorpay order creation endpoint
 * 
 * Security features:
 * - Server-side order creation
 * - Proper authentication
 * - Input validation
 * - Audit logging
 * - Error handling
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = 'INR', receipt, notes, promoCode, plan, billingCycle } = body;

    // Input validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!receipt || typeof receipt !== 'string') {
      return NextResponse.json({ error: 'Receipt is required' }, { status: 400 });
    }

    // Handle promo code validation if provided
    let finalAmount = amount;
    let discountAmount = 0;
    let appliedPromo: any = null;

    if (promoCode && plan && billingCycle) {
      try {
        const promoValidation = await fetch(`${process.env.NEXTAUTH_URL}/api/promo-codes/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoCode, plan })
        });

        const validationData = await promoValidation.json();

        if (promoValidation.ok && validationData.valid) {
          const discount = validationData.discount;
          
          if (discount.type === 'percentage') {
            discountAmount = amount * (discount.value / 100);
            if (discount.maxAmount && discountAmount > discount.maxAmount) {
              discountAmount = discount.maxAmount;
            }
          } else if (discount.type === 'fixed') {
            discountAmount = discount.value;
          }

          finalAmount = Math.max(0, amount - discountAmount);
          appliedPromo = validationData.discount;

          console.log('💰 Promo code applied:', {
            promoCode,
            originalAmount: amount,
            discountAmount,
            finalAmount
          });
        }
      } catch (error) {
        console.error('Promo validation failed:', error);
        // Continue with original amount if promo validation fails
      }
    }

    // Get Razorpay credentials from school settings
    const razorpayKeyId = await getSchoolSetting('payment_gateway', 'api_key');
    const razorpayKeySecret = await getSchoolSetting('payment_gateway', 'api_secret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
    }

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Create order with production-ready options
    const orderOptions = {
      amount: Math.round(finalAmount * 100), // Convert to paise and ensure integer
      currency,
      receipt,
      notes: {
        ...notes,
        created_by: session.user.email,
        created_at: new Date().toISOString(),
        school_id: notes?.schoolId || 'default',
        original_amount: amount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        promo_code: promoCode || null,
        promo_discount: appliedPromo,
        plan: plan || null,
        billing_cycle: billingCycle || null,
      },
      payment_capture: 1, // Auto-capture payments
      partial_payment: false, // Disable partial payments
    };

    // Create order
    const order = await razorpay.orders.create(orderOptions);

    // Log order creation for audit
    console.log('📝 Razorpay order created:', {
      orderId: order.id,
      amount: order.amount,
      receipt: order.receipt,
      createdBy: session.user.email,
      notes: order.notes,
    });

    // Store order details in database for tracking
    await storePaymentOrder({
      orderId: order.id,
      amount: Number(order.amount),
      currency: String(order.currency),
      receipt: String(order.receipt),
      status: 'created',
      notes: order.notes,
      createdBy: session.user.email,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
        created_at: order.created_at,
      },
      discount: discountAmount > 0 ? {
        originalAmount: amount,
        discountAmount,
        finalAmount: finalAmount,
        promoCode: promoCode,
        promoDetails: appliedPromo
      } : null
    });

  } catch (error: any) {
    console.error('❌ Razorpay order creation failed:', error);
    
    // Log error for debugging
    if (error.error?.description) {
      console.error('Razorpay error details:', error.error);
    }

    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
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

/**
 * Store payment order in database for tracking
 */
async function storePaymentOrder(orderData: {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  notes: any;
  createdBy: string;
}) {
  try {
    // Store in database using Prisma
    const result = await schoolPrisma.razorpayPaymentOrder.create({
      data: {
        id: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        status: orderData.status,
        notes: orderData.notes,
        createdBy: orderData.createdBy,
        schoolId: 'default', // You can get this from session or context
      }
    });
    
    console.log('💾 Payment order stored successfully:', { orderId: orderData.orderId });
    
    // Log audit trail
    await logAuditEvent('order_created', 'order', orderData.orderId, null, orderData, orderData.createdBy);
    
    return result;
    
  } catch (error) {
    console.error('Error storing payment order:', error);
    throw new Error('Failed to store payment order in database');
  }
}

/**
 * Log audit events for compliance
 */
async function logAuditEvent(
  action: string, 
  entityType: string, 
  entityId: string, 
  oldValues: any, 
  newValues: any, 
  userEmail: string
) {
  try {
    await schoolPrisma.razorpayAuditLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        userEmail,
        ipAddress: '127.0.0.1', // You can get this from request headers
        userAgent: 'Razorpay API', // You can get this from request headers
      }
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw error here to avoid breaking the main flow
  }
}
