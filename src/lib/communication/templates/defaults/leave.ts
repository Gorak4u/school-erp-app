/**
 * Leave Templates
 */

import { DefaultTemplate } from '../types';

export const leaveApprovalRequestEmail: DefaultTemplate = {
  key: 'leave_approval_request_email',
  category: 'email',
  type: 'approval',
  name: 'Leave Approval Request',
  subject: 'Leave approval required: {{staffName}}',
  htmlBody: `<p><strong>{{staffName}}</strong> has applied for <strong>{{leaveType}}</strong> leave.</p><p>From {{startDate}} to {{endDate}} ({{totalDays}} days).</p>{{#if reason}}<p><strong>Reason:</strong> {{reason}}</p>{{/if}}<p><a href="{{actionUrl}}">Review request</a></p>`,
  textBody: `Leave approval required: {{staffName}}\nLeave: {{leaveType}}\nFrom: {{startDate}} To: {{endDate}}\nDays: {{totalDays}}\n{{#if reason}}Reason: {{reason}}\n{{/if}}{{#if actionUrl}}Review: {{actionUrl}}{{/if}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'staffName', type: 'string', required: true },
    { name: 'leaveType', type: 'string', required: true },
    { name: 'startDate', type: 'string', required: true },
    { name: 'endDate', type: 'string', required: true },
    { name: 'totalDays', type: 'string', required: true },
    { name: 'reason', type: 'string', required: false },
    { name: 'actionUrl', type: 'string', required: false }
  ]}),
  isDefault: true,
};

export const leaveApplicationSubmittedEmail: DefaultTemplate = {
  key: 'leave_application_submitted_email',
  category: 'email',
  type: 'notification',
  name: 'Leave Application Submitted',
  subject: 'Leave application submitted: {{leaveType}}',
  htmlBody: `<p>Your leave request for <strong>{{leaveType}}</strong> has been submitted.</p><p>{{startDate}} to {{endDate}} ({{totalDays}} days).</p>{{#if reason}}<p><strong>Reason:</strong> {{reason}}</p>{{/if}}`,
  textBody: `Leave application submitted\n{{leaveType}}\n{{startDate}} to {{endDate}}\nDays: {{totalDays}}\n{{#if reason}}Reason: {{reason}}{{/if}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'leaveType', type: 'string', required: true },
    { name: 'startDate', type: 'string', required: true },
    { name: 'endDate', type: 'string', required: true },
    { name: 'totalDays', type: 'string', required: true },
    { name: 'reason', type: 'string', required: false }
  ]}),
  isDefault: true,
};

export const leaveStatusUpdateEmail: DefaultTemplate = {
  key: 'leave_status_update_email',
  category: 'email',
  type: 'notification',
  name: 'Leave Status Update',
  subject: 'Leave {{status}}: {{leaveType}}',
  htmlBody: `<p>Your leave application for <strong>{{leaveType}}</strong> was <strong>{{status}}</strong>.</p><p>{{#if comments}}Comments: {{comments}}{{/if}}</p>`,
  textBody: `Leave {{status}}\n{{leaveType}}\n{{#if comments}}Comments: {{comments}}{{/if}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'leaveType', type: 'string', required: true },
    { name: 'status', type: 'string', required: true },
    { name: 'comments', type: 'string', required: false }
  ]}),
  isDefault: true,
};
