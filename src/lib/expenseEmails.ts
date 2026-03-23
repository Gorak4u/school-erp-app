import { sendSchoolEmail, isEmailNotificationEnabled } from './email';
import { schoolPrisma } from './prisma';
import { logger } from './logger';

// Type definitions
type SchoolPrismaClient = typeof schoolPrisma;

interface User {
  email: string;
  schoolId: string;
  role: string;
  isActive: boolean;
}

interface SchoolSetting {
  value: string;
}

const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

async function getSchoolName(schoolId: string): Promise<string> {
  try {
    const setting = await (schoolPrisma as SchoolPrismaClient).schoolSetting.findFirst({
      where: { schoolId, group: 'school_details', key: 'school_name' },
    });
    return setting?.value || 'School ERP';
  } catch {
    return 'School ERP';
  }
}

async function getAdminEmails(schoolId: string): Promise<string[]> {
  try {
    const admins = await (schoolPrisma as any).user.findMany({
      where: { schoolId, role: 'admin', isActive: true },
      select: { email: true },
    });
    return admins.map((a: { email: string }) => a.email).filter(Boolean);
  } catch {
    return [];
  }
}

function baseTemplate(schoolName: string, content: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">${schoolName}</h1>
        <p style="color: #93c5fd; margin: 6px 0 0; font-size: 13px;">Expense Management</p>
      </div>
      <div style="background: #1e293b; padding: 28px 32px; border-radius: 0 0 12px 12px;">
        ${content}
        <p style="color: #475569; font-size: 12px; margin-top: 28px; padding-top: 16px; border-top: 1px solid #334155;">
          This is an automated notification from ${schoolName} — Expense Management System.
        </p>
      </div>
    </div>
  `;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  description?: string;
  category: string;
  requestedByEmail: string;
  requestedByName?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  approvalNote?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  dateIncurred?: string;
  vendorName?: string;
  approvedByName?: string;
}

function expenseCard(expense: Expense) {
  return `
    <div style="background: #0f172a; padding: 18px 20px; border-radius: 10px; margin: 18px 0; border-left: 4px solid #3b82f6;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #94a3b8; font-size: 13px; padding: 4px 0; width: 40%;">Title</td>
          <td style="color: #e2e8f0; font-size: 13px; font-weight: bold;">${expense.title}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 13px; padding: 4px 0;">Amount</td>
          <td style="color: #60a5fa; font-size: 16px; font-weight: bold;">${fmt(expense.amount)}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 13px; padding: 4px 0;">Category</td>
          <td style="color: #e2e8f0; font-size: 13px;">${expense.category || '—'}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 13px; padding: 4px 0;">Date</td>
          <td style="color: #e2e8f0; font-size: 13px;">${expense.dateIncurred}</td>
        </tr>
        ${expense.vendorName ? `<tr><td style="color: #94a3b8; font-size: 13px; padding: 4px 0;">Vendor</td><td style="color: #e2e8f0; font-size: 13px;">${expense.vendorName}</td></tr>` : ''}
        <tr>
          <td style="color: #94a3b8; font-size: 13px; padding: 4px 0;">Receipt No</td>
          <td style="color: #94a3b8; font-size: 12px; font-mono;">${expense.receiptNumber || '—'}</td>
        </tr>
      </table>
    </div>
  `;
}

// ── Email: New expense submitted → notify all admins ──────────────────────────
export async function sendExpenseCreatedEmail(expense: Expense, schoolId: string) {
  try {
    if (!(await isEmailNotificationEnabled(schoolId))) return;
    const [schoolName, adminEmails] = await Promise.all([
      getSchoolName(schoolId),
      getAdminEmails(schoolId),
    ]);
    if (!adminEmails.length) return;

    const subject = `💸 New Expense Pending Approval — ${expense.title} (${fmt(expense.amount)})`;
    const html = baseTemplate(schoolName, `
      <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 4px;">New expense submitted for approval</p>
      <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px;">
        Submitted by: <strong style="color: #93c5fd;">${expense.requestedByEmail || expense.requestedByName || 'Unknown'}</strong>
      </p>
      ${expenseCard(expense)}
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Please log in to the Expense Management portal to review and take action on this expense request.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/expenses"
          style="background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
          Review Expense →
        </a>
      </div>
    `);

    for (const email of adminEmails) {
      await sendSchoolEmail({ to: email, subject, html, schoolId });
    }
  } catch (err) {
    logger.error('sendExpenseCreatedEmail error', { error: err, schoolId });
  }
}

// ── Email: Expense approved → notify creator ──────────────────────────────────
export async function sendExpenseApprovedEmail(expense: Expense, schoolId: string) {
  try {
    if (!expense.requestedByEmail) return;
    if (!(await isEmailNotificationEnabled(schoolId))) return;
    const schoolName = await getSchoolName(schoolId);

    const subject = `✅ Your Expense Has Been Approved — ${expense.title}`;
    const html = baseTemplate(schoolName, `
      <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 4px;">Great news! Your expense request has been <strong style="color: #34d399;">approved</strong>.</p>
      ${expenseCard(expense)}
      ${expense.approvalNote ? `
        <div style="background: #064e3b22; border: 1px solid #34d39944; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
          <p style="color: #34d399; font-size: 12px; font-weight: bold; margin: 0 0 4px;">APPROVER NOTE</p>
          <p style="color: #d1fae5; font-size: 13px; margin: 0;">${expense.approvalNote}</p>
        </div>` : ''}
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Approved by: <strong style="color: #93c5fd;">${expense.approvedByName || 'Admin'}</strong><br/>
        The payment will be processed shortly.
      </p>
    `);

    await sendSchoolEmail({ to: expense.requestedByEmail, subject, html, schoolId });
  } catch (err) {
    logger.error('sendExpenseApprovedEmail error', { error: err, schoolId, expenseId: expense.id });
  }
}

// ── Email: Expense rejected → notify creator ──────────────────────────────────
export async function sendExpenseRejectedEmail(expense: Expense, rejectionReason: string, schoolId: string) {
  try {
    if (!expense.requestedByEmail) return;
    if (!(await isEmailNotificationEnabled(schoolId))) return;
    const schoolName = await getSchoolName(schoolId);

    const subject = `❌ Your Expense Request Was Not Approved — ${expense.title}`;
    const html = baseTemplate(schoolName, `
      <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 4px;">Unfortunately, your expense request has been <strong style="color: #f87171;">rejected</strong>.</p>
      ${expenseCard(expense)}
      <div style="background: #7f1d1d22; border: 1px solid #f8717144; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
        <p style="color: #f87171; font-size: 12px; font-weight: bold; margin: 0 0 4px;">REASON FOR REJECTION</p>
        <p style="color: #fecaca; font-size: 13px; margin: 0;">${rejectionReason}</p>
      </div>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        If you believe this decision is incorrect, please contact your school administrator for further clarification.
        You may submit a revised expense request if applicable.
      </p>
    `);

    await sendSchoolEmail({ to: expense.requestedByEmail, subject, html, schoolId });
  } catch (err) {
    logger.error('sendExpenseRejectedEmail error', { error: err, schoolId, expenseId: expense.id });
  }
}

// ── Email: Expense paid → notify creator ─────────────────────────────────────
export async function sendExpensePaidEmail(expense: Expense, paymentMethod: string | undefined, schoolId: string) {
  try {
    if (!expense.requestedByEmail) return;
    if (!(await isEmailNotificationEnabled(schoolId))) return;
    const schoolName = await getSchoolName(schoolId);

    const subject = `🏦 Expense Payment Completed — ${expense.title} (${fmt(expense.amount)})`;
    const html = baseTemplate(schoolName, `
      <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 4px;">Your approved expense has been <strong style="color: #60a5fa;">paid</strong>.</p>
      ${expenseCard(expense)}
      ${paymentMethod ? `
        <div style="background: #1e3a5f33; border: 1px solid #3b82f644; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
          <p style="color: #60a5fa; font-size: 12px; font-weight: bold; margin: 0 0 4px;">PAYMENT METHOD</p>
          <p style="color: #bfdbfe; font-size: 13px; margin: 0; text-transform: capitalize;">${paymentMethod.replace('_', ' ')}</p>
        </div>` : ''}
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Payment processed on: <strong style="color: #e2e8f0;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong><br/>
        Please keep your receipt number <strong style="color: #93c5fd;">${expense.receiptNumber}</strong> for your records.
      </p>
    `);

    await sendSchoolEmail({ to: expense.requestedByEmail, subject, html, schoolId });
  } catch (err) {
    logger.error('sendExpensePaidEmail error', { error: err, schoolId, expenseId: expense.id });
  }
}
