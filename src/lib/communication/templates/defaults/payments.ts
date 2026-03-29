/**
 * Payment Templates
 */

import { DefaultTemplate } from '../types';

export const paymentConfirmationEmail: DefaultTemplate = {
  key: 'payment_confirmation_email',
  category: 'email',
  type: 'notification',
  name: 'Payment Confirmation',
  subject: 'Payment Received - {{studentName}}',
  htmlBody: `<p>Dear Parent/Guardian,</p><p>We have received your payment for <strong>{{studentName}}</strong>.</p><p><strong>Payment Details:</strong></p><ul><li>Amount: {{currency}} {{amount}}</li><li>Receipt No: {{receiptNo}}</li><li>Date: {{paymentDate}}</li><li>Payment Method: {{paymentMethod}}</li></ul>{{#if actionUrl}}<p><a href="{{actionUrl}}">View Receipt</a></p>{{/if}}`,
  textBody: `Payment Received\n\nStudent: {{studentName}}\nAmount: {{currency}} {{amount}}\nReceipt No: {{receiptNo}}\nDate: {{paymentDate}}\nMethod: {{paymentMethod}}\n{{#if actionUrl}}Receipt: {{actionUrl}}{{/if}}`,
  variablesSchema: JSON.stringify({ variables: [
    { name: 'studentName', type: 'string', required: true },
    { name: 'amount', type: 'string', required: true },
    { name: 'currency', type: 'string', required: false },
    { name: 'receiptNo', type: 'string', required: true },
    { name: 'paymentDate', type: 'string', required: true },
    { name: 'paymentMethod', type: 'string', required: true },
    { name: 'actionUrl', type: 'string', required: false }
  ]}),
  isDefault: true,
};
