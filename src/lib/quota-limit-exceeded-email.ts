import { prisma } from '@/lib/prisma';

export interface QuotaLimitExceededEmailData {
  adminUser: any;
  school: any;
  subscription: any;
  studentsUsed: number;
  teachersUsed: number;
  studentsLimit: number;
  teachersLimit: number;
  exceededResources: string[];
  lastCheckedDate: string;
}

export function generateQuotaLimitExceededEmail(data: QuotaLimitExceededEmailData): string {
  const { adminUser, school, subscription, studentsUsed, teachersUsed, studentsLimit, teachersLimit, exceededResources, lastCheckedDate } = data;

  const studentUsagePercent = Math.round((studentsUsed / studentsLimit) * 100);
  const teacherUsagePercent = Math.round((teachersUsed / teachersLimit) * 100);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚠️ Quota Limit Exceeded - Action Required</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
        .alert { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .usage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .usage-item { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .usage-item h4 { margin: 0 0 10px 0; color: #374151; }
        .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: #ef4444; transition: width 0.3s ease; }
        .btn { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
        .btn:hover { background: #dc2626; }
        .btn-secondary { background: #6b7280; }
        .btn-secondary:hover { background: #4b5563; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .warning-icon { font-size: 48px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="warning-icon">⚠️</div>
            <h1>Quota Limit Exceeded</h1>
            <p>Action Required for ${school.name}</p>
        </div>
        
        <div class="content">
            <p>Dear ${adminUser.firstName || adminUser.email},</p>
            
            <div class="alert">
                <h3>🚨 Immediate Action Required</h3>
                <p>Your school has exceeded one or more quota limits for your <strong>${subscription.plan.toUpperCase()}</strong> plan. This may affect your ability to add new students or teachers.</p>
            </div>

            <h3>📊 Current Usage Overview</h3>
            <div class="usage-grid">
                <div class="usage-item">
                    <h4>👥 Students</h4>
                    <p><strong>${studentsUsed} / ${studentsLimit}</strong> (${studentUsagePercent}% used)</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(studentUsagePercent, 100)}%"></div>
                    </div>
                    <p style="color: #ef4444; font-weight: 600;">${studentsUsed >= studentsLimit ? 'LIMIT EXCEEDED' : 'Near Limit'}</p>
                </div>
                
                <div class="usage-item">
                    <h4>👨‍🏫 Teachers</h4>
                    <p><strong>${teachersUsed} / ${teachersLimit}</strong> (${teacherUsagePercent}% used)</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(teacherUsagePercent, 100)}%"></div>
                    </div>
                    <p style="color: #ef4444; font-weight: 600;">${teachersUsed >= teachersLimit ? 'LIMIT EXCEEDED' : 'Near Limit'}</p>
                </div>
            </div>

            <h3>🚨 Exceeded Resources</h3>
            <ul style="background: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
                ${exceededResources.map(resource => `<li style="color: #ef4444; font-weight: 600;">${resource}</li>`).join('')}
            </ul>

            <h3>⚡ Immediate Actions Required</h3>
            <ol>
                <li><strong>Upgrade Your Plan</strong> - Increase your limits to continue adding students/teachers</li>
                <li><strong>Review Usage</strong> - Check if any inactive accounts can be removed</li>
                <li><strong>Plan Ahead</strong> - Consider your growth needs when choosing a new plan</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://your-school-domain.com/billing" class="btn">🚀 Upgrade Plan Now</a>
                <a href="https://your-school-domain.com/subscription" class="btn btn-secondary">📊 View Subscription</a>
            </div>

            <h3>📈 Available Plans</h3>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                <div style="margin-bottom: 15px;">
                    <strong>Basic Plan:</strong> 200 students, 20 teachers - ₹999/month
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Premium Plan:</strong> 500 students, 50 teachers - ₹2,999/month  
                </div>
                <div>
                    <strong>Enterprise Plan:</strong> Unlimited students & teachers - ₹9,999/month
                </div>
            </div>

            <h3>❓ What Happens If You Don't Upgrade?</h3>
            <ul style="color: #6b7280;">
                <li>You won't be able to add new students or teachers</li>
                <li>Current operations continue normally</li>
                <li>Existing data remains safe and accessible</li>
                <li>No impact on current student/teacher accounts</li>
            </ul>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3>💡 Need Help?</h3>
                <p>Our support team is here to help you choose the right plan for your school's needs:</p>
                <ul>
                    <li>📧 Email: support@schoolerp.com</li>
                    <li>📞 Phone: +91-XXX-XXX-XXXX</li>
                    <li>💬 Live Chat: Available on your dashboard</li>
                </ul>
            </div>

            <p style="color: #6b7280; font-size: 12px;">
                Last checked: ${new Date(lastCheckedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
            </p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from School ERP System.</p>
            <p>If you have questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
  `;
}

export async function sendQuotaLimitExceededEmail(
  adminUser: any,
  school: any,
  subscription: any,
  studentsUsed: number,
  teachersUsed: number,
  studentsLimit: number,
  teachersLimit: number,
  exceededResources: string[],
  lastCheckedDate: string
): Promise<boolean> {
  try {
    const emailData: QuotaLimitExceededEmailData = {
      adminUser,
      school,
      subscription,
      studentsUsed,
      teachersUsed,
      studentsLimit,
      teachersLimit,
      exceededResources,
      lastCheckedDate
    };

    const htmlContent = generateQuotaLimitExceededEmail(emailData);

    // In production, integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll log the email content
    console.log('📧 QUOTA LIMIT EXCEEDED EMAIL:');
    console.log(`To: ${adminUser.email}`);
    console.log(`Subject: ⚠️ Quota Limit Exceeded - Action Required - ${school.name}`);
    console.log(`School: ${school.name}`);
    console.log(`Plan: ${subscription.plan}`);
    console.log(`Students: ${studentsUsed}/${studentsLimit} (${Math.round((studentsUsed/studentsLimit)*100)}%)`);
    console.log(`Teachers: ${teachersUsed}/${teachersLimit} (${Math.round((teachersUsed/teachersLimit)*100)}%)`);
    console.log(`Exceeded: ${exceededResources.join(', ')}`);
    
    // TODO: Implement actual email sending
    // await emailService.send({
    //   to: adminUser.email,
    //   subject: `⚠️ Quota Limit Exceeded - Action Required - ${school.name}`,
    //   html: htmlContent
    // });

    return true;
  } catch (error) {
    console.error('Failed to send quota limit exceeded email:', error);
    return false;
  }
}
