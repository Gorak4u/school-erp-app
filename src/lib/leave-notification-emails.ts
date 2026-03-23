import { sendSchoolEmail } from './email';

export async function sendLeaveApplicationSubmittedEmail(params: {
  to: string;
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: string;
  schoolName: string;
  applicationId: string;
  schoolId: string;
}) {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  const protocol = process.env.NEXT_PUBLIC_APP_PROTOCOL || 'http';
  const url = `${protocol}://${domain}/leave`;
  
  const subject = `Leave application ${params.status} - ${params.leaveType} leave`;
  const statusText = params.status === 'pending' ? 'submitted for approval' : params.status;
  const statusColor = params.status === 'pending' ? '#f59e0b' : params.status === 'approved' ? '#10b981' : '#ef4444';
  
  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #d1d5db; background: #f9fafb;">
      <h2 style="margin-bottom: 12px; color: #0f172a;">Leave Application ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2>
      
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Leave Type:</strong> ${params.leaveType}</p>
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Duration:</strong> ${new Date(params.startDate).toLocaleDateString()} - ${new Date(params.endDate).toLocaleDateString()}</p>
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Total Days:</strong> ${params.totalDays}</p>
        ${params.reason ? `<p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Reason:</strong> ${params.reason}</p>` : ''}
        <p style="margin: 0; color: #1f2937;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${params.status.charAt(0).toUpperCase() + params.status.slice(1)}</span></p>
      </div>
      
      <p style="color: #1f2937;">Your leave application has been ${statusText} at ${params.schoolName}.</p>
      
      ${params.status === 'pending' ? `
        <p style="color: #475569;">You will be notified once your request is reviewed and approved.</p>
      ` : ''}
      
      <div style="margin: 24px 0;">
        <a href="${url}" style="display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 999px; background: #0ea5e9; color: white; text-decoration: none; font-weight: 600;">View Leave Status</a>
      </div>
      
      <p style="color: #475569; font-size: 14px;">You can track your leave applications anytime from the leave management section.</p>
    </div>
  `;

  return await sendSchoolEmail({
    to: params.to,
    subject,
    html,
    schoolId: params.schoolId
  });
}

export async function sendLeaveStatusUpdateEmail(params: {
  to: string;
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: 'approved' | 'rejected';
  approverName: string;
  comments?: string;
  schoolName: string;
  applicationId: string;
  schoolId: string;
}) {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  const protocol = process.env.NEXT_PUBLIC_APP_PROTOCOL || 'http';
  const url = `${protocol}://${domain}/leave`;
  
  const subject = `Leave application ${params.status} - ${params.leaveType} leave`;
  const statusColor = params.status === 'approved' ? '#10b981' : '#ef4444';
  const statusIcon = params.status === 'approved' ? '✅' : '❌';
  
  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #d1d5db; background: #f9fafb;">
      <h2 style="margin-bottom: 12px; color: #0f172a;">${statusIcon} Leave Application ${params.status.charAt(0).toUpperCase() + params.status.slice(1)}</h2>
      
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Leave Type:</strong> ${params.leaveType}</p>
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Duration:</strong> ${new Date(params.startDate).toLocaleDateString()} - ${new Date(params.endDate).toLocaleDateString()}</p>
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Total Days:</strong> ${params.totalDays}</p>
        ${params.reason ? `<p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Reason:</strong> ${params.reason}</p>` : ''}
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Reviewed by:</strong> ${params.approverName}</p>
        ${params.comments ? `<p style="margin: 0; color: #1f2937;"><strong>Comments:</strong> ${params.comments}</p>` : ''}
        <p style="margin: 8px 0 0 0; color: #1f2937;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${params.status.charAt(0).toUpperCase() + params.status.slice(1)}</span></p>
      </div>
      
      <p style="color: #1f2937;">
        ${params.status === 'approved' 
          ? `Your leave application has been approved by ${params.approverName} at ${params.schoolName}. Enjoy your leave!`
          : `Your leave application has been rejected by ${params.approverName} at ${params.schoolName}. Please contact them if you have any questions.`
        }
      </p>
      
      <div style="margin: 24px 0;">
        <a href="${url}" style="display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 999px; background: #0ea5e9; color: white; text-decoration: none; font-weight: 600;">View Leave Details</a>
      </div>
      
      <p style="color: #475569; font-size: 14px;">This is an automated notification from ${params.schoolName} leave management system.</p>
    </div>
  `;

  return await sendSchoolEmail({
    to: params.to,
    subject,
    html,
    schoolId: params.schoolId
  });
}

export async function sendLeaveCancelledEmail(params: {
  to: string;
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  schoolName: string;
  applicationId: string;
  schoolId: string;
}) {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  const protocol = process.env.NEXT_PUBLIC_APP_PROTOCOL || 'http';
  const url = `${protocol}://${domain}/leave`;
  
  const subject = `Leave application cancelled - ${params.leaveType} leave`;
  
  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #d1d5db; background: #f9fafb;">
      <h2 style="margin-bottom: 12px; color: #0f172a;">🚫 Leave Application Cancelled</h2>
      
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Leave Type:</strong> ${params.leaveType}</p>
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Duration:</strong> ${new Date(params.startDate).toLocaleDateString()} - ${new Date(params.endDate).toLocaleDateString()}</p>
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Total Days:</strong> ${params.totalDays}</p>
        ${params.reason ? `<p style="margin: 0; color: #1f2937;"><strong>Reason:</strong> ${params.reason}</p>` : ''}
        <p style="margin: 8px 0 0 0; color: #1f2937;"><strong>Status:</strong> <span style="color: #6b7280; font-weight: 600;">Cancelled</span></p>
      </div>
      
      <p style="color: #1f2937;">Your leave application has been cancelled at ${params.schoolName}.</p>
      
      <div style="margin: 24px 0;">
        <a href="${url}" style="display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 999px; background: #0ea5e9; color: white; text-decoration: none; font-weight: 600;">View Leave History</a>
      </div>
      
      <p style="color: #475569; font-size: 14px;">This is an automated notification from ${params.schoolName} leave management system.</p>
    </div>
  `;

  return await sendSchoolEmail({
    to: params.to,
    subject,
    html,
    schoolId: params.schoolId
  });
}
