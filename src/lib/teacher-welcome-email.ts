import { sendSchoolEmail } from './email';
import { logger } from './logger';
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
  designation?: string;
  schoolId: string;
}

interface School {
  id: string;
  name: string;
  domain?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  logo?: string;
  theme?: string;
}

async function buildTeacherIdCardAttachment(user: TeacherUser, teacher: Teacher, school: School): Promise<Buffer> {
  // Import the server-side ID card generator that matches staff page design
  const { generateTeacherIdCardPDFServer } = await import('./teacherIdCardServer');
  
  // Create the same schoolConfig structure as used in staff page
  const schoolConfig = {
    school: {
      name: school?.name || 'School'
    },
    schoolDetails: {
      logo_url: school?.logo
    }
  };

  // Generate the same ID card PDF as staff page (server-compatible version)
  const pdfBuffer = await generateTeacherIdCardPDFServer(teacher, schoolConfig);
  
  return pdfBuffer;
}

function resolveAbsoluteUrl(baseUrl: string, url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
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
      logger.info(`Email notifications disabled for school ${schoolId}`, {
        userEmail: user.email,
        reason: 'Email notifications disabled'
      });
      return { success: true, skipped: true, reason: 'Email notifications disabled' };
    }

    // Get school details
    const school = await (schoolPrisma as any).school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        slug: true,
        domain: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        pinCode: true,
        logo: true,
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
      loginUrl = `${baseUrl}/school-login`;
      dashboardUrl = `${baseUrl}/dashboard`;
    }

    const schoolAddress = [school.address, school.city, school.state, school.pinCode]
      .filter(Boolean)
      .join(', ');

    let teacherIdCardPdf: Buffer | null = null;
    try {
      teacherIdCardPdf = await buildTeacherIdCardAttachment(user, teacher, school);
    } catch (attachmentError) {
      logger.error('Failed to generate teacher ID card attachment', { error: attachmentError, userId: user.id, schoolId });
    }

    const schoolLogoUrl = resolveAbsoluteUrl(baseUrl, school.logo);

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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; padding: 20px; background: #f3f4f6; }
          .shell { background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.10); }
          .header { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #7c3aed 100%); color: white; padding: 28px; text-align: center; }
          .brand { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 14px; }
          .logo { width: 54px; height: 54px; object-fit: contain; border-radius: 14px; background: rgba(255,255,255,0.16); padding: 6px; border: 1px solid rgba(255,255,255,0.18); }
          .content { background: #ffffff; padding: 28px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 28px; text-decoration: none; border-radius: 12px; margin: 18px 0; font-weight: 700; }
          .credentials { background: #eff6ff; padding: 20px; border-radius: 16px; margin: 20px 0; border: 1px solid #bfdbfe; }
          .credentials code { background: #dbeafe; padding: 2px 8px; border-radius: 999px; }
          .footer { text-align: center; margin-top: 26px; padding-top: 18px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0; }
          .info-item { background: #f9fafb; padding: 15px; border-radius: 14px; border: 1px solid #e5e7eb; }
          .badge { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #dcfce7; color: #166534; }
        </style>
      </head>
      <body>
        <div class="shell">
        <div class="header">
          <div class="brand">
            ${schoolLogoUrl ? `<img src="${schoolLogoUrl}" alt="${school.name}" class="logo" />` : ''}
            <div>
              <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.9;">Staff Welcome</div>
              <h1 style="margin: 4px 0 0; font-size: 28px;">${school.name}</h1>
            </div>
          </div>
          <p style="margin: 0; opacity: 0.95;">Your teacher account has been created successfully</p>
        </div>

        <div class="content">
          <p>Dear ${user.firstName} ${user.lastName},</p>
          
          <p>We're excited to have you join our teaching team at ${school.name}. Your teacher account has been successfully created and you can now access our school management system.</p>
          ${schoolAddress ? `<p style="margin-top: -4px; color: #6b7280; font-size: 13px;">${schoolAddress}</p>` : ''}
          
          <div class="credentials">
            <h3>🔐 Your Login Credentials</h3>
            <p><strong>Login Options (use either one):</strong></p>
            <p>
              <strong>📧 Email:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${user.email}</code><br>
              <strong>🆔 Employee ID:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${teacher.employeeId}</code>
            </p>
            <p><strong>Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${temporaryPassword}</code></p>
            <p><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
          </div>
          
          <div class="badge">✅ Teacher ID card attached</div>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">🚀 Login to Your Account</a>
            <div style="height: 8px;"></div>
            <a href="${dashboardUrl}" class="button" style="background:#7c3aed;">📊 Open Dashboard</a>
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
              ${school.pinCode ? `<p><strong>PIN:</strong> ${school.pinCode}</p>` : ''}
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
        </div>
      </body>
      </html>
    `;

    // Send email using school SMTP
    const emailResult = await sendSchoolEmail({
      to: user.email,
      subject,
      html: htmlContent,
      schoolId,
      attachments: teacherIdCardPdf ? [
        {
          filename: `Teacher_ID_Card_${teacher.employeeId}.pdf`,
          content: teacherIdCardPdf,
          contentType: 'application/pdf',
        },
      ] : undefined,
    });

    if (emailResult.success) {
      logger.info('Teacher welcome email sent successfully', { userEmail: user.email, schoolId });
      return { success: true };
    } else {
      logger.error('Teacher welcome email send failed', { error: emailResult.error, userEmail: user.email, schoolId });
      return { success: false, error: emailResult.error || 'Failed to send email' };
    }

  } catch (error) {
    logger.error('Failed to send teacher welcome email', { error, userEmail: user.email, schoolId });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
