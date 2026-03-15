import { sendEmail } from './email';

export interface SubscriptionSuspendedEmailData {
  schoolName: string;
  planName: string;
  overdueInvoices: any[];
  billingUrl: string;
  adminName: string;
}

export function generateSubscriptionSuspendedEmail(data: SubscriptionSuspendedEmailData) {
  const { schoolName, planName, overdueInvoices, billingUrl, adminName } = data;
  
  const subject = `Subscription Suspended - ${schoolName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Suspended - School ERP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .btn:hover { background: #c82333; }
        .suspended-badge { background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .danger { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .invoice-table th, .invoice-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .invoice-table th { background: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ Subscription Suspended</h1>
        <p>Your ${schoolName} subscription has been temporarily suspended</p>
    </div>
    
    <div class="content">
        <div class="danger">
            <h3>🚫 Immediate Action Required</h3>
            <p>Your subscription has been suspended due to overdue payments. Your access to School ERP features has been temporarily limited.</p>
        </div>

        <div class="card">
            <h2>📋 Suspension Details</h2>
            <p><strong>School:</strong> ${schoolName}</p>
            <p><strong>Plan:</strong> ${planName.toUpperCase()} <span class="suspended-badge">SUSPENDED</span></p>
            <p><strong>Reason:</strong> Payment overdue for more than 7 days</p>
            <p><strong>Status:</strong> Limited access until payment is completed</p>
        </div>

        <div class="card">
            <h2>💳 Overdue Invoices</h2>
            <p>You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length !== 1 ? 's' : ''}:</p>
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${overdueInvoices.map(inv => `
                    <tr>
                        <td>#${inv.id.slice(-8)}</td>
                        <td>₹${inv.amount.toLocaleString()}</td>
                        <td>${new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td><span style="color: #dc3545; font-weight: bold;">Overdue</span></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>🔄 How to Reactivate Your Account</h2>
            <ol>
                <li><strong>Pay Outstanding Invoices:</strong> Complete payment for all overdue invoices</li>
                <li><strong>Account Reactivation:</strong> Your account will be automatically reactivated within 1 hour of payment</li>
                <li><strong>Data Preservation:</strong> All your data is safe and will be restored upon reactivation</li>
                <li><strong>Grace Period:</strong> You have 30 days to pay before permanent cancellation</li>
            </ol>
        </div>

        <div class="card">
            <h2>⚡ Quick Actions</h2>
            <p>Click below to pay your outstanding invoices and reactivate your account immediately:</p>
            <p style="margin-top: 15px;">
                <a href="${billingUrl}" class="btn">💳 Pay Outstanding Invoices</a>
                <a href="${billingUrl}" class="btn">📞 Contact Support</a>
            </p>
        </div>

        <div class="card">
            <h2>📊 What Happens Next</h2>
            <ul>
                <li><strong>Immediately:</strong> Limited access to essential features only</li>
                <li><strong>After Payment:</strong> Full access restored within 1 hour</li>
                <li><strong>30 Days:</strong> If unpaid, subscription will be permanently cancelled</li>
                <li><strong>Data Retention:</strong> Data preserved for 60 days after cancellation</li>
            </ul>
        </div>

        <div class="warning">
            <h3>⏰ Important Timeline</h3>
            <ul>
                <li><strong>Today:</strong> Account suspended (limited access)</li>
                <li><strong>Within 1 hour of payment:</strong> Full access restored</li>
                <li><strong>30 days from suspension:</strong> Permanent cancellation if unpaid</li>
                <li><strong>60 days from cancellation:</strong> Data deletion begins</li>
            </ul>
        </div>

        <div class="card">
            <h2>📞 Need Help?</h2>
            <p>Our support team is here to help you resolve any payment issues:</p>
            <ul>
                <li><strong>Support Email:</strong> support@schoolerp.com</li>
                <li><strong>Phone:</strong> +91-XXXXXXXXXX</li>
                <li><strong>Help Center:</strong> schoolerp.com/help</li>
                <li><strong>Live Chat:</strong> Available on our website</li>
            </ul>
        </div>

        <div class="footer">
            <p>This is an automated message from School ERP.</p>
            <p>School Management System | © 2024 School ERP. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html };
}
