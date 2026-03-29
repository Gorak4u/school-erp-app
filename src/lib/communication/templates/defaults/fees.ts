/**
 * Fee Templates - Modular template definitions
 * 
 * @module FeeTemplates
 */

import { DefaultTemplate } from '../types';

/**
 * Fee Reminder - Payment due reminder
 */
export const feeReminderEmail: DefaultTemplate = {
  key: 'fee_reminder_email',
  category: 'email',
  type: 'reminder',
  name: 'Fee Payment Reminder',
  description: 'Reminder for upcoming fee payment due date',
  subject: '⏰ Fee Payment Due: {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">⏰ Payment Reminder</p>
      <p style="margin: 0; color: #78350f; font-size: 20px; font-weight: 700;">Fee Payment Due Soon</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      This is a friendly reminder that the fee payment for {{studentName}} is due soon.
    </p>
    
    <div style="background: #fefce8; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Fee Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fee Category:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{feeCategory}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Amount Due:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">₹{{amountDue}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Due Date:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{dueDate}}</td></tr>
      </table>
    </div>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Pay Now
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      Please ensure timely payment to avoid any late fees. Contact the accounts office for any queries.
    </p>
  `,
  textBody: `
Fee Payment Reminder

Student: {{studentName}}
Admission No: {{admissionNo}}
Class: {{className}} - {{section}}
Fee Category: {{feeCategory}}
Amount Due: ₹{{amountDue}}
Due Date: {{dueDate}}

{{#if actionUrl}}Pay Now: {{actionUrl}}{{/if}}

Please ensure timely payment.
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'feeCategory', type: 'string', required: true },
      { name: 'amountDue', type: 'string', required: true },
      { name: 'dueDate', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#f59e0b',
  accentColor: '#d97706',
  isDefault: true
};

/**
 * Fee Receipt - Payment confirmation
 */
export const feeReceiptEmail: DefaultTemplate = {
  key: 'fee_receipt_email',
  category: 'email',
  type: 'receipt',
  name: 'Fee Payment Receipt',
  description: 'Receipt for fee payment confirmation',
  subject: '✅ Fee Payment Received: {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">✅ Payment Successful</p>
      <p style="margin: 0; color: #064e3b; font-size: 20px; font-weight: 700;">Fee Receipt</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Thank you for your payment. Please find your receipt details below.
    </p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Payment Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Receipt No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{receiptNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Amount Paid:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 600;">₹{{amountPaid}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Payment Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{paymentDate}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Payment Mode:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{paymentMode}}</td></tr>
      </table>
    </div>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Download Receipt
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      This is a computer-generated receipt and does not require a signature.
    </p>
  `,
  textBody: `
Fee Payment Receipt

Student: {{studentName}}
Admission No: {{admissionNo}}
Class: {{className}} - {{section}}
Receipt No: {{receiptNo}}
Amount Paid: ₹{{amountPaid}}
Payment Date: {{paymentDate}}
Payment Mode: {{paymentMode}}

{{#if actionUrl}}Download: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'receiptNo', type: 'string', required: true },
      { name: 'amountPaid', type: 'string', required: true },
      { name: 'paymentDate', type: 'string', required: true },
      { name: 'paymentMode', type: 'string', required: true },
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
export const fineWaiverRequestEmail: DefaultTemplate = {
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
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Amount:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">₹{{fineAmount}}</td></tr>
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

Student: {{studentName}}
Admission No: {{admissionNo}}
Class: {{className}} - {{section}}
Fine Number: {{fineNumber}}
Fine Type: {{fineType}}
Fine Amount: ₹{{fineAmount}}
Requested By: {{requesterName}}
Reason: {{reason}}

{{#if actionUrl}}Review: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'fineNumber', type: 'string', required: true },
      { name: 'fineType', type: 'string', required: true },
      { name: 'fineAmount', type: 'string', required: true },
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
 * Fine Waiver Approved - Notification when fine waiver is approved
 */
export const fineWaiverApprovedEmail: DefaultTemplate = {
  key: 'fine_waiver_approved_email',
  category: 'email',
  type: 'notification',
  name: 'Fine Waiver Approved',
  description: 'Notification when fine waiver is approved',
  subject: '✅ Fine Waiver Approved: {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">✅ Approved</p>
      <p style="margin: 0; color: #064e3b; font-size: 20px; font-weight: 700;">Fine Waiver Approved</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We are pleased to inform you that the fine waiver request for {{studentName}} has been approved.
    </p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Waiver Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Number:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineNumber}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Original Amount:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">₹{{originalAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Waived Amount:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 600;">₹{{waivedAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Remaining Amount:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">₹{{remainingAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Approved By:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{approvedBy}}</td></tr>
      </table>
    </div>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            View Fee Details
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
Fine Waiver Approved

Student: {{studentName}}
Fine Number: {{fineNumber}}
Original Amount: ₹{{originalAmount}}
Waived Amount: ₹{{waivedAmount}}
Remaining Amount: ₹{{remainingAmount}}
Approved By: {{approvedBy}}

{{#if actionUrl}}View Details: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'fineNumber', type: 'string', required: true },
      { name: 'originalAmount', type: 'string', required: true },
      { name: 'waivedAmount', type: 'string', required: true },
      { name: 'remainingAmount', type: 'string', required: true },
      { name: 'approvedBy', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#10b981',
  accentColor: '#059669',
  isDefault: true
};
