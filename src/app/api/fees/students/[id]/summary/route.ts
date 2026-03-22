import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canViewFeesAccess } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canViewFeesAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const studentId = resolvedParams.id;
    if (!studentId) {
      return NextResponse.json({ error: 'Student id is required' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        ...tenantWhere(ctx),
      },
      include: {
        feeRecords: {
          orderBy: { createdAt: 'desc' },
          include: {
            feeStructure: true,
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const feeRecords = student.feeRecords || [];

    const feeBreakdownMap = new Map<string, any>();
    for (const record of feeRecords) {
      const pendingAmount = Math.max(0, (record.amount || 0) - (record.paidAmount || 0) - (record.discount || 0));
      const feeStructureId = record.feeStructureId || record.feeStructure?.id || record.id;
      const key = feeStructureId || record.feeStructure?.name || record.id;
      const existing = feeBreakdownMap.get(key) || {
        feeStructureId,
        feeName: record.feeStructure?.name || 'Fee',
        category: record.feeStructure?.category || 'academic',
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        discountAmount: 0,
        recordCount: 0,
      };

      existing.totalAmount += Number(record.amount || 0);
      existing.paidAmount += Number(record.paidAmount || 0);
      existing.pendingAmount += pendingAmount;
      existing.discountAmount += Number(record.discount || 0);
      existing.recordCount += 1;
      feeBreakdownMap.set(key, existing);
    }

    const feeBreakdown = Array.from(feeBreakdownMap.values()).sort((a, b) =>
      a.feeName.localeCompare(b.feeName)
    );

    const totalFees = feeRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const totalPaid = feeRecords.reduce((sum, record) => sum + Number(record.paidAmount || 0), 0);
    const totalDiscount = feeRecords.reduce((sum, record) => sum + Number(record.discount || 0), 0);
    const totalPending = feeRecords.reduce(
      (sum, record) => sum + Math.max(0, (record.amount || 0) - (record.paidAmount || 0) - (record.discount || 0)),
      0
    );
    const totalOverdue = feeRecords.reduce((sum, record) => {
      const pendingAmount = Math.max(0, (record.amount || 0) - (record.paidAmount || 0) - (record.discount || 0));
      if (record.dueDate && new Date(record.dueDate) < new Date() && pendingAmount > 0) {
        return sum + pendingAmount;
      }
      return sum;
    }, 0);

    const paymentStatus = totalOverdue > 0
      ? 'overdue'
      : totalPaid === 0
        ? 'no_payment'
        : totalPaid >= totalFees
          ? 'fully_paid'
          : 'partially_paid';

    return NextResponse.json({
      success: true,
      data: {
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        admissionNo: student.admissionNo,
        studentStatus: student.status,
        totalFees,
        totalPaid,
        totalPending,
        totalDiscount,
        totalOverdue,
        paymentStatus,
        feeBreakdown,
        feeRecords: feeRecords.map(record => ({
          id: record.id,
          feeStructureId: record.feeStructureId,
          feeName: record.feeStructure?.name || 'Fee',
          category: record.feeStructure?.category || 'academic',
          amount: record.amount || 0,
          paidAmount: record.paidAmount || 0,
          discount: record.discount || 0,
          pendingAmount: Math.max(0, (record.amount || 0) - (record.paidAmount || 0) - (record.discount || 0)),
          dueDate: record.dueDate || null,
          status: record.status,
          academicYear: record.academicYear || '',
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/fees/students/[id]/summary:', error);
    return NextResponse.json({ error: 'Failed to load student fee summary' }, { status: 500 });
  }
}
