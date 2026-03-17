// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canManageFeesAccess } from '@/lib/permissions';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const arrears = await (schoolPrisma as any).feeArrears.findFirst({
      where: { id, schoolId: ctx.schoolId }
    });
    if (!arrears) return NextResponse.json({ error: 'Arrears record not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: arrears });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch arrears' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canManageFeesAccess(ctx)) {
      return NextResponse.json({ error: 'Only admins can record arrears payments' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { paymentAmount, paymentMethod, remarks } = body;

    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    const arrears = await (schoolPrisma as any).feeArrears.findFirst({
      where: { id, schoolId: ctx.schoolId }
    });
    if (!arrears) return NextResponse.json({ error: 'Arrears record not found' }, { status: 404 });
    if (arrears.status === 'paid') return NextResponse.json({ error: 'Arrears already fully paid' }, { status: 400 });

    const newPaidAmount = Math.min(arrears.paidAmount + paymentAmount, arrears.amount);
    const newPendingAmount = arrears.amount - newPaidAmount;
    const newStatus = newPendingAmount <= 0 ? 'paid' : 'partial';

    const updated = await (schoolPrisma as any).feeArrears.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newStatus,
        remarks: remarks || arrears.remarks
      }
    });

    // Also update the original fee record if it still exists
    try {
      const originalFee = await (schoolPrisma as any).feeRecord.findUnique({
        where: { id: arrears.originalFeeRecordId }
      });
      if (originalFee) {
        const updatedPaid = Math.min(originalFee.paidAmount + paymentAmount, originalFee.amount);
        const updatedPending = originalFee.amount - updatedPaid - (originalFee.discount || 0);
        const updatedStatus = updatedPending <= 0 ? 'paid' : 'partial';
        await (schoolPrisma as any).feeRecord.update({
          where: { id: arrears.originalFeeRecordId },
          data: { paidAmount: updatedPaid, pendingAmount: Math.max(0, updatedPending), status: updatedStatus }
        });
      }
    } catch (feeUpdateErr) {
      console.error('Failed to update original fee record:', feeUpdateErr);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: newStatus === 'paid' ? 'Arrears fully paid' : `Payment recorded. Remaining: ₹${newPendingAmount.toFixed(2)}`
    });
  } catch (err: any) {
    console.error('PATCH /api/fees/arrears/[id]:', err);
    return NextResponse.json({ error: 'Failed to record payment', details: err.message }, { status: 500 });
  }
}
