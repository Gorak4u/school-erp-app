import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/fines/waiver-requests/[id] - Get specific waiver request
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    const waiverRequest = await (schoolPrisma as any).FineWaiverRequest.findFirst({
      where: { id },
      include: {
        fine: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                admissionNo: true,
                class: true,
                section: true
              }
            }
          }
        }
      }
    });

    if (!waiverRequest) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Waiver request not found' 
        },
        { status: 404 }
      );
    }

    // Check school access
    if (!ctx.isSuperAdmin && ctx.schoolId && waiverRequest.schoolId !== ctx.schoolId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Access denied' 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      waiverRequest
    });

  } catch (error) {
    console.error('Failed to fetch waiver request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch waiver request' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/fines/waiver-requests/[id] - Update waiver request (approve/reject)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;
    const body = await request.json();
    const {
      action, // 'approve' or 'reject'
      remarks,
      waiveAmount
    } = body;

    // Check permissions
    if (!ctx.permissions?.includes('manage_fines')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient permissions to manage waiver requests' 
        },
        { status: 403 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'action must be either "approve" or "reject"' 
        },
        { status: 400 }
      );
    }

    // Get waiver request with fine details
    const waiverRequest = await (schoolPrisma as any).FineWaiverRequest.findFirst({
      where: { id },
      include: {
        fine: true
      }
    });

    if (!waiverRequest) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Waiver request not found' 
        },
        { status: 404 }
      );
    }

    if (waiverRequest.status !== 'pending') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Waiver request is already processed' 
        },
        { status: 400 }
      );
    }

    // Check school access
    if (!ctx.isSuperAdmin && ctx.schoolId && waiverRequest.schoolId !== ctx.schoolId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Access denied' 
        },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // Calculate waiver amount - use the amount stored in the waiver request
      const pendingAmount = waiverRequest.fine.amount - waiverRequest.fine.paidAmount - waiverRequest.fine.waivedAmount;
      const actualWaiveAmount = waiverRequest.waiveAmount && waiverRequest.waiveAmount <= pendingAmount ? waiverRequest.waiveAmount : pendingAmount;

      // Update fine
      const newWaivedAmount = waiverRequest.fine.waivedAmount + actualWaiveAmount;
      const newPendingAmount = waiverRequest.fine.amount - waiverRequest.fine.paidAmount - newWaivedAmount;
      let newStatus = waiverRequest.fine.status;

      if (newPendingAmount <= 0) {
        newStatus = 'waived';
      }

      await (schoolPrisma as any).Fine.update({
        where: { id: waiverRequest.fineId },
        data: {
          waivedAmount: newWaivedAmount,
          pendingAmount: Math.max(0, newPendingAmount),
          status: newStatus,
          waivedAt: newStatus === 'waived' ? new Date() : waiverRequest.fine.waivedAt,
          waivedBy: ctx.email,
          waiverReason: waiverRequest.reason
        }
      });
    }

    // Update waiver request
    const updatedRequest = await (schoolPrisma as any).FineWaiverRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: ctx.email,
        reviewedByName: ctx.email,
        reviewedAt: new Date(),
        remarks: remarks || null
      },
      include: {
        fine: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                admissionNo: true,
                class: true,
                section: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      waiverRequest: updatedRequest,
      message: `Waiver request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    });

  } catch (error) {
    console.error('Failed to update waiver request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update waiver request' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/fines/waiver-requests/[id] - Delete waiver request
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    // Get waiver request
    const waiverRequest = await (schoolPrisma as any).FineWaiverRequest.findFirst({
      where: { id }
    });

    if (!waiverRequest) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Waiver request not found' 
        },
        { status: 404 }
      );
    }

    // Only allow deletion of pending requests by the requester or admin
    const canDelete = waiverRequest.requestedBy === ctx.email || 
                     ctx.permissions?.includes('manage_fines') ||
                     ctx.isSuperAdmin;

    if (!canDelete) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Access denied' 
        },
        { status: 403 }
      );
    }

    if (waiverRequest.status !== 'pending') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete processed waiver request' 
        },
        { status: 400 }
      );
    }

    await schoolPrisma.fineWaiverRequest.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Waiver request deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete waiver request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete waiver request' 
      },
      { status: 500 }
    );
  }
}
