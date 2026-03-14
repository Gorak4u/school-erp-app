import { School, Subscription, User } from '@prisma/client';

export interface WelcomeEmailData {
  user: User;
  school: School;
  subscription: Subscription;
  loginUrl: string;
  dashboardUrl: string;
  paymentUrl?: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData) {
  const { user, school, subscription, loginUrl, dashboardUrl, paymentUrl } = data;
  
  const isTrial = subscription.plan === 'trial';
  const isPaid = subscription.plan === 'pro' || subscription.plan === 'premium';
  const trialDays = subscription.trialEndsAt 
    ? Math.ceil((new Date(subscription.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const subject = `Welcome to School ERP - ${school.name} is Ready!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to School ERP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .btn:hover { background: #5a6fd8; }
        .feature { margin: 15px 0; }
        .feature strong { color: #667eea; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        .trial-badge { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .paid-badge { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Welcome to School ERP</h1>
        <p>Your school management system is ready!</p>
    </div>
    
    <div class="content">
        <div class="card">
            <h2>🏫 School Details</h2>
            <p><strong>School Name:</strong> ${school.name}</p>
            <p><strong>Account Email:</strong> ${user.email}</p>
            <p><strong>Admin Name:</strong> ${user.firstName} ${user.lastName}</p>
        </div>

        <div class="card">
            <h2>🔐 Login Credentials</h2>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> [Use the password you created during registration]</p>
            <p style="margin-top: 15px;">
                <a href="${loginUrl}" class="btn">🚀 Login Now</a>
            </p>
        </div>

        <div class="card">
            <h2>💳 Subscription Details</h2>
            <p>
                <strong>Plan:</strong> ${subscription.plan.toUpperCase()}
                ${isTrial ? '<span class="trial-badge">TRIAL</span>' : ''}
                ${isPaid ? '<span class="paid-badge">PAID</span>' : ''}
            </p>
            <p><strong>Status:</strong> ${subscription.status}</p>
            ${isTrial ? `<p><strong>Trial Period:</strong> ${trialDays} days remaining</p>` : ''}
            <p><strong>Student Limit:</strong> ${subscription.maxStudents}</p>
            <p><strong>Teacher Limit:</strong> ${subscription.maxTeachers}</p>
            ${isPaid && paymentUrl ? `<p><strong>Manage Billing:</strong> <a href="${paymentUrl}">Payment Settings</a></p>` : ''}
        </div>

        ${isTrial ? `
        <div class="card">
            <h2>💰 Upgrade Your Plan</h2>
            <p>Your trial includes all features. When it ends, choose a plan that fits your needs:</p>
            <ul>
                <li><strong>Basic:</strong> Perfect for small schools (100 students)</li>
                <li><strong>Pro:</strong> Great for growing schools (500 students)</li>
                <li><strong>Premium:</strong> Unlimited students + priority support</li>
            </ul>
            ${paymentUrl ? `<a href="${paymentUrl}" class="btn">💳 Upgrade Now</a>` : ''}
        </div>
        ` : ''}

        <div class="card">
            <h2>📋 Quick Setup Guide</h2>
            <div class="feature">
                <strong>1. Configure School Settings</strong><br>
                Set up academic years, classes, sections, and school timings
            </div>
            <div class="feature">
                <strong>2. Add Teachers & Staff</strong><br>
                Create accounts for your teachers and administrative staff
            </div>
            <div class="feature">
                <strong>3. Register Students</strong><br>
                Add student information and assign them to classes
            </div>
            <div class="feature">
                <strong>4. Set Up Fee Structure</strong><br>
                Define fee categories and payment schedules
            </div>
            <div class="feature">
                <strong>5. Explore Features</strong><br>
                Attendance, exams, reports, and communication tools
            </div>
            <p style="margin-top: 15px;">
                <a href="${dashboardUrl}" class="btn">📊 Go to Dashboard</a>
            </p>
        </div>

        <div class="card">
            <h2>🎯 What You Can Do</h2>
            <ul>
                <li><strong>Student Management:</strong> Complete student profiles with photos and documents</li>
                <li><strong>Attendance Tracking:</strong> Daily attendance with automated reports</li>
                <li><strong>Fee Management:</strong> Online payments, receipts, and due date reminders</li>
                <li><strong>Exam & Results:</strong> Create exams, enter marks, generate report cards</li>
                <li><strong>Communication:</strong> Email/SMS notifications to parents and students</li>
                <li><strong>Reports & Analytics:</strong> Comprehensive reports for management</li>
            </ul>
        </div>

        ${isPaid ? `
        <div class="card">
            <h2>💳 Payment Information</h2>
            <p>Your paid subscription is active. You can:</p>
            <ul>
                <li>View payment history and receipts</li>
                <li>Update payment methods</li>
                <li>Upgrade or downgrade your plan</li>
                <li>Download invoices for accounting</li>
            </ul>
            ${paymentUrl ? `<a href="${paymentUrl}" class="btn">💳 Manage Billing</a>` : ''}
        </div>
        ` : ''}
    </div>

    <div class="footer">
        <p>Need help? Reply to this email or contact our support team</p>
        <p>© 2026 School ERP. All rights reserved.</p>
    </div>
</body>
</html>
  `;

  return { subject, html };
}
