import nodemailer from 'nodemailer';
import { saasPrisma, schoolPrisma } from './prisma';

// Check if email notifications are enabled for a school
export async function isEmailNotificationEnabled(schoolId?: string): Promise<boolean> {
  try {
    let whereClause: any = { group: 'app_config', key: 'email_notifications' };
    
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
      console.log('📧 Email notifications setting not found, defaulting to enabled');
      return true;
    }
    
    const isEnabled = setting.value === 'true';
    console.log(`📧 Email notifications ${isEnabled ? 'ENABLED' : 'DISABLED'} for school ${schoolId || 'default'}`);
    return isEnabled;
  } catch (error) {
    console.error('Error checking email notification setting:', error);
    // Default to enabled on error to avoid breaking existing functionality
    return true;
  }
}

// Reads SaaS-level SMTP from SaasSetting (group: saas_smtp)
// This is SEPARATE from school-level SMTP in SchoolSetting (group: smtp)
export async function getSaasSmtpConfig() {
  const settings = await (saasPrisma as any).SaasSetting.findMany({
    where: { group: 'saas_smtp' },
  });
  const config: Record<string, string> = {};
  for (const s of settings) config[s.key] = s.value;
  return config;
}

// Reads school-level SMTP from SchoolSetting (group: smtp)
// Used for: fee receipts, school notifications, admissions, reminders
export async function getSchoolSmtpConfig(schoolId?: string) {
  let whereClause: any = { group: 'smtp' };
  
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
  // Only use SaaS SMTP settings from database - no fallbacks
  const smtp = await getSaasSmtpConfig();

  const host = smtp.smtp_host;
  const port = parseInt(smtp.smtp_port || '587');
  const user = smtp.smtp_username;
  const pass = smtp.smtp_password;
  const from = smtp.smtp_from_email || user;

  // Check if SaaS SMTP is properly configured
  if (!host || !user || !pass) {
    console.log('\n📧 [EMAIL - SaaS SMTP not configured]');
    console.log('Missing settings in SaasSetting table (group: saas_smtp):');
    console.log('- smtp_host:', host ? '✓' : '✗ Missing');
    console.log('- smtp_username:', user ? '✓' : '✗ Missing');
    console.log('- smtp_password:', pass ? '✓' : '✗ Missing');
    console.log('--- END ---\n');
    return { success: false, error: 'SaaS SMTP not configured' };
  }

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
    console.log('✅ Email sent via SaaS SMTP');
    return { success: true };
  } catch (error: any) {
    console.error('SaaS SMTP send error:', error);
    return { success: false, error: error.message };
  }
}

// School-level email sender (uses school's own SMTP)
// Used for: fee receipts, school notifications, admissions, reminders
export async function sendSchoolEmail({
  to,
  subject,
  html,
  schoolId,
}: {
  to: string;
  subject: string;
  html: string;
  schoolId?: string;
}) {
  console.log('sendSchoolEmail called with:', { to, subject, schoolId });
  
  // Check if email notifications are enabled for this school
  const emailNotificationsEnabled = await isEmailNotificationEnabled(schoolId);
  if (!emailNotificationsEnabled) {
    console.log(`📧 Email notifications are DISABLED for school ${schoolId || 'default'}. Skipping email send.`);
    console.log(`📧 Email details (not sent): To: ${to}, Subject: ${subject}`);
    return { success: true, skipped: true, reason: 'Email notifications disabled' };
  }
  
  const smtp = await getSchoolSmtpConfig(schoolId);
  console.log('SMTP config retrieved:', { 
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
    console.log('📧 Gmail: Attempting to send from custom address:', from, 'authenticated as:', user);
    finalFrom = from;
  } else {
    finalFrom = from;
  }

  console.log('Final SMTP settings:', { 
    host: host ? 'SET' : 'NOT SET', 
    port, 
    user: user ? 'SET' : 'NOT SET',
    pass: pass ? 'SET' : 'NOT SET',
    from,
    finalFrom
  });

  if (!host || !user || !pass) {
    // No SMTP configured — log the email for development
    console.log('\n📧 [SCHOOL EMAIL - No SMTP configured]');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('--- HTML ---');
    console.log(html);
    console.log('--- END ---\n');
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
      html,
    });
    return { success: true };
  } catch (error: any) {
    console.error('School email send error:', error);
    return { success: false, error: error.message };
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
