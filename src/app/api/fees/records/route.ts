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
    const fromDate = parseDateParam(searchParams.get('fromDate'));
    const toDate = parseDateParam(searchParams.get('toDate'), { endOfDay: true });
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (academicYear) where.academicYear = academicYear;
    
    // Add date range filtering
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = fromDate;
      }
      if (toDate) {
        where.createdAt.lte = toDate;
      }
    }
    
    // Tenant isolation via student relation
    if (ctx.schoolId) {
      where.student = { schoolId: ctx.schoolId };
    }

    const [records, total] = await Promise.all([
      (schoolPrisma as any).feeRecord.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, class: true, section: true, rollNo: true } },
          feeStructure: { select: { id: true, name: true, category: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).feeRecord.count({ where }),
    ]);

    return NextResponse.json({ records, total, page, pageSize });
  } catch (error) {
    console.error('GET /api/fees/records:', error);
    return NextResponse.json({ error: 'Failed to fetch fee records' }, { status: 500 });
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
