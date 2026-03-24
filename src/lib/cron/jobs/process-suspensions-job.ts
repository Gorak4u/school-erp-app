import { createCronJobResult } from '@/lib/cron/job-contract';
import { sendEmail } from '@/lib/email';
import { saasPrisma } from '@/lib/prisma';
import { generateSubscriptionSuspendedEmail } from '@/lib/subscription-suspended-email';

type SchoolAdminRow = {
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
};

async function getSchoolAdmin(schoolId: string) {
  const admins = await (saasPrisma as any).$queryRaw`
    SELECT email, name, "firstName", "lastName"
    FROM school."school_User"
    WHERE "schoolId" = ${schoolId} AND "role" = 'admin'
    LIMIT 1
  `;

  return (admins as SchoolAdminRow[])[0] || null;
}

export async function runProcessSuspensionsJob() {
  const p = saasPrisma as any;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const invoiceGraceCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const subscriptions = await p.subscription.findMany({
    where: {
      status: { in: ['active', 'past_due'] },
      currentPeriodEnd: { lt: sevenDaysAgo },
    },
    include: {
      school: true,
      invoices: {
        where: {
          status: 'pending',
          dueDate: { lt: invoiceGraceCutoff },
        },
      },
    },
  });

  if (!subscriptions.length) {
    return createCronJobResult({
      success: true,
      jobName: 'process-suspensions',
      scope: 'saas',
      message: 'No subscriptions require suspension',
      processed: 0,
      attempted: 0,
      delivered: 0,
      skipped: 0,
      failed: 0,
    });
  }

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
      const overdueInvoices = sub.invoices || [];
      if (!overdueInvoices.length) {
        skipped += 1;
        details.push({ schoolId: sub.schoolId, status: 'skipped', reason: 'No overdue invoices found' });
        continue;
      }

      await p.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'suspended',
          cancelledAt: sub.cancelledAt || now,
        },
      });

      const admin = await getSchoolAdmin(sub.schoolId);
      if (!admin?.email) {
        failed += 1;
        details.push({ schoolId: sub.schoolId, status: 'failed', reason: 'No school admin found to notify' });
        continue;
      }

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const billingUrl = `${baseUrl}/billing`;
      const { subject, html } = generateSubscriptionSuspendedEmail({
        schoolName: sub.school.name,
        planName: sub.plan,
        overdueInvoices,
        billingUrl,
        adminName: admin.name || `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin',
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
          reason: emailResult.error || 'Suspension email failed',
        });
        continue;
      }

      delivered += 1;
      details.push({
        schoolId: sub.schoolId,
        status: 'suspended',
        overdueInvoices: overdueInvoices.length,
        emailSentTo: admin.email,
      });
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : 'Unknown suspension processing error';
      errors.push(message);
      details.push({ schoolId: sub.schoolId, status: 'error', reason: message });
    }
  }

  const success = errors.length === 0 && failed === 0;

  return createCronJobResult({
    success,
    jobName: 'process-suspensions',
    scope: 'saas',
    message: success ? `Processed ${processed} suspension subscription(s)` : 'Suspension processing completed with failures',
    processed,
    attempted,
    delivered,
    skipped,
    failed,
    stats: { details },
    errors,
  });
}
