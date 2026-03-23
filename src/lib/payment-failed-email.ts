import { sendEmail } from './email';
import { logger } from './logger';
import { School, Subscription, User } from '@prisma/client';

export interface PaymentFailedEmailData {
  user: User;
  school: School;
  subscription: Subscription;
  daysSinceFailure: number;
  amount: number;
  paymentMethod: string;
  lastAttemptDate: Date;
}

export function generatePaymentFailedEmail(data: PaymentFailedEmailData) {
  const { user, school, subscription, daysSinceFailure, amount, paymentMethod, lastAttemptDate } = data;
  
  const subject = `Payment Failed - Action Required - ${school.name}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed - School ERP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .btn:hover { background: #c82333; }
        .failure-badge { background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .payment-details { background: #f8d7da; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; }
        .urgent { background: #dc3545; color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>💳 Payment Failed</h1>
        <p>Your ${school.name} subscription payment could not be processed</p>
    </div>
    
    <div class="content">
        ${daysSinceFailure === 0 ? `
        <div class="urgent">
            <h3>🚨 Immediate Action Required!</h3>
            <p>Your recent payment attempt failed. Please update your payment method immediately to avoid service interruption.</p>
        </div>
        ` : daysSinceFailure <= 3 ? `
        <div class="urgent">
            <h3>⚠️ Payment Still Failed!</h3>
            <p>Your payment failed ${daysSinceFailure} day${daysSinceFailure !== 1 ? 's' : ''} ago. Service will be suspended soon if not resolved.</p>
        </div>
        ` : ''}

        <div class="card">
            <h2>💳 Payment Details</h2>
            <div class="payment-details">
                <p><strong>Subscription:</strong> ${subscription.plan.toUpperCase()} <span class="failure-badge">PAYMENT FAILED</span></p>
                <p><strong>Failed Amount:</strong> ₹${amount.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                <p><strong>Failure Date:</strong> ${lastAttemptDate.toLocaleDateString()}</p>
                <p><strong>Days Since Failure:</strong> ${daysSinceFailure} day${daysSinceFailure !== 1 ? 's' : ''}</p>
            </div>
        </div>

        <div class="card">
            <h2>🔧 What You Need to Do</h2>
            <ol>
                <li><strong>Check your payment method</strong> - Ensure your card is valid and has sufficient funds</li>
                <li><strong>Update payment details</strong> - Add a new payment method if needed</li>
                <li><strong>Retry payment</strong> - Process the payment manually or wait for automatic retry</li>
                <li><strong>Contact support</strong> - If issues persist, reach out to our support team</li>
            </ol>
        </div>

        ${daysSinceFailure > 7 ? `
        <div class="card">
            <h2>⚠️ Service Status</h2>
            <div class="payment-details">
                <p><strong>Warning:</strong> Your service may be suspended if payment is not resolved soon.</p>
                <p><strong>Next Step:</strong> Please update your payment method immediately to restore service.</p>
            </div>
        </div>
        ` : ''}

        <div class="card">
            <h2>🛠️ Quick Actions</h2>
            <p>Resolve this payment issue quickly:</p>
            <p style="margin-top: 15px;">
                <a href="http://localhost:3000/billing" class="btn">💳 Update Payment Method</a>
                <a href="http://localhost:3000/billing" class="btn">🔄 Retry Payment</a>
            </p>
        </div>

        <div class="card">
            <h2>📞 Need Help?</h2>
            <p>Having trouble with your payment? Our support team is here to help:</p>
            <ul>
                <li><strong>Support Email:</strong> support@schoolerp.com</li>
                <li><strong>Phone:</strong> +91-XXXXXXXXXX</li>
                <li><strong>Live Chat:</strong> Available on our website</li>
                <li><strong>Help Center:</strong> schoolerp.com/help/payment-issues</li>
            </ul>
        </div>

        <div class="footer">
            <p>Please resolve this payment issue to continue using School ERP without interruption. 🎓</p>
            <p style="font-size: 12px; margin-top: 10px;">
                This is an automated payment failure notification. You can manage your email preferences in your account settings.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html };
}

export async function sendPaymentFailedEmail(
  user: User,
  school: School,
  subscription: Subscription,
  daysSinceFailure: number,
  amount: number,
  paymentMethod: string,
  lastAttemptDate: Date
) {
  try {
    const emailData: PaymentFailedEmailData = {
      user,
      school,
      subscription,
      daysSinceFailure,
      amount,
      paymentMethod,
      lastAttemptDate,
    };

    const { subject, html } = generatePaymentFailedEmail(emailData);

    // Send email using existing SaaS SMTP configuration
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    logger.info('Payment failed email sent', {
      userEmail: user.email,
      daysSinceFailure,
      amount
    });
    return result;
  } catch (error) {
    logger.error('Failed to send payment failed email', { error, userEmail: user.email });
    throw error;
  }
}
