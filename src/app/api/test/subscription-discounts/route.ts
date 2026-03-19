import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

/**
 * Test endpoint for subscription discount functionality
 * This helps verify that the discount system is working correctly
 * PUBLIC ENDPOINT - No authentication required for testing
 */
export async function GET() {
  // Add CORS headers for testing
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Test 1: Check if promo codes exist
    const promoCodes = await saasPrisma.promoCode.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Test 2: Check if subscription promos exist
    const subscriptionPromos = await saasPrisma.subscriptionPromo.findMany({
      take: 5,
      include: {
        promoCode: true,
        subscription: {
          include: {
            school: true
          }
        }
      }
    });

    // Test 3: Check if invoices with discounts exist
    const discountedInvoices = await saasPrisma.invoice.findMany({
      where: {
        discountAmount: {
          gt: 0
        }
      },
      take: 5,
      include: {
        promoCode: true,
        subscription: true
      }
    });

    // Test 4: Check subscription model has discount fields
    const subscriptionsWithDiscounts = await saasPrisma.subscription.findMany({
      where: {
        discountAmount: {
          gt: 0
        }
      },
      take: 3
    });

    return NextResponse.json({
      success: true,
      tests: {
        promoCodes: {
          count: promoCodes.length,
          sample: promoCodes.map(p => ({
            code: p.code,
            discountType: p.discountType,
            discountValue: p.discountValue,
            isActive: p.isActive,
            usageCount: p.usageCount,
            usageLimit: p.usageLimit
          }))
        },
        subscriptionPromos: {
          count: subscriptionPromos.length,
          sample: subscriptionPromos.map(sp => ({
            promoCode: sp.promoCode.code,
            discountAmount: sp.discountAmount,
            appliedAt: sp.appliedAt,
            schoolName: sp.subscription?.school?.name || 'Unknown'
          }))
        },
        discountedInvoices: {
          count: discountedInvoices.length,
          sample: discountedInvoices.map(inv => ({
            invoiceId: inv.id,
            originalAmount: inv.originalAmount,
            discountAmount: inv.discountAmount,
            finalAmount: inv.amount,
            promoCode: inv.promoCode?.code || null
          }))
        },
        subscriptionsWithDiscounts: {
          count: subscriptionsWithDiscounts.length,
          sample: subscriptionsWithDiscounts.map(sub => ({
            plan: sub.plan,
            originalAmount: sub.originalAmount,
            discountAmount: sub.discountAmount,
            price: sub.price,
            status: sub.status
          }))
        }
      },
      summary: {
        totalPromoCodes: await saasPrisma.promoCode.count(),
        activePromoCodes: await saasPrisma.promoCode.count({ where: { isActive: true } }),
        totalSubscriptionPromos: await saasPrisma.subscriptionPromo.count(),
        totalDiscountedInvoices: await saasPrisma.invoice.count({ where: { discountAmount: { gt: 0 } } }),
        subscriptionsWithDiscounts: await saasPrisma.subscription.count({ where: { discountAmount: { gt: 0 } } })
      }
    }, { headers });

  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Test promo code validation
 */
export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { promoCode, plan } = await req.json();

    if (!promoCode || !plan) {
      return NextResponse.json({ error: 'promoCode and plan are required' }, { status: 400, headers });
    }

    // Test validation
    const validationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoCode, plan })
    });

    const validationResult = await validationResponse.json();

    return NextResponse.json({
      success: validationResponse.ok,
      validationResult,
      testDetails: {
        endpoint: '/api/promo-codes/validate',
        requestPayload: { code: promoCode, plan },
        responseStatus: validationResponse.status,
        isValid: validationResult.valid
      }
    }, { headers });

  } catch (error: any) {
    console.error('Test validation error:', error);
    return NextResponse.json(
      { 
        error: 'Validation test failed',
        details: error.message 
      },
      { 
        status: 500,
        headers
      }
    );
  }
}
