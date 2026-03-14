// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

// POST /api/fees/payments — process a payment against a fee record
export async function POST(request: NextRequest) {
  try {
    const { feeRecordId, amount, paymentMethod, transactionId, collectedBy, remarks } = await request.json();

    if (!feeRecordId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'feeRecordId, amount, paymentMethod are required' }, { status: 400 });
    }

    const record = await (schoolPrisma as any).feeRecord.findUnique({ where: { id: feeRecordId } });
    if (!record) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });

    const maxPayable = record.pendingAmount;
    if (amount > maxPayable) {
      return NextResponse.json({ error: `Amount exceeds pending amount of ₹${maxPayable}` }, { status: 400 });
    }

    const receiptNumber = `RCPT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const paymentDate = new Date().toISOString().slice(0, 10);

    const newPaidAmount = record.paidAmount + amount;
    const newPendingAmount = record.amount - record.discount - newPaidAmount;
    const newStatus = newPendingAmount <= 0 ? 'paid' : 'partial';

    // Transaction: create payment + update fee record atomically
    const [payment, updatedRecord] = await (schoolPrisma as any).$transaction([
      (schoolPrisma as any).payment.create({
        data: {
          feeRecordId,
          amount,
          paymentMethod,
          transactionId,
          receiptNumber,
          paymentDate,
          collectedBy,
          remarks,
        },
      }),
      (schoolPrisma as any).feeRecord.update({
        where: { id: feeRecordId },
        data: {
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          status: newStatus,
          paymentMethod,
          transactionId,
          receiptNumber,
          paidDate: paymentDate,
          collectedBy,
        },
        include: {
          student: { select: { id: true, name: true, class: true, admissionNo: true } },
          feeStructure: { select: { id: true, name: true, category: true } },
          payments: true,
        },
      }),
    ]);

    return NextResponse.json({ payment, feeRecord: updatedRecord, receiptNumber }, { status: 201 });
  } catch (error) {
    console.error('POST /api/fees/payments:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

// GET /api/fees/payments — list all payments
export async function GET(request: NextRequest) {
  try {
    const { getSessionContext } = await import('@/lib/apiAuth');
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const feeRecordId = searchParams.get('feeRecordId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const where: any = {};
    if (feeRecordId) where.feeRecordId = feeRecordId;
    // Tenant isolation via feeRecord → student
    if (!ctx.isSuperAdmin && ctx.schoolId) {
      where.feeRecord = { student: { schoolId: ctx.schoolId } };
    }

    const [payments, total] = await Promise.all([
      (schoolPrisma as any).payment.findMany({
        where,
        include: { feeRecord: { include: { student: { select: { id: true, name: true, class: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).payment.count({ where }),
    ]);

    return NextResponse.json({ payments, total });
  } catch (error) {
    console.error('GET /api/fees/payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
