// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

/**
 * GET /api/fees/students/[id]/payment-history
 * 
 * Optimized endpoint for fetching student payment history
 * Designed to handle 10M+ records efficiently using:
 * - Raw SQL with proper indexing
 * - Pagination
 * - Filtering and search
 * - Aggregated statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get the student ID
    const { id: studentId } = await params;
    
        
    const { getSessionContext } = await import('@/lib/apiAuth');
    const { parseDateParam } = await import('@/lib/parseDateParam');
    
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const offset = (page - 1) * pageSize;
    
    // Filter parameters
    const search = searchParams.get('search') || '';
    const fromDate = parseDateParam(searchParams.get('fromDate'));
    const toDate = parseDateParam(searchParams.get('toDate'), { endOfDay: true });
    const paymentMethod = searchParams.get('paymentMethod');
    
    // Build WHERE conditions for optimized querying
    const whereConditions = [`p."feeRecordId" = fr.id`];
    const havingConditions = [];
    
    // Student filter (CRITICAL for performance - uses index)
    whereConditions.push(`fr."studentId" = '${studentId}'`);
    
    // Tenant isolation
    if (!ctx.isSuperAdmin && ctx.schoolId) {
      whereConditions.push(`s."schoolId" = '${ctx.schoolId}'`);
    }
    
        
    // Date range filtering (uses index on createdAt)
    if (fromDate) {
      whereConditions.push(`p."createdAt" >= '${fromDate.toISOString()}'`);
    }
    if (toDate) {
      whereConditions.push(`p."createdAt" <= '${toDate.toISOString()}'`);
    }
    
    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      whereConditions.push(`p."paymentMethod" = '${paymentMethod}'`);
    }
    
    // Search filter (receipt number, fee name)
    if (search) {
      whereConditions.push(`(
        p."receiptNumber" ILIKE '%${search}%' OR
        fs.name ILIKE '%${search}%' OR
        p."collectedBy" ILIKE '%${search}%'
      )`);
    }
    
    const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : 'TRUE';
    const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';

    
    // OPTIMIZED: Main query with all payment details
    const paymentsQuery = `
      SELECT 
        p.id,
        p."feeRecordId",
        p.amount,
        p."paymentMethod",
        p."paymentDate",
        p."receiptNumber",
        p."transactionId",
        p."collectedBy",
        p.remarks,
        p."createdAt",
        fr.amount as "feeAmount",
        fr."academicYear",
        fs.name as "feeName",
        fs.category as "feeCategory",
        s.name as "studentName",
        s.class as "studentClass",
        s."rollNo" as "studentRollNo"
      FROM "school"."Payment" p
      INNER JOIN "school"."FeeRecord" fr ON p."feeRecordId" = fr.id
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      LEFT JOIN "school"."FeeStructure" fs ON fr."feeStructureId" = fs.id
      WHERE ${whereClause}
      ${havingClause}
      ORDER BY p."createdAt" DESC, p.id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "school"."Payment" p
      INNER JOIN "school"."FeeRecord" fr ON p."feeRecordId" = fr.id
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      LEFT JOIN "school"."FeeStructure" fs ON fr."feeStructureId" = fs.id
      WHERE ${whereClause}
      ${havingClause}
    `;

    // Summary query for statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as "totalPayments",
        COALESCE(SUM(p.amount), 0) as "totalAmount",
        MIN(p."createdAt") as "firstPaymentDate",
        MAX(p."createdAt") as "lastPaymentDate",
        COUNT(DISTINCT p."paymentMethod") as "uniqueMethods",
        COUNT(DISTINCT DATE(p."createdAt")) as "paymentDays"
      FROM "school"."Payment" p
      INNER JOIN "school"."FeeRecord" fr ON p."feeRecordId" = fr.id
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      LEFT JOIN "school"."FeeStructure" fs ON fr."feeStructureId" = fs.id
      WHERE ${whereClause}
      ${havingClause}
    `;

    // Payment method breakdown
    const methodBreakdownQuery = `
      SELECT 
        p."paymentMethod",
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as total
      FROM "school"."Payment" p
      INNER JOIN "school"."FeeRecord" fr ON p."feeRecordId" = fr.id
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      WHERE ${whereClause}
      GROUP BY p."paymentMethod"
      ORDER BY total DESC
    `;

    // Execute all queries in parallel for performance
    const [paymentsResult, countResult, summaryResult, methodBreakdownResult] = await Promise.all([
      (schoolPrisma as any).$queryRawUnsafe(paymentsQuery),
      (schoolPrisma as any).$queryRawUnsafe(countQuery),
      (schoolPrisma as any).$queryRawUnsafe(summaryQuery),
      (schoolPrisma as any).$queryRawUnsafe(methodBreakdownQuery),
    ]);

    const total = parseInt(countResult[0]?.total || '0');
    const summary = summaryResult[0] || {};
    const totalPages = Math.ceil(total / pageSize);

    // Format payments for frontend
    const payments = paymentsResult.map((p: any) => ({
      id: p.id,
      feeRecordId: p.feeRecordId,
      amount: parseFloat(p.amount || 0),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      receiptNumber: p.receiptNumber,
      transactionId: p.transactionId,
      collectedBy: p.collectedBy,
      remarks: p.remarks,
      createdAt: p.createdAt,
      feeAmount: parseFloat(p.feeAmount || 0),
      academicYear: p.academicYear,
      feeName: p.feeName,
      feeCategory: p.feeCategory,
      studentName: p.studentName,
      studentClass: p.studentClass,
      studentRollNo: p.studentRollNo,
    }));

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
        summary: {
          totalPayments: parseInt(summary.totalPayments || '0'),
          totalAmount: parseFloat(summary.totalAmount || '0'),
          firstPaymentDate: summary.firstPaymentDate,
          lastPaymentDate: summary.lastPaymentDate,
          uniqueMethods: parseInt(summary.uniqueMethods || '0'),
          paymentDays: parseInt(summary.paymentDays || '0'),
        },
        methodBreakdown: methodBreakdownResult.map((m: any) => ({
          method: m.paymentMethod,
          count: parseInt(m.count || '0'),
          total: parseFloat(m.total || '0'),
        })),
      },
    });

  } catch (error) {
    console.error('Payment History API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch payment history',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
