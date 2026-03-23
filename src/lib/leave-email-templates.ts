import { isEmailNotificationEnabled, sendEmail } from './email';
import { logger } from './logger';

export async function sendLeaveStatusEmail(
  to: string,
  staffName: string,
  status: 'approved' | 'rejected',
  leaveType: string,
  schoolId: string,
  schoolName: string
) {
  try {
    const isEnabled = await isEmailNotificationEnabled(schoolId);
    if (!isEnabled) {
      logger.info(`Leave email notifications disabled for school ${schoolId}`);
      return { success: false, error: 'Notifications disabled' };
    }

    const statusText = status === 'approved' ? 'Approved' : 'Rejected';
    const statusColor = status === 'approved' ? '#16a34a' : '#dc2626';
    const subject = `Leave Application ${statusText} - ${schoolName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #111827;">Leave Application ${statusText}</h2>
        <p style="margin: 0 0 12px; color: #374151;">Hello ${staffName},</p>
        <p style="margin: 0 0 16px; color: #374151;">
          Your application for <strong>${leaveType}</strong> has been
          <strong style="color: ${statusColor};">${statusText.toLowerCase()}</strong>.
        </p>
        <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 10px; border-left: 4px solid ${statusColor};">
          <p style="margin: 0 0 8px; color: #111827;"><strong>School:</strong> ${schoolName}</p>
          <p style="margin: 0; color: #111827;"><strong>Status:</strong> <span style="color: ${statusColor};">${statusText}</span></p>
        </div>
        <p style="margin: 16px 0 0; color: #6b7280;">Please contact the school administration if you need more details.</p>
      </div>
    `;

    return await sendEmail({ to, subject, html });
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to send leave status email', { error: errorMessage, to, staffName, status, schoolId });
    return { success: false, error: errorMessage || 'Failed to send leave status email' };
  }
}
