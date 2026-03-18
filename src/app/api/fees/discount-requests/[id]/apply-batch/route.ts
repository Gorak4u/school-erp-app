import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, SessionContext } from '@/lib/apiAuth';
import { canApplyDiscountsAccess } from '@/lib/permissions';

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

    if (!canApplyDiscountsAccess(ctx)) {
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
    // DEBUG: Log the discount request details
    console.log('DEBUG - Discount Request Details:', {
      id: discountReq.id,
      name: discountReq.name,
      targetType: discountReq.targetType,
      scope: discountReq.scope,
      feeStructureIds: discountReq.feeStructureIds,
      parsedFeeStructureIds: JSON.parse(discountReq.feeStructureIds || '[]'),
      discountType: discountReq.discountType,
      discountValue: discountReq.discountValue
    });
    
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

    if (discountReq.scope === 'student' && studentIds.length === 0) {
      throw new Error('Discount request has no targeted students');
    }

    if (discountReq.targetType === 'fee_structure' && feeStructureIds.length === 0) {
      throw new Error('Discount request has no targeted fee structures');
    }

    // Build query to find target records - both FeeRecord and FeeArrears
    const feeRecordsQuery: any = {
      academicYear: discountReq.academicYear,
      status: { in: ['pending', 'partial'] }
    };

    const arrearsQuery: any = {
      toAcademicYear: discountReq.academicYear,
      status: { in: ['pending', 'partial'] }
    };

    if (discountReq.scope === 'student' && studentIds.length > 0) {
      feeRecordsQuery.studentId = { in: studentIds };
      arrearsQuery.studentId = { in: studentIds };
    } else if (discountReq.scope === 'class') {
      const resolvedStudentIds = await resolveClassTargetStudentIds(classIds, sectionIds, ctx);
      if (!resolvedStudentIds.length) {
        throw new Error('No matching students found for this class request');
      }

      feeRecordsQuery.studentId = { in: resolvedStudentIds };
      arrearsQuery.studentId = { in: resolvedStudentIds };
    }

    // DEBUG: Log the query building
    console.log('DEBUG - Before fee structure filter:', {
      targetType: discountReq.targetType,
      feeStructureIds: feeStructureIds,
      feeRecordsQuery: { ...feeRecordsQuery }
    });

    if (discountReq.targetType === 'fee_structure') {
      feeRecordsQuery.feeStructureId = { in: feeStructureIds };
      console.log('DEBUG - Applied fee structure filter:', feeStructureIds);
    } else {
      console.log('DEBUG - targetType is not fee_structure, skipping fee structure filter');
    }

    if (ctx.schoolId) {
      feeRecordsQuery.student = { schoolId: ctx.schoolId };
      arrearsQuery.student = { schoolId: ctx.schoolId };
    }

    // DEBUG: Log final queries
    console.log('DEBUG - Final queries:', {
      feeRecordsQuery,
      arrearsQuery
    });

    // Get total count from both tables
    const [feeRecordCount, arrearsCount] = await Promise.all([
      (schoolPrisma as any).FeeRecord.count({ where: feeRecordsQuery }),
      (schoolPrisma as any).FeeArrears.count({ where: arrearsQuery })
    ]);

    const totalCount = feeRecordCount + arrearsCount;
    
    // DEBUG: Log the counts and sample records
    console.log('DEBUG - Fee Records Count:', feeRecordCount);
    console.log('DEBUG - Arrears Count:', arrearsCount);
    console.log('DEBUG - Total Count:', totalCount);
    
    // Get sample records for debugging
    if (feeRecordCount > 0) {
      const sampleRecords = await (schoolPrisma as any).FeeRecord.findMany({
        where: feeRecordsQuery,
        take: 5,
        select: {
          id: true,
          academicYear: true,
          studentId: true,
          student: { select: { name: true } },
          feeStructureId: true,
          feeStructure: { select: { name: true } },
          amount: true
        }
      });
      
      console.log('DEBUG - Fee Records Results:', {
        recordsCount: feeRecordCount,
        sampleRecords: sampleRecords.map((r: any) => ({
          id: r.id,
          academicYear: r.academicYear,
          studentName: r.student?.name,
          feeStructureName: r.feeStructure?.name,
          amount: r.amount
        }))
      });
    }

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

    // Process FeeRecords first
    for (let skip = 0; skip < feeRecordCount; skip += batchSize) {
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

      const updates = batch.map((record: any) => {
        const currentDiscount = record.discount || 0;
        const totalFee = record.amount;
        const paidAmount = record.paidAmount || 0;
        
        if (paidAmount >= totalFee) return { id: record.id, skipUpdate: true, reason: 'Already paid' };
        
        let calcDiscount = 0;
        if (discountReq.discountType === 'percentage') {
          calcDiscount = (totalFee * discountReq.discountValue) / 100;
          if (discountReq.maxCapAmount) calcDiscount = Math.min(calcDiscount, discountReq.maxCapAmount);
        } else if (discountReq.discountType === 'fixed') {
          calcDiscount = discountReq.discountValue;
        } else if (discountReq.discountType === 'full_waiver') {
          calcDiscount = totalFee;
        }
        
        const newDiscount = Math.min(currentDiscount + calcDiscount, totalFee);
        const newPendingAmount = totalFee - paidAmount - newDiscount;
        
        if (newPendingAmount < 0) return { id: record.id, skipUpdate: true, reason: 'Negative balance' };
        
        return { id: record.id, discount: newDiscount, pendingAmount: newPendingAmount, skipUpdate: false };
      });

      const validUpdates = updates.filter((u: any) => !u.skipUpdate);
      
      if (validUpdates.length > 0) {
        await Promise.all(
          validUpdates.map((update: any) =>
            (schoolPrisma as any).FeeRecord.update({
              where: { id: update.id },
              data: { discount: update.discount, pendingAmount: update.pendingAmount }
            })
          )
        );
      }

      processedCount += batch.length;
      jobStatus.set(jobId, {
        ...job,
        progress: processedCount,
        message: `Processed ${processedCount} of ${totalCount} records...`
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Process FeeArrears
    for (let skip = 0; skip < arrearsCount; skip += batchSize) {
      const batch = await (schoolPrisma as any).FeeArrears.findMany({
        where: arrearsQuery,
        skip,
        take: batchSize,
        select: { 
          id: true, 
          studentId: true, 
          amount: true, 
          paidAmount: true
        }
      });

      const updates = batch.map((record: any) => {
        const totalFee = record.amount;
        const paidAmount = record.paidAmount || 0;
        
        if (paidAmount >= totalFee) return { id: record.id, skipUpdate: true, reason: 'Already paid' };
        
        let calcDiscount = 0;
        if (discountReq.discountType === 'percentage') {
          calcDiscount = (totalFee * discountReq.discountValue) / 100;
          if (discountReq.maxCapAmount) calcDiscount = Math.min(calcDiscount, discountReq.maxCapAmount);
        } else if (discountReq.discountType === 'fixed') {
          calcDiscount = discountReq.discountValue;
        } else if (discountReq.discountType === 'full_waiver') {
          calcDiscount = totalFee;
        }
        
        const newAmount = Math.max(0, totalFee - calcDiscount);
        const newPendingAmount = newAmount - paidAmount;
        
        if (newPendingAmount < 0) return { id: record.id, skipUpdate: true, reason: 'Negative balance' };
        
        return { id: record.id, amount: newAmount, pendingAmount: newPendingAmount, skipUpdate: false };
      });

      const validUpdates = updates.filter((u: any) => !u.skipUpdate);
      
      if (validUpdates.length > 0) {
        await Promise.all(
          validUpdates.map((update: any) =>
            (schoolPrisma as any).FeeArrears.update({
              where: { id: update.id },
              data: { amount: update.amount, pendingAmount: update.pendingAmount }
            })
          )
        );
      }

      processedCount += batch.length;
      jobStatus.set(jobId, {
        ...job,
        progress: processedCount,
        message: `Processed ${processedCount} of ${totalCount} records...`
      });

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
