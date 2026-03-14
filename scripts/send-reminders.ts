import 'dotenv/config';
import { saasPrisma, schoolPrisma } from '../src/lib/prisma';
import { getReminderConfig, shouldSendReminderToday } from '../src/lib/reminder-config';
import { sendTrialExpiryEmail } from '../src/lib/trial-expiry-email';
import { sendSubscriptionRenewalEmail } from '../src/lib/subscription-renewal-email';
import { sendPaymentFailedEmail } from '../src/lib/payment-failed-email';
import { sendServiceSuspensionEmail } from '../src/lib/service-suspension-email';
import { sendQuotaLimitExceededEmail } from '../src/lib/quota-limit-exceeded-email';

interface ReminderResult {
  type: string;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

async function sendTrialExpiryReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    type: 'trial_expiry',
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const config = await getReminderConfig();
    const trialConfig = config.trialExpiry;

    if (!trialConfig.enabled) {
      console.log('Trial expiry reminders are disabled');
      return result;
    }

    const p = saasPrisma as any;

    // Get all active trial subscriptions
    const trialSubscriptions = await p.subscription.findMany({
      where: {
        status: 'trial',
        trialEndsAt: {
          not: null,
          gte: new Date(), // Only future or current trials
        },
      },
      include: {
        school: {
          include: {
            users: {
              where: { role: 'admin' },
              take: 1,
            },
          },
        },
      },
    });

    console.log(`Found ${trialSubscriptions.length} active trial subscriptions`);

    for (const subscription of trialSubscriptions) {
      try {
        if (!subscription.trialEndsAt) {
          result.skipped++;
          continue;
        }

        // Check if reminder should be sent today
        if (!shouldSendReminderToday(subscription.trialEndsAt, trialConfig.daysBefore, trialConfig.timezone)) {
          result.skipped++;
          continue;
        }

        const adminUser = subscription.school.users[0];
        if (!adminUser) {
          result.skipped++;
          console.log(`No admin user found for school: ${subscription.school.name}`);
          continue;
        }

        // Calculate days remaining
        const now = new Date();
        const trialEnd = new Date(subscription.trialEndsAt);
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send reminder email
        await sendTrialExpiryEmail(adminUser, subscription.school, subscription, daysRemaining);
        result.sent++;
        console.log(`Trial expiry reminder sent to ${adminUser.email} (${daysRemaining} days remaining)`);

      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to send trial expiry reminder to ${subscription.school.name}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

  } catch (error) {
    result.errors.push(`Trial expiry reminder process failed: ${error}`);
    console.error('Trial expiry reminder process failed:', error);
  }

  return result;
}

async function sendSubscriptionRenewalReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    type: 'subscription_renewal',
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const config = await getReminderConfig();
    const renewalConfig = config.subscriptionRenewal;

    if (!renewalConfig.enabled) {
      console.log('Subscription renewal reminders are disabled');
      return result;
    }

    const p = saasPrisma as any;

    // Get all active subscriptions with current period end dates
    const activeSubscriptions = await p.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          not: null,
          gte: new Date(), // Only future or current periods
        },
      },
      include: {
        school: {
          include: {
            users: {
              where: { role: 'admin' },
              take: 1,
            },
          },
        },
      },
    });

    console.log(`Found ${activeSubscriptions.length} active subscriptions`);

    for (const subscription of activeSubscriptions) {
      try {
        if (!subscription.currentPeriodEnd) {
          result.skipped++;
          continue;
        }

        // Check if reminder should be sent today
        if (!shouldSendReminderToday(subscription.currentPeriodEnd, renewalConfig.daysBefore, renewalConfig.timezone)) {
          result.skipped++;
          continue;
        }

        const adminUser = subscription.school.users[0];
        if (!adminUser) {
          result.skipped++;
          console.log(`No admin user found for school: ${subscription.school.name}`);
          continue;
        }

        // Calculate days remaining and billing details
        const now = new Date();
        const renewalDate = new Date(subscription.currentPeriodEnd!);
        const daysRemaining = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Get billing cycle from subscription or default to monthly
        const billingCycle: 'monthly' | 'yearly' = (subscription as any).billingCycle || 'monthly';
        
        // Send subscription renewal email
        await sendSubscriptionRenewalEmail(
          adminUser,
          subscription.school,
          subscription,
          daysRemaining,
          renewalDate,
          subscription.amount || 0,
          billingCycle
        );
        result.sent++;
        console.log(`Subscription renewal reminder sent to ${adminUser.email} (${daysRemaining} days until renewal)`);

      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to send renewal reminder to ${subscription.school.name}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

  } catch (error) {
    result.errors.push(`Subscription renewal reminder process failed: ${error}`);
    console.error('Subscription renewal reminder process failed:', error);
  }

  return result;
}

async function sendPaymentFailedReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    type: 'payment_failed',
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const config = await getReminderConfig();
    const paymentConfig = config.paymentFailed;

    if (!paymentConfig.enabled) {
      console.log('Payment failed reminders are disabled');
      return result;
    }

    // Get failed payment records from SubscriptionPayment table
    const p = saasPrisma as any;
    const failedPayments = await p.subscriptionPayment.findMany({
      where: {
        status: 'failed',
        createdAt: {
          gte: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // Last 30 days
        },
      },
      include: {
        subscription: {
          include: {
            school: {
              include: {
                users: {
                  where: { role: 'admin' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    console.log(`Found ${failedPayments.length} failed payment records`);

    for (const payment of failedPayments) {
      try {
        const daysSinceFailure = Math.ceil((Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if reminder should be sent today (days after failure)
        if (!paymentConfig.daysBefore.includes(daysSinceFailure)) {
          result.skipped++;
          continue;
        }

        const adminUser = payment.subscription.school.users[0];
        if (!adminUser) {
          result.skipped++;
          console.log(`No admin user found for school: ${payment.subscription.school.name}`);
          continue;
        }

        // Send payment failed email
        await sendPaymentFailedEmail(
          adminUser,
          payment.subscription.school,
          payment.subscription, // Use actual subscription object
          daysSinceFailure,
          payment.amount,
          payment.paymentMethod || 'Online',
          payment.createdAt
        );
        result.sent++;
        console.log(`Payment failed reminder sent to ${adminUser.email} (${daysSinceFailure} days since failure)`);

      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to send payment failed reminder to ${payment.subscription.school.name}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
  } catch (error) {
    result.errors.push(`Payment failed reminder process failed: ${error}`);
    console.error('Payment failed reminder process failed:', error);
  }

  return result;
}

async function sendServiceSuspensionReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    type: 'service_suspension',
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const config = await getReminderConfig();
    const suspensionConfig = config.serviceSuspension;

    if (!suspensionConfig.enabled) {
      console.log('Service suspension reminders are disabled');
      return result;
    }

    const p = saasPrisma as any;

    // Get all expired/cancelled subscriptions
    const expiredSubscriptions = await p.subscription.findMany({
      where: {
        status: {
          in: ['expired', 'cancelled'],
        },
      },
      include: {
        school: {
          include: {
            users: {
              where: { role: 'admin' },
              take: 1,
            },
          },
        },
      },
    });

    console.log(`Found ${expiredSubscriptions.length} expired/cancelled subscriptions`);

    for (const subscription of expiredSubscriptions) {
      try {
        // Calculate days since expiry
        const now = new Date();
        const expiryDate = subscription.trialEndsAt || subscription.currentPeriodEnd;
        
        if (!expiryDate) {
          result.skipped++;
          continue;
        }

        const daysSinceExpiry = Math.ceil((now.getTime() - new Date(expiryDate).getTime()) / (1000 * 60 * 60 * 24));

        // Check if reminder should be sent today (days after expiry)
        if (!suspensionConfig.daysBefore.includes(daysSinceExpiry)) {
          result.skipped++;
          continue;
        }

        const adminUser = subscription.school.users[0];
        if (!adminUser) {
          result.skipped++;
          console.log(`No admin user found for school: ${subscription.school.name}`);
          continue;
        }

        // Calculate suspension date and last billing date
        const suspensionDate = expiryDate; // Suspension starts on expiry date
        const lastBillingDate = subscription.currentPeriodStart || subscription.trialEndsAt || expiryDate;
        
        // Send service suspension email
        await sendServiceSuspensionEmail(
          adminUser,
          subscription.school,
          subscription,
          daysSinceExpiry,
          suspensionDate,
          lastBillingDate
        );
        result.sent++;
        console.log(`Service suspension reminder sent to ${adminUser.email} (${daysSinceExpiry} days since suspension)`);

      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to send suspension reminder to ${subscription.school.name}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

  } catch (error) {
    result.errors.push(`Service suspension reminder process failed: ${error}`);
    console.error('Service suspension reminder process failed:', error);
  }

  return result;
}

async function sendQuotaLimitExceededReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    type: 'quota_limit_exceeded',
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const config = await getReminderConfig();
    const quotaConfig = config.quotaLimitExceeded;

    if (!quotaConfig.enabled) {
      console.log('Quota limit exceeded reminders are disabled');
      return result;
    }

    const p = saasPrisma as any;

    // Get all active subscriptions
    const subscriptions = await p.subscription.findMany({
      where: {
        status: 'active',
      },
      include: {
        school: {
          include: {
            _count: { select: { students: true, teachers: true } },
            users: {
              where: { role: 'admin' },
              take: 1,
            },
          },
        },
      },
    });

    console.log(`Found ${subscriptions.length} active subscriptions for quota checking`);

    for (const subscription of subscriptions) {
      try {
        const adminUser = subscription.school.users[0];
        if (!adminUser) {
          result.skipped++;
          console.log(`No admin user found for school: ${subscription.school.name}`);
          continue;
        }

        const studentsUsed = subscription.school._count.students;
        const teachersUsed = subscription.school._count.teachers;
        const studentsLimit = subscription.maxStudents;
        const teachersLimit = subscription.maxTeachers;

        // Check if any quota is exceeded
        const exceededResources: string[] = [];
        if (studentsUsed >= studentsLimit) {
          exceededResources.push(`Students: ${studentsUsed}/${studentsLimit}`);
        }
        if (teachersUsed >= teachersLimit) {
          exceededResources.push(`Teachers: ${teachersUsed}/${teachersLimit}`);
        }

        // Only send reminder if quotas are exceeded
        if (exceededResources.length === 0) {
          result.skipped++;
          continue;
        }

        // Check if should send today (daily check when quota exceeded)
        const now = new Date();
        const [targetHour, targetMinute] = quotaConfig.timeOfDay.split(':').map(Number);
        const currentHour = parseInt(now.toLocaleString('en-US', { timeZone: quotaConfig.timezone, hour: '2-digit', hour12: false }));
        const currentMinute = parseInt(now.toLocaleString('en-US', { timeZone: quotaConfig.timezone, minute: '2-digit' }));
        
        // Only send if current time is after target time (to avoid sending multiple times per day)
        if (currentHour < targetHour || (currentHour === targetHour && currentMinute < targetMinute)) {
          result.skipped++;
          continue;
        }

        // Send quota limit exceeded email
        const success = await sendQuotaLimitExceededEmail(
          adminUser,
          subscription.school,
          subscription,
          studentsUsed,
          teachersUsed,
          studentsLimit,
          teachersLimit,
          exceededResources,
          new Date().toISOString()
        );

        if (success) {
          result.sent++;
          console.log(`Quota limit exceeded reminder sent to ${adminUser.email} for ${subscription.school.name}`);
        } else {
          result.failed++;
          result.errors.push(`Failed to send quota reminder to ${subscription.school.name}`);
        }

      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to process quota reminder for ${subscription.school.name}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

  } catch (error) {
    result.errors.push(`Quota limit exceeded reminder process failed: ${error}`);
    console.error('Quota limit exceeded reminder process failed:', error);
  }

  return result;
}

async function main() {
  console.log('🔔 Starting reminder service...');
  console.log(`Time: ${new Date().toISOString()}`);

  const results: ReminderResult[] = [];

  try {
    // Send all types of reminders
    results.push(await sendTrialExpiryReminders());
    results.push(await sendSubscriptionRenewalReminders());
    results.push(await sendPaymentFailedReminders());
    results.push(await sendServiceSuspensionReminders());
    results.push(await sendQuotaLimitExceededReminders());

    // Print summary
    console.log('\n📊 Reminder Service Summary:');
    console.log('================================');
    
    let totalSent = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const result of results) {
      console.log(`\n${result.type.toUpperCase()}:`);
      console.log(`  ✅ Sent: ${result.sent}`);
      console.log(`  ❌ Failed: ${result.failed}`);
      console.log(`  ⏭️  Skipped: ${result.skipped}`);
      
      if (result.errors.length > 0) {
        console.log(`  🚨 Errors: ${result.errors.length}`);
        result.errors.forEach(error => console.log(`    - ${error}`));
      }

      totalSent += result.sent;
      totalFailed += result.failed;
      totalSkipped += result.skipped;
      totalErrors += result.errors.length;
    }

    console.log('\n🎯 TOTALS:');
    console.log(`  ✅ Sent: ${totalSent}`);
    console.log(`  ❌ Failed: ${totalFailed}`);
    console.log(`  ⏭️  Skipped: ${totalSkipped}`);
    console.log(`  🚨 Errors: ${totalErrors}`);

    if (totalErrors > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('🚨 Reminder service failed:', error);
    process.exit(1);
  } finally {
    await (saasPrisma as any).$disconnect();
  }
}

// Run the reminder service
if (require.main === module) {
  main().catch(console.error);
}

export { main as sendReminders };
