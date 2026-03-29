/**
 * Attendance Templates - Modular template definitions
 * 
 * @module AttendanceTemplates
 */

import { DefaultTemplate } from '../types';

/**
 * Attendance Absent - Notification for absent students
 */
export const attendanceAbsentEmail: DefaultTemplate = {
  key: 'attendance_absent_email',
  category: 'email',
  type: 'alert',
  name: 'Attendance Absent Alert',
  description: 'Alert when student is marked absent',
  subject: '🔴 Absent: {{studentName}} on {{date}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600;">🔴 Absence Alert</p>
      <p style="margin: 0; color: #7f1d1d; font-size: 20px; font-weight: 700;">Student Marked Absent</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      This is to inform you that {{studentName}} was marked absent today.
    </p>
    
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Attendance Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{date}}</td></tr>
        {{#if subject}}<tr><td style="padding: 6px 0; color: #64748b;">Subject:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{subject}}</td></tr>{{/if}}
        <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">ABSENT</td></tr>
      </table>
    </div>
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      If this was an error or if there are special circumstances, please contact the school administration.
    </p>
  `,
  textBody: `
Attendance Alert: Student Absent

Student: {{studentName}}
Class: {{className}} - {{section}}
Date: {{date}}
{{#if subject}}Subject: {{subject}}{{/if}}
Status: ABSENT

Please contact school if this is an error.
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'date', type: 'string', required: true },
      { name: 'subject', type: 'string', required: false }
    ]
  }),
  primaryColor: '#ef4444',
  accentColor: '#dc2626',
  isDefault: true
};

/**
 * Attendance Late - Notification for late students
 */
export const attendanceLateEmail: DefaultTemplate = {
  key: 'attendance_late_email',
  category: 'email',
  type: 'alert',
  name: 'Attendance Late Alert',
  description: 'Alert when student is marked late',
  subject: '⏰ Late: {{studentName}} on {{date}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">⏰ Late Arrival</p>
      <p style="margin: 0; color: #78350f; font-size: 20px; font-weight: 700;">Student Marked Late</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      This is to inform you that {{studentName}} was marked late today.
    </p>
    
    <div style="background: #fefce8; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Attendance Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date:</td><td style="padding: 6px 0; color: #d97706; text-align: right; font-weight: 600;">{{date}}</td></tr>
        {{#if subject}}<tr><td style="padding: 6px 0; color: #64748b;">Subject:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{subject}}</td></tr>{{/if}}
        <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="padding: 6px 0; color: #d97706; text-align: right; font-weight: 600;">LATE</td></tr>
      </table>
    </div>
    
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
      Regular punctuality is important for academic success. Please ensure timely arrival.
    </p>
  `,
  textBody: `
Attendance Alert: Student Late

Student: {{studentName}}
Class: {{className}} - {{section}}
Date: {{date}}
{{#if subject}}Subject: {{subject}}{{/if}}
Status: LATE

Please ensure timely arrival.
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'date', type: 'string', required: true },
      { name: 'subject', type: 'string', required: false }
    ]
  }),
  primaryColor: '#f59e0b',
  accentColor: '#d97706',
  isDefault: true
};

/**
 * Attendance Regular - Daily attendance summary for parents
 */
export const attendanceDailySummaryEmail: DefaultTemplate = {
  key: 'attendance_daily_summary_email',
  category: 'email',
  type: 'summary',
  name: 'Daily Attendance Summary',
  description: 'Daily attendance summary for parents',
  subject: '📋 Attendance Summary: {{studentName}} - {{date}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border: 1px solid #6366f1; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #3730a3; font-size: 14px; font-weight: 600;">📋 Daily Summary</p>
      <p style="margin: 0; color: #312e81; font-size: 20px; font-weight: 700;">Attendance Report</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Attendance summary for {{studentName}} on {{date}}.
    </p>
    
    <div style="background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Summary</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{date}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;"><span style="color: {{statusColor}};">{{status}}</span></td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Present Days:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 600;">{{presentDays}}/{{totalDays}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Attendance %:</td><td style="padding: 6px 0; color: {{percentageColor}}; text-align: right; font-weight: 600;">{{attendancePercentage}}%</td></tr>
      </table>
    </div>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            View Full Report
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
Daily Attendance Summary

Student: {{studentName}}
Class: {{className}} - {{section}}
Date: {{date}}
Status: {{status}}
Present Days: {{presentDays}}/{{totalDays}}
Attendance %: {{attendancePercentage}}%

{{#if actionUrl}}View Report: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'date', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'statusColor', type: 'string', required: true },
      { name: 'presentDays', type: 'string', required: true },
      { name: 'totalDays', type: 'string', required: true },
      { name: 'attendancePercentage', type: 'string', required: true },
      { name: 'percentageColor', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#6366f1',
  accentColor: '#4f46e5',
  isDefault: true
};

/**
 * Attendance Low - Warning for low attendance
 */
export const attendanceLowWarningEmail: DefaultTemplate = {
  key: 'attendance_low_warning_email',
  category: 'email',
  type: 'warning',
  name: 'Low Attendance Warning',
  description: 'Warning when student attendance is below threshold',
  subject: '⚠️ Low Attendance Alert: {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">⚠️ Important Notice</p>
      <p style="margin: 0; color: #78350f; font-size: 20px; font-weight: 700;">Low Attendance Alert</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      This is to bring to your attention that {{studentName}}'s attendance has fallen below the required minimum.
    </p>
    
    <div style="background: #fefce8; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Attendance Statistics</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Current Attendance:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{attendancePercentage}}%</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Required Minimum:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{requiredPercentage}}%</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Days Present:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{presentDays}}/{{totalDays}}</td></tr>
      </table>
    </div>
    
    <p style="color: #92400e; font-size: 13px; line-height: 1.5; margin: 16px 0; font-weight: 500;">
      Please ensure regular attendance to meet academic requirements. Contact the school for any concerns.
    </p>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            View Attendance Details
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
Low Attendance Warning

Student: {{studentName}}
Class: {{className}} - {{section}}
Current Attendance: {{attendancePercentage}}%
Required Minimum: {{requiredPercentage}}%
Days Present: {{presentDays}}/{{totalDays}}

Please ensure regular attendance.
{{#if actionUrl}}View Details: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'studentName', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'attendancePercentage', type: 'string', required: true },
      { name: 'requiredPercentage', type: 'string', required: true },
      { name: 'presentDays', type: 'string', required: true },
      { name: 'totalDays', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#f59e0b',
  accentColor: '#d97706',
  isDefault: true
};
