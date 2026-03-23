import { DiscountRequest } from '@prisma/client';

// Helper function to get user display name
function getUserDisplayName(user: Record<string, unknown>): string {
  if ((user as Record<string, unknown>).firstName && (user as Record<string, unknown>).lastName) {
    return `${(user as Record<string, unknown>).firstName} ${(user as Record<string, unknown>).lastName}`;
  }
  return (user as Record<string, unknown>).name as string || (user as Record<string, unknown>).email as string || 'Unknown User';
}

export interface DiscountPendingEmailData {
  discountRequest: DiscountRequest;
  submitter: Record<string, unknown>; // User type from database
  approver: Record<string, unknown>; // User type from database
  schoolName: string;
}

export interface DiscountApprovedEmailData {
  discountRequest: DiscountRequest;
  submitter: Record<string, unknown>; // User type from database
  approver: Record<string, unknown>; // User type from database
  schoolName: string;
}

export function generateDiscountPendingEmail(data: DiscountPendingEmailData) {
  const { discountRequest, submitter, approver, schoolName } = data;
  
  const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/fees/discount-requests/${discountRequest.id}`;
  
  const subject = `Discount Request Pending Approval - ${discountRequest.name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Discount Request Pending Approval</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: #93c5fd; margin: 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb; }
        .card h3 { color: #1e3a5f; margin: 0 0 10px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #64748b; font-size: 14px; }
        .info-value { color: #1e293b; font-size: 14px; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 15px 0; }
        .btn:hover { background: #1d4ed8; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .highlight h4 { color: #92400e; margin: 0 0 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎫 Discount Request Approval</h1>
        <p>${schoolName}</p>
      </div>
      
      <div class="content">
        <div class="card">
          <h3>📋 New Discount Request Submitted</h3>
          <p>A new discount request has been submitted and requires your approval.</p>
        </div>

        <div class="card">
          <h3>📝 Request Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Request Name:</div>
              <div class="info-value">${discountRequest.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Submitted By:</div>
              <div class="info-value">${getUserDisplayName(submitter)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Discount Type:</div>
              <div class="info-value">${discountRequest.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Discount Value:</div>
              <div class="info-value">${discountRequest.discountType === 'percentage' ? `${discountRequest.discountValue}%` : `₹${discountRequest.discountValue}`}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Academic Year:</div>
              <div class="info-value">${discountRequest.academicYear}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Scope:</div>
              <div class="info-value">${discountRequest.scope} - ${discountRequest.targetType}</div>
            </div>
          </div>
          
          ${discountRequest.reason ? `
          <div style="margin-top: 20px;">
            <div class="info-label">Reason:</div>
            <div class="info-value" style="margin-top: 5px;">${discountRequest.reason}</div>
          </div>
          ` : ''}
        </div>

        <div class="highlight">
          <h4>⚠️ Action Required</h4>
          <p>This discount request is <strong>pending your approval</strong>. Please review the details and take appropriate action.</p>
        </div>

        <div style="text-align: center;">
          <a href="${approvalUrl}" class="btn">Review & Approve/Reject</a>
          <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
            Or copy this link: <a href="${approvalUrl}" style="color: #2563eb;">${approvalUrl}</a>
          </p>
        </div>

        <div class="footer">
          <p>This is an automated notification from ${schoolName} School ERP System.</p>
          <p>If you have any questions, please contact the administration office.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

export function generateDiscountApprovedEmail(data: DiscountApprovedEmailData) {
  const { discountRequest, submitter, approver, schoolName } = data;
  
  const subject = `Discount Request Approved - ${discountRequest.name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Discount Request Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: #86efac; margin: 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981; }
        .card h3 { color: #059669; margin: 0 0 10px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #64748b; font-size: 14px; }
        .info-value { color: #1e293b; font-size: 14px; }
        .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #10b981; }
        .success-box h3 { color: #059669; margin: 0 0 10px 0; font-size: 20px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Discount Request Approved</h1>
        <p>${schoolName}</p>
      </div>
      
      <div class="content">
        <div class="success-box">
          <h3>🎉 Good News!</h3>
          <p>Your discount request has been <strong>approved</strong> and is now active.</p>
        </div>

        <div class="card">
          <h3>📋 Approved Request Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Request Name:</div>
              <div class="info-value">${discountRequest.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Approved By:</div>
              <div class="info-value">${getUserDisplayName(approver)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Discount Type:</div>
              <div class="info-value">${discountRequest.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Discount Value:</div>
              <div class="info-value">${discountRequest.discountType === 'percentage' ? `${discountRequest.discountValue}%` : `₹${discountRequest.discountValue}`}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Academic Year:</div>
              <div class="info-value">${discountRequest.academicYear}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Approved On:</div>
              <div class="info-value">${new Date(discountRequest.approvedAt!).toLocaleDateString()}</div>
            </div>
          </div>
          
          ${discountRequest.approvalNote ? `
          <div style="margin-top: 20px;">
            <div class="info-label">Approval Note:</div>
            <div class="info-value" style="margin-top: 5px;">${discountRequest.approvalNote}</div>
          </div>
          ` : ''}
        </div>

        <div class="card">
          <h3>📝 Next Steps</h3>
          <p>The discount has been applied to the relevant fee records. You can view the updated fee details in your dashboard.</p>
          <ul style="margin: 15px 0; padding-left: 20px;">
            <li>Check the <strong>Fee Records</strong> tab to see applied discounts</li>
            <li>Review <strong>Student Financial Profiles</strong> for updated balances</li>
            <li>Monitor <strong>Fee Collection</strong> for discounted amounts</li>
          </ul>
        </div>

        <div class="footer">
          <p>This is an automated notification from ${schoolName} School ERP System.</p>
          <p>If you have any questions about this approval, please contact the administration office.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}
