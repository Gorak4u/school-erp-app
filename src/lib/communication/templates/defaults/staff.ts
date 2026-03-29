/**
 * Staff/Teacher Templates
 */

import { DefaultTemplate } from '../types';

export const teacherWelcomeEmail: DefaultTemplate = {
  key: 'teacher_welcome_email',
  category: 'email',
  type: 'notification',
  name: 'Teacher Welcome Email',
  subject: 'Welcome to {{schoolName}} - Your Account Details',
  htmlBody: `<p>Dear <strong>{{teacherName}}</strong>,</p><p>Welcome to {{schoolName}}! Your account has been created.</p><p><strong>Login Details:</strong></p><ul><li>Email: {{email}}</li><li>Employee ID: {{employeeId}}</li><li>Temporary Password: {{tempPassword}}</li></ul><p>Please log in and change your password immediately.</p>{{#if actionUrl}}<p><a href="{{actionUrl}}">Login Now</a></p>{{/if}}`,
  textBody: `Welcome to {{schoolName}}\n\nDear {{teacherName}},\n\nYour account has been created.\n\nEmail: {{email}}\nEmployee ID: {{employeeId}}\nTemporary Password: {{tempPassword}}\n\nPlease log in and change your password.\n{{#if actionUrl}}Login: {{actionUrl}}{{/if}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'teacherName', type: 'string', required: true },
    { name: 'schoolName', type: 'string', required: true },
    { name: 'email', type: 'string', required: true },
    { name: 'employeeId', type: 'string', required: true },
    { name: 'tempPassword', type: 'string', required: true },
    { name: 'actionUrl', type: 'string', required: false }
  ]}),
  isDefault: true,
};

export const teacherAdminNotificationEmail: DefaultTemplate = {
  key: 'teacher_admin_notification_email',
  category: 'email',
  type: 'notification',
  name: 'Teacher Admin Notification',
  subject: 'New Teacher Added: {{teacherName}}',
  htmlBody: `<p>A new teacher has been added to {{schoolName}}.</p><p><strong>Details:</strong></p><ul><li>Name: {{teacherName}}</li><li>Email: {{email}}</li><li>Employee ID: {{employeeId}}</li><li>Department: {{department}}</li></ul>`,
  textBody: `New Teacher Added\n\nSchool: {{schoolName}}\nName: {{teacherName}}\nEmail: {{email}}\nEmployee ID: {{employeeId}}\nDepartment: {{department}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'teacherName', type: 'string', required: true },
    { name: 'schoolName', type: 'string', required: true },
    { name: 'email', type: 'string', required: true },
    { name: 'employeeId', type: 'string', required: true },
    { name: 'department', type: 'string', required: false }
  ]}),
  isDefault: true,
};

export const studentWelcomeEmail: DefaultTemplate = {
  key: 'student_welcome_email',
  category: 'email',
  type: 'notification',
  name: 'Student Welcome Email',
  subject: 'Welcome to {{schoolName}} - {{studentName}}',
  htmlBody: `<p>Dear <strong>{{studentName}}</strong>,</p><p>Welcome to {{schoolName}}!</p><p><strong>Student Details:</strong></p><ul><li>Admission No: {{admissionNo}}</li><li>Class: {{className}} {{section}}</li><li>Roll No: {{rollNo}}</li></ul>{{#if loginEmail}}<p><strong>Login Credentials:</strong></p><ul><li>Email: {{loginEmail}}</li><li>Password: {{tempPassword}}</li></ul>{{/if}}{{#if actionUrl}}<p><a href="{{actionUrl}}">Access Portal</a></p>{{/if}}`,
  textBody: `Welcome to {{schoolName}}\n\nDear {{studentName}},\n\nAdmission No: {{admissionNo}}\nClass: {{className}} {{section}}\nRoll No: {{rollNo}}\n{{#if loginEmail}}\nLogin Email: {{loginEmail}}\nPassword: {{tempPassword}}\n{{/if}}{{#if actionUrl}}Portal: {{actionUrl}}{{/if}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'studentName', type: 'string', required: true },
    { name: 'schoolName', type: 'string', required: true },
    { name: 'admissionNo', type: 'string', required: true },
    { name: 'className', type: 'string', required: true },
    { name: 'section', type: 'string', required: false },
    { name: 'rollNo', type: 'string', required: false },
    { name: 'loginEmail', type: 'string', required: false },
    { name: 'tempPassword', type: 'string', required: false },
    { name: 'actionUrl', type: 'string', required: false }
  ]}),
  isDefault: true,
};

export const parentWelcomeEmail: DefaultTemplate = {
  key: 'parent_welcome_email',
  category: 'email',
  type: 'notification',
  name: 'Parent Welcome Email',
  subject: 'Welcome to {{schoolName}} - Parent Portal Access',
  htmlBody: `<p>Dear Parent/Guardian,</p><p>Your child <strong>{{studentName}}</strong> has been enrolled at {{schoolName}}.</p><p><strong>Student Details:</strong></p><ul><li>Admission No: {{admissionNo}}</li><li>Class: {{className}} {{section}}</li></ul>{{#if loginEmail}}<p><strong>Parent Portal Access:</strong></p><ul><li>Email: {{loginEmail}}</li><li>Password: {{tempPassword}}</li></ul>{{/if}}{{#if actionUrl}}<p><a href="{{actionUrl}}">Access Parent Portal</a></p>{{/if}}`,
  textBody: `Welcome to {{schoolName}}\n\nYour child {{studentName}} has been enrolled.\n\nAdmission No: {{admissionNo}}\nClass: {{className}} {{section}}\n{{#if loginEmail}}\nParent Portal:\nEmail: {{loginEmail}}\nPassword: {{tempPassword}}\n{{/if}}{{#if actionUrl}}Portal: {{actionUrl}}{{/if}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'studentName', type: 'string', required: true },
    { name: 'schoolName', type: 'string', required: true },
    { name: 'admissionNo', type: 'string', required: true },
    { name: 'className', type: 'string', required: true },
    { name: 'section', type: 'string', required: false },
    { name: 'loginEmail', type: 'string', required: false },
    { name: 'tempPassword', type: 'string', required: false },
    { name: 'actionUrl', type: 'string', required: false }
  ]}),
  isDefault: true,
};

export const userWelcomeEmail: DefaultTemplate = {
  key: 'user_welcome_email',
  category: 'email',
  type: 'notification',
  name: 'User Welcome Email',
  subject: 'Welcome to {{schoolName}}',
  htmlBody: `<p>Dear <strong>{{userName}}</strong>,</p><p>Your account has been created at {{schoolName}}.</p><p><strong>Login Details:</strong></p><ul><li>Email: {{email}}</li><li>Password: {{tempPassword}}</li></ul>{{#if actionUrl}}<p><a href="{{actionUrl}}">Login Now</a></p>{{/if}}`,
  textBody: `Welcome to {{schoolName}}\n\nDear {{userName}},\n\nEmail: {{email}}\nPassword: {{tempPassword}}\n{{#if actionUrl}}Login: {{actionUrl}}{{/if}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'userName', type: 'string', required: true },
    { name: 'schoolName', type: 'string', required: true },
    { name: 'email', type: 'string', required: true },
    { name: 'tempPassword', type: 'string', required: true },
    { name: 'actionUrl', type: 'string', required: false }
  ]}),
  isDefault: true,
};
