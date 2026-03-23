import { sendEmail } from './email';
import { logger } from './logger';
import { School, Subscription, User } from '@prisma/client';

export interface PaymentConfirmationEmailData {
  user: User;
  school: School;
  subscription: Subscription;
  paymentAmount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
}

export function generatePaymentConfirmationEmail(data: PaymentConfirmationEmailData) {
  const { user, school, subscription, paymentAmount, billingCycle, nextBillingDate } = data;
  
  const subject = `Payment Confirmed - ${school.name} Subscription Activated!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation - School ERP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .btn:hover { background: #218838; }
        .success-badge { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .payment-details { background: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Payment Successful!</h1>
        <p>Your ${school.name} subscription is now active</p>
    </div>
    
    <div class="content">
        <div class="card">
            <h2>💳 Payment Confirmation</h2>
            <div class="payment-details">
                <p><strong>Transaction Status:</strong> <span class="success-badge">COMPLETED</span></p>
                <p><strong>Amount Paid:</strong> ₹${paymentAmount.toLocaleString()}</p>
                <p><strong>Billing Cycle:</strong> ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</p>
                <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Next Billing Date:</strong> ${nextBillingDate.toLocaleDateString()}</p>
            </div>
        </div>

        <div class="card">
            <h2>🏫 Account Details</h2>
            <p><strong>School Name:</strong> ${school.name}</p>
            <p><strong>Account Email:</strong> ${user.email}</p>
            <p><strong>Admin Name:</strong> ${(user as any).firstName && (user as any).lastName ? `${(user as any).firstName} ${(user as any).lastName}` : (user as any).name || 'Admin'}</p>
        </div>

        <div class="card">
            <h2>📋 Subscription Details</h2>
            <p><strong>Plan:</strong> ${subscription.plan.toUpperCase()}</p>
            <p><strong>Status:</strong> <span class="success-badge">ACTIVE</span></p>
            <p><strong>Current Period:</strong> ${new Date().toLocaleDateString()} - ${nextBillingDate.toLocaleDateString()}</p>
            <p><strong>Student Limit:</strong> ${subscription.maxStudents}</p>
            <p><strong>Teacher Limit:</strong> ${subscription.maxTeachers}</p>
        </div>

        <div class="card">
            <h2>🚀 What's Next?</h2>
            <p>Your subscription is now active! You can:</p>
            <ul>
                <li>Access all features of your ${subscription.plan} plan</li>
                <li>Add unlimited students and teachers (within your plan limits)</li>
                <li>Manage your school data and settings</li>
                <li>Generate reports and track progress</li>
            </ul>
            <p style="margin-top: 15px;">
                <a href="http://localhost:3000/dashboard" class="btn">🎓 Go to Dashboard</a>
                <a href="http://localhost:3000/billing" class="btn">💳 Manage Billing</a>
            </p>
        </div>

        <div class="card">
            <h2>📧 Need Help?</h2>
            <p>If you have any questions about your subscription or need assistance, we're here to help:</p>
            <ul>
                <li><strong>Support Email:</strong> support@schoolerp.com</li>
                <li><strong>Documentation:</strong> docs.schoolerp.com</li>
                <li><strong>FAQ:</strong> schoolerp.com/help</li>
            </ul>
        </div>

        <div class="footer">
            <p>Thank you for choosing School ERP! 🎓</p>
            <p style="font-size: 12px; margin-top: 10px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html };
}

export async function sendPaymentConfirmationEmail(
  user: User,
  school: School,
  subscription: Subscription,
  paymentAmount: number,
  billingCycle: 'monthly' | 'yearly'
) {
  try {
    const nextBillingDate = new Date();
    if (billingCycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    const emailData: PaymentConfirmationEmailData = {
      user,
      school,
      subscription,
      paymentAmount,
      billingCycle,
      nextBillingDate,
    };

    const { subject, html } = generatePaymentConfirmationEmail(emailData);

    // Send email using existing SaaS SMTP configuration
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    logger.info('Payment confirmation email sent successfully', { userEmail: user.email });
    return result;
  } catch (error) {
    logger.error('Failed to send payment confirmation email', { error, userEmail: user.email });
    throw error;
  }
}
