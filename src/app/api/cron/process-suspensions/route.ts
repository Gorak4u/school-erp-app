import { NextRequest, NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { generateSubscriptionSuspendedEmail } from '@/lib/subscription-suspended-email';

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const p = saasPrisma as any;
    
    // Find subscriptions that should be suspended
    // Conditions:
    // - status is 'active'
    // - currentPeriodEnd is more than 7 days ago (grace period)
    // - Have unpaid invoices
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const subscriptionsToSuspend = await p.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          lt: sevenDaysAgo,
        },
      },
      include: {
        school: true,
        invoices: {
          where: {
            status: 'pending',
            dueDate: {
              lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // Overdue by 3+ days
            }
          }
        }
      }
    });

    console.log(`Found ${subscriptionsToSuspend.length} subscriptions to suspend due to non-payment.`);

    const results = {
      processed: 0,
      suspended: 0,
      notified: 0,
      details: [] as any[]
    };

    for (const sub of subscriptionsToSuspend) {
      results.processed++;
      
      try {
        // Check if there are overdue invoices
        const hasOverdueInvoices = sub.invoices && sub.invoices.length > 0;
        
        if (!hasOverdueInvoices) {
          results.details.push({ 
            schoolId: sub.schoolId, 
            status: 'skipped', 
            reason: 'No overdue invoices found' 
          });
          continue;
        }

        // Suspend the subscription
        await p.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'suspended',
            cancelledAt: new Date(),
          }
        });

        // Get school admin to notify
        const schoolAdmin = await (saasPrisma as any).$queryRaw`
          SELECT email, name, "firstName", "lastName"
          FROM school."school_User"
          WHERE "schoolId" = ${sub.schoolId} AND "role" = 'admin'
          LIMIT 1
        `;

        if (schoolAdmin && schoolAdmin.length > 0) {
          const admin = schoolAdmin[0];
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const billingUrl = `${baseUrl}/billing`;

          // Send suspension email
          const { subject, html } = generateSubscriptionSuspendedEmail({
            schoolName: sub.school.name,
            planName: sub.plan,
            overdueInvoices: sub.invoices,
            billingUrl,
            adminName: admin.name || `${admin.firstName} ${admin.lastName}` || 'Admin'
          });

          await sendEmail({
            to: admin.email,
            subject,
            html
          });

          results.notified++;
        }

        results.suspended++;
        results.details.push({ 
          schoolId: sub.schoolId, 
          status: 'suspended',
          overdueInvoices: sub.invoices.length
        });

      } catch (subError: any) {
        console.error(`Error suspending subscription ${sub.id}:`, subError);
        results.details.push({ 
          schoolId: sub.schoolId, 
          status: 'error', 
          reason: subError.message 
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${results.processed} subscriptions, suspended ${results.suspended}`,
      results 
    });

  } catch (error: any) {
    console.error('Suspension cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to process suspensions', details: error.message },
      { status: 500 }
    );
  }
}
