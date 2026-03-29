/**
 * Student Templates - Modular template definitions
 * 
 * @module StudentTemplates
 */

import { DefaultTemplate } from '../types';

/**
 * Student Welcome - Welcome email for new admissions
 */
export const studentWelcomeEmail: DefaultTemplate = {
  key: 'student_welcome_email',
  category: 'email',
  type: 'welcome',
  name: 'Student Welcome',
  description: 'Welcome email sent to parents when student is admitted',
  subject: 'Welcome to {{schoolName}} - Admission Confirmed',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">🎉 Welcome!</p>
      <p style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: 700;">Admission Confirmed</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We are delighted to welcome <strong style="color: #1e293b;">{{studentName}}</strong> to our school family! 
      The admission has been successfully completed for academic year {{academicYear}}.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Student Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Admission Number:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Section:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date of Admission:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionDate}}</td></tr>
      </table>
    </div>
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      We look forward to a fruitful academic journey together. For any queries, please contact the school office.
    </p>
  `,
  textBody: `
Welcome to {{schoolName}}!

Admission Confirmed

Student: {{studentName}}
Admission No: {{admissionNo}}
Class: {{className}} - {{section}}
Academic Year: {{academicYear}}
Date of Admission: {{admissionDate}}

We look forward to a fruitful academic journey together.
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'schoolName', type: 'string', required: true },
      { name: 'studentName', type: 'string', required: true },
      { name: 'admissionNo', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'academicYear', type: 'string', required: true },
      { name: 'admissionDate', type: 'string', required: true }
    ]
  }),
  primaryColor: '#2563eb',
  accentColor: '#1d4ed8',
  isDefault: true
};

/**
 * Leave Submitted - When student/parent submits leave request
 */
export const leaveSubmittedEmail: DefaultTemplate = {
  key: 'leave_submitted_email',
  category: 'email',
  type: 'notification',
  name: 'Leave Submitted',
  description: 'Confirmation when leave request is submitted',
  subject: '✅ Leave Request Submitted: {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">✅ Request Submitted</p>
      <p style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: 700;">Leave Application</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Your leave request for {{studentName}} has been submitted successfully and is pending approval.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Leave Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">From Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fromDate}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">To Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{toDate}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Total Days:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{totalDays}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Leave Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{leaveType}}</td></tr>
      </table>
    </div>
    
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">Reason:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{reason}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      You will be notified once the leave request is approved or rejected.
    </p>
  `,
  textBody: `
Leave Request Submitted

Student: {{studentName}}
From: {{fromDate}}
To: {{toDate}}
Total Days: {{totalDays}}
Leave Type: {{leaveType}}
Reason: {{reason}}

Your request is pending approval.
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'fromDate', type: 'string', required: true },
      { name: 'toDate', type: 'string', required: true },
      { name: 'totalDays', type: 'string', required: true },
      { name: 'leaveType', type: 'string', required: true },
      { name: 'reason', type: 'string', required: true }
    ]
  }),
  primaryColor: '#3b82f6',
  accentColor: '#2563eb',
  isDefault: true
};

/**
 * Leave Status - Approved/Rejected notification
 */
export const leaveStatusEmail: DefaultTemplate = {
  key: 'leave_status_email',
  category: 'email',
  type: 'notification',
  name: 'Leave Status Update',
  description: 'Notification when leave request is approved or rejected',
  subject: '{{statusIcon}} Leave {{status}}: {{studentName}}',
  htmlBody: `
    <div style="background: {{#if isApproved}}linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981;{{else}}linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #ef4444;{{/if}} border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: {{#if isApproved}}#065f46{{else}}#991b1b{{/if}}; font-size: 14px; font-weight: 600;">{{statusIcon}}</p>
      <p style="margin: 0; color: {{#if isApproved}}#064e3b{{else}}#7f1d1d{{/if}}; font-size: 20px; font-weight: 700;">Leave {{status}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Your leave request for {{studentName}} has been {{status}}.
    </p>
    
    <div style="background: {{#if isApproved}}#f0fdf4; border-left: 4px solid #10b981;{{else}}#fef2f2; border-left: 4px solid #ef4444;{{/if}} border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Leave Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">From Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fromDate}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">To Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{toDate}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Total Days:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{totalDays}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">{{#if isApproved}}Approved{{else}}Rejected{{/if}} By:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{actionBy}}</td></tr>
      </table>
    </div>
    
    {{#if remarks}}
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">Remarks:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{remarks}}</p>
    </div>
    {{/if}}
  `,
  textBody: `
Leave {{status}}

Student: {{studentName}}
From: {{fromDate}}
To: {{toDate}}
Total Days: {{totalDays}}
{{#if isApproved}}Approved{{else}}Rejected{{/if}} By: {{actionBy}}

{{#if remarks}}Remarks: {{remarks}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'fromDate', type: 'string', required: true },
      { name: 'toDate', type: 'string', required: true },
      { name: 'totalDays', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'statusIcon', type: 'string', required: true },
      { name: 'isApproved', type: 'boolean', required: true },
      { name: 'actionBy', type: 'string', required: true },
      { name: 'remarks', type: 'string', required: false }
    ]
  }),
  primaryColor: '#10b981',
  accentColor: '#059669',
  isDefault: true
};

/**
 * Password Reset - Password reset instructions
 */
export const passwordResetEmail: DefaultTemplate = {
  key: 'password_reset_email',
  category: 'email',
  type: 'security',
  name: 'Password Reset',
  description: 'Password reset instructions',
  subject: '🔐 Password Reset Request',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border: 1px solid #6366f1; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #3730a3; font-size: 14px; font-weight: 600;">🔐 Security</p>
      <p style="margin: 0; color: #312e81; font-size: 20px; font-weight: 700;">Password Reset Request</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We received a request to reset your password for {{schoolName}}. Click the button below to reset your password.
    </p>
    
    <div style="background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Account Information</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Email:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{email}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Request Time:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{requestTime}}</td></tr>
      </table>
    </div>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); text-align: center;">
          <a href="{{resetUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      This link will expire in 24 hours. If you didn't request this, please ignore this email.
    </p>
  `,
  textBody: `
Password Reset Request

Email: {{email}}
Request Time: {{requestTime}}

Reset your password: {{resetUrl}}

This link expires in 24 hours.
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'schoolName', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'requestTime', type: 'string', required: true },
      { name: 'resetUrl', type: 'string', required: true }
    ]
  }),
  primaryColor: '#6366f1',
  accentColor: '#4f46e5',
  isDefault: true
};
