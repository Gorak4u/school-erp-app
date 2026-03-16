import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, SessionContext } from '@/lib/apiAuth';

// Import shared job status from the status API
import { jobStatus } from './[jobId]/status/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    // Check if discount request exists and is approved
    const discountReq = await (schoolPrisma as any).DiscountRequest.findUnique({
      where: { id, ...tenantWhere(ctx) },
    });

    if (!discountReq) {
      return NextResponse.json({ error: 'Discount request not found' }, { status: 404 });
    }

    if (discountReq.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved requests can be applied' }, { status: 400 });
    }

    // Only admins can apply discounts
    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can apply discounts' }, { status: 403 });
    }

    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job status
    jobStatus.set(jobId, {
      status: 'pending',
      progress: 0,
      total: 0,
      message: 'Initializing discount application...'
    });

    // Start background processing
    processDiscountApplication(jobId, id, discountReq, ctx).catch(error => {
      console.error('Background job failed:', error);
      jobStatus.set(jobId, {
        ...jobStatus.get(jobId)!,
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      });
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Discount application started. Use the job ID to track progress.'
    });

  } catch (error: any) {
    console.error('POST /api/fees/discount-requests/[id]/apply-batch:', error);
    return NextResponse.json({ error: 'Failed to start discount application' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = jobStatus.get(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job
    });

  } catch (error: any) {
    console.error('GET /api/fees/discount-requests/[id]/apply-batch:', error);
    return NextResponse.json({ error: 'Failed to get job status' }, { status: 500 });
  }
}

async function processDiscountApplication(
  jobId: string,
  discountId: string,
  discountReq: any,
  ctx: SessionContext
) {
  const job = jobStatus.get(jobId)!;
  
  try {
    // Update job status to running
    jobStatus.set(jobId, {
      ...job,
      status: 'running',
      message: 'Finding target fee records...',
      startedAt: new Date()
    });

    const feeStructureIds = JSON.parse(discountReq.feeStructureIds || '[]');
    const studentIds = JSON.parse(discountReq.studentIds || '[]');
    const classIds = JSON.parse(discountReq.classIds || '[]');
    const sectionIds = JSON.parse(discountReq.sectionIds || '[]');

    // Build query to find target records
    const feeRecordsQuery: any = {
      academicYear: discountReq.academicYear,
      status: { in: ['pending', 'partial'] }
    };

    if (discountReq.scope === 'student' && studentIds.length > 0) {
      feeRecordsQuery.studentId = { in: studentIds };
    } else if (discountReq.scope === 'class') {
      const resolvedStudentIds = await resolveClassTargetStudentIds(classIds, sectionIds, ctx);
      if (resolvedStudentIds.length) {
        feeRecordsQuery.studentId = { in: resolvedStudentIds };
      }
    }

    if (discountReq.targetType === 'fee_structure' && feeStructureIds.length > 0) {
      feeRecordsQuery.feeStructureId = { in: feeStructureIds };
    }

    if (ctx.schoolId) {
      feeRecordsQuery.student = { schoolId: ctx.schoolId };
    }

    // Get total count first
    const totalCount = await (schoolPrisma as any).FeeRecord.count({
      where: feeRecordsQuery
    });

    if (totalCount === 0) {
      jobStatus.set(jobId, {
        ...job,
        status: 'completed',
        progress: 100,
        message: 'No matching fee records found',
        completedAt: new Date()
      });
      return;
    }

    // Update total count
    jobStatus.set(jobId, {
      ...job,
      total: totalCount,
      message: `Found ${totalCount} fee records to update`
    });

    // Process in batches of 1000
    const batchSize = 1000;
    let processedCount = 0;

    for (let skip = 0; skip < totalCount; skip += batchSize) {
      const batch = await (schoolPrisma as any).FeeRecord.findMany({
        where: feeRecordsQuery,
        skip,
        take: batchSize,
        select: { 
          id: true, 
          studentId: true, 
          feeStructureId: true, 
          amount: true, 
          paidAmount: true, 
          discount: true 
        }
      });

      // Calculate new discount for each record
      const updates = batch.map((record: any) => {
        const currentDiscount = record.discount || 0;
        const totalFee = record.amount;
        const paidAmount = record.paidAmount || 0;
        const remainingBalance = totalFee - paidAmount - currentDiscount;
        
        // Check if student has already paid full amount
        if (paidAmount >= totalFee) {
          return {
            id: record.id,
            skipUpdate: true,
            reason: 'Student already paid full amount'
          };
        }
        
        // Check if discount would create negative pending amount
        let newDiscount = currentDiscount;
        
        if (discountReq.discountType === 'percentage') {
          const discountAmount = (totalFee * discountReq.discountValue) / 100;
          newDiscount = currentDiscount + discountAmount;
          
          // Apply max cap if specified
          if (discountReq.maxCapAmount && newDiscount > discountReq.maxCapAmount) {
            newDiscount = discountReq.maxCapAmount;
          }
        } else {
          newDiscount = currentDiscount + discountReq.discountValue;
        }
        
        // Calculate new pending amount
        const newPendingAmount = totalFee - paidAmount - newDiscount;
        
        // Skip if discount would create negative pending amount
        if (newPendingAmount < 0) {
          return {
            id: record.id,
            skipUpdate: true,
            reason: 'Discount would create negative pending amount'
          };
        }
        
        // Only apply discount if it actually reduces the pending amount
        if (newPendingAmount >= remainingBalance) {
          return {
            id: record.id,
            skipUpdate: true,
            reason: 'Discount provides no benefit'
          };
        }

        return {
          id: record.id,
          discount: newDiscount,
          pendingAmount: newPendingAmount,
          oldPendingAmount: remainingBalance,
          discountApplied: newDiscount - currentDiscount
        };
      });

      // Filter out records that should be skipped
      const validUpdates = updates.filter((update: any) => !update.skipUpdate);
      const skippedRecords = updates.filter((update: any) => update.skipUpdate);
      
      if (skippedRecords.length > 0) {
        console.log(`SKIPPED ${skippedRecords.length} records:`, skippedRecords.map((r: any) => ({ id: r.id, reason: r.reason })));
      }

      // Update only valid records
      if (validUpdates.length > 0) {
        await Promise.all(
          validUpdates.map((update: any) =>
            (schoolPrisma as any).FeeRecord.update({
              where: { id: update.id },
              data: {
                discount: update.discount,
                pendingAmount: update.pendingAmount
              }
            })
          )
        );
        console.log(`UPDATED ${validUpdates.length} fee records with discounts`);
      }

      processedCount += batch.length;
      const progress = Math.round((processedCount / totalCount) * 100);

      // Update progress with skip information
      const skipMessage = skippedRecords.length > 0 
        ? ` (${skippedRecords.length} skipped)` 
        : '';
      
      jobStatus.set(jobId, {
        ...job,
        progress: processedCount,
        processedRecords: processedCount,
        message: `Processed ${processedCount} of ${totalCount} fee records...${skipMessage}`
      });

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create audit log
    await (schoolPrisma as any).DiscountRequestAuditLog.create({
      data: {
        schoolId: ctx.schoolId,
        discountRequestId: discountId,
        action: 'applied',
        actorUserId: ctx.userId,
        actorEmail: ctx.email,
        actorName: ctx.email, // Would need resolveUserDisplayName in production
        actorRole: ctx.role || 'admin',
        newStatus: 'applied',
        details: JSON.stringify({ appliedCount: processedCount })
      }
    });

    // Update discount request status
    await (schoolPrisma as any).DiscountRequest.update({
      where: { id: discountId },
      data: {
        status: 'applied',
        appliedAt: new Date(),
        appliedCount: processedCount
      }
    });

    // Mark job as completed
    jobStatus.set(jobId, {
      ...job,
      status: 'completed',
      progress: totalCount,
      processedRecords: processedCount,
      message: `Successfully applied discount to ${processedCount} fee records`,
      completedAt: new Date(),
      details: {
        totalRecords: totalCount,
        processedRecords: processedCount,
        discountType: discountReq.discountType,
        discountValue: discountReq.discountValue,
        scope: discountReq.scope
      }
    });

  } catch (error: any) {
    console.error('Discount application failed:', error);
    jobStatus.set(jobId, {
      ...job,
      status: 'failed',
      error: error.message,
      completedAt: new Date()
    });
  }
}

async function resolveClassTargetStudentIds(classIds: string[], sectionIds: string[], ctx: SessionContext) {
  if (!classIds?.length) return [];

  const classRecords = await (schoolPrisma as any).Class.findMany({
    where: {
      OR: [
        { id: { in: classIds } },
        { code: { in: classIds } },
        { name: { in: classIds } }
      ]
    },
    select: { id: true, name: true }
  });

  const classNames = classRecords.map((cls: any) => cls.name);

  const studentWhere: any = {
    OR: [
      { class: { in: classIds } },
      { class: { in: classNames } }
    ]
  };

  if (sectionIds?.length) {
    studentWhere.OR.push(
      { section: { in: sectionIds } },
      { class: { in: classIds }, section: { in: sectionIds } },
      { class: { in: classNames }, section: { in: sectionIds } }
    );
  }

  const students = await (schoolPrisma as any).Student.findMany({
    where: { ...studentWhere, ...tenantWhere(ctx) },
    select: { id: true }
  });

  return students.map((s: any) => s.id);
}
