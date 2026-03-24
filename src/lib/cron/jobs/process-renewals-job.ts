import Razorpay from 'razorpay';
import { createCronJobResult } from '@/lib/cron/job-contract';
import { sendEmail } from '@/lib/email';
import { saasPrisma } from '@/lib/prisma';
import { generateSubscriptionRenewalEmail } from '@/lib/subscription-renewal-email';

type SchoolAdminRow = {
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
};

async function getSaasPaymentConfig() {
  const settings = await (saasPrisma as any).saasSetting.findMany({
    where: { group: 'saas_payment' },
  });

  const config: Record<string, string> = {};
  for (const setting of settings) {
    config[setting.key] = setting.value;
  }
  return config;
}

async function getSchoolAdmin(schoolId: string) {
  const admins = await (saasPrisma as any).$queryRaw`
    SELECT email, name, "firstName", "lastName"
    FROM school."school_User"
    WHERE "schoolId" = ${schoolId} AND "role" = 'admin'
    LIMIT 1
  `;

  return (admins as SchoolAdminRow[])[0] || null;
}

export async function runProcessRenewalsJob() {
  const p = saasPrisma as any;
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const subscriptions = await p.subscription.findMany({
    where: {
      status: { in: ['active', 'past_due'] },
      autoRenew: true,
      currentPeriodEnd: {
        lte: threeDaysFromNow,
        gte: sevenDaysAgo,
      },
    },
    include: {
      school: true,
    },
  });

  if (!subscriptions.length) {
    return createCronJobResult({
      success: true,
      jobName: 'process-renewals',
      scope: 'saas',
      message: 'No subscriptions require renewal',
      processed: 0,
      attempted: 0,
      delivered: 0,
      skipped: 0,
      failed: 0,
      stats: { processedSubscriptions: 0 },
    });
  }

  const paymentConfig = await getSaasPaymentConfig();
  const keyId = paymentConfig.razorpay_key_id;
  const keySecret = paymentConfig.razorpay_key_secret;

  if (!keyId || !keySecret) {
    return createCronJobResult({
      success: false,
      jobName: 'process-renewals',
      scope: 'saas',
      message: 'Razorpay configuration missing',
      processed: 0,
      attempted: 0,
      delivered: 0,
      skipped: 0,
      failed: subscriptions.length,
      stats: { dueSubscriptions: subscriptions.length },
      errors: ['Razorpay configuration missing'],
    });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const details: Array<Record<string, unknown>> = [];
  const errors: string[] = [];
  let processed = 0;
  let attempted = 0;
  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    processed += 1;

    try {
      if (!sub.plan || sub.plan === 'trial' || sub.plan === 'free') {
        skipped += 1;
        details.push({ schoolId: sub.schoolId, status: 'skipped', reason: 'Invalid plan for renewal' });
        continue;
      }

      const plan = await p.plan.findUnique({ where: { name: sub.plan } });
      if (!plan) {
        skipped += 1;
        details.push({ schoolId: sub.schoolId, status: 'skipped', reason: 'Plan not found' });
        continue;
      }

      const amount = sub.billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
      if (amount <= 0) {
        skipped += 1;
        details.push({ schoolId: sub.schoolId, status: 'skipped', reason: 'Non-billable subscription plan' });
        continue;
      }

      const existingPendingPayment = await p.subscriptionPayment.findFirst({
        where: {
          subscriptionId: sub.id,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingPendingPayment) {
        skipped += 1;
        details.push({ schoolId: sub.schoolId, status: 'skipped', reason: 'Pending renewal payment already exists' });
        continue;
      }

      const admin = await getSchoolAdmin(sub.schoolId);
      if (!admin?.email) {
        failed += 1;
        details.push({ schoolId: sub.schoolId, status: 'failed', reason: 'No school admin found to notify' });
        continue;
      }

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
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

      const dueDate = new Date(sub.currentPeriodEnd || now);
      if (dueDate < now) {
        dueDate.setTime(now.getTime());
      }

      const invoice = await p.$transaction(async (tx: any) => {
        const createdInvoice = await tx.invoice.create({
          data: {
            subscriptionId: sub.id,
            amount,
            currency: 'INR',
            status: 'pending',
            description: `Renewal for ${plan.displayName} (${sub.billingCycle || 'monthly'})`,
            dueDate,
          },
        });

        await tx.subscriptionPayment.create({
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

        if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < now && sub.status !== 'past_due') {
          await tx.subscription.update({
            where: { id: sub.id },
            data: { status: 'past_due' },
          });
        }

        return createdInvoice;
      });

      const renewalDate = new Date(sub.currentPeriodEnd || now);
      const daysRemaining = Math.max(0, Math.ceil((renewalDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      const { subject, html } = generateSubscriptionRenewalEmail({
        user: admin as any,
        school: sub.school,
        subscription: sub,
        daysRemaining,
        nextBillingDate: dueDate,
        amount,
        billingCycle: (sub.billingCycle || 'monthly') as 'monthly' | 'yearly',
      });

      attempted += 1;
      const emailResult = await sendEmail({
        to: admin.email,
        subject,
        html,
      });

      if (!emailResult.success) {
        failed += 1;
        details.push({
          schoolId: sub.schoolId,
          status: 'failed',
          invoiceId: invoice.id,
          reason: emailResult.error || 'Renewal email failed',
        });
        continue;
      }

      delivered += 1;
      details.push({
        schoolId: sub.schoolId,
        status: 'sent',
        invoiceId: invoice.id,
        emailSentTo: admin.email,
      });
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : 'Unknown renewal processing error';
      errors.push(message);
      details.push({ schoolId: sub.schoolId, status: 'error', reason: message });
    }
  }

  const success = errors.length === 0 && failed === 0;

  return createCronJobResult({
    success,
    jobName: 'process-renewals',
    scope: 'saas',
    message: success ? `Processed ${processed} renewal subscription(s)` : 'Renewal processing completed with failures',
    processed,
    attempted,
    delivered,
    skipped,
    failed,
    stats: { details },
    errors,
  });
}
