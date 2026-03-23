import { sendEmail } from './email';
import { generateWelcomeEmail, WelcomeEmailData } from './email-templates';
import { School, Subscription, User } from '@prisma/client';
import { getSubdomainUrl } from './subdomain';
import { logger } from './logger';

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
      logger.info(`Email notifications disabled for school ${school.id}`, {
        userEmail: user.email,
        reason: 'Email notifications disabled'
      });
      return { success: true, skipped: true, reason: 'Email notifications disabled' };
    }
    
    // Build URLs - use domain if available, otherwise main domain
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    let loginUrl: string;
    let dashboardUrl: string;
    
    if (school.domain) {
      const schoolUrl = getSubdomainUrl(school.domain);
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

    logger.info('Welcome email sent successfully', { userEmail: user.email, schoolId: school.id });
    return { success: true, result };
  } catch (error: any) {
    logger.error('Failed to send welcome email', { error, userEmail: user.email, schoolId: school.id });
    return { success: false, error: error.message };
  }
}
