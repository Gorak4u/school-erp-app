import nodemailer from 'nodemailer';
import { saasPrisma, schoolPrisma } from './prisma';

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
export async function getSchoolSmtpConfig() {
  const settings = await (schoolPrisma as any).SchoolSetting.findMany({
    where: { group: 'smtp' },
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
  const smtp = await getSaasSmtpConfig();

  // Fallback: use environment variables if no DB SMTP config
  const host = smtp.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(smtp.smtp_port || process.env.SMTP_PORT || '587');
  const user = smtp.smtp_username || process.env.SMTP_USER;
  const pass = smtp.smtp_password || process.env.SMTP_PASS;
  const from = smtp.smtp_from_email || process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    // No SMTP configured — log the email for development
    console.log('\n📧 [EMAIL - No SMTP configured]');
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
      from: `"${smtp.smtp_from_name || 'School ERP'}" <${from}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// School-level email sender (uses school's own SMTP)
// Used for: fee receipts, school notifications, admissions, reminders
export async function sendSchoolEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const smtp = await getSchoolSmtpConfig();

  // Fallback: use environment variables if no school SMTP config
  const host = smtp.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(smtp.smtp_port || process.env.SMTP_PORT || '587');
  const user = smtp.smtp_username || process.env.SMTP_USER;
  const pass = smtp.smtp_password || process.env.SMTP_PASS;
  const from = smtp.smtp_from_email || process.env.SMTP_FROM || user;

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
      from: `"${smtp.smtp_from_name || 'School'}" <${from}>`,
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
