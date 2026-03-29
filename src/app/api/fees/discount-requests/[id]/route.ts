import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, SessionContext } from '@/lib/apiAuth';
import { resolveUserDisplayName } from '@/lib/userName';
import { queueCommunicationOutbox } from '@/lib/communicationOutbox';
import { canApproveDiscountsAccess, canViewDiscountRequestsAccess, isAdminLikeAccess } from '@/lib/permissions';

// Helper function to resolve class target student IDs
async function resolveClassTargetStudentIds(classIds: string[], sectionIds: string[], ctx: SessionContext) {
  if (!classIds?.length) return [];

  const classRecords = await (schoolPrisma as any).Class.findMany({
    where: {
      OR: [
        { id: { in: classIds } },
        { code: { in: classIds } },
        { name: { in: classIds } }
      ],
      ...tenantWhere(ctx)
    },
    select: { id: true, name: true }
  });

  const classNames = classRecords.map((c: any) => c.name);

  const studentWhere: any = {
    OR: [
      { class: { in: classIds } },
      { class: { in: classNames } }
    ]
  };

  if (sectionIds?.length) {
    studentWhere.section = { in: sectionIds };
  }

  const students = await (schoolPrisma as any).Student.findMany({
    where: { ...studentWhere, ...tenantWhere(ctx) },
    select: { id: true }
  });

  return students.map((s: any) => s.id);
}

// Helper function to automatically apply discount after approval
async function autoApplyDiscount(discountRequestId: string, ctx: SessionContext) {
  try {
    console.log(`🔄 Auto-applying discount for request: ${discountRequestId}`);
    
    // Fetch the discount request
    const discountReq = await (schoolPrisma as any).DiscountRequest.findFirst({
      where: { id: discountRequestId, ...tenantWhere(ctx) }
    });

    if (!discountReq || discountReq.status !== 'approved') {
      console.error('Discount request not found or not approved');
      return { success: false, error: 'Discount request not approved' };
    }

    // Parse target IDs
    const studentIds = JSON.parse(discountReq.studentIds || '[]');
    const classIds = JSON.parse(discountReq.classIds || '[]');
    const sectionIds = JSON.parse(discountReq.sectionIds || '[]');
    const feeStructureIds = JSON.parse(discountReq.feeStructureIds || '[]');
    const transportRouteIds = JSON.parse(discountReq.transportRouteIds || '[]');

    if (!discountReq.academicYear) {
      return { success: false, error: 'Discount request is missing academic year scope' };
    }

    if (discountReq.scope === 'student' && studentIds.length === 0) {
      return { success: false, error: 'Discount request has no targeted students' };
    }

    if (discountReq.targetType === 'fee_structure' && feeStructureIds.length === 0) {
      return { success: false, error: 'Discount request has no targeted fee structures' };
    }

    // Build query for target fee records
    const baseWhere: any = {
      status: { in: ['pending', 'partial'] },
      academicYear: discountReq.academicYear,
    };

    let feeRecordsQuery: any = { where: baseWhere };

    // Filter by student/class/bulk
    if ((discountReq.scope === 'student' || discountReq.scope === 'bulk') && studentIds.length > 0) {
      feeRecordsQuery.where.studentId = { in: studentIds };
    } else if (discountReq.scope === 'class') {
      const resolvedStudentIds = await resolveClassTargetStudentIds(classIds, sectionIds, ctx);
      if (!resolvedStudentIds.length) {
        return { success: true, appliedCount: 0, skippedCount: 0, message: 'No matching students found for this class request' };
      }

      feeRecordsQuery.where.studentId = { in: resolvedStudentIds };
    }

    // Filter by fee structures (apply when feeStructureIds are provided)
    if (feeStructureIds.length > 0) {
      feeRecordsQuery.where.feeStructureId = { in: feeStructureIds };
    }

    // Apply tenant scoping
    if (ctx.schoolId) {
      feeRecordsQuery.where.student = { schoolId: ctx.schoolId };
    }

    // Concurrency guard: check if already being applied
    const inProgressCount = await (schoolPrisma as any).DiscountRequestAuditLog.count({
      where: {
        discountRequestId,
        action: 'applying',
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // last 5 minutes
      }
    });
    if (inProgressCount > 0) {
      return { success: false, error: 'Discount application is already in progress' };
    }

    // Fetch target records
    const targetRecords = await (schoolPrisma as any).FeeRecord.findMany({
      where: feeRecordsQuery.where,
      select: { id: true, studentId: true, feeStructureId: true, amount: true, paidAmount: true, discount: true }
    });

    if (targetRecords.length === 0) {
      console.log('⚠️ No matching fee records found to apply discount');
      return { success: true, appliedCount: 0, message: 'No matching fee records found' };
    }

    console.log(`📊 Found ${targetRecords.length} target fee records`);

    // Calculate and apply discounts
    const applications: any[] = [];
    const updates: any[] = [];
    let skippedCount = 0;

    for (const record of targetRecords) {
      const totalFee = record.amount;
      const paidAmount = record.paidAmount || 0;
      const currentDiscount = record.discount || 0;
      
      // Skip if already paid full amount
      if (paidAmount >= totalFee) {
        skippedCount++;
        continue;
      }
      
      let calcDiscount = 0;
      
      if (discountReq.discountType === 'percentage') {
        calcDiscount = (totalFee * discountReq.discountValue) / 100;
        if (discountReq.maxCapAmount) {
          calcDiscount = Math.min(calcDiscount, discountReq.maxCapAmount);
        }
      } else if (discountReq.discountType === 'fixed') {
        calcDiscount = discountReq.discountValue;
      } else if (discountReq.discountType === 'full_waiver') {
        calcDiscount = totalFee;
      }

      // Ensure discount doesn't exceed amount
      calcDiscount = Math.min(calcDiscount, totalFee);
      const totalNewDiscount = currentDiscount + calcDiscount;

      if (totalNewDiscount > totalFee) {
        calcDiscount = totalFee - currentDiscount;
      }

      const newPendingAmount = totalFee - paidAmount - totalNewDiscount;
      
      // Skip if discount creates negative pending or provides no benefit
      if (newPendingAmount < 0 || calcDiscount <= 0) {
        skippedCount++;
        continue;
      }

      applications.push({
        schoolId: ctx.schoolId,
        discountRequestId: discountRequestId,
        studentId: record.studentId,
        feeRecordId: record.id,
        feeStructureId: record.feeStructureId,
        discountAmount: calcDiscount,
        previousDiscount: currentDiscount,
        appliedBy: ctx.userId,
        appliedByEmail: ctx.email
      });

      updates.push(
        (schoolPrisma as any).$executeRawUnsafe(
          `UPDATE "school"."FeeRecord" SET "discount" = "discount" + $1, "pendingAmount" = $2 WHERE id = $3`,
          calcDiscount,
          newPendingAmount,
          record.id
        )
      );
    }

    if (applications.length === 0) {
      console.log('⚠️ No valid records to apply discount');
      return { success: true, appliedCount: 0, skippedCount, message: 'No valid records to apply discount' };
    }

    // Execute batch operations with concurrency guard audit logs
    await (schoolPrisma as any).$transaction(async (tx: any) => {
      // Mark as applying to prevent concurrent runs
      await tx.DiscountRequestAuditLog.create({
        data: {
          schoolId: ctx.schoolId,
          discountRequestId,
          action: 'applying',
          actorUserId: ctx.userId,
          actorEmail: ctx.email,
          actorName: ctx.email.split('@')[0],
          actorRole: ctx.role || 'admin',
          previousStatus: discountReq.status,
          newStatus: 'applying',
          details: JSON.stringify({ targetCount: targetRecords.length })
        }
      });

      await Promise.all(updates);
      await tx.DiscountApplication.createMany({ data: applications });
      await tx.DiscountRequest.update({
        where: { id: discountRequestId },
        data: {
          status: 'applied',
          appliedBy: ctx.userId,
          appliedByEmail: ctx.email,
          appliedAt: new Date(),
          appliedCount: applications.length
        }
      });
      await tx.DiscountRequestAuditLog.create({
        data: {
          schoolId: ctx.schoolId,
          discountRequestId,
          action: 'applied',
          actorUserId: ctx.userId,
          actorEmail: ctx.email,
          actorName: ctx.email.split('@')[0],
          actorRole: ctx.role || 'admin',
          previousStatus: 'approved',
          newStatus: 'applied',
          details: JSON.stringify({ appliedCount: applications.length, skippedCount, transportRouteIds })
        }
      });
    }, {
      timeout: 60000 // 60 seconds timeout
    });

    console.log(`✅ Auto-applied discount to ${applications.length} fee records (${skippedCount} skipped)`);

    return {
      success: true,
      appliedCount: applications.length,
      skippedCount,
      message: `Discount applied to ${applications.length} fee records`,
      transportRouteIds,
      metadata: discountReq.metadata
    };

  } catch (error: any) {
    console.error('❌ Auto-apply discount failed:', error);
    return { success: false, error: error.message };
  }
}

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

    if (!canViewDiscountRequestsAccess(ctx) && discountReq.requestedBy !== ctx.userId) {
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

    if (!canApproveDiscountsAccess(ctx)) {
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
    if (action === 'approve' && existingReq.requestedBy === ctx.userId && !isAdminLikeAccess(ctx)) {
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

    // Auto-apply discount after approval
    let autoApplyResult = null;
    if (action === 'approve') {
      try {
        console.log('🚀 Starting automatic discount application...');
        autoApplyResult = await autoApplyDiscount(id, ctx);
        
        if (autoApplyResult.success) {
          console.log(`✅ Auto-applied discount: ${autoApplyResult.appliedCount} records updated`);
        } else {
          console.error('⚠️ Auto-apply failed:', autoApplyResult.error);
        }
      } catch (autoApplyError) {
        console.error('❌ Auto-apply error:', autoApplyError);
        // Don't fail the approval if auto-apply fails
      }
    }

    // Send email notification for approval
    if (action === 'approve' && result.requestedBy) {
      queueCommunicationOutbox({
        notification: {
          userId: result.requestedBy,
          type: 'discount_approved',
          title: 'Discount Request Approved',
          message: `Your discount request for ${result.student?.name || 'student'} has been approved.`,
          priority: 'medium',
          schoolId: ctx.schoolId!,
          entityType: 'discount_request',
          entityId: result.id,
        },
        templateEmail: result.requestedByUser?.email ? {
          templateKey: 'discount_approved_email',
          schoolId: ctx.schoolId || undefined,
          to: result.requestedByUser.email,
          recipientUserId: result.requestedBy,
          variables: {
            studentName: result.student?.name || 'Student',
            discountCategory: result.discountCategory || 'Fee Discount',
            discountType: result.discountType || 'Percentage',
            discountAmount: String(result.discountValue || 0),
            comments: note || '',
          },
          dedupeKey: `discount_approved:${result.id}`,
        } : undefined,
      }).catch((error) => {
        console.error('Failed to send discount approval notification:', error);
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      autoApply: autoApplyResult,
      message: action === 'approve' 
        ? `Discount request approved and applied to ${autoApplyResult?.appliedCount || 0} fee records` 
        : action === 'reject' ? 'Discount request rejected' 
        : 'Discount request cancelled'
    });
  } catch (err) {
    console.error('PATCH /api/fees/discount-requests/[id]:', err);
    return NextResponse.json({ error: 'Failed to update discount request' }, { status: 500 });
  }
}
