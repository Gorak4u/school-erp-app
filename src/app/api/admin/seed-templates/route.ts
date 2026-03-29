/**
 * API Route to seed default communication templates
 * 
 * POST /api/admin/seed-templates
 * 
 * This endpoint seeds the default templates into the database
 * so they can be customized per school.
 * 
 * Following the same pattern as /api/plans/seed-defaults
 */

import { NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// Default communication templates - hardcoded like SaaS plans
const DEFAULT_TEMPLATES = [
  {
    key: 'student_welcome_email',
    category: 'email',
    type: 'welcome',
    name: 'Student Welcome',
    description: 'Welcome email sent to parents when student is admitted',
    subject: 'Welcome to {{schoolName}} - Admission Confirmed',
    htmlBody: `<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We are delighted to welcome <strong style="color: #1e293b;">{{studentName}}</strong> to our school family! 
      The admission has been successfully completed for academic year {{academicYear}}.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px;"><strong>Admission Number:</strong> {{admissionNo}}</p>
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px;"><strong>Student Name:</strong> {{studentName}}</p>
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px;"><strong>Section:</strong> {{section}}</p>
      <p style="margin: 0; color: #374151; font-size: 13px;"><strong>Date of Admission:</strong> {{formatDate admissionDate "medium"}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      We look forward to a wonderful journey together. Please visit the school office 
      to complete any pending documentation and collect the student kit.
    </p>
    
    {{#if orientationDate}}
    <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1e40af; font-size: 14px;">📅 Orientation Session</p>
      <p style="margin: 0; color: #374151; font-size: 13px;">
        Date: {{formatDate orientationDate "long"}}<br>
        Time: {{orientationTime}}<br>
        Venue: {{orientationVenue}}
      </p>
    </div>
    {{/if}}`,
    textBody: `Dear Parent,\n\nWelcome to {{schoolName}}! {{studentName}} has been successfully admitted.\n\nAdmission Details:\n- Admission Number: {{admissionNo}}\n- Student Name: {{studentName}}\n- Class: {{className}}\n- Section: {{section}}\n- Date of Admission: {{admissionDate}}\n\n{{#if orientationDate}}\nOrientation Session:\nDate: {{orientationDate}}\nTime: {{orientationTime}}\nVenue: {{orientationVenue}}\n{{/if}}\n\nFor any queries, please contact the school office.`,
    variablesSchema: JSON.stringify({
      variables: [
        { name: 'studentName', type: 'string', required: true },
        { name: 'admissionNo', type: 'string', required: true },
        { name: 'className', type: 'string', required: true },
        { name: 'section', type: 'string', required: true },
        { name: 'academicYear', type: 'string', required: true },
        { name: 'admissionDate', type: 'date', required: true },
        { name: 'orientationDate', type: 'date', required: false },
        { name: 'orientationTime', type: 'string', required: false },
        { name: 'orientationVenue', type: 'string', required: false }
      ]
    }),
    primaryColor: '#2563eb',
    accentColor: '#1e40af',
    isDefault: true,
    isActive: true,
    version: 1,
    smsBody: null
  },
  {
    key: 'fine_waiver_approved_email',
    category: 'email',
    type: 'approval',
    name: 'Fine Waiver Approved',
    description: 'Notification when fine waiver request is approved',
    subject: 'Fine Waiver Approved - {{studentName}} | {{fineNumber}}',
    htmlBody: `<div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px; text-align: center;">
      <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 600;">✅ Waiver Approved</p>
      <p style="margin: 0; color: #059669; font-size: 28px; font-weight: 700;">{{formatCurrency waivedAmount}}</p>
      <p style="margin: 8px 0 0; color: #065f46; font-size: 13px;">Fine #{{fineNumber}}</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Your fine waiver request has been approved. The waived amount has been applied to your fine record.
    </p>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Fine Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Number:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineNumber}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Original Amount:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{formatCurrency originalAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Waived Amount:</td><td style="padding: 6px 0; color: #059669; text-align: right; font-weight: 600;">- {{formatCurrency waivedAmount}}</td></tr>
        <tr style="border-top: 2px solid #e2e8f0;"><td style="padding: 12px 0 6px; color: #1e293b; font-weight: 600;">Pending Amount:</td><td style="padding: 12px 0 6px; color: #1e293b; text-align: right; font-weight: 700; font-size: 16px;">{{formatCurrency pendingAmount}}</td></tr>
      </table>
    </div>
    
    {{#if remarks}}
    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 4px; color: #374151; font-size: 12px; font-weight: 600;">Remarks from Reviewer:</p>
      <p style="margin: 0; color: #4b5563; font-size: 13px;">{{remarks}}</p>
    </div>
    {{/if}}`,
    textBody: `Fine Waiver Approved ✅\n\nYour fine waiver request has been approved.\n\nFine Details:\n- Student: {{studentName}}\n- Fine Number: {{fineNumber}}\n- Fine Type: {{fineType}}\n- Original Amount: {{formatCurrency originalAmount}}\n- Waived Amount: {{formatCurrency waivedAmount}}\n- Pending Amount: {{formatCurrency pendingAmount}}\n\n{{#if remarks}}Remarks: {{remarks}}{{/if}}\n\nThe fine status has been updated in your account.`,
    variablesSchema: JSON.stringify({
      variables: [
        { name: 'studentName', type: 'string', required: true },
        { name: 'fineNumber', type: 'string', required: true },
        { name: 'fineType', type: 'string', required: true },
        { name: 'originalAmount', type: 'number', required: true },
        { name: 'waivedAmount', type: 'number', required: true },
        { name: 'pendingAmount', type: 'number', required: true },
        { name: 'remarks', type: 'string', required: false }
      ]
    }),
    primaryColor: '#10b981',
    accentColor: '#059669',
    isDefault: true,
    isActive: true,
    version: 1,
    smsBody: null
  },
  {
    key: 'fine_waiver_request_email',
    category: 'email',
    type: 'approval',
    name: 'Fine Waiver Request',
    description: 'Notification to administrators for fine waiver approval',
    subject: 'Action Required: Fine Waiver Request - {{studentName}}',
    htmlBody: `<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">⏳ Pending Approval</p>
      <p style="margin: 0; color: #78350f; font-size: 20px; font-weight: 700;">Fine Waiver Request</p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      A fine waiver request has been submitted and requires your review and approval.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b; font-size: 14px;">Request Details</p>
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 50%;">Student Name:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{studentName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{admissionNo}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Class/Section:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{className}} - {{section}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Number:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineNumber}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Type:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{fineType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Fine Amount:</td><td style="padding: 6px 0; color: #dc2626; text-align: right; font-weight: 600;">{{formatCurrency fineAmount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Requested By:</td><td style="padding: 6px 0; color: #1e293b; text-align: right; font-weight: 500;">{{requesterName}}</td></tr>
      </table>
    </div>
    
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">Reason for Waiver:</p>
      <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">{{reason}}</p>
    </div>`,
    textBody: `Fine Waiver Request - Action Required\n\nA waiver request has been submitted for your review.\n\nStudent Details:\n- Name: {{studentName}}\n- Admission No: {{admissionNo}}\n- Class: {{className}} - {{section}}\n\nFine Details:\n- Fine Number: {{fineNumber}}\n- Fine Type: {{fineType}}\n- Amount: {{formatCurrency fineAmount}}\n\nRequest Details:\n- Requested By: {{requesterName}}\n- Reason: {{reason}}\n\nPlease review this request.`,
    variablesSchema: JSON.stringify({
      variables: [
        { name: 'studentName', type: 'string', required: true },
        { name: 'admissionNo', type: 'string', required: true },
        { name: 'className', type: 'string', required: true },
        { name: 'section', type: 'string', required: true },
        { name: 'fineNumber', type: 'string', required: true },
        { name: 'fineType', type: 'string', required: true },
        { name: 'fineAmount', type: 'number', required: true },
        { name: 'requesterName', type: 'string', required: true },
        { name: 'reason', type: 'string', required: true }
      ]
    }),
    primaryColor: '#f59e0b',
    accentColor: '#d97706',
    isDefault: true,
    isActive: true,
    version: 1,
    smsBody: null
  },
  {
    key: 'password_reset_email',
    category: 'email',
    type: 'system',
    name: 'Password Reset',
    description: 'Password reset email with secure link',
    subject: 'Password Reset Request - {{schoolName}}',
    htmlBody: `<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      Hi {{userName}},<br><br>
      We received a request to reset the password for your account.
    </p>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        ⏰ This link expires in <strong>1 hour</strong>
      </p>
    </div>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); text-align: center;">
          <a href="{{resetUrl}}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
            Reset My Password
          </a>
        </td>
      </tr>
    </table>`,
    textBody: `Hi {{userName}},\n\nPassword Reset Request\n\nWe received a request to reset your password. Click the link below:\n\n{{resetUrl}}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can ignore this email.`,
    variablesSchema: JSON.stringify({
      variables: [
        { name: 'userName', type: 'string', required: true },
        { name: 'resetUrl', type: 'string', required: true }
      ]
    }),
    primaryColor: '#2563eb',
    accentColor: '#1e40af',
    isDefault: true,
    isActive: true,
    version: 1,
    smsBody: null
  }
];

export async function GET() {
  // Redirect to POST handler with bypass auth for easier testing
  return POST();
}

export async function POST() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Only super admins can seed templates
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Only super admins can seed default templates' 
      }, { status: 403 });
    }

    const results = [];

    for (const template of DEFAULT_TEMPLATES) {
      // Check if template already exists
      const existing = await (schoolPrisma as any).CommunicationTemplate.findFirst({
        where: {
          schoolId: null,
          key: template.key
        }
      });

      if (existing) {
        // Update if version changed
        if ((template.version || 1) > (existing.version || 1)) {
          await (schoolPrisma as any).CommunicationTemplate.update({
            where: { id: existing.id },
            data: {
              category: template.category,
              type: template.type,
              name: template.name,
              description: template.description,
              subject: template.subject,
              htmlBody: template.htmlBody,
              textBody: template.textBody,
              smsBody: template.smsBody,
              variablesSchema: template.variablesSchema,
              primaryColor: template.primaryColor,
              accentColor: template.accentColor,
              isDefault: true,
              isActive: true,
              version: template.version || 1,
              updatedAt: new Date()
            }
          });
          results.push({ key: template.key, status: 'updated', id: existing.id });
        } else {
          results.push({ key: template.key, status: 'already_exists', id: existing.id });
        }
        continue;
      }

      // Create new template
      const created = await (schoolPrisma as any).CommunicationTemplate.create({
        data: {
          schoolId: null, // Global template
          category: template.category,
          type: template.type,
          key: template.key,
          name: template.name,
          description: template.description,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          smsBody: template.smsBody,
          variablesSchema: template.variablesSchema,
          primaryColor: template.primaryColor,
          accentColor: template.accentColor,
          isDefault: true,
          isActive: true,
          version: template.version || 1
        }
      });

      results.push({ key: template.key, status: 'created', id: created.id });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Templates seeded successfully',
      results 
    });

  } catch (err: any) {
    console.error('POST /api/admin/seed-templates:', err);
    return NextResponse.json({ 
      error: 'Failed to seed templates',
      details: err?.message 
    }, { status: 500 });
  }
}
