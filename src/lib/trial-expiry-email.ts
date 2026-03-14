import { sendEmail } from './email';
import { School, Subscription, User } from '@prisma/client';

export interface TrialExpiryEmailData {
  user: User;
  school: School;
  subscription: Subscription;
  daysRemaining: number;
}

export function generateTrialExpiryEmail(data: TrialExpiryEmailData) {
  const { user, school, subscription, daysRemaining } = data;
  
  const subject = `Trial Expiring Soon - ${school.name}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trial Expiry Reminder - School ERP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { display: inline-block; padding: 12px 24px; background: #ffc107; color: #212529; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
        .btn:hover { background: #e0a800; }
        .warning-badge { background: #ffc107; color: #212529; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .urgent { background: #dc3545; color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Trial Expiring Soon</h1>
        <p>Your ${school.name} trial period is ending</p>
    </div>
    
    <div class="content">
        ${daysRemaining <= 3 ? `
        <div class="urgent">
            <h3>🚨 URGENT: Your trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}!</h3>
            <p>Upgrade now to avoid losing access to your school data and features.</p>
        </div>
        ` : ''}

        <div class="card">
            <h2>📅 Trial Status</h2>
            <p><strong>Trial Period:</strong> ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining</p>
            <p><strong>Expiry Date:</strong> ${subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'Unknown'}</p>
            <p><strong>Current Plan:</strong> ${subscription.plan.toUpperCase()} <span class="warning-badge">TRIAL</span></p>
        </div>

        <div class="card">
            <h2>💡 What Happens When Trial Ends?</h2>
            <ul>
                <li>❌ You'll lose access to all features</li>
                <li>❌ Your data will be preserved for 30 days</li>
                <li>❌ Students and teachers won't be able to login</li>
                <li>✅ Upgrade anytime to restore full access</li>
            </ul>
        </div>

        <div class="card">
            <h2>💳 Upgrade Your Plan</h2>
            <p>Choose a plan that fits your school's needs:</p>
            <ul>
                <li><strong>Basic:</strong> ₹999/month - Perfect for small schools (100 students)</li>
                <li><strong>Pro:</strong> ₹2,999/month - Great for growing schools (500 students)</li>
                <li><strong>Premium:</strong> ₹9,999/month - Unlimited students + priority support</li>
            </ul>
            <p style="margin-top: 15px;">
                <a href="http://localhost:3000/billing" class="btn">💳 Upgrade Now</a>
            </p>
        </div>

        <div class="card">
            <h2>📞 Need Help?</h2>
            <p>Our team is here to help you choose the right plan:</p>
            <ul>
                <li><strong>Support Email:</strong> support@schoolerp.com</li>
                <li><strong>Phone:</strong> +91-XXXXXXXXXX</li>
                <li><strong>Live Chat:</strong> Available on our website</li>
            </ul>
        </div>

        <div class="footer">
            <p>Don't let your trial expire! Upgrade today to continue using School ERP 🎓</p>
            <p style="font-size: 12px; margin-top: 10px;">
                This is an automated reminder. You can manage your email preferences in your account settings.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html };
}

export async function sendTrialExpiryEmail(
  user: User,
  school: School,
  subscription: Subscription,
  daysRemaining: number
) {
  try {
    const emailData: TrialExpiryEmailData = {
      user,
      school,
      subscription,
      daysRemaining,
    };

    const { subject, html } = generateTrialExpiryEmail(emailData);

    // Send email using existing SaaS SMTP configuration
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    console.log(`Trial expiry email sent to ${user.email} (${daysRemaining} days remaining)`);
    return result;
  } catch (error) {
    console.error('Failed to send trial expiry email:', error);
    throw error;
  }
}
