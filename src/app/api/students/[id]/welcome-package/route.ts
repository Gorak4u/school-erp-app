// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { enqueueEmailBatch } from '@/lib/queues/emailQueue';

function fmtCurrency(value: number | string | undefined | null) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function buildAdmissionPackageHtml({
  greetingName,
  studentName,
  admissionNo,
  className,
  schoolName,
  previewSummary,
  transport,
  isParent,
}: any) {
  const transportHtml = transport?.route?.routeName || transport?.routeName
    ? `
      <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
        <strong style="color: #e2e8f0;">Transport:</strong> ${transport?.route?.routeName || transport?.routeName || 'Assigned'}
      </p>
    `
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#0f172a; border-radius: 18px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 26px;">${schoolName}</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Admission Completed Successfully</p>
      </div>
      <div style="padding: 32px; color: #e2e8f0;">
        <p style="font-size: 16px; margin-top: 0;">Dear ${greetingName || (isParent ? 'Parent' : studentName)},</p>
        <p style="font-size: 14px; line-height: 1.7; color: #94a3b8;">
          ${isParent
            ? `We are pleased to inform you that <strong style="color:#e2e8f0;">${studentName}</strong> has been admitted successfully.`
            : `Congratulations! Your admission has been completed successfully.`}
        </p>
        <div style="background: #111827; border: 1px solid #1e3a8a; padding: 20px; border-radius: 14px; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Student Name:</strong> ${studentName}
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Admission Number:</strong> ${admissionNo}
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Class:</strong> ${className}
          </p>
          ${transportHtml}
          <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;">
            <strong style="color: #e2e8f0;">Total Annual Payable:</strong> ${fmtCurrency(previewSummary?.grandTotal)}
          </p>
        </div>
        <div style="background: #1e293b; border-radius: 14px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px; color: #fff; font-size: 16px;">Attachments Included</h3>
          <ul style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 14px; line-height: 1.7;">
            <li>Admission preview document</li>
            <li>Student ID card document</li>
          </ul>
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #94a3b8;">
          Please keep these documents for your records. If you need any help with onboarding, fee payment, or transport coordination, contact the school administration.
        </p>
        <p style="font-size: 14px; line-height: 1.7; color: #94a3b8; margin-top: 24px;">
          Best regards,<br />
          <strong style="color:#fff;">${schoolName}</strong><br />
          Administration Team
        </p>
      </div>
    </div>
  `;
}

async function getSchoolDisplayName(schoolId: string | null): Promise<string> {
  if (!schoolId) return 'Our School';
  try {
    const settings = await (schoolPrisma as any).schoolSetting.findMany({
      where: { schoolId, group: 'school_details', key: { in: ['name', 'school_name'] } },
    });
    const byKey = new Map(settings.map((setting: any) => [setting.key, setting.value]));
    return byKey.get('name') || byKey.get('school_name') || 'Our School';
  } catch (error) {
    console.error('Failed to fetch school name for welcome package:', error);
    return 'Our School';
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();

    const student = await (schoolPrisma as any).student.findFirst({
      where: { id, ...tenantWhere(ctx) },
      select: {
        id: true,
        name: true,
        admissionNo: true,
        class: true,
        section: true,
        email: true,
        phone: true,
        parentEmail: true,
        parentName: true,
        fatherEmail: true,
        fatherName: true,
        motherEmail: true,
        motherName: true,
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const schoolName = await getSchoolDisplayName(ctx.schoolId);
    const attachments = [
      body.previewDocumentHtml ? {
        filename: `Admission_Preview_${student.admissionNo}.html`,
        content: body.previewDocumentHtml,
        contentType: 'text/html; charset=utf-8',
      } : null,
      body.idCardHtml ? {
        filename: `Student_ID_Card_${student.admissionNo}.html`,
        content: body.idCardHtml,
        contentType: 'text/html; charset=utf-8',
      } : null,
    ].filter(Boolean);

    const jobs: any[] = [];
    const seen = new Set<string>();
    const className = [student.class, student.section].filter(Boolean).join(' - ') || student.class || 'Assigned Class';
    const previewSummary = body.previewSummary || {};

    const pushJob = (email: string | undefined, greetingName: string | undefined, isParent: boolean) => {
      const normalized = email?.trim();
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      jobs.push({
        to: normalized,
        subject: `${schoolName} Admission Package - ${student.admissionNo}`,
        html: buildAdmissionPackageHtml({
          greetingName,
          studentName: student.name,
          admissionNo: student.admissionNo,
          className,
          schoolName,
          previewSummary,
          transport: body.transport,
          isParent,
        }),
        schoolId: ctx.schoolId,
        attachments,
      });
    };

    pushJob(student.email, student.name, false);
    pushJob(student.parentEmail, student.parentName || 'Parent', true);
    pushJob(student.fatherEmail, student.fatherName || 'Father', true);
    pushJob(student.motherEmail, student.motherName || 'Mother', true);

    if (!jobs.length) {
      return NextResponse.json({ message: 'No recipient email addresses available for welcome package.' });
    }

    enqueueEmailBatch(jobs);

    return NextResponse.json({
      message: 'Welcome package queued successfully.',
      recipients: jobs.map(job => job.to),
      attachments: attachments.map((attachment: any) => attachment.filename),
    });
  } catch (error: any) {
    console.error('POST /api/students/[id]/welcome-package:', error);
    return NextResponse.json({ error: 'Failed to queue welcome package', details: error.message }, { status: 500 });
  }
}
