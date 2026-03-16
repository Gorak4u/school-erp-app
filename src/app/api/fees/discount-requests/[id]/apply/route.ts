import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, SessionContext } from '@/lib/apiAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Only admins/super_admins can apply discounts
    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can apply discounts' }, { status: 403 });
    }

    const { id } = await params;
    
    // 1. Fetch the approved request
    const discountReq = await (schoolPrisma as any).DiscountRequest.findFirst({
      where: { id, ...tenantWhere(ctx) }
    });

    if (!discountReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (discountReq.status !== 'approved') return NextResponse.json({ error: 'Only approved requests can be applied' }, { status: 400 });

    // 2. Identify target FeeRecords
    const baseWhere: any = {
      status: { in: ['pending', 'partial'] }, // Only apply to unpaid/partially paid fees
    };

    let feeRecordsQuery: any = {
      where: baseWhere
    };

    // Filter by student/class/bulk
    const studentIds = JSON.parse(discountReq.studentIds || '[]');
    const classIds = JSON.parse(discountReq.classIds || '[]');
    const sectionIds = JSON.parse(discountReq.sectionIds || '[]');
    const feeStructureIds = JSON.parse(discountReq.feeStructureIds);

    if ((discountReq.scope === 'student' || discountReq.scope === 'bulk') && studentIds.length > 0) {
      feeRecordsQuery.where.studentId = { in: studentIds };
    } else if (discountReq.scope === 'class') {
      const resolvedStudentIds = await resolveClassTargetStudentIds(classIds, sectionIds, ctx);
      if (resolvedStudentIds.length) {
        feeRecordsQuery.where.studentId = { in: resolvedStudentIds };
      }
    }

    // Filter by fee structures
    if (discountReq.targetType === 'fee_structure' && feeStructureIds.length > 0) {
      feeRecordsQuery.where.feeStructureId = { in: feeStructureIds };
    }

    // Apply tenant scoping via student relationship
    if (ctx.schoolId) {
      feeRecordsQuery.where.student = { schoolId: ctx.schoolId };
    }

    // Fetch target records
    const targetRecords = await (schoolPrisma as any).FeeRecord.findMany({
      where: feeRecordsQuery.where,
      select: { id: true, studentId: true, feeStructureId: true, amount: true, paidAmount: true, discount: true, pendingAmount: true }
    });

      discountReqId: id,
      academicYear: discountReq.academicYear,
      scope: discountReq.scope,
      targetType: discountReq.targetType,
      studentIds,
      classIds,
      sectionIds,
      feeStructureIds,
      finalQueryWhere: feeRecordsQuery.where,
      matchedRecordsCount: targetRecords.length,
      schoolId: ctx.schoolId
    });

    // Debug: Check if any fee records exist for this student at all
    const allStudentRecords = await (schoolPrisma as any).FeeRecord.findMany({
      where: { 
        studentId: { in: studentIds },
        academicYear: discountReq.academicYear 
      },
      select: { id: true, status: true, academicYear: true, feeStructureId: true }
    });

    // Debug: Check if student has any fee records in any academic year
    const anyYearRecords = await (schoolPrisma as any).FeeRecord.findMany({
      where: { 
        studentId: { in: studentIds }
      },
      select: { id: true, status: true, academicYear: true, feeStructureId: true },
      take: 5
    });

    if (targetRecords.length === 0) {
      return NextResponse.json({ error: 'No matching fee records found to apply discount' }, { status: 404 });
    }

    // 3. Calculate new discounts with payment validation
    const applications = [];
    const updates = [];
    const skippedRecords = [];

    for (const record of targetRecords) {
      const totalFee = record.amount;
      const paidAmount = record.paidAmount || 0;
      const currentDiscount = record.discount || 0;
      const remainingBalance = totalFee - paidAmount - currentDiscount;
      
      // Check if student has already paid full amount
      if (paidAmount >= totalFee) {
        console.log(`SKIPPING: Student already paid full amount. Fee: ${totalFee}, Paid: ${paidAmount}, Current Discount: ${currentDiscount}`);
        skippedRecords.push({
          id: record.id,
          studentId: record.studentId,
          reason: 'Student already paid full amount'
        });
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

      // Ensure total discount doesn't exceed total amount
      if (totalNewDiscount > totalFee) {
        calcDiscount = totalFee - currentDiscount;
      }

      // Calculate new pending amount
      const newPendingAmount = totalFee - paidAmount - totalNewDiscount;
      
      // Skip if discount would create negative pending amount
      if (newPendingAmount < 0) {
        console.log(`SKIPPING: Discount would create negative pending amount. Fee: ${totalFee}, Paid: ${paidAmount}, New Discount: ${totalNewDiscount}, New Pending: ${newPendingAmount}`);
        skippedRecords.push({
          id: record.id,
          studentId: record.studentId,
          reason: 'Discount would create negative pending amount'
        });
        continue;
      }
      
      // Only apply discount if it actually reduces the pending amount
      if (newPendingAmount >= remainingBalance) {
        console.log(`SKIPPING: Discount doesn't benefit student. Current Pending: ${remainingBalance}, New Pending: ${newPendingAmount}`);
        skippedRecords.push({
          id: record.id,
          studentId: record.studentId,
          reason: 'Discount provides no benefit'
        });
        continue;
      }

      if (calcDiscount <= 0) {
        skippedRecords.push({
          id: record.id,
          studentId: record.studentId,
          reason: 'Calculated discount is zero or negative'
        });
        continue;
      }

      applications.push({
        schoolId: ctx.schoolId,
        discountRequestId: id,
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

      totalRecords: targetRecords.length,
      appliedCount: applications.length,
      skippedCount: skippedRecords.length,
      skippedReasons: skippedRecords.reduce((acc: any, record: any) => {
        acc[record.reason] = (acc[record.reason] || 0) + 1;
        return acc;
      }, {})
    });

    if (applications.length === 0) {
      return NextResponse.json({ error: 'No valid records found to apply this discount (might already be fully discounted)' }, { status: 400 });
    }

    // 4. Execute batch operations
    await (schoolPrisma as any).$transaction([
      ...updates,
      (schoolPrisma as any).DiscountApplication.createMany({ data: applications }),
      (schoolPrisma as any).DiscountRequest.update({
        where: { id },
        data: {
          status: 'applied',
          appliedBy: ctx.userId,
          appliedByEmail: ctx.email,
          appliedAt: new Date(),
          appliedCount: applications.length
        }
      }),
      (schoolPrisma as any).DiscountRequestAuditLog.create({
        data: {
          schoolId: ctx.schoolId,
          discountRequestId: id,
          action: 'applied',
          actorUserId: ctx.userId,
          actorEmail: ctx.email,
          actorName: ctx.email.split('@')[0],
          actorRole: ctx.role || 'admin',
          previousStatus: 'approved',
          newStatus: 'applied',
          details: JSON.stringify({ appliedCount: applications.length })
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      data: { 
        appliedCount: applications.length,
        skippedCount: skippedRecords.length,
        skippedRecords: skippedRecords,
        summary: {
          totalRecords: targetRecords.length,
          appliedCount: applications.length,
          skippedCount: skippedRecords.length,
          skippedReasons: skippedRecords.reduce((acc: any, record: any) => {
            acc[record.reason] = (acc[record.reason] || 0) + 1;
            return acc;
          }, {})
        }
      } 
    });
  } catch (err) {
    console.error('POST /api/fees/discount-requests/[id]/apply:', err);
    return NextResponse.json({ error: 'Failed to apply discount' }, { status: 500 });
  }
}
