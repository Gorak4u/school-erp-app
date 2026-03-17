import { sendEmail } from './email';
import { schoolPrisma } from './prisma';
import { getSubdomainUrl } from './subdomain';

interface TeacherUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department?: string;
  subject?: string;
  schoolId: string;
}

export async function sendTeacherWelcomeEmail(
  user: TeacherUser,
  teacher: Teacher,
  temporaryPassword: string,
  schoolId: string
) {
  try {
    // Check if email notifications are enabled for this school
    const { isEmailNotificationEnabled } = await import('./email');
    const emailNotificationsEnabled = await isEmailNotificationEnabled(schoolId);
    
    if (!emailNotificationsEnabled) {
      console.log(`📧 Email notifications are DISABLED for school ${schoolId}. Skipping teacher welcome email to ${user.email}.`);
      return { success: true, skipped: true, reason: 'Email notifications disabled' };
    }

    // Get school details
    const school = await (schoolPrisma as any).school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        domain: true,
        email: true,
        phone: true,
        city: true,
        state: true,
      }
    });

    if (!school) {
      throw new Error(`School not found: ${schoolId}`);
    }

    // Build URLs - use domain if available, otherwise main domain
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    let loginUrl: string;
    let dashboardUrl: string;
    
    if (school.domain) {
      const schoolUrl = getSubdomainUrl(school.domain);
      loginUrl = `${schoolUrl}/school-login`;
      dashboardUrl = `${schoolUrl}/dashboard`;
    } else {
      loginUrl = `${baseUrl}/login`;
      dashboardUrl = `${baseUrl}/dashboard`;
    }

    // Generate email content
    const subject = `Welcome to ${school.name} - Your Teacher Account`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${school.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .credentials { background: #e8f4fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .info-item { background: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 Welcome to ${school.name}!</h1>
          <p>Your teacher account has been created</p>
        </div>
        
        <div class="content">
          <p>Dear ${user.firstName} ${user.lastName},</p>
          
          <p>We're excited to have you join our teaching team at ${school.name}. Your teacher account has been successfully created and you can now access our school management system.</p>
          
          <div class="credentials">
            <h3>🔐 Your Login Credentials</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${temporaryPassword}</code></p>
            <p><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">🚀 Login to Your Account</a>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <h4>👤 Your Details</h4>
              <p><strong>Name:</strong> ${teacher.name}</p>
              <p><strong>Employee ID:</strong> ${teacher.employeeId}</p>
              ${teacher.department ? `<p><strong>Department:</strong> ${teacher.department}</p>` : ''}
              ${teacher.subject ? `<p><strong>Subject:</strong> ${teacher.subject}</p>` : ''}
            </div>
            
            <div class="info-item">
              <h4>🏫 School Information</h4>
              <p><strong>School:</strong> ${school.name}</p>
              ${school.city ? `<p><strong>City:</strong> ${school.city}</p>` : ''}
              ${school.state ? `<p><strong>State:</strong> ${school.state}</p>` : ''}
              ${school.phone ? `<p><strong>Phone:</strong> ${school.phone}</p>` : ''}
            </div>
          </div>
          
          <h3>📚 What You Can Do</h3>
          <ul>
            <li>📅 Manage your class schedule and timetable</li>
            <li>📝 Mark student attendance</li>
            <li>📚 Create and manage lesson plans</li>
            <li>📋 Create assignments and grade submissions</li>
            <li>📊 View analytics and performance reports</li>
            <li>🏖️ Apply for leave and manage your profile</li>
          </ul>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Click the login button above</li>
            <li>Use your email and temporary password to login</li>
            <li>Change your password immediately</li>
            <li>Explore your dashboard and familiarize yourself with the system</li>
          </ol>
          
          <p>If you have any questions or need assistance, please contact the school administration.</p>
          
          <div class="footer">
            <p>Best regards,<br>The ${school.name} Team</p>
            <p style="font-size: 12px; color: #999;">
              This is an automated message. Please do not reply to this email.<br>
              If you didn't expect this email, please contact your school administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to ${school.name}!

Dear ${user.firstName} ${user.lastName},

We're excited to have you join our teaching team at ${school.name}. Your teacher account has been successfully created.

LOGIN CREDENTIALS:
Email: ${user.email}
Temporary Password: ${temporaryPassword}

Please login at: ${loginUrl}
After logging in, please change your password for security.

YOUR DETAILS:
Name: ${teacher.name}
Employee ID: ${teacher.employeeId}
${teacher.department ? `Department: ${teacher.department}` : ''}
${teacher.subject ? `Subject: ${teacher.subject}` : ''}

SCHOOL INFORMATION:
School: ${school.name}
${school.city ? `City: ${school.city}` : ''}
${school.state ? `State: ${school.state}` : ''}
${school.phone ? `Phone: ${school.phone}` : ''}

WHAT YOU CAN DO:
- Manage your class schedule and timetable
- Mark student attendance
- Create and manage lesson plans
- Create assignments and grade submissions
- View analytics and performance reports
- Apply for leave and manage your profile

If you need assistance, please contact your school administrator.

Best regards,
The ${school.name} Team
`;

    // Send email
    const emailResult = await sendEmail({
      to: user.email,
      subject,
      html: htmlContent,
    });

    if (emailResult.success) {
      console.log(`✅ Teacher welcome email sent successfully to ${user.email}`);
      return { success: true };
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }

  } catch (error) {
    console.error('Failed to send teacher welcome email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
