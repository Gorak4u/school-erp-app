import { sendEmail } from './email';
import { generateWelcomeEmail, WelcomeEmailData } from './email-templates';
import { School, Subscription, User } from '@prisma/client';
import { getSubdomainUrl } from './subdomain';

export async function sendWelcomeEmail(
  user: User,
  school: School,
  subscription: Subscription,
  password?: string,
  planStartDate?: Date,
  planEndDate?: Date
) {
  try {
    // Check if email notifications are enabled for this school
    const { isEmailNotificationEnabled } = await import('./email');
    const emailNotificationsEnabled = await isEmailNotificationEnabled(school.id);
    
    if (!emailNotificationsEnabled) {
      console.log(`📧 Email notifications are DISABLED for school ${school.id}. Skipping welcome email to ${user.email}.`);
      return { success: true, skipped: true, reason: 'Email notifications disabled' };
    }
    
    // Build URLs - use subdomain if available, otherwise main domain
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    let loginUrl: string;
    let dashboardUrl: string;
    
    if (school.subdomain) {
      const schoolUrl = getSubdomainUrl(school.subdomain);
      loginUrl = `${schoolUrl}/school-login`;
      dashboardUrl = `${schoolUrl}/dashboard`;
    } else {
      loginUrl = `${baseUrl}/login`;
      dashboardUrl = `${baseUrl}/dashboard`;
    }
    
    const paymentUrl = subscription.plan !== 'trial' ? `${baseUrl}/billing` : undefined;

    // Generate email content
    const emailData: WelcomeEmailData = {
      user,
      school,
      subscription,
      loginUrl,
      dashboardUrl,
      paymentUrl,
      password,
      planStartDate,
      planEndDate,
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
