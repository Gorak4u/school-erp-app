import { sendEmail } from './email';
import { School, Subscription, User } from '@prisma/client';

export interface SubscriptionRenewalEmailData {
  user: User;
  school: School;
  subscription: Subscription;
  daysRemaining: number;
  nextBillingDate: Date;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
}

export function generateSubscriptionRenewalEmail(data: SubscriptionRenewalEmailData) {
  const { user, school, subscription, daysRemaining, nextBillingDate, amount, billingCycle } = data;
  
  const subject = `Subscription Renewing Soon - ${school.name}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Renewal - School ERP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .btn:hover { background: #0056b3; }
        .renewal-badge { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .payment-details { background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }
        .urgent { background: #ffc107; color: #212529; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔄 Subscription Renewing Soon</h1>
        <p>Your ${school.name} subscription will renew automatically</p>
    </div>
    
    <div class="content">
        ${daysRemaining <= 3 ? `
        <div class="urgent">
            <h3>⚠️ Renewing in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}!</h3>
            <p>Your subscription will automatically renew. Please ensure your payment method is up to date.</p>
        </div>
        ` : ''}

        <div class="card">
            <h2>💳 Renewal Details</h2>
            <div class="payment-details">
                <p><strong>Current Plan:</strong> ${subscription.plan.toUpperCase()} <span class="renewal-badge">ACTIVE</span></p>
                <p><strong>Renewal Date:</strong> ${nextBillingDate.toLocaleDateString()}</p>
                <p><strong>Days Until Renewal:</strong> ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</p>
                <p><strong>Renewal Amount:</strong> ₹${amount.toLocaleString()}</p>
                <p><strong>Billing Cycle:</strong> ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</p>
            </div>
        </div>

        <div class="card">
            <h2>📋 What You Get</h2>
            <ul>
                <li>✅ Continued access to all features</li>
                <li>✅ ${subscription.maxStudents} student limit</li>
                <li>✅ ${subscription.maxTeachers} teacher limit</li>
                <li>✅ Priority customer support</li>
                <li>✅ Regular updates and new features</li>
            </ul>
        </div>

        <div class="card">
            <h2>💳 Manage Your Subscription</h2>
            <p>You can manage your subscription settings, update payment methods, or change plans anytime:</p>
            <ul>
                <li><strong>Update Payment Method:</strong> Ensure your card details are current</li>
                <li><strong>Change Plan:</strong> Upgrade or downgrade your plan</li>
                <li><strong>Cancel Anytime:</strong> No long-term commitments</li>
                <li><strong>View History:</strong> Access all past invoices and payments</li>
            </ul>
            <p style="margin-top: 15px;">
                <a href="http://localhost:3000/billing" class="btn">💳 Manage Billing</a>
                <a href="http://localhost:3000/dashboard" class="btn">🎓 Go to Dashboard</a>
            </p>
        </div>

        <div class="card">
            <h2>📞 Need Help?</h2>
            <p>Have questions about your renewal or need to make changes?</p>
            <ul>
                <li><strong>Support Email:</strong> support@schoolerp.com</li>
                <li><strong>Phone:</strong> +91-XXXXXXXXXX</li>
                <li><strong>Help Center:</strong> schoolerp.com/help</li>
            </ul>
        </div>

        <div class="footer">
            <p>Thank you for your continued partnership with School ERP! 🎓</p>
            <p style="font-size: 12px; margin-top: 10px;">
                This is an automated renewal reminder. You can manage your email preferences in your account settings.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html };
}

export async function sendSubscriptionRenewalEmail(
  user: User,
  school: School,
  subscription: Subscription,
  daysRemaining: number,
  nextBillingDate: Date,
  amount: number,
  billingCycle: 'monthly' | 'yearly'
) {
  try {
    const emailData: SubscriptionRenewalEmailData = {
      user,
      school,
      subscription,
      daysRemaining,
      nextBillingDate,
      amount,
      billingCycle,
    };

    const { subject, html } = generateSubscriptionRenewalEmail(emailData);

    // Send email using existing SaaS SMTP configuration
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    console.log(`Subscription renewal email sent to ${user.email} (${daysRemaining} days until renewal)`);
    return result;
  } catch (error) {
    console.error('Failed to send subscription renewal email:', error);
    throw error;
  }
}
