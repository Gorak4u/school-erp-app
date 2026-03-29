/**
 * Assignment Templates - Modular template definitions
 * 
 * @module AssignmentTemplates
 */

import { DefaultTemplate } from '../types';

/**
 * Assignment Published - Notification to students/parents
 */
export const assignmentPublishedEmail: DefaultTemplate = {
  key: 'assignment_published_email',
  category: 'email',
  type: 'notification',
  name: 'Assignment Published',
  description: 'Notification when new assignment is published',
  subject: 'New Assignment: {{assignmentTitle}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">📚 New Assignment</p>
      <p style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: 700;">{{assignmentTitle}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      A new assignment has been published for {{studentName}}. Please review the details below.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Assignment Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Subject:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{subject}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Due Date:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{dueDate}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Student:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
      </table>
    </div>
    
    {{#if description}}
    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #166534; font-size: 12px; font-weight: 600;">Description:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{description}}</p>
    </div>
    {{/if}}
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            View Assignment
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
New Assignment Published

Assignment: {{assignmentTitle}}
Subject: {{subject}}
Due Date: {{dueDate}}
Student: {{studentName}}
Class: {{className}} - {{section}}

{{#if description}}Description: {{description}}{{/if}}
{{#if actionUrl}}View: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'assignmentTitle', type: 'string', required: true },
      { name: 'subject', type: 'string', required: true },
      { name: 'dueDate', type: 'string', required: true },
      { name: 'studentName', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'description', type: 'string', required: false },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#3b82f6',
  accentColor: '#1d4ed8',
  isDefault: true
};

/**
 * Assignment Due Soon - Reminder notification
 */
export const assignmentDueSoonEmail: DefaultTemplate = {
  key: 'assignment_due_soon_email',
  category: 'email',
  type: 'reminder',
  name: 'Assignment Due Soon',
  description: 'Reminder when assignment is due soon',
  subject: '⏰ Due Soon: {{assignmentTitle}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">⏰ Reminder</p>
      <p style="margin: 0; color: #78350f; font-size: 20px; font-weight: 700;">Assignment Due Soon</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      {{studentName}} has an assignment due soon. Please ensure timely submission.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Assignment Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Assignment:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{assignmentTitle}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Subject:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{subject}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Due Date:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{dueDate}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Time Remaining:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{timeRemaining}}</td></tr>
      </table>
    </div>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Submit Now
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
Assignment Due Soon Reminder

Assignment: {{assignmentTitle}}
Subject: {{subject}}
Due Date: {{dueDate}}
Time Remaining: {{timeRemaining}}
Student: {{studentName}}

{{#if actionUrl}}Submit: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'assignmentTitle', type: 'string', required: true },
      { name: 'subject', type: 'string', required: true },
      { name: 'dueDate', type: 'string', required: true },
      { name: 'timeRemaining', type: 'string', required: true },
      { name: 'studentName', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#f59e0b',
  accentColor: '#d97706',
  isDefault: true
};

/**
 * Assignment Overdue - Urgent notification
 */
export const assignmentOverdueEmail: DefaultTemplate = {
  key: 'assignment_overdue_email',
  category: 'email',
  type: 'urgent',
  name: 'Assignment Overdue',
  description: 'Urgent notification when assignment is overdue',
  subject: '🔴 OVERDUE: {{assignmentTitle}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600;">🔴 URGENT</p>
      <p style="margin: 0; color: #7f1d1d; font-size: 20px; font-weight: 700;">Assignment Overdue</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      {{studentName}} has an overdue assignment that requires immediate attention.
    </p>
    
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Assignment Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Assignment:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{assignmentTitle}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Subject:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{subject}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Was Due On:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{dueDate}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Overdue By:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{overdueDuration}}</td></tr>
      </table>
    </div>
    
    <p style="color: #991b1b; font-size: 13px; line-height: 1.5; margin: 16px 0; font-weight: 500;">
      Please complete this assignment as soon as possible to avoid further penalties.
    </p>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Submit Immediately
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
URGENT: Assignment Overdue

Assignment: {{assignmentTitle}}
Subject: {{subject}}
Was Due: {{dueDate}}
Overdue By: {{overdueDuration}}
Student: {{studentName}}

Please submit immediately.

{{#if actionUrl}}Submit: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'assignmentTitle', type: 'string', required: true },
      { name: 'subject', type: 'string', required: true },
      { name: 'dueDate', type: 'string', required: true },
      { name: 'overdueDuration', type: 'string', required: true },
      { name: 'studentName', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#ef4444',
  accentColor: '#dc2626',
  isDefault: true
};

/**
 * Assignment Graded - Notification of graded assignment
 */
export const assignmentGradedEmail: DefaultTemplate = {
  key: 'assignment_graded_email',
  category: 'email',
  type: 'notification',
  name: 'Assignment Graded',
  description: 'Notification when assignment has been graded',
  subject: '📝 Graded: {{assignmentTitle}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">✅ Assignment Graded</p>
      <p style="margin: 0; color: #064e3b; font-size: 20px; font-weight: 700;">{{assignmentTitle}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      {{studentName}}'s assignment has been graded. View the results below.
    </p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Grade Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Assignment:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{assignmentTitle}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Subject:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{subject}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Grade:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 700; font-size: 16px;">{{grade}}</td></tr>
        {{#if marks}}<tr><td style="padding: 6px 0; color: #64748b;">Marks:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 600;">{{marks}}</td></tr>{{/if}}
        <tr><td style="padding: 6px 0; color: #64748b;">Graded By:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{gradedBy}}</td></tr>
      </table>
    </div>
    
    {{#if feedback}}
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">Feedback:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{feedback}}</p>
    </div>
    {{/if}}
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            View Full Result
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
Assignment Graded

Assignment: {{assignmentTitle}}
Subject: {{subject}}
Student: {{studentName}}
Grade: {{grade}}
{{#if marks}}Marks: {{marks}}{{/if}}
Graded By: {{gradedBy}}

{{#if feedback}}Feedback: {{feedback}}{{/if}}
{{#if actionUrl}}View: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'assignmentTitle', type: 'string', required: true },
      { name: 'subject', type: 'string', required: true },
      { name: 'studentName', type: 'string', required: true },
      { name: 'grade', type: 'string', required: true },
      { name: 'marks', type: 'string', required: false },
      { name: 'gradedBy', type: 'string', required: true },
      { name: 'feedback', type: 'string', required: false },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#10b981',
  accentColor: '#059669',
  isDefault: true
};

/**
 * Assignment Submitted - Notification to teacher
 */
export const assignmentSubmittedEmail: DefaultTemplate = {
  key: 'assignment_submitted_email',
  category: 'email',
  type: 'notification',
  name: 'Assignment Submitted',
  description: 'Notification to teacher when student submits assignment',
  subject: '✅ Submitted: {{assignmentTitle}} by {{studentName}}',
  htmlBody: `
    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border: 1px solid #6366f1; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #3730a3; font-size: 14px; font-weight: 600;">✅ Assignment Submitted</p>
      <p style="margin: 0; color: #312e81; font-size: 20px; font-weight: 700;">{{assignmentTitle}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      {{studentName}} has submitted an assignment for your review.
    </p>
    
    <div style="background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Submission Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Assignment:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{assignmentTitle}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Subject:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{subject}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Student:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Submitted At:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{submittedAt}}</td></tr>
      </table>
    </div>
    
    {{#if actionUrl}}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); text-align: center;">
          <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
            Review Submission
          </a>
        </td>
      </tr>
    </table>
    {{/if}}
  `,
  textBody: `
Assignment Submitted

Assignment: {{assignmentTitle}}
Subject: {{subject}}
Student: {{studentName}}
Class: {{className}} - {{section}}
Submitted At: {{submittedAt}}

{{#if actionUrl}}Review: {{actionUrl}}{{/if}}
  `,
  variablesSchema: JSON.stringify({
    variables: [
      { name: 'assignmentTitle', type: 'string', required: true },
      { name: 'subject', type: 'string', required: true },
      { name: 'studentName', type: 'string', required: true },
      { name: 'className', type: 'string', required: true },
      { name: 'section', type: 'string', required: true },
      { name: 'submittedAt', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false }
    ]
  }),
  primaryColor: '#6366f1',
  accentColor: '#4f46e5',
  isDefault: true
};
