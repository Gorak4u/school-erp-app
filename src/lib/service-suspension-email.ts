import { sendEmail } from './email';
import { logger } from './logger';
import { School, Subscription, User } from '@prisma/client';

export interface ServiceSuspensionEmailData {
  user: User;
  school: School;
  subscription: Subscription;
  daysSinceSuspension: number;
  suspensionDate: Date;
  lastBillingDate: Date;
}

export function generateServiceSuspensionEmail(data: ServiceSuspensionEmailData) {
  const { user, school, subscription, daysSinceSuspension, suspensionDate, lastBillingDate } = data;
  
  const subject = `Service Suspended - ${school.name}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Suspended - School ERP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { display: inline-block; padding: 12px 24px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .btn:hover { background: #ee5a24; }
        .suspension-badge { background: #ff6b6b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .suspension-details { background: #ffe0e0; padding: 15px; border-radius: 6px; border-left: 4px solid #ff6b6b; }
        .critical { background: #dc3545; color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚫 Service Suspended</h1>
        <p>Your ${school.name} subscription has been suspended</p>
    </div>
    
    <div class="content">
        ${daysSinceSuspension <= 3 ? `
        <div class="critical">
            <h3>🚨 Service Access Suspended!</h3>
            <p>Your School ERP service has been suspended due to payment issues. Please resolve immediately to restore access.</p>
        </div>
        ` : daysSinceSuspension <= 14 ? `
        <div class="critical">
            <h3>⚠️ Service Still Suspended!</h3>
            <p>Your service has been suspended for ${daysSinceSuspension} days. Your data may be at risk if not resolved soon.</p>
        </div>
        ` : `
        <div class="critical">
            <h3>🔴 Critical: Data at Risk!</h3>
            <p>Your service has been suspended for ${daysSinceSuspension} days. Your data may be permanently deleted if not resolved immediately.</p>
        </div>
        `}

        <div class="card">
            <h2>📊 Suspension Details</h2>
            <div class="suspension-details">
                <p><strong>Subscription:</strong> ${subscription.plan.toUpperCase()} <span class="suspension-badge">SUSPENDED</span></p>
                <p><strong>Suspension Date:</strong> ${suspensionDate.toLocaleDateString()}</p>
                <p><strong>Days Suspended:</strong> ${daysSinceSuspension} day${daysSinceSuspension !== 1 ? 's' : ''}</p>
                <p><strong>Last Billing Date:</strong> ${lastBillingDate.toLocaleDateString()}</p>
            </div>
        </div>

        <div class="card">
            <h2>🔒 What This Means</h2>
            <ul>
                <li>❌ <strong>No Access:</strong> You cannot login to your School ERP account</li>
                <li>❌ <strong>No Features:</strong> All features are unavailable</li>
                <li>❌ <strong>No Data Access:</strong> Students, teachers, and parents cannot access the system</li>
                ${daysSinceSuspension > 7 ? `
                <li>⚠️ <strong>Data at Risk:</strong> Your data may be deleted after 30 days of suspension</li>
                ` : ''}
                <li>🔄 <strong>Reversible:</strong> Service can be restored immediately upon payment</li>
            </ul>
        </div>

        <div class="card">
            <h2>🔧 How to Restore Service</h2>
            <ol>
                <li><strong>Update Payment Method</strong> - Add valid payment details</li>
                <li><strong>Pay Outstanding Amount</strong> - Clear all pending payments</li>
                <li><strong>Reactivate Subscription</strong> - Choose your preferred plan</li>
                <li><strong>Confirm Restoration</strong> - Your service will be restored immediately</li>
            </ol>
        </div>

        ${daysSinceSuspension > 21 ? `
        <div class="card">
            <h2>⚠️ Data Deletion Warning</h2>
            <div class="suspension-details">
                <p><strong>Important:</strong> Your account has been suspended for over 21 days.</p>
                <p><strong>Action Required:</strong> Your data will be permanently deleted after 30 days of suspension.</p>
                <p><strong>Deadline:</strong> ${new Date(suspensionDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</p>
            </div>
        </div>
        ` : ''}

        <div class="card">
            <h2>🚀 Restore Your Service Now</h2>
            <p>Get your School ERP running again in just a few clicks:</p>
            <p style="margin-top: 15px;">
                <a href="http://localhost:3000/billing" class="btn">💳 Reactivate Subscription</a>
                <a href="http://localhost:3000/support" class="btn">📞 Contact Support</a>
            </p>
        </div>

        <div class="card">
            <h2>📞 Need Help?</h2>
            <p>Our support team is ready to help you restore your service:</p>
            <ul>
                <li><strong>Priority Support:</strong> support@schoolerp.com (mark as URGENT)</li>
                <li><strong>Phone:</strong> +91-XXXXXXXXXX (Available 24/7 for suspension issues)</li>
                <li><strong>Live Chat:</strong> Available on our website</li>
                <li><strong>Help Center:</strong> schoolerp.com/help/suspension</li>
            </ul>
        </div>

        <div class="footer">
            <p>Don't lose your valuable school data! Restore your service today. 🎓</p>
            <p style="font-size: 12px; margin-top: 10px;">
                This is an automated service suspension notification. You can manage your email preferences in your account settings.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html };
}

export async function sendServiceSuspensionEmail(
  user: User,
  school: School,
  subscription: Subscription,
  daysSinceSuspension: number,
  suspensionDate: Date,
  lastBillingDate: Date
) {
  try {
    const emailData: ServiceSuspensionEmailData = {
      user,
      school,
      subscription,
      daysSinceSuspension,
      suspensionDate,
      lastBillingDate,
    };

    const { subject, html } = generateServiceSuspensionEmail(emailData);

    // Send email using existing SaaS SMTP configuration
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    logger.info('Service suspension email sent', {
      userEmail: user.email,
      daysSinceSuspension
    });
    return result;
  } catch (error) {
    logger.error('Failed to send service suspension email', { error, userEmail: user.email });
    throw error;
  }
}
