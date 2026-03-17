import { sendSchoolEmail } from './email';

export async function sendLeaveApprovalRequestEmail(params: {
  to: string;
  staffName: string;
  leaveType: string;
  schoolName: string;
  applicationId: string;
  schoolId: string;
}) {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  const protocol = process.env.NEXT_PUBLIC_APP_PROTOCOL || 'http';
  const url = `${protocol}://${domain}/leave?tab=approvals&applicationId=${params.applicationId}`;
  const subject = `Leave request awaiting approval - ${params.staffName}`;
  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #d1d5db; background: #f9fafb;">
      <h2 style="margin-bottom: 12px; color: #0f172a;">Leave approval pending</h2>
      <p style="color: #1f2937;">${params.staffName} has applied for <strong>${params.leaveType}</strong> leave at ${params.schoolName}. Please review and action the request.</p>
      <div style="margin: 24px 0;">
        <a href="${url}" style="display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 999px; background: #0ea5e9; color: white; text-decoration: none; font-weight: 600;">Open Approval</a>
      </div>
      <p style="color: #475569; font-size: 14px;">You can also visit the leave approvals section anytime from the dashboard.</p>
    </div>
  `;

  return await sendSchoolEmail({
    to: params.to,
    subject,
    html,
    schoolId: params.schoolId
  });
}
