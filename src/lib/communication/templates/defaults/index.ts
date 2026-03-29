/**
 * Default Templates - Hardcoded fallback templates
 * 
 * These templates serve as the ultimate fallback when:
 * 1. No school-specific template exists
 * 2. No global template in database
 * 
 * @module DefaultTemplates
 */

export interface DefaultTemplate {
  key: string;
  category: 'email' | 'sms' | 'push';
  type: string;
  name: string;
  description?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  smsBody?: string;
  variablesSchema?: string;
  primaryColor?: string;
  accentColor?: string;
  version?: number;
  isDefault: boolean;
}

/**
 * Student Welcome Email
 */
const studentWelcomeEmail: DefaultTemplate = {
  key: 'student_welcome_email',
  category: 'email',
  type: 'welcome',
  name: 'Student Welcome',
  description: 'Welcome email sent to parents when student is admitted',
  subject: 'Welcome to {{schoolName}} - Admission Confirmed',
  htmlBody: `
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We are delighted to welcome <strong style="color: #1e293b;">{{studentName}}</strong> to our school family! 
      The admission has been successfully completed for academic year {{academicYear}}.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px;"><strong>Admission Number:</strong> {{admissionNo}}</p>
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px;"><strong>Student Name:</strong> {{studentName}}</p>
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px;"><strong>Section:</strong> {{section}}</p>
      <p style="margin: 0; color: #374151; font-size: 13px;"><strong>Date of Admission:</strong> {{formatDate admissionDate "medium"}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We look forward to a wonderful journey together. Please visit the school office 
      to complete any pending documentation and collect the student kit.
    </p>
    
    {{#if orientationDate}}
    <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1e40af; font-size: 14px;">📅 Orientation Session</p>
      <p style="margin: 0; color: #374151; font-size: 13px;">
        Date: {{formatDate orientationDate "long"}}<br>
        Time: {{orientationTime}}<br>
        Venue: {{orientationVenue}}
      </p>
    </div>
    {{/if}}
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
      For any queries, please contact the school administration office.
    </p>
  `,
  textBody: `
Dear Parent,

Welcome to {{schoolName}}! {{studentName}} has been successfully admitted.

Admission Details:
- Admission Number: {{admissionNo}}
- Student Name: {{studentName}}
- Class: {{className}}
- Section: {{section}}
- Date of Admission: {{admissionDate}}

{{#if orientationDate}}
Orientation Session:
Date: {{orientationDate}}
Time: {{orientationTime}}
Venue: {{orientationVenue}}
{{/if}}

For any queries, please contact the school office.

Best regards,
{{schoolName}} Administration
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true, description: 'Full name of the student' },
      { name: 'admissionNo', type: 'string', required: true, description: 'Unique admission number' },
      { name: 'className', type: 'string', required: true, description: 'Class assigned' },
      { name: 'section', type: 'string', required: true, description: 'Section assigned' },
      { name: 'academicYear', type: 'string', required: true, description: 'Academic year' },
      { name: 'admissionDate', type: 'date', required: true, description: 'Date of admission' },
      { name: 'orientationDate', type: 'date', required: false, description: 'Orientation date' },
      { name: 'orientationTime', type: 'string', required: false, description: 'Orientation time' },
      { name: 'orientationVenue', type: 'string', required: false, description: 'Orientation venue' }
    ]
  }),
  primaryColor: '#2563eb',
  accentColor: '#1e40af',
  isDefault: true
};

/**
 * Fee Payment Reminder
 */
const feeReminderEmail: DefaultTemplate = {
  key: 'fee_reminder_email',
  category: 'email',
  type: 'reminder',
  name: 'Fee Payment Reminder',
  description: 'Reminder for pending fee payment',
  subject: 'Fee Payment Reminder - {{studentName}} ({{admissionNo}})',
  htmlBody: `
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      This is a friendly reminder regarding the pending fee payment for your ward.
    </p>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Student Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Name:</td>
          <td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Admission No:</td>
          <td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Class:</td>
          <td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: {{#if isOverdue}}#fef2f2{{else}}#fffbeb{{/if}}; border: 1px solid {{#if isOverdue}}#ef4444{{else}}#f59e0b{{/if}}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: {{#if isOverdue}}#991b1b{{else}}#92400e{{/if}}; font-size: 14px;">
        {{#if isOverdue}}⚠️ Payment Overdue{{else}}⏰ Payment Due Soon{{/if}}
      </p>
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Fee Type:</td>
          <td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{feeType}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Due Amount:</td>
          <td style="padding: 6px 0; color: {{#if isOverdue}}#dc2626{{else}}#d97706{{/if}}; text-align: right; font-weight: 700; font-size: 16px;">{{formatCurrency dueAmount}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Due Date:</td>
          <td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatDate dueDate "long"}}</td>
        </tr>
        {{#if daysOverdue}}
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Days Overdue:</td>
          <td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{daysOverdue}} {{pluralize daysOverdue "day" "days"}}</td>
        </tr>
        {{/if}}
        {{#if lateFeeAmount}}
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Late Fee:</td>
          <td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 500;">{{formatCurrency lateFeeAmount}}</td>
        </tr>
        {{/if}}
      </table>
    </div>
    
    {{#if paymentUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); text-align: center;">
          <a href="{{paymentUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Pay Now
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      You can also pay at the school office during working hours (9:00 AM - 4:00 PM).
      For any queries, please contact the accounts department.
    </p>
  `,
  textBody: `
Dear Parent,

Fee Payment Reminder for {{studentName}} ({{admissionNo}})

Fee Details:
- Fee Type: {{feeType}}
- Due Amount: {{dueAmount}}
- Due Date: {{dueDate}}
{{#if isOverdue}}- Days Overdue: {{daysOverdue}}{{/if}}
{{#if lateFeeAmount}}- Late Fee: {{lateFeeAmount}}{{/if}}

{{#if isOverdue}}⚠️ Payment is overdue. Please clear dues immediately to avoid additional charges.{{else}}⏰ Payment is due soon. Please ensure timely payment.{{/if}}

{{#if paymentUrl}}Pay online: {{paymentUrl}}{{/if}}

Contact the accounts department for any queries.

Best regards,
{{schoolName}} Accounts Department
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'feeType', type: 'string', required: true },
      { name: 'dueAmount', type: 'number', required: true },
      { name: 'dueDate', type: 'date', required: true },
      { name: 'isOverdue', type: 'boolean', required: false },
      { name: 'daysOverdue', type: 'number', required: false },
      { name: 'lateFeeAmount', type: 'number', required: false },
      { name: 'paymentUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#2563eb',
  accentColor: '#1e40af',
  isDefault: true
};

/**
 * Fee Payment Receipt
 */
const feeReceiptEmail: DefaultTemplate = {
  key: 'fee_receipt_email',
  category: 'email',
  type: 'receipt',
  name: 'Fee Payment Receipt',
  description: 'Receipt sent after successful fee payment',
  subject: 'Payment Receipt - {{studentName}} | {{receiptNo}}',
  htmlBody: `
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Thank you for your payment. Please find your receipt details below.
    </p>
    
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Payment Successful</p>
      <p style="margin: 0; color: #059669; font-size: 28px; font-weight: 700;">{{formatCurrency paidAmount}}</p>
      <p style="margin: 8px 0 0; color: #065f46; font-size: 13px;">Receipt No: {{receiptNo}}</p>
    </div>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Payment Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fee Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{feeType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Payment Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatDate paymentDate "long"}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Payment Method:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{paymentMethod}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Transaction ID:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{transactionId}}</td></tr>
      </table>
    </div>
    
    {{#if downloadUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); text-align: center;">
          <a href="{{downloadUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Download Receipt
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      This is a computer-generated receipt and does not require a signature.
      Please keep this receipt for your records.
    </p>
  `,
  textBody: `
Dear Parent,

Payment Receipt - {{receiptNo}}

Payment Successful: {{formatCurrency paidAmount}}

Student Details:
- Name: {{studentName}}
- Admission No: {{admissionNo}}
- Class: {{className}}
- Fee Type: {{feeType}}

Payment Details:
- Date: {{paymentDate}}
- Method: {{paymentMethod}}
- Transaction ID: {{transactionId}}

{{#if downloadUrl}}Download Receipt: {{downloadUrl}}{{/if}}

This is a computer-generated receipt.

Best regards,
{{schoolName}} Accounts Department
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'feeType', type: 'string', required: true },
      { name: 'paidAmount', type: 'number', required: true },
      { name: 'receiptNo', type: 'string', required: true },
      { name: 'paymentDate', type: 'date', required: true },
      { name: 'paymentMethod', type: 'string', required: true },
      { name: 'transactionId', type: 'string', required: true },
      { name: 'downloadUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#10b981',
  accentColor: '#059669',
  isDefault: true
};

/**
 * Leave Request Submitted
 */
const leaveSubmittedEmail: DefaultTemplate = {
  key: 'leave_submitted_email',
  category: 'email',
  type: 'notification',
  name: 'Leave Request Submitted',
  description: 'Notification sent when leave request is submitted',
  subject: 'Leave Request Submitted - {{staffName}}',
  htmlBody: `
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      A leave request has been submitted and is awaiting your review.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Leave Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Staff Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{staffName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Leave Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{leaveType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">From Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatDate fromDate "long"}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">To Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatDate toDate "long"}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Total Days:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{totalDays}} {{pluralize totalDays "day" "days"}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Reason:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{reason}}</td></tr>
      </table>
    </div>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Review Request
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      Please review and approve/reject the request at your earliest convenience.
    </p>
  `,
  textBody: `
Leave Request Submitted

Staff: {{staffName}}
Leave Type: {{leaveType}}
From: {{fromDate}}
To: {{toDate}}
Total Days: {{totalDays}}
Reason: {{reason}}

{{#if actionUrl}}Review: {{actionUrl}}{{/if}}

Please review this request.

Best regards,
{{schoolName}} HR Department
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'staffName', type: 'string', required: true },
      { name: 'leaveType', type: 'string', required: true },
      { name: 'fromDate', type: 'date', required: true },
      { name: 'toDate', type: 'date', required: true },
      { name: 'totalDays', type: 'number', required: true },
      { name: 'reason', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#3b82f6',
  accentColor: '#2563eb',
  isDefault: true
};

/**
 * Leave Approved/Rejected
 */
const leaveStatusEmail: DefaultTemplate = {
  key: 'leave_status_email',
  category: 'email',
  type: 'notification',
  name: 'Leave Status Update',
  description: 'Notification sent when leave is approved or rejected',
  subject: 'Leave Request {{#if isApproved}}Approved{{else}}Rejected{{/if}} - {{leaveType}}',
  htmlBody: `
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Your leave request has been {{#if isApproved}}<strong style="color: #059669;">approved</strong>{{else}}<strong style="color: #dc2626;">rejected</strong>{{/if}}.
    </p>
    
    <div style="background: {{#if isApproved}}#ecfdf5{{else}}#fef2f2{{/if}}; border: 1px solid {{#if isApproved}}#10b981{{else}}#ef4444{{/if}}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: {{#if isApproved}}#065f46{{else}}#991b1b{{/if}}; font-size: 14px;">
        {{#if isApproved}}✅ Leave Approved{{else}}❌ Leave Rejected{{/if}}
      </p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Leave Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{leaveType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">From Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatDate fromDate "long"}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">To Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatDate toDate "long"}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Total Days:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{totalDays}} {{pluralize totalDays "day" "days"}}</td></tr>
      </table>
      
      {{#if approverName}}
      <p style="margin: 12px 0 0; color: #64748b; font-size: 12px;">
        {{#if isApproved}}Approved{{else}}Rejected{{/if}} by: {{approverName}}
        {{#if approvedAt}} on {{formatDate approvedAt "medium"}}{{/if}}
      </p>
      {{/if}}
      
      {{#if rejectionReason}}
      <div style="background: #fee2e2; border-left: 3px solid #ef4444; border-radius: 4px; padding: 12px; margin: 16px 0 0;">
        <p style="margin: 0; color: #991b1b; font-size: 12px; font-weight: 600;">Reason for Rejection:</p>
        <p style="margin: 4px 0 0; color: #7f1d1d; font-size: 12px;">{{rejectionReason}}</p>
      </div>
      {{/if}}
      
      {{#if comments}}
      <div style="background: #f3f4f6; border-radius: 4px; padding: 12px; margin: 16px 0 0;">
        <p style="margin: 0; color: #374151; font-size: 12px; font-weight: 600;">Comments:</p>
        <p style="margin: 4px 0 0; color: #4b5563; font-size: 12px;">{{comments}}</p>
      </div>
      {{/if}}
    </div>
  `,
  textBody: `
Leave Request Update

Your {{leaveType}} leave request has been {{#if isApproved}}APPROVED{{else}}REJECTED{{/if}}.

Details:
- From: {{fromDate}}
- To: {{toDate}}
- Days: {{totalDays}}

{{#if approverName}}{{#if isApproved}}Approved{{else}}Rejected{{/if}} by: {{approverName}}{{/if}}
{{#if rejectionReason}}Reason: {{rejectionReason}}{{/if}}
{{#if comments}}Comments: {{comments}}{{/if}}

Best regards,
{{schoolName}} HR Department
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'isApproved', type: 'boolean', required: true },
      { name: 'leaveType', type: 'string', required: true },
      { name: 'fromDate', type: 'date', required: true },
      { name: 'toDate', type: 'date', required: true },
      { name: 'totalDays', type: 'number', required: true },
      { name: 'approverName', type: 'string', required: false },
      { name: 'approvedAt', type: 'date', required: false },
      { name: 'rejectionReason', type: 'string', required: false },
      { name: 'comments', type: 'string', required: false }
    ]
  }),
  primaryColor: '#10b981',
  accentColor: '#059669',
  isDefault: true
};

/**
 * Password Reset Email
 */
const passwordResetEmail: DefaultTemplate = {
  key: 'password_reset_email',
  category: 'email',
  type: 'system',
  name: 'Password Reset',
  description: 'Password reset email with secure link',
  subject: 'Password Reset Request - {{schoolName}}',
  htmlBody: `
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Hi {{userName}},
    </p>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      We received a request to reset the password for your account. Click the button below to set a new password.
    </p>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        ⏰ This link expires in <strong>1 hour</strong>
      </p>
    </div>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); text-align: center; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
          <a href="{{resetUrl}}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
            Reset My Password
          </a>
        </td>
      </tr>
    </table>
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0; text-align: center;">
      Or copy and paste this link:<br>
      <a href="{{resetUrl}}" style="color: #3b82f6; word-break: break-all;">{{resetUrl}}</a>
    </p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
      </p>
    </div>
  `,
  textBody: `
Hi {{userName}},

Password Reset Request

We received a request to reset your password. Click the link below to reset:

{{resetUrl}}

This link expires in 1 hour.

If you didn't request this, you can ignore this email.

Best regards,
{{schoolName}} Team
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'userName', type: 'string', required: true },
      { name: 'resetUrl', type: 'string', required: true }
    ]
  }),
  primaryColor: '#2563eb',
  accentColor: '#1e40af',
  isDefault: true
};

/**
 * Announcement Email
 */
const announcementEmail: DefaultTemplate = {
  key: 'announcement_email',
  category: 'email',
  type: 'announcement',
  name: 'General Announcement',
  description: 'General school announcement to parents/staff',
  subject: '{{announcementTitle}}',
  htmlBody: `
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
      <p style="margin: 0; color: #1e40af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">📢 Announcement</p>
    </div>
    
    <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px; font-weight: 700;">{{announcementTitle}}</h2>
    
    <div style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
      {{announcementContent}}
    </div>
    
    {{#if category}}
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 12px;">
      Category: <span style="text-transform: uppercase; font-weight: 600;">{{category}}</span>
      {{#if targetAudience}} | For: {{targetAudience}}{{/if}}
    </p>
    {{/if}}
  `,
  textBody: `
📢 {{announcementTitle}}

{{announcementContent}}

{{#if category}}Category: {{category}}{{/if}}
{{#if targetAudience}}For: {{targetAudience}}{{/if}}

{{schoolName}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'announcementTitle', type: 'string', required: true },
      { name: 'announcementContent', type: 'string', required: true },
      { name: 'category', type: 'string', required: false },
      { name: 'targetAudience', type: 'string', required: false }
    ]
  }),
  primaryColor: '#3b82f6',
  accentColor: '#2563eb',
  isDefault: true
};

/**
 * Fee Discount Approved
 */
const discountApprovedEmail: DefaultTemplate = {
  key: 'discount_approved_email',
  category: 'email',
  type: 'approval',
  name: 'Fee Discount Approved',
  description: 'Notification when fee discount request is approved',
  subject: 'Fee Discount Approved - {{studentName}}',
  htmlBody: `
    <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">✅ Discount Approved</p>
      <p style="margin: 0; color: #059669; font-size: 24px; font-weight: 700;">{{formatCurrency discountAmount}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Your fee discount request for <strong style="color: #1e293b;">{{studentName}}</strong> has been approved.
    </p>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Discount Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Original Amount:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatCurrency originalAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Discount:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 600;">- {{formatCurrency discountAmount}}</td></tr>
        <tr style="border-top: 2px solid #e2e8f0;"><td style="padding: 12px 0 6px; color: #1e293b; font-weight: 600;">Final Amount:</td><td style="padding: 12px 0 6px; color: #059669; text-align: right; font-weight: 700; font-size: 16px;">{{formatCurrency finalAmount}}</td></tr>
      </table>
    </div>
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      The discount has been applied to your fee record. Please check the updated fee details in your account.
    </p>
  `,
  textBody: `
Discount Approved ✅

Your discount request for {{studentName}} has been approved.

Discount Amount: {{formatCurrency discountAmount}}

Fee Details:
- Original: {{formatCurrency originalAmount}}
- Discount: {{formatCurrency discountAmount}}
- Final: {{formatCurrency finalAmount}}

The discount has been applied to your account.

Best regards,
{{schoolName}} Accounts Department
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'discountAmount', type: 'number', required: true },
      { name: 'originalAmount', type: 'number', required: true },
      { name: 'finalAmount', type: 'number', required: true }
    ]
  }),
  primaryColor: '#10b981',
  accentColor: '#059669',
  isDefault: true
};

/**
 * Fine Waiver Approved - Notification to parent/student
 */
const fineWaiverApprovedEmail: DefaultTemplate = {
  key: 'fine_waiver_approved_email',
  category: 'email',
  type: 'approval',
  name: 'Fine Waiver Approved',
  description: 'Notification when fine waiver request is approved',
  subject: 'Fine Waiver Approved - {{studentName}} | {{fineNumber}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px; text-align: center;">
      <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">✅ Waiver Approved</p>
      <p style="margin: 0; color: #059669; font-size: 28px; font-weight: 700;">{{formatCurrency waivedAmount}}</p>
      <p style="margin: 8px 0 0; color: #065f46; font-size: 13px;">Fine #{{fineNumber}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Your fine waiver request has been approved. The waived amount has been applied to your fine record.
    </p>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Fine Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Number:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineNumber}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Original Amount:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatCurrency originalAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Waived Amount:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 600;">- {{formatCurrency waivedAmount}}</td></tr>
        <tr style="border-top: 2px solid #e2e8f0;"><td style="padding: 12px 0 6px; color: #1e293b; font-weight: 600;">Pending Amount:</td><td style="padding: 12px 0 6px; color: #1e293b; text-align: right; font-weight: 700; font-size: 16px;">{{formatCurrency pendingAmount}}</td></tr>
      </table>
    </div>
    
    {{#if remarks}}
    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 4px; color: #374151; font-size: 12px; font-weight: 600;">Remarks from Reviewer:</p>
      <p style="margin: 0; color: #4b5563; font-size: 13px;">{{remarks}}</p>
    </div>
    {{/if}}
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      The fine status has been updated. You can view the updated details in your account dashboard.
    </p>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            View Fine Details
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
Fine Waiver Approved ✅

Your fine waiver request has been approved.

Fine Details:
- Student: {{studentName}}
- Fine Number: {{fineNumber}}
- Fine Type: {{fineType}}
- Original Amount: {{formatCurrency originalAmount}}
- Waived Amount: {{formatCurrency waivedAmount}}
- Pending Amount: {{formatCurrency pendingAmount}}

{{#if remarks}}Remarks: {{remarks}}{{/if}}

The fine status has been updated in your account.

Best regards,
{{schoolName}} Administration
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'fineNumber', type: 'string', required: true },
      { name: 'fineType', type: 'string', required: true },
      { name: 'originalAmount', type: 'number', required: true },
      { name: 'waivedAmount', type: 'number', required: true },
      { name: 'pendingAmount', type: 'number', required: true },
      { name: 'remarks', type: 'string', required: false },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#10b981',
  accentColor: '#059669',
  isDefault: true
};

/**
 * Fine Waiver Request - Notification to admin for approval
 */
const fineWaiverRequestEmail: DefaultTemplate = {
  key: 'fine_waiver_request_email',
  category: 'email',
  type: 'approval',
  name: 'Fine Waiver Request',
  description: 'Notification to administrators for fine waiver approval',
  subject: 'Action Required: Fine Waiver Request - {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">⏳ Pending Approval</p>
      <p style="margin: 0; color: #78350f; font-size: 20px; font-weight: 700;">Fine Waiver Request</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      A fine waiver request has been submitted and requires your review and approval.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Request Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class/Section:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Number:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineNumber}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Amount:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{formatCurrency fineAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Requested By:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{requesterName}}</td></tr>
      </table>
    </div>
    
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">Reason for Waiver:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{reason}}</p>
    </div>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Review Request
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      Please review and approve/reject the request at your earliest convenience. The parent/student will be notified of your decision.
    </p>
  `,
  textBody: `
Fine Waiver Request - Action Required

A waiver request has been submitted for your review.

Student Details:
- Name: {{studentName}}
- Admission No: {{admissionNo}}
- Class: {{className}} - {{section}}

Fine Details:
- Fine Number: {{fineNumber}}
- Fine Type: {{fineType}}
- Amount: {{formatCurrency fineAmount}}

Request Details:
- Requested By: {{requesterName}}
- Reason: {{reason}}

{{#if actionUrl}}Review: {{actionUrl}}{{/if}}

Please review this request.

Best regards,
{{schoolName}} Administration
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'fineNumber', type: 'string', required: true },
      { name: 'fineType', type: 'string', required: true },
      { name: 'fineAmount', type: 'number', required: true },
      { name: 'requesterName', type: 'string', required: true },
      { name: 'reason', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#f59e0b',
  accentColor: '#d97706',
  isDefault: true
};

/**
 * All default templates export
 */
export const defaultTemplates: Record<string, DefaultTemplate> = {
  [studentWelcomeEmail.key]: studentWelcomeEmail,
  [feeReminderEmail.key]: feeReminderEmail,
  [feeReceiptEmail.key]: feeReceiptEmail,
  [leaveSubmittedEmail.key]: leaveSubmittedEmail,
  [leaveStatusEmail.key]: leaveStatusEmail,
  [passwordResetEmail.key]: passwordResetEmail,
  [announcementEmail.key]: announcementEmail,
  [discountApprovedEmail.key]: discountApprovedEmail,
  [fineWaiverApprovedEmail.key]: fineWaiverApprovedEmail,
  [fineWaiverRequestEmail.key]: fineWaiverRequestEmail
};

export default defaultTemplates;
