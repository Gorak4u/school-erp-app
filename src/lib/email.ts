import nodemailer from 'nodemailer';
import { logger } from './logger';
import { saasPrisma, schoolPrisma } from './prisma';

// Check if email notifications are enabled for a school
export async function isEmailNotificationEnabled(schoolId?: string): Promise<boolean> {
  try {
    let whereClause: {
      group: string;
      key: string;
      schoolId: string;
    } = { group: 'app_config', key: 'email_notifications', schoolId: 'default' };
    
    if (schoolId) {
      whereClause.schoolId = schoolId;
    } else {
      whereClause.schoolId = 'default';
    }
    
    const setting = await (schoolPrisma as any).SchoolSetting.findFirst({
      where: whereClause,
    });
    
    // Default to true if setting is not found (backward compatibility)
    if (!setting) {
      logger.info('Email notifications setting not found, defaulting to enabled', { schoolId });
      return true;
    }
    
    const isEnabled = setting.value === 'true';
    logger.info(`Email notifications ${isEnabled ? 'ENABLED' : 'DISABLED'}`, { schoolId, enabled: isEnabled });
    return isEnabled;
  } catch (error) {
    logger.error('Error checking email notification setting', { error, schoolId });
    // Default to enabled on error to avoid breaking existing functionality
    return true;
  }
}

// Reads SaaS-level SMTP with priority: .env first, then database
// This is SEPARATE from school-level SMTP in SchoolSetting (group: smtp)
export async function getSaasSmtpConfig() {
  const settings = await (saasPrisma as any).SaasSetting.findMany({
    where: { group: 'saas_smtp' },
  });
  
  const config: Record<string, string> = {};
  
  // Define all possible SaaS SMTP keys
  const saasSmtpKeys = [
    'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password',
    'smtp_from_email', 'smtp_from_name', 'smtp_enabled'
  ];
  
  // For each key, check .env first, then database
  for (const key of saasSmtpKeys) {
    const envValue = process.env[key.toUpperCase()];
    if (envValue) {
      config[key] = envValue;
    } else {
      const dbSetting = settings.find((s: { key: string; value: string }) => s.key === key);
      if (dbSetting) {
        config[key] = dbSetting.value;
      }
    }
  }
  
  return config;
}

// Reads school-level SMTP from SchoolSetting (group: smtp)
// Used for: fee receipts, school notifications, admissions, reminders
export async function getSchoolSmtpConfig(schoolId?: string) {
  let whereClause: {
    group: string;
    schoolId?: string;
  } = { group: 'smtp' };
  
  if (schoolId) {
    whereClause.schoolId = schoolId;
  }
  
  const settings = await (schoolPrisma as any).SchoolSetting.findMany({
    where: whereClause,
  });
  
  const config: Record<string, string> = {};
  for (const s of settings) config[s.key] = s.value;
  return config;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Get SaaS SMTP config with .env priority
  const smtp = await getSaasSmtpConfig();

  const host = smtp.smtp_host;
  const port = parseInt(smtp.smtp_port || '587');
  const user = smtp.smtp_username;
  const pass = smtp.smtp_password;
  const from = smtp.smtp_from_email || user;
  const enabled = smtp.smtp_enabled === 'true';

  // Check if SaaS SMTP is enabled
  if (enabled === false) {
    logger.info('SaaS SMTP disabled', {
      message: 'SMTP is explicitly disabled in configuration',
      solution: 'Set SMTP_ENABLED=true in .env or via admin panel'
    });
    return { success: false, error: 'SaaS SMTP disabled' };
  }

  // Check if SaaS SMTP is properly configured
  if (!host || !user || !pass) {
    logger.warn('SaaS SMTP not configured', {
      missing_settings: {
        smtp_host: host ? 'configured' : 'missing',
        smtp_username: user ? 'configured' : 'missing',
        smtp_password: pass ? 'configured' : 'missing'
      },
      env_sources: {
        SMTP_HOST: process.env.SMTP_HOST ? 'from_env' : 'not_in_env',
        SMTP_USERNAME: process.env.SMTP_USERNAME ? 'from_env' : 'not_in_env',
        SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'from_env' : 'not_in_env'
      }
    });
    
    return { success: false, error: 'SaaS SMTP not configured' };
  }

  logger.info('Sending email via SaaS SMTP', {
    host: `${host}:${port}`,
    user,
    from,
    to,
    subject
  });

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"${smtp.smtp_from_name || 'School ERP'}" <${from}>`,
      to,
      subject,
      html,
    });
    logger.info('Email sent successfully via SaaS SMTP');
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('SaaS SMTP send error', { error: errorMessage, stack: errorStack });
    return { success: false, error: errorMessage };
  }
}

// School-level email sender (uses school's own SMTP)
// Used for: fee receipts, school notifications, admissions, reminders
// Wrap email content with school branding
export async function wrapEmailWithBranding(html: string, schoolId?: string): Promise<string> {
  try {
    // Get school information for branding
    let schoolName = 'School ERP';
    let schoolLogo = '';
    let schoolAddress = '';
    let schoolPhone = '';
    let schoolEmail = '';

    if (schoolId) {
      try {
        logger.debug('Fetching school info for email branding', { schoolId });
        const school = await (saasPrisma as any).school.findUnique({
          where: { id: schoolId },
          select: { name: true, logo: true, address: true, phone: true, email: true }
        });
        
        logger.debug('School info fetched', { school: school || 'null' });
        
        if (school) {
          schoolName = school.name;
          schoolLogo = school.logo || '';
          schoolAddress = school.address || '';
          schoolPhone = school.phone || '';
          schoolEmail = school.email || '';
          logger.info('School branding applied', { schoolName, schoolId });
        } else {
          logger.warn('School not found for branding', { schoolId });
        }
      } catch (error) {
        logger.warn('Failed to fetch school info for email branding', { error, schoolId });
      }
    } else {
      logger.debug('No schoolId provided for email branding');
    }

    // Create branded email template
    const brandedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${schoolName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 32px; text-align: center;">
            ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" style="max-height: 60px; margin-bottom: 16px;">` : ''}
            <h1 style="color: white; margin: 0; font-size: 24px;">${schoolName}</h1>
            <p style="color: #93c5fd; margin: 8px 0 0;">School Management System</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px; background-color: #ffffff;">
            ${html}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1e293b; padding: 32px; text-align: center;">
            <p style="color: #94a3b8; margin: 0 0 16px; font-size: 14px;">
              ${schoolAddress ? `${schoolAddress}<br/>` : ''}
              ${schoolPhone ? `📞 ${schoolPhone}<br/>` : ''}
              ${schoolEmail ? `✉️ ${schoolEmail}` : ''}
            </p>
            <p style="color: #64748b; margin: 16px 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} ${schoolName}. All rights reserved.
            </p>
            <p style="color: #64748b; margin: 8px 0 0; font-size: 11px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return brandedHtml;
  } catch (error) {
    logger.error('Failed to wrap email with branding', { error, schoolId });
    // Return original HTML if branding fails
    return html;
  }
}

export async function sendSchoolEmail({
  to,
  subject,
  html,
  schoolId,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  schoolId?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}) {
  logger.debug('sendSchoolEmail called', { to, subject, schoolId });
  
  // Check if email notifications are enabled for this school
  const emailNotificationsEnabled = await isEmailNotificationEnabled(schoolId);
  if (!emailNotificationsEnabled) {
    logger.info(`Email notifications disabled for school ${schoolId || 'default'}`, {
      to,
      subject,
      reason: 'Email notifications disabled'
    });
    return { success: true, skipped: true, reason: 'Email notifications disabled' };
  }
  
  // Apply school branding to the email
  const brandedHtml = await wrapEmailWithBranding(html, schoolId);
  
  const smtp = await getSchoolSmtpConfig(schoolId);
  logger.debug('School SMTP config retrieved', {
    hasHost: !!smtp.smtp_host,
    hasUser: !!smtp.smtp_username,
    hasPass: !!smtp.smtp_password,
    configKeys: Object.keys(smtp)
  });

  // Fallback: use environment variables if no school SMTP config
  // Note: School SMTP settings use different keys (e.g., 'host' instead of 'smtp_host')
  const host = smtp.host || smtp.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(smtp.port || smtp.smtp_port || process.env.SMTP_PORT || '587');
  const user = smtp.user || smtp.smtp_username || process.env.SMTP_USER;
  const pass = smtp.password || smtp.smtp_password || process.env.SMTP_PASS;
  const from = smtp.from_email || smtp.smtp_from_email || process.env.SMTP_FROM || user;
  const fromName = smtp.from_name || smtp.smtp_from_name || 'School ERP';
  
  // For Gmail, check if we have a custom from_email that's been set up as "Send As"
  // If not, fall back to the authenticated user
  let finalFrom = from;
  if ((host?.includes('gmail.com') || host?.includes('smtp.gmail.com')) && from !== user) {
    // For Gmail with custom from address, we need to ensure it's set up as "Send As"
    // If it fails, Gmail will give us an error and we can handle it
    logger.debug('Gmail: Attempting to send from custom address', { from, authenticatedAs: user });
    finalFrom = from;
  } else {
    finalFrom = from;
  }

  logger.debug('Final SMTP settings', {
    host: host ? 'SET' : 'NOT SET',
    port,
    user: user ? 'SET' : 'NOT SET',
    pass: pass ? 'SET' : 'NOT SET',
    from,
    finalFrom
  });

  if (!host || !user || !pass) {
    // No SMTP configured — log the email for development
    logger.warn('School email - No SMTP configured, logging for development', {
      to,
      subject,
      html_length: html.length,
      schoolId
    });
    return { success: true, devMode: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${finalFrom}>`,
      to,
      subject,
      html: brandedHtml,
      attachments,
    });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('School email send error', { error: errorMessage, stack: errorStack, to, subject });
    return { success: false, error: errorMessage };
  }
}

export function welcomeEmailHtml(studentName: string, admissionNo: string, className: string, schoolName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${schoolName}</h1>
        <p style="color: #93c5fd; margin: 8px 0 0;">Welcome to Our School</p>
      </div>
      <div style="background: #1e293b; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="color: #e2e8f0; font-size: 16px;">Dear ${studentName},</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          We are delighted to welcome you to our school family! Your admission has been successfully completed.
        </p>
        <div style="background: #0f172a; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2563eb;">
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Admission Number:</strong> ${admissionNo}
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Class:</strong> ${className}
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          We look forward to a wonderful journey with you. If you have any questions or need assistance, please don't hesitate to reach out to our administration office.
        </p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          Best regards,<br/>
          <strong style="color: #e2e8f0;">${schoolName}</strong><br/>
          Administration Team
        </p>
      </div>
    </div>
  `;
}

export function parentWelcomeEmailHtml(studentName: string, admissionNo: string, className: string, schoolName: string, parentName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${schoolName}</h1>
        <p style="color: #93c5fd; margin: 8px 0 0;">Student Admission Confirmation</p>
      </div>
      <div style="background: #1e293b; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="color: #e2e8f0; font-size: 16px;">Dear ${parentName},</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          We are pleased to inform you that your child, <strong style="color: #e2e8f0;">${studentName}</strong>, has been successfully admitted to our school.
        </p>
        <div style="background: #0f172a; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2563eb;">
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Student Name:</strong> ${studentName}
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Admission Number:</strong> ${admissionNo}
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Class:</strong> ${className}
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          We are committed to providing quality education and holistic development for your child. We look forward to a strong partnership with you in this educational journey.
        </p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          Best regards,<br/>
          <strong style="color: #e2e8f0;">${schoolName}</strong><br/>
          Administration Team
        </p>
      </div>
    </div>
  `;
}

export function passwordResetEmailHtml(resetUrl: string, userName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">School ERP</h1>
        <p style="color: #93c5fd; margin: 8px 0 0;">Password Reset Request</p>
      </div>
      <div style="background: #1e293b; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="color: #e2e8f0; font-size: 16px;">Hi ${userName},</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          We received a request to reset the password for your School ERP account.
          Click the button below to set a new password. This link expires in <strong style="color: #f59e0b;">1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Reset My Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          Or copy this link: <a href="${resetUrl}" style="color: #93c5fd;">${resetUrl}</a>
        </p>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
      </div>
    </div>
  `;
}
