import { NextRequest, NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';
import Razorpay from 'razorpay';
import { sendEmail } from '@/lib/email';
import { generateSubscriptionRenewalEmail } from '@/lib/subscription-renewal-email';
import { generatePaymentFailedEmail } from '@/lib/payment-failed-email';

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
    // 1. Verify cron secret to ensure only authorized callers can trigger this
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const p = saasPrisma as any;
    
    // 2. Find subscriptions that need renewal
    // Conditions:
    // - status is 'active'
    // - autoRenew is true
    // - currentPeriodEnd is within the next 3 days OR already passed (but not more than 7 days)
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const subscriptionsToRenew = await p.subscription.findMany({
      where: {
        status: 'active',
        autoRenew: true,
        currentPeriodEnd: {
          lte: threeDaysFromNow,
          gte: sevenDaysAgo,
        },
      },
      include: {
        school: true,
      }
    });

    console.log(`Found ${subscriptionsToRenew.length} subscriptions to process for auto-renewal.`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      details: [] as any[]
    };

    if (subscriptionsToRenew.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions require renewal', results });
    }

    // 3. Initialize Razorpay
    const paymentConfig = await getSaasPaymentConfig();
    const keyId = paymentConfig.razorpay_key_id;
    const keySecret = paymentConfig.razorpay_key_secret;

    if (!keyId || !keySecret) {
      console.error('Razorpay not configured in SaaS settings. Cannot process renewals.');
      return NextResponse.json({ error: 'Razorpay configuration missing' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 4. Process each subscription
    for (const sub of subscriptionsToRenew) {
      results.processed++;
      
      try {
        // Skip if we don't have a plan
        if (!sub.plan || sub.plan === 'trial' || sub.plan === 'free') {
          results.details.push({ schoolId: sub.schoolId, status: 'skipped', reason: 'Invalid plan for auto-renewal' });
          continue;
        }

        // Get plan details
        const plan = await p.plan.findUnique({ where: { name: sub.plan } });
        if (!plan) {
          results.details.push({ schoolId: sub.schoolId, status: 'skipped', reason: 'Plan not found in database' });
          continue;
        }

        // Determine amount based on billing cycle
        const amount = sub.billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
        
        // Skip if free plan
        if (amount <= 0) {
          results.details.push({ schoolId: sub.schoolId, status: 'skipped', reason: 'Free plan' });
          continue;
        }

        // Ideally, we would charge the customer's saved payment method here using Razorpay Tokens/Mandates
        // Since we don't have stored mandates in the current schema, we will generate an invoice
        // and send an email for them to complete the payment manually if auto-charge isn't possible
        
        // Create an order for the renewal
        const order = await razorpay.orders.create({
          amount: amount * 100, // in paise
          currency: 'INR',
          receipt: `ren_${sub.id.slice(0, 20)}_${Date.now().toString().slice(-6)}`,
          notes: {
            subscriptionId: sub.id,
            schoolId: sub.schoolId,
            plan: sub.plan,
            type: 'auto_renewal_invoice',
            billingCycle: sub.billingCycle || 'monthly',
          },
        });

        // Create an Invoice record in the database
        const dueDate = new Date(sub.currentPeriodEnd || now);
        // If current period end is already past, due date is now
        if (dueDate < now) dueDate.setTime(now.getTime());

        const invoice = await p.invoice.create({
          data: {
            subscriptionId: sub.id,
            amount: amount,
            currency: 'INR',
            status: 'pending',
            description: `Auto-renewal for ${plan.displayName} (${sub.billingCycle})`,
            dueDate: dueDate,
          }
        });

        // Also create a subscription payment record
        await p.subscriptionPayment.create({
          data: {
            subscriptionId: sub.id,
            orderId: order.id,
            amount,
            currency: 'INR',
            status: 'pending',
            paymentMethod: 'razorpay',
            receiptNumber: order.receipt || `ren_${order.id.slice(0, 20)}`,
          },
        });

        // Get the school admin email to send the invoice
        const schoolAdmin = await (saasPrisma as any).$queryRaw`
          SELECT email, name, "firstName", "lastName"
          FROM school."school_User"
          WHERE "schoolId" = ${sub.schoolId} AND "role" = 'admin'
          LIMIT 1
        `;

        if (schoolAdmin && schoolAdmin.length > 0) {
          const admin = schoolAdmin[0];
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const paymentUrl = `${baseUrl}/billing`;

          // Generate and send email
          const { subject, html } = generateSubscriptionRenewalEmail({
            user: admin,
            school: sub.school,
            subscription: sub,
            daysRemaining: 0,
            nextBillingDate: dueDate,
            amount,
            billingCycle: sub.billingCycle || 'monthly',
          });

          await sendEmail({
            to: admin.email,
            subject,
            html
          });
          
          results.successful++;
          results.details.push({ 
            schoolId: sub.schoolId, 
            status: 'success', 
            invoiceId: invoice.id,
            emailSentTo: admin.email
          });
        } else {
          results.failed++;
          results.details.push({ schoolId: sub.schoolId, status: 'failed', reason: 'No school admin found to email' });
        }

      } catch (subError: any) {
        console.error(`Error processing auto-renewal for subscription ${sub.id}:`, subError);
        results.failed++;
        results.details.push({ schoolId: sub.schoolId, status: 'error', reason: subError.message });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('Auto-renewal cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to process auto-renewals', details: error.message },
      { status: 500 }
    );
  }
}
