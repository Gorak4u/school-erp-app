// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const student = await schoolPrisma.student.findFirst({
      where: { id, ...tenantWhere(ctx) },
      select: {
        id: true, name: true, admissionNo: true, status: true,
        feeRecords: {
          select: { id: true, amount: true, paidAmount: true, discount: true, status: true, dueDate: true, paidDate: true, remarks: true },
          orderBy: { createdAt: 'desc' },
        },
        arrears: {
          select: { id: true, amount: true, paidAmount: true, fromAcademicYear: true, dueDate: true, status: true, remarks: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });

    const feeTotal = student.feeRecords.reduce((sum, f) => sum + (f.amount || 0), 0);
    const feePaid = student.feeRecords.reduce((sum, f) => sum + (f.paidAmount || 0) + (f.discount || 0), 0);
    const unpaidFees = student.feeRecords.filter(f => f.status !== 'paid' && f.status !== 'waived');
    const unpaidArrears = student.arrears.filter(a => a.status !== 'paid' && a.status !== 'waived');

    const arrearsTotal = unpaidArrears.reduce((sum, a) => sum + Math.max(0, (a.amount || 0) - (a.paidAmount || 0)), 0);
    const feesPending = Math.max(0, feeTotal - feePaid);
    const totalDues = feesPending + arrearsTotal;

    return NextResponse.json({
      success: true,
      data: {
        studentId: student.id,
        studentName: student.name,
        admissionNo: student.admissionNo,
        totalDues,
        feesPending,
        arrearsTotal,
        unpaidFees: unpaidFees.map(f => ({
          id: f.id,
          amount: f.amount,
          paidAmount: f.paidAmount,
          pendingAmount: Math.max(0, f.amount - f.paidAmount - (f.discount || 0)),
          dueDate: f.dueDate,
          status: f.status,
          description: f.remarks,
        })),
        arrears: unpaidArrears.map(a => ({
          id: a.id,
          amount: a.amount,
          paidAmount: a.paidAmount,
          pendingAmount: Math.max(0, a.amount - a.paidAmount),
          fromAcademicYear: a.fromAcademicYear,
          dueDate: a.dueDate,
          status: a.status,
          description: a.remarks,
        })),
      },
    });
  } catch (error: any) {
    console.error('GET /api/alumni/[id]/dues:', error);
    return NextResponse.json({ error: 'Failed to fetch dues' }, { status: 500 });
  }
}
