// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { parseDateParam } from '@/lib/parseDateParam';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '';
    const status = searchParams.get('status') || '';
    const academicYear = searchParams.get('academicYear') || '';
    const search = searchParams.get('search') || '';
    const fromDate = parseDateParam(searchParams.get('fromDate'));
    const toDate = parseDateParam(searchParams.get('toDate'), { endOfDay: true });
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    console.log('DEBUG - Fee Records API:', {
      studentId,
      status,
      academicYear,
      search,
      page,
      pageSize,
      requestUrl: request.url
    });

    // Build WHERE conditions for optimized querying
    const whereConditions = [];
    const havingConditions = [];
    
    // Student filter
    if (studentId) {
      whereConditions.push(`fr."studentId" = '${studentId}'`);
    }
    
    // Status filter - moved to WHERE clause
    if (status && status !== 'all') {
      if (status === 'paid') {
        whereConditions.push(`fr."paidAmount" >= (fr.amount - fr.discount)`);
      } else if (status === 'partial') {
        whereConditions.push(`fr."paidAmount" > 0 AND fr."paidAmount" < (fr.amount - fr.discount)`);
      } else if (status === 'pending') {
        whereConditions.push(`fr."paidAmount" = 0`);
      }
    }
    
    // Academic year filter
    if (academicYear && academicYear !== 'all') {
      whereConditions.push(`fr."academicYear" = '${academicYear}'`);
    }
    
    // Search filter (student name)
    if (search) {
      whereConditions.push(`s."name" ILIKE '%${search}%'`);
    }
    
    // Date range filtering - temporarily disabled for testing
    // if (fromDate) {
    //   whereConditions.push(`fr."createdAt" >= '${fromDate.toISOString()}'`);
    // }
    // if (toDate) {
    //   whereConditions.push(`fr."createdAt" <= '${toDate.toISOString()}'`);
    // }
    
    // Tenant isolation - strict: null schoolId only visible to super admins
    if (!ctx.isSuperAdmin) {
      if (ctx.schoolId) {
        whereConditions.push(`s."schoolId" = '${ctx.schoolId}'`);
      } else {
        // Non-admin users without school context get no data
        whereConditions.push('FALSE');
      }
    }
    // Super admins can see all data including null schoolId
    
    const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : 'TRUE';
    const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';

    // OPTIMIZED: Use database aggregations for 10M record performance
    // Include both FeeRecords and FeeArrears for current academic year
    const query = `
      (
        SELECT 
          fr.id,
          fr."studentId",
          fr."feeStructureId",
          fr.amount,
          fr."paidAmount",
          fr.discount,
          fr."dueDate",
          fr."createdAt",
          fr."academicYear",
          fr."receiptNumber",
          s.name as "studentName",
          s.class,
          s.section,
          s."rollNo",
          COALESCE(s.status, 'active') as "studentStatus",
          fs.name as "feeStructureName",
          fs.category as "feeCategory",
          CASE 
            WHEN fr."paidAmount" >= (fr.amount - fr.discount) THEN 'paid'
            WHEN fr."paidAmount" > 0 AND fr."paidAmount" < (fr.amount - fr.discount) THEN 'partial'
            ELSE 'pending'
          END as status,
          COALESCE(SUM(p.amount), 0) as "totalPayments",
          COUNT(p.id) as "paymentCount",
          'fee_record' as record_type
        FROM "school"."FeeRecord" fr
        LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
        LEFT JOIN "school"."FeeStructure" fs ON fr."feeStructureId" = fs.id
        LEFT JOIN "school"."Payment" p ON fr.id = p."feeRecordId"
        WHERE ${whereClause}
        GROUP BY fr.id, fr."receiptNumber", s.name, s.class, s.section, s."rollNo", s.status, fs.name, fs.category
        
        UNION ALL
        
        SELECT 
          fa.id,
          fa."studentId",
          NULL as "feeStructureId",
          fa.amount,
          fa."paidAmount",
          0 as discount,
          fa."dueDate",
          fa."createdAt",
          fa."toAcademicYear" as "academicYear",
          NULL as "receiptNumber",
          s.name as "studentName",
          s.class,
          s.section,
          s."rollNo",
          COALESCE(s.status, 'active') as "studentStatus",
          'Arrears' as "feeStructureName",
          'Arrears' as "feeCategory",
          CASE 
            WHEN fa."paidAmount" >= fa.amount THEN 'paid'
            WHEN fa."paidAmount" > 0 AND fa."paidAmount" < fa.amount THEN 'partial'
            ELSE 'pending'
          END as status,
          0 as "totalPayments",
          0 as "paymentCount",
          'arrears' as record_type
        FROM "school"."FeeArrears" fa
        LEFT JOIN "school"."Student" s ON fa."studentId" = s.id
        WHERE ${whereConditions.filter(c => !c.includes('fr.')).length > 0 ? whereConditions.filter(c => !c.includes('fr.')).join(' AND ') : 'TRUE'}
      )
      ORDER BY "createdAt" DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `;

    console.log('DEBUG - Fee Records SQL:', {
      whereClause,
      havingClause,
      query: query.substring(0, 200) + '...'
    });

    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        SELECT fr.id
        FROM "school"."FeeRecord" fr
        LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
        LEFT JOIN "school"."FeeStructure" fs ON fr."feeStructureId" = fs.id
        WHERE ${whereClause}
        GROUP BY fr.id, s.name, s.class, s.section, s."rollNo", fs.name, fs.category
        ${havingClause}
      ) as filtered_records
    `;

    const summaryQuery = `
      SELECT 
        COUNT(*) as "totalRecords",
        COALESCE(SUM(fr.amount), 0) as "totalAmount",
        COALESCE(SUM(fr."paidAmount"), 0) as "totalCollected",
        COUNT(CASE WHEN fr."paidAmount" >= (fr.amount - fr.discount) THEN 1 END) as "paidCount",
        COUNT(CASE WHEN fr."paidAmount" > 0 AND fr."paidAmount" < (fr.amount - fr.discount) THEN 1 END) as "overdueCount",
        COUNT(CASE WHEN fr."paidAmount" > 0 AND fr."paidAmount" < (fr.amount - fr.discount) THEN 1 END) as "partialCount",
        COUNT(CASE WHEN fr."paidAmount" = 0 THEN 1 END) as "pendingCount"
      FROM "school"."FeeRecord" fr
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      WHERE ${whereClause}
      ${havingClause}
    `;

    // Add fines summary query
    const finesSummaryQuery = `
      SELECT 
        COUNT(*) as "totalFines",
        COALESCE(SUM(f.amount), 0) as "totalFinesAmount",
        COALESCE(SUM(f."paidAmount"), 0) as "totalFinesCollected",
        COALESCE(SUM(f."pendingAmount"), 0) as "totalFinesPending",
        COALESCE(SUM(f."waivedAmount"), 0) as "totalFinesWaived",
        COUNT(CASE WHEN f."paidAmount" >= f.amount THEN 1 END) as "finesPaidCount",
        COUNT(CASE WHEN f."paidAmount" > 0 AND f."paidAmount" < f.amount THEN 1 END) as "finesPartialCount",
        COUNT(CASE WHEN f."paidAmount" = 0 THEN 1 END) as "finesPendingCount"
      FROM "school"."Fine" f
      LEFT JOIN "school"."Student" s ON f."studentId" = s.id
      WHERE f."schoolId" = $1
      ${studentId ? `AND f."studentId" = $2` : ''}
      ${studentClass ? `AND s.class = $${studentId ? 3 : 2}` : ''}
      ${status ? `AND f.status = $${studentId ? (studentClass ? 4 : 3) : (studentClass ? 3 : 2)}` : ''}
    `;

    // Execute optimized queries in parallel
    const [recordsResult, countResult, summaryResult, finesSummaryResult] = await Promise.all([
      schoolPrisma.$queryRawUnsafe(query),
      schoolPrisma.$queryRawUnsafe(countQuery),
      schoolPrisma.$queryRawUnsafe(summaryQuery),
      schoolPrisma.$queryRawUnsafe(finesSummaryQuery, ctx.schoolId, ...(studentId ? [studentId] : []), ...(studentClass ? [studentClass] : []), ...(status ? [status] : []))
    ]);

    console.log('DEBUG - Fee Records Results:', {
      recordsCount: recordsResult.length,
      sampleRecords: recordsResult.slice(0, 2).map((r: any) => ({
        id: r.id,
        academicYear: r.academicYear,
        studentName: r.studentName,
        feeStructureName: r.feeStructureName,
        amount: r.amount
      }))
    });

    // Handle BigInt serialization
    const safeParseInt = (value: any) => {
      if (typeof value === 'bigint') return Number(value);
      return parseInt(value || 0);
    };
    
    const safeParseFloat = (value: any) => {
      if (typeof value === 'bigint') return Number(value);
      return parseFloat(value || 0);
    };

    // Format records for frontend
    const records = (recordsResult as unknown as any[]).map((record: any) => {
      const amount = safeParseFloat(record.amount);
      const paidAmount = safeParseFloat(record.paidAmount);
      const discount = safeParseFloat(record.discount);
      const pendingAmount = Math.max(0, amount - paidAmount - discount);
      const normalizedStudentStatus = record.studentStatus === 'exit' ? 'exited' : (record.studentStatus || 'active');
      const invoicePrefix = record.record_type === 'arrears' ? 'ARR' : 'INV';
      
      return {
        id: record.id,
        invoiceNumber: `${invoicePrefix}-${String(record.id || '').slice(-6).toUpperCase()}`,
        receiptNumber: record.receiptNumber || null,
        amount,
        paidAmount,
        pendingAmount,
        discount,
        dueDate: record.dueDate,
        createdAt: record.createdAt,
        academicYear: record.academicYear,
        student: {
          name: record.studentName,
          class: record.class,
          section: record.section,
          rollNo: record.rollNo,
          status: normalizedStudentStatus
        },
        feeStructure: {
          name: record.feeStructureName,
          category: record.feeCategory
        },
        status: record.status,
        totalPayments: safeParseFloat(record.totalPayments),
        paymentCount: safeParseInt(record.paymentCount)
      };
    });

    const total = safeParseInt((countResult as unknown as any[])[0]?.total);
    const totalPages = Math.ceil(total / pageSize);

    // Format summary statistics
    const regularFeesSummary = {
      totalRecords: safeParseInt((summaryResult as unknown as any[])[0]?.totalRecords),
      totalAmount: safeParseFloat((summaryResult as unknown as any[])[0]?.totalAmount),
      totalCollected: safeParseFloat((summaryResult as unknown as any[])[0]?.totalCollected),
      paidCount: safeParseInt((summaryResult as unknown as any[])[0]?.paidCount),
      overdueCount: safeParseInt((summaryResult as unknown as any[])[0]?.overdueCount),
      partialCount: safeParseInt((summaryResult as unknown as any[])[0]?.partialCount),
      pendingCount: safeParseInt((summaryResult as unknown as any[])[0]?.pendingCount)
    };

    // Format fines summary statistics
    const finesSummary = {
      totalFines: safeParseInt((finesSummaryResult as unknown as any[])[0]?.totalFines),
      totalFinesAmount: safeParseFloat((finesSummaryResult as unknown as any[])[0]?.totalFinesAmount),
      totalFinesCollected: safeParseFloat((finesSummaryResult as unknown as any[])[0]?.totalFinesCollected),
      totalFinesPending: safeParseFloat((finesSummaryResult as unknown as any[])[0]?.totalFinesPending),
      totalFinesWaived: safeParseFloat((finesSummaryResult as unknown as any[])[0]?.totalFinesWaived),
      finesPaidCount: safeParseInt((finesSummaryResult as unknown as any[])[0]?.finesPaidCount),
      finesPartialCount: safeParseInt((finesSummaryResult as unknown as any[])[0]?.finesPartialCount),
      finesPendingCount: safeParseInt((finesSummaryResult as unknown as any[])[0]?.finesPendingCount)
    };

    // Combined summary including both regular fees and fines
    const summary = {
      ...regularFeesSummary,
      ...finesSummary,
      // Combined totals
      combinedTotalRecords: regularFeesSummary.totalRecords + finesSummary.totalFines,
      combinedTotalAmount: regularFeesSummary.totalAmount + finesSummary.totalFinesAmount,
      combinedTotalCollected: regularFeesSummary.totalCollected + finesSummary.totalFinesCollected,
      combinedTotalPending: regularFeesSummary.totalAmount - regularFeesSummary.totalCollected + finesSummary.totalFinesPending,
      combinedTotalWaived: finesSummary.totalFinesWaived, // Regular fees use discounts, not waivers
      combinedPaidCount: regularFeesSummary.paidCount + finesSummary.finesPaidCount,
      combinedPartialCount: regularFeesSummary.partialCount + finesSummary.finesPartialCount,
      combinedPendingCount: regularFeesSummary.pendingCount + finesSummary.finesPendingCount,
    };

    // Handle BigInt serialization in JSON response
    return NextResponse.json({
      success: true,
      records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page * pageSize < total,
        hasPrev: page > 1
      },
      summary
    }, (key, value) => typeof value === 'bigint' ? Number(value) : value);

  } catch (error) {
    console.error('GET /api/fees/records:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch fee records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { studentId, feeStructureId, amount, dueDate, academicYear, discount = 0, remarks } = body;

    // Verify student belongs to this school
    if (ctx.schoolId) {
      const student = await (schoolPrisma as any).student.findFirst({ where: { id: studentId, schoolId: ctx.schoolId } });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!studentId || !feeStructureId || !amount || !dueDate) {
      return NextResponse.json({ error: 'studentId, feeStructureId, amount, dueDate are required' }, { status: 400 });
    }

    const pendingAmount = amount - discount;
    const record = await (schoolPrisma as any).feeRecord.create({
      data: {
        studentId,
        feeStructureId,
        amount,
        paidAmount: 0,
        pendingAmount,
        discount,
        dueDate,
        academicYear: academicYear || '2024-25',
        status: 'pending',
        remarks,
      },
      include: {
        student: { select: { id: true, name: true, class: true } },
        feeStructure: { select: { id: true, name: true, category: true } },
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('POST /api/fees/records:', error);
    return NextResponse.json({ error: 'Failed to create fee record' }, { status: 500 });
  }
}
