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
        whereConditions.push(`fr."paidAmount" >= fr.amount`);
      } else if (status === 'partial') {
        whereConditions.push(`fr."paidAmount" > 0 AND fr."paidAmount" < fr.amount`);
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
    const recordsQuery = `
      SELECT 
        fr.id,
        fr."receiptNumber",
        fr.amount,
        fr."paidAmount",
        fr."pendingAmount",
        fr.discount,
        fr."dueDate",
        fr."createdAt",
        fr."academicYear",
        s.name as "studentName",
        s.class as "studentClass",
        s.section as "studentSection",
        s."rollNo" as "studentRollNo",
        fs.name as "feeStructureName",
        fs.category as "feeCategory",
        CASE 
          WHEN fr."paidAmount" >= fr.amount THEN 'paid'
          WHEN fr."paidAmount" > 0 AND fr."paidAmount" < fr.amount THEN 'partial'
          ELSE 'pending'
        END as status,
        COALESCE(SUM(p.amount), 0) as "totalPayments",
        COUNT(p.id) as "paymentCount"
      FROM "school"."FeeRecord" fr
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      LEFT JOIN "school"."FeeStructure" fs ON fr."feeStructureId" = fs.id
      LEFT JOIN "school"."Payment" p ON fr.id = p."feeRecordId"
      WHERE ${whereClause}
      GROUP BY fr.id, s.name, s.class, s.section, s."rollNo", fs.name, fs.category
      ${havingClause}
      ORDER BY fr."createdAt" DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `;

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
        COUNT(CASE WHEN fr."paidAmount" >= fr.amount THEN 1 END) as "paidCount",
        COUNT(CASE WHEN fr."paidAmount" > 0 AND fr."paidAmount" < fr.amount THEN 1 END) as "overdueCount",
        COUNT(CASE WHEN fr."paidAmount" > 0 AND fr."paidAmount" < fr.amount THEN 1 END) as "partialCount",
        COUNT(CASE WHEN fr."paidAmount" = 0 THEN 1 END) as "pendingCount"
      FROM "school"."FeeRecord" fr
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      WHERE ${whereClause}
      ${havingClause}
    `;

    // Execute optimized queries in parallel
    const [recordsResult, countResult, summaryResult] = await Promise.all([
      schoolPrisma.$queryRawUnsafe(recordsQuery),
      schoolPrisma.$queryRawUnsafe(countQuery),
      schoolPrisma.$queryRawUnsafe(summaryQuery)
    ]);

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
    const records = (recordsResult as unknown as any[]).map((record: any) => ({
      id: record.id,
      receiptNumber: record.receiptNumber || `INV-${record.id?.slice(-6)}`,
      amount: safeParseFloat(record.amount),
      paidAmount: safeParseFloat(record.paidAmount),
      pendingAmount: safeParseFloat(record.pendingAmount),
      discount: safeParseFloat(record.discount),
      dueDate: record.dueDate,
      createdAt: record.createdAt,
      academicYear: record.academicYear,
      student: {
        name: record.studentName,
        class: record.studentClass,
        section: record.studentSection,
        rollNo: record.studentRollNo
      },
      feeStructure: {
        name: record.feeStructureName,
        category: record.feeCategory
      },
      status: record.status,
      totalPayments: safeParseFloat(record.totalPayments),
      paymentCount: safeParseInt(record.paymentCount)
    }));

    const total = safeParseInt((countResult as unknown as any[])[0]?.total);
    const totalPages = Math.ceil(total / pageSize);

    // Format summary statistics
    const summary = {
      totalRecords: safeParseInt((summaryResult as unknown as any[])[0]?.totalRecords),
      totalAmount: safeParseFloat((summaryResult as unknown as any[])[0]?.totalAmount),
      totalCollected: safeParseFloat((summaryResult as unknown as any[])[0]?.totalCollected),
      paidCount: safeParseInt((summaryResult as unknown as any[])[0]?.paidCount),
      overdueCount: safeParseInt((summaryResult as unknown as any[])[0]?.overdueCount),
      partialCount: safeParseInt((summaryResult as unknown as any[])[0]?.partialCount),
      pendingCount: safeParseInt((summaryResult as unknown as any[])[0]?.pendingCount)
    };

    // Handle BigInt serialization in JSON response
    const jsonString = JSON.stringify({
      success: true,
      data: {
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
      }
    }, (key, value) => typeof value === 'bigint' ? Number(value) : value);

    return new Response(jsonString, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

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
