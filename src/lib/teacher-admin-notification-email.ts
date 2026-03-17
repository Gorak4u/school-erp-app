import { sendSchoolEmail } from './email';
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
  phone?: string;
  employeeId: string;
  department?: string;
  subject?: string;
  schoolId: string;
}

export async function sendTeacherAdminNotificationEmail(
  adminEmail: string,
  teacher: Teacher,
  user: TeacherUser | null,
  temporaryPassword: string,
  createUserAccount: boolean,
  schoolId: string
) {
  try {
    // Check if email notifications are enabled for this school
    const { isEmailNotificationEnabled } = await import('./email');
    const emailNotificationsEnabled = await isEmailNotificationEnabled(schoolId);
    
    if (!emailNotificationsEnabled) {
      console.log(`📧 Email notifications are DISABLED for school ${schoolId}. Skipping admin notification email to ${adminEmail}.`);
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

    // Build URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    let teachersPageUrl: string;
    
    if (school.domain) {
      const schoolUrl = getSubdomainUrl(school.domain);
      teachersPageUrl = `${schoolUrl}/teachers`;
    } else {
      teachersPageUrl = `${baseUrl}/teachers`;
    }

    // Generate email content
    const subject = `New Teacher Added: ${teacher.name} - ${school.name}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Teacher Added - ${school.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .credentials { background: #e8f4fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981; }
          .warning { background: #fef3c7; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .info-item { background: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-success { background: #d1fae5; color: #065f46; }
          .status-warning { background: #fef3c7; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>👨‍🏫 New Teacher Added</h1>
          <p>${teacher.name} has been added to your school</p>
        </div>
        
        <div class="content">
          <p>Dear Administrator,</p>
          
          <p>A new teacher has been successfully added to <strong>${school.name}</strong>. Here are the details:</p>
          
          <div class="info-grid">
            <div class="info-item">
              <h4>👤 Teacher Information</h4>
              <p><strong>Name:</strong> ${teacher.name}</p>
              <p><strong>Employee ID:</strong> ${teacher.employeeId}</p>
              ${teacher.email ? `<p><strong>Email:</strong> ${teacher.email}</p>` : '<p><strong>Email:</strong> <em>Not provided</em></p>'}
              ${teacher.phone ? `<p><strong>Phone:</strong> ${teacher.phone}</p>` : ''}
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
          
          <div class="status-badge ${createUserAccount ? 'status-success' : 'status-warning'}">
            ${createUserAccount ? '✅ User Account Created' : '⚠️ No User Account Created'}
          </div>
          
          ${createUserAccount && user ? `
            <div class="credentials">
              <h3>🔐 Teacher Login Credentials</h3>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${temporaryPassword}</code></p>
              <p><strong>⚠️ Important:</strong> Please share these credentials securely with the teacher. They will need to change their password after first login.</p>
            </div>
          ` : `
            <div class="warning">
              <h3>⚠️ No User Account Created</h3>
              <p><strong>Reason:</strong> Teacher email was not provided</p>
              <p>To create a login account for this teacher, you can:</p>
              <ol>
                <li>Edit the teacher record and add their email address</li>
                <li>Contact support to manually create a user account</li>
              </ol>
            </div>
          `}
          
          <div style="text-align: center;">
            <a href="${teachersPageUrl}" class="button">📋 View Teachers List</a>
          </div>
          
          <h3>📋 Next Steps</h3>
          ${createUserAccount ? `
            <ol>
              <li>Share the login credentials with the teacher</li>
              <li>Guide them to change their password after first login</li>
              <li>Assign classes and subjects if applicable</li>
              <li>Review their profile and update any missing information</li>
            </ol>
          ` : `
            <ol>
              <li>Collect the teacher's email address</li>
              <li>Edit their profile to add the email</li>
              <li>Once email is added, their user account will be created automatically</li>
              <li>Assign classes and subjects if applicable</li>
            </ol>
          `}
          
          <p>If you have any questions or need assistance, please contact the support team.</p>
          
          <div class="footer">
            <p>Best regards,<br>The ${school.name} System</p>
            <p style="font-size: 12px; color: #999;">
              This is an automated message. Please do not reply to this email.<br>
              If you didn't expect this email, please contact your system administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
New Teacher Added - ${school.name}

Dear Administrator,

A new teacher has been successfully added to ${school.name}.

TEACHER INFORMATION:
Name: ${teacher.name}
Employee ID: ${teacher.employeeId}
${teacher.email ? `Email: ${teacher.email}` : 'Email: Not provided'}
${teacher.phone ? `Phone: ${teacher.phone}` : ''}
${teacher.department ? `Department: ${teacher.department}` : ''}
${teacher.subject ? `Subject: ${teacher.subject}` : ''}

SCHOOL INFORMATION:
School: ${school.name}
${school.city ? `City: ${school.city}` : ''}
${school.state ? `State: ${school.state}` : ''}

ACCOUNT STATUS: ${createUserAccount ? 'User Account Created' : 'No User Account Created'}

${createUserAccount && user ? `
LOGIN CREDENTIALS:
Email: ${user.email}
Temporary Password: ${temporaryPassword}

Please share these credentials securely with the teacher.
` : `
NO USER ACCOUNT CREATED:
Reason: Teacher email was not provided

To create a login account:
1. Edit the teacher record and add their email address
2. Contact support to manually create a user account
`}

View teachers list: ${teachersPageUrl}

NEXT STEPS:
${createUserAccount ? `
1. Share login credentials with the teacher
2. Guide them to change their password after first login
3. Assign classes and subjects if applicable
4. Review their profile and update any missing information
` : `
1. Collect the teacher's email address
2. Edit their profile to add the email
3. Once email is added, their user account will be created automatically
4. Assign classes and subjects if applicable
`}

Best regards,
The ${school.name} System
`;

    // Send email using school SMTP
    const emailResult = await sendSchoolEmail({
      to: adminEmail,
      subject,
      html: htmlContent,
      schoolId,
    });

    if (emailResult.success) {
      console.log(`✅ Teacher admin notification email sent successfully to ${adminEmail}`);
      return { success: true };
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }

  } catch (error) {
    console.error('Failed to send teacher admin notification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
