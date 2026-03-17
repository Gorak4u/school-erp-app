import { isEmailNotificationEnabled, sendEmail } from './email';

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
      console.log(`[Leave Email] Notification disabled for school ${schoolId}`);
      return { success: false, error: 'Notifications disabled' };
    }

    const subject = `Leave Application ${status === 'approved' ? 'Approved' : 'Rejected'} - ${schoolName}`;
    const statusColor = status === 'approved' ? '#16a34a' : '#dc2626'; // green or red
    const statusText = status === 'approved' ? 'Approved' : 'Rejected';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; borderimport { isEmailNotificationEnabled, sendEmail } from './email';

export async function sendLeaveStatusEmail(
to
export async function sendLeaveStatusEmail(
  to: string,
  stdin  to: string,
  staffName: string,
  statu},  staffName:    stYour application for <strong>${leaveType}</strong> h  schoolId: string,=" olor: ${statusColor) {
  try {
    cond;  ${    coTe    if (!isEnabled) {
      console.log(`[Leave Email] Notificatas      console.log(`[</      return { success: false, error: 'Notifications disabled' };
    }

    coer    }

    const subject = `Leave Application ${status === 'appran
   oma    const statusColor = status === 'approved' ? '#16a34a' : '#dc2626'; // green or red
    const statusTexub    const statusText = status === 'approved' ? 'Approved' : 'Rejected';

    const htil
    const html = `
      <div style="font-family: Arial, sans-serif;  };
  }
}
