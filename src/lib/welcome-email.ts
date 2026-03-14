import { sendEmail } from './email';
import { generateWelcomeEmail, WelcomeEmailData } from './email-templates';
import { School, Subscription, User } from '@prisma/client';

export async function sendWelcomeEmail(
  user: User,
  school: School,
  subscription: Subscription
) {
  try {
    // Build URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/login`;
    const dashboardUrl = `${baseUrl}/dashboard`;
    const paymentUrl = subscription.plan !== 'trial' ? `${baseUrl}/billing` : undefined;

    // Generate email content
    const emailData: WelcomeEmailData = {
      user,
      school,
      subscription,
      loginUrl,
      dashboardUrl,
      paymentUrl,
    };

    const { subject, html } = generateWelcomeEmail(emailData);

    // Send email using existing SaaS SMTP configuration
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    console.log(`Welcome email sent to ${user.email}`);
    return { success: true, result };
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}
