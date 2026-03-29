/**
 * Discount Templates - Modular template definitions
 * 
 * @module DiscountTemplates
 */

import { DefaultTemplate } from '../types';

/**
 * Discount Request - Notification for fee discount approval
 */
export const discountRequestEmail: DefaultTemplate = {
  key: 'discount_request_email',
  category: 'email',
  type: 'approval',
  name: 'Discount Request',
  description: 'Notification for fee discount approval request',
  subject: '💰 Discount Request: {{studentName}} - {{discountCategory}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); border: 1px solid #ec4899; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #9d174d; font-size: 14px; font-weight: 600;">⏳ Pending Approval</p>
      <p style="margin: 0; color: #831843; font-size: 20px; font-weight: 700;">Fee Discount Request</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      A fee discount request has been submitted and requires your review.
    </p>
    
    <div style="background: #fdf2f8; border-left: 4px solid #ec4899; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Request Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Discount Category:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{discountCategory}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Discount Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{discountType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Requested Amount:</td><td style="padding: 6px 0; color: #ec4899; text-align: right; font-weight: 600;">₹{{requestedAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Requester:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{requesterName}}</td></tr>
      </table>
    </div>
    
    {{#if reason}}
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">Reason for Request:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{reason}}</p>
    </div>
    {{/if}}
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Review Request
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
Fee Discount Request

Student: {{studentName}}
Admission No: {{admissionNo}}
Class: {{className}} - {{section}}
Discount Category: {{discountCategory}}
Discount Type: {{discountType}}
Requested Amount: ₹{{requestedAmount}}
Requester: {{requesterName}}

{{#if reason}}Reason: {{reason}}{{/if}}
{{#if actionUrl}}Review: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'discountCategory', type: 'string', required: true },
      { name: 'discountType', type: 'string', required: true },
      { name: 'requestedAmount', type: 'string', required: true },
      { name: 'requesterName', type: 'string', required: true },
      { name: 'reason', type: 'string', required: false },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#ec4899',
  accentColor: '#db2777',
  isDefault: true
};

/**
 * Discount Approved - Notification when discount is approved
 */
export const discountApprovedEmail: DefaultTemplate = {
  key: 'discount_approved_email',
  category: 'email',
  type: 'notification',
  name: 'Discount Approved',
  description: 'Notification when fee discount is approved',
  subject: '✅ Discount Approved: {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">✅ Approved</p>
      <p style="margin: 0; color: #064e3b; font-size: 20px; font-weight: 700;">Fee Discount Approved</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We are pleased to inform you that the fee discount request for {{studentName}} has been approved.
    </p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Approval Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Discount Category:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{discountCategory}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Approved Amount:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 600;">₹{{approvedAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Approved By:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{approvedBy}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Approval Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{approvedAt}}</td></tr>
      </table>
    </div>
    
    {{#if remarks}}
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">Remarks:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{remarks}}</p>
    </div>
    {{/if}}
    
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
Discount Approved

Student: {{studentName}}
Admission No: {{admissionNo}}
Class: {{className}} - {{section}}
Discount Category: {{discountCategory}}
Approved Amount: ₹{{approvedAmount}}
Approved By: {{approvedBy}}
Approval Date: {{approvedAt}}

{{#if remarks}}Remarks: {{remarks}}{{/if}}
{{#if actionUrl}}View Details: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'discountCategory', type: 'string', required: true },
      { name: 'approvedAmount', type: 'string', required: true },
      { name: 'approvedBy', type: 'string', required: true },
      { name: 'approvedAt', type: 'string', required: true },
      { name: 'remarks', type: 'string', required: false },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#10b981',
  accentColor: '#059669',
  isDefault: true
};

/**
 * Discount Rejected - Notification when discount is rejected
 */
export const discountRejectedEmail: DefaultTemplate = {
  key: 'discount_rejected_email',
  category: 'email',
  type: 'notification',
  name: 'Discount Rejected',
  description: 'Notification when fee discount is rejected',
  subject: '❌ Discount Request Declined: {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600;">❌ Not Approved</p>
      <p style="margin: 0; color: #7f1d1d; font-size: 20px; font-weight: 700;">Discount Request Declined</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We regret to inform you that the fee discount request for {{studentName}} has been declined.
    </p>
    
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Request Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Discount Category:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{discountCategory}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Requested Amount:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">₹{{requestedAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Reviewed By:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{reviewedBy}}</td></tr>
      </table>
    </div>
    
    {{#if remarks}}
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">Reason for Decline:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{remarks}}</p>
    </div>
    {{/if}}
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      If you have any questions or would like to discuss this further, please contact the school administration.
    </p>
  `,
  textBody: `
Discount Request Declined

Student: {{studentName}}
Admission No: {{admissionNo}}
Class: {{className}} - {{section}}
Discount Category: {{discountCategory}}
Requested Amount: ₹{{requestedAmount}}
Reviewed By: {{reviewedBy}}

{{#if remarks}}Reason: {{remarks}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'discountCategory', type: 'string', required: true },
      { name: 'requestedAmount', type: 'string', required: true },
      { name: 'reviewedBy', type: 'string', required: true },
      { name: 'remarks', type: 'string', required: false }
    ]
  }),
  primaryColor: '#ef4444',
  accentColor: '#dc2626',
  isDefault: true
};
