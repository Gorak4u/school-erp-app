import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - Reject a leave application
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { rejectionReason, comments } = body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Find the leave application
    const application = await schoolPrisma.leaveApplication.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Leave application not found' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Application is not in pending status',
        currentStatus: application.status 
      }, { status: 400 });
    }

    // Get approver (staff) information
    const approver = await schoolPrisma.teacher.findFirst({
      where: {
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
    });

    if (!approver) {
      return NextResponse.json({ error: 'Approver profile not found' }, { status: 404 });
    }

    // Create approval history entry
    await schoolPrisma.leaveApprovalHistory.create({
      data: {
        leaveApplicationId: application.id,
        approverId: approver.id,
        action: 'rejected',
        comments: comments || rejectionReason,
        approverRole: approver.designation || 'staff',
        previousStatus: application.status,
        newStatus: 'rejected',
      },
    });

    // Update leave application
    const updatedApplication = await schoolPrisma.leaveApplication.update({
      where: { id: application.id },
      data: {
        status: 'rejected',
        approverId: approver.id,
        rejectionReason,
        approvalComments: comments,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
            isPaid: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send notification to staff member about rejection
    // This would involve integrating with the notification system

    return NextResponse.json({ 
      application: updatedApplication,
      message: 'Leave application rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting leave application:', error);
    return NextResponse.json({ error: 'Failed to reject leave application' }, { status: 500 });
  }
}
