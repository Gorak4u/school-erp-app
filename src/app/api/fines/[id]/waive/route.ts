import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// POST /api/fines/[id]/waive - Request or process fine waiver
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;
    const body = await request.json();
    const {
      action, // 'request' or 'approve'
      reason,
      waiveAmount,
      documents,
      remarks
    } = body;

    // Validation
    if (!action || !['request', 'approve'].includes(action)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'action must be either "request" or "approve"' 
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { 
          success: false,
          error: 'reason is required' 
        },
        { status: 400 }
      );
    }

    // Check if fine exists and belongs to school
    const fine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true,
            section: true,
            email: true,
            phone: true
          }
        },
        waiverRequests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!fine) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine not found' 
        },
        { status: 404 }
      );
    }

    // Check if fine is already paid
    if (fine.status === 'paid') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot waive paid fines' 
        },
        { status: 400 }
      );
    }

    // Check for existing pending waiver request
    const existingRequest = fine.waiverRequests.find((req: any) => req.status === 'pending');
    if (existingRequest && action === 'request') {
      return NextResponse.json(
        { 
          success: false,
          error: 'A waiver request is already pending for this fine' 
        },
        { status: 409 }
      );
    }

    if (action === 'request') {
      // Create waiver request
      const waiverRequest = await schoolPrisma.fineWaiverRequest.create({
        data: {
          schoolId: ctx.schoolId!,
          fineId: id,
          requestedBy: 'parent', // Can be dynamic based on user role
          requesterId: fine.studentId,
          requesterName: fine.student.name,
          requesterEmail: fine.student.email,
          reason,
          documents: documents ? JSON.stringify(documents) : null,
          status: 'pending'
        }
      });

      // TODO: Send notification to approvers
      // await sendWaiverRequestNotification(waiverRequest);

      return NextResponse.json({
        success: true,
        waiverRequest,
        message: 'Waiver request submitted successfully'
      }, { status: 201 });

    } else if (action === 'approve') {
      // Check user has permission to approve waivers
      if (!ctx.permissions?.includes('manage_fines')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient permissions to approve waivers' 
          },
          { status: 403 }
        );
      }

      // Find pending waiver request
      const pendingRequest = fine.waiverRequests.find((req: any) => req.status === 'pending');
      if (!pendingRequest) {
        return NextResponse.json(
          { 
            success: false,
            error: 'No pending waiver request found' 
          },
          { status: 404 }
        );
      }

      // Calculate waiver amount
      const pendingAmount = fine.amount - fine.paidAmount - fine.waivedAmount;
      const actualWaiveAmount = waiveAmount && waiveAmount <= pendingAmount ? waiveAmount : pendingAmount;

      // Update waiver request
      await schoolPrisma.fineWaiverRequest.update({
        where: { id: pendingRequest.id },
        data: {
          status: 'approved',
          reviewedBy: ctx.email,
          reviewedByName: ctx.email,
          reviewedAt: new Date(),
          remarks
        }
      });

      // Update fine
      const newWaivedAmount = fine.waivedAmount + actualWaiveAmount;
      const newPendingAmount = fine.amount - fine.paidAmount - newWaivedAmount;
      let newStatus = fine.status;

      if (newPendingAmount <= 0) {
        newStatus = 'waived';
      }

      const updatedFine = await (schoolPrisma as any).Fine.update({
        where: { id },
        data: {
          waivedAmount: newWaivedAmount,
          pendingAmount: Math.max(0, newPendingAmount),
          status: newStatus,
          waivedAt: newStatus === 'waived' ? new Date() : fine.waivedAt,
          waivedBy: ctx.email,
          waiverReason: reason
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              admissionNo: true,
              class: true,
              section: true,
              rollNo: true
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          },
          waiverRequests: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // TODO: Send waiver approval notification
      // await sendWaiverApprovalNotification(updatedFine, actualWaiveAmount);

      return NextResponse.json({
        success: true,
        fine: updatedFine,
        waivedAmount: actualWaiveAmount,
        message: `Waiver of ₹${actualWaiveAmount} approved successfully`
      });

    }

  } catch (error) {
    console.error('POST /api/fines/[id]/waive:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid reference to fine or school' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process waiver',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/fines/[id]/waive - Get waiver requests for fine
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    // Check if fine exists and belongs to school
    const fine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      },
      select: { id: true }
    });

    if (!fine) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine not found' 
        },
        { status: 404 }
      );
    }

    // Get waiver requests
    const waiverRequests = await schoolPrisma.fineWaiverRequest.findMany({
      where: { fineId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      waiverRequests
    });

  } catch (error) {
    console.error('GET /api/fines/[id]/waive:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch waiver requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
