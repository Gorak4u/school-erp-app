import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { resolveUserDisplayName } from '@/lib/userName';
import { sendSchoolEmail } from '@/lib/email';
import { generateDiscountApprovedEmail } from '@/lib/discount-email-templates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const where = { id, ...tenantWhere(ctx) };

    const discountReq = await (schoolPrisma as any).DiscountRequest.findUnique({
      where,
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!discountReq) {
      return NextResponse.json({ error: 'Discount request not found' }, { status: 404 });
    }

    // Access control: only admins/principals or the original requester can view details
    if (ctx.role !== 'admin' && ctx.role !== 'principal' && !ctx.isSuperAdmin && discountReq.requestedBy !== ctx.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: discountReq });
  } catch (err) {
    console.error('GET /api/fees/discount-requests/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch discount request' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Only admins/super_admins can approve or reject
    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can approve or reject discounts' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, note, rejectionReason } = body;

    if (!['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be approve, reject, or cancel' }, { status: 400 });
    }

    const existingReq = await (schoolPrisma as any).DiscountRequest.findUnique({
      where: { id, ...tenantWhere(ctx) }
    });

    if (!existingReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (existingReq.status !== 'pending') {
      return NextResponse.json({ error: `Cannot ${action} a request that is already ${existingReq.status}` }, { status: 400 });
    }

    // Allow self-approval for admins (but not other roles)
    // This allows admins to approve their own discount requests
    if (action === 'approve' && existingReq.requestedBy === ctx.userId && ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'You cannot approve your own discount request' }, { status: 403 });
    }

    const approverName = await resolveUserDisplayName(ctx.userId, ctx.email);

    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled';
      
      const updateData: any = {
        status: newStatus,
      };

      if (action === 'approve') {
        updateData.approvedBy = ctx.userId;
        updateData.approvedByEmail = ctx.email;
        updateData.approvedByName = approverName;
        updateData.approvedAt = new Date();
        updateData.approvalNote = note;
      } else if (action === 'reject') {
        updateData.rejectedBy = ctx.userId;
        updateData.rejectedByEmail = ctx.email;
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = rejectionReason;
      }

      const updatedReq = await tx.DiscountRequest.update({
        where: { id },
        data: updateData
      });

      await tx.DiscountRequestAuditLog.create({
        data: {
          schoolId: ctx.schoolId,
          discountRequestId: id,
          action: newStatus,
          actorUserId: ctx.userId,
          actorEmail: ctx.email,
          actorName: approverName,
          actorRole: ctx.role || 'admin',
          previousStatus: 'pending',
          newStatus: newStatus,
          details: JSON.stringify({ note: note || rejectionReason })
        }
      });

      return updatedReq;
    });

    // Send email notification for approval
    if (action === 'approve') {
      try {
        // Get school name for email
        const schoolSetting = await (schoolPrisma as any).SchoolSetting.findFirst({
          where: { group: 'school_details', key: 'name', schoolId: ctx.schoolId }
        });
        const schoolName = schoolSetting?.value || 'School';

        // Get submitter user details
        const submitter = await (schoolPrisma as any).school_User.findUnique({
          where: { id: result.requestedBy }
        });

        // Get approver user details
        const approver = await (schoolPrisma as any).school_User.findUnique({
          where: { id: ctx.userId }
        });

        if (submitter && approver) {
          const emailData = {
            discountRequest: result,
            submitter,
            approver,
            schoolName
          };
          
          const { subject, html } = generateDiscountApprovedEmail(emailData);
          
          await sendSchoolEmail({
            to: submitter.email || '',
            subject,
            html,
            schoolId: ctx.schoolId || undefined
          });
          
          console.log(`✅ Discount approval email sent to submitter: ${submitter.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send discount approval email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: action === 'approve' ? 'Discount request approved successfully' : 
               action === 'reject' ? 'Discount request rejected' : 
               'Discount request cancelled'
    });
  } catch (err) {
    console.error('PATCH /api/fees/discount-requests/[id]:', err);
    return NextResponse.json({ error: 'Failed to update discount request' }, { status: 500 });
  }
}
