import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { resolveUserDisplayName } from '@/lib/userName';
import { sendSchoolEmail } from '@/lib/email';
import { generateDiscountPendingEmail } from '@/lib/discount-email-templates';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const scope = searchParams.get('scope');

    const where: any = tenantWhere(ctx);
    if (status && status !== 'all') where.status = status;
    if (academicYear) where.academicYear = academicYear;
    if (scope && scope !== 'all') where.scope = scope;

    // Users can only see requests they created, UNLESS they are admin/principal
    if (ctx.role !== 'admin' && ctx.role !== 'principal' && !ctx.isSuperAdmin) {
      where.requestedBy = ctx.userId;
    }

    const [requests, total] = await Promise.all([
      (schoolPrisma as any).DiscountRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).DiscountRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      }
    });
  } catch (error) {
    console.error('GET /api/fees/discount-requests:', error);
    return NextResponse.json({ error: 'Failed to fetch discount requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      name, description, discountType, discountValue, maxCapAmount,
      scope, targetType, feeStructureIds, studentIds, classIds, sectionIds,
      academicYear, reason, supportingDoc, validFrom, validTo
    } = body;

    // Validate
    if (!name || !discountType || discountValue === undefined || !scope || !targetType || !academicYear || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const requesterName = await resolveUserDisplayName(ctx.userId, ctx.email);
    console.log('DEBUG resolveUserDisplayName:', { userId: ctx.userId, email: ctx.email, requesterName });

    // Create request in transaction to ensure audit log is also created
    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      // 1. Create the request
      const discountReq = await tx.DiscountRequest.create({
        data: {
          schoolId: ctx.schoolId,
          name,
          description,
          discountType,
          discountValue: Number(discountValue),
          maxCapAmount: maxCapAmount ? Number(maxCapAmount) : null,
          scope,
          targetType,
          feeStructureIds: JSON.stringify(feeStructureIds || []),
          studentIds: JSON.stringify(studentIds || []),
          classIds: JSON.stringify(classIds || []),
          sectionIds: JSON.stringify(sectionIds || []),
          academicYear,
          reason,
          supportingDoc,
          status: 'pending',
          requestedBy: ctx.userId,
          requestedByEmail: ctx.email,
          requestedByName: requesterName,
          validFrom,
          validTo
        }
      });

      // 2. Create Audit Log
      await tx.DiscountRequestAuditLog.create({
        data: {
          schoolId: ctx.schoolId,
          discountRequestId: discountReq.id,
          action: 'created',
          actorUserId: ctx.userId,
          actorEmail: ctx.email,
          actorName: requesterName,
          actorRole: ctx.role || 'user',
          newStatus: 'pending',
          details: JSON.stringify({ reason })
        }
      });

      return discountReq;
    });

    // Send email notifications after successful creation
    try {
      // Get school name for email
      const schoolSetting = await (schoolPrisma as any).SchoolSetting.findFirst({
        where: { group: 'school_details', key: 'name', schoolId: ctx.schoolId }
      });
      const schoolName = schoolSetting?.value || 'School';

      // Find eligible approvers (admin users)
      const approvers = await (schoolPrisma as any).school_User.findMany({
        where: {
          schoolId: ctx.schoolId,
          role: 'admin',
          isActive: true
        }
      });

      // Get submitter user details
      const submitter = await (schoolPrisma as any).school_User.findUnique({
        where: { id: ctx.userId }
      });

      if (approvers.length > 0 && submitter) {
        // Send email to all approvers
        for (const approver of approvers) {
          const emailData = {
            discountRequest: result,
            submitter,
            approver,
            schoolName
          };
          
          const { subject, html } = generateDiscountPendingEmail(emailData);
          
          await sendSchoolEmail({
            to: approver.email || '',
            subject,
            html,
            schoolId: ctx.schoolId
          });
          
          console.log(`✅ Discount pending email sent to approver: ${approver.email}`);
        }

        // Send confirmation email to submitter
        const submitterEmailData = {
          discountRequest: result,
          submitter,
          approver: submitter, // Self-reference for submitter email
          schoolName
        };
        
        const { subject: submitterSubject, html: submitterHtml } = generateDiscountPendingEmail(submitterEmailData);
        
        await sendSchoolEmail({
            to: submitter.email || '',
            subject: submitterSubject.replace('Pending Approval', 'Submitted - Pending Approval'),
            html: submitterHtml.replace('requires your approval', 'has been submitted and is pending approval'),
            schoolId: ctx.schoolId
          });
        
        console.log(`✅ Discount submission confirmation email sent to: ${submitter.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send discount request emails:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('POST /api/fees/discount-requests:', error);
    return NextResponse.json({ error: 'Failed to create discount request' }, { status: 500 });
  }
}
