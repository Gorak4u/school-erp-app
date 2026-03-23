import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - Approve a leave application
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
    const { comments, forwardTo } = body;

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
        approvalHistory: {
          orderBy: { createdAt: 'desc' },
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

    // Check if staff attendance is already marked for any day in the leave period
    const attendanceConflicts = await (schoolPrisma as any).staffAttendanceRecord.findMany({
      where: {
        teacherId: application.staffId,
        attendanceDate: {
          gte: new Date(application.startDate),
          lte: new Date(application.endDate),
        },
      },
      select: {
        attendanceDate: true,
        status: true,
        source: true,
      },
    });

    if (attendanceConflicts.length > 0) {
      const conflictDates = attendanceConflicts.map(conflict => 
        new Date(conflict.attendanceDate).toISOString().split('T')[0]
      ).join(', ');
      
      return NextResponse.json({ 
        error: 'Cannot approve leave - staff attendance already marked', 
        message: `Attendance is already recorded for: ${conflictDates}. Please delete attendance records first or adjust leave dates.`,
        conflicts: attendanceConflicts
      }, { status: 409 });
    }

    // Check if approver has permission to approve
    // This would involve checking the workflow and permissions
    // For now, we'll proceed with basic approval

    // Create approval history entry
    await schoolPrisma.leaveApprovalHistory.create({
      data: {
        leaveApplicationId: application.id,
        approverId: approver.id,
        action: 'approved',
        comments,
        approverRole: approver.designation || 'staff',
        previousStatus: application.status,
        newStatus: 'approved',
      },
    });

    // Update leave application
    const updatedApplication = await schoolPrisma.leaveApplication.update({
      where: { id: application.id },
      data: {
        status: 'approved',
        approverId: approver.id,
        approvedAt: new Date(),
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

    // Update leave balance
    await schoolPrisma.leaveBalance.update({
      where: {
        staffId_leaveTypeId_academicYearId: {
          staffId: application.staffId,
          leaveTypeId: application.leaveTypeId,
          academicYearId: application.academicYearId,
        },
      },
      data: {
        used: { increment: application.totalDays },
        balance: { decrement: application.totalDays },
      },
    });

    // Send notification to staff member
    try {
      if (application.staff?.id) {
        // Create notification directly in database
        await (schoolPrisma as any).notification.create({
          data: {
            userId: application.staff.id,
            type: 'leave_approved',
            title: 'Leave Application Approved',
            message: `Your leave application has been approved for ${application.totalDays} day(s)`,
            priority: 'medium',
            metadata: JSON.stringify({ 
              leaveApplicationId: application.id,
              totalDays: application.totalDays,
              startDate: application.startDate,
              endDate: application.endDate
            }),
            schoolId: application.schoolId,
            isRead: false,
            createdAt: new Date()
          }
        });
        
        logger.info('Leave approval notification sent', { 
          leaveApplicationId: application.id,
          userId: application.staff.id 
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send leave approval notification', { 
        error: notificationError,
        leaveApplicationId: application.id 
      });
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      application: updatedApplication,
      message: 'Leave application approved successfully'
    });
  } catch (error) {
    logger.error('Error approving leave application', { error, leaveApplicationId: id });
    return NextResponse.json({ error: 'Failed to approve leave application' }, { status: 500 });
  }
}
