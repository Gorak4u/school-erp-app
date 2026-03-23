import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendLeaveApprovalRequestEmail } from '@/lib/leave-approval-request-email';
import { sendLeaveStatusUpdateEmail } from '@/lib/leave-notification-emails';

// PUT - Update leave application status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status, comments } = await request.json();

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const userPermissions = ((session.user as any)?.permissions || []) as string[];
    const canApproveLeave =
      session.user.role === 'admin' ||
      session.user.role === 'super_admin' ||
      userPermissions.includes('approve_department_leave') ||
      userPermissions.includes('approve_all_leave') ||
      userPermissions.includes('override_leave_approval');

    if (!canApproveLeave) {
      return NextResponse.json({ error: 'You do not have permission to update leave applications' }, { status: 403 });
    }

    await schoolPrisma.$connect();

    // Get the application with related data
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
            employeeId: true,
          },
        },
        leaveType: {
          select: {
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            name: true,
            year: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application is not in pending status', currentStatus: application.status },
        { status: 400 }
      );
    }

    const school = await schoolPrisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: { name: true },
    });

    // Find the teacher record for the current user (approver) when available.
    let approverTeacherId: string | null = null;
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      const approverTeacher = await schoolPrisma.teacher.findFirst({
        where: {
          userId: session.user.id,
          schoolId: session.user.schoolId,
        },
        select: { id: true },
      });

      approverTeacherId = approverTeacher?.id || null;
    }

    const updatedApplication = await schoolPrisma.$transaction(async (tx) => {
      if (status === 'approved') {
        const leaveBalance = await tx.leaveBalance.findFirst({
          where: {
            staffId: application.staffId,
            leaveTypeId: application.leaveTypeId,
            academicYearId: application.academicYearId,
          },
        });

        if (!leaveBalance) {
          throw new Error('Leave balance not found');
        }

        const balanceValue = Number(leaveBalance.balance);
        if (balanceValue < Number(application.totalDays)) {
          throw new Error('Insufficient leave balance');
        }
      }

      const updateResult = await tx.leaveApplication.updateMany({
        where: {
          id,
          schoolId: session.user.schoolId,
          status: 'pending',
        },
        data: {
          status,
          approverId: approverTeacherId,
          approvedAt: status === 'approved' ? new Date() : null,
          approvalComments: comments || null,
          rejectionReason: status === 'rejected' ? (comments || null) : null,
        },
      });

      if (updateResult.count === 0) {
        throw new Error('Application is not in pending status');
      }

      if (approverTeacherId) {
        await tx.leaveApprovalHistory.create({
          data: {
            leaveApplicationId: application.id,
            approverId: approverTeacherId,
            action: status,
            comments: comments || null,
            approverRole: session.user.role,
            previousStatus: 'pending',
            newStatus: status,
          },
        });
      }

      if (status === 'approved') {
        await tx.leaveBalance.update({
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
      }

      return tx.leaveApplication.findUnique({
        where: { id },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true,
            },
          },
          leaveType: {
            select: {
              name: true,
              code: true,
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
    });

    if (!updatedApplication) {
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // Send email notifications
    try {
      // Send email to the applicant about status change
      if (application.staff.email && school?.name) {
        await sendLeaveStatusUpdateEmail({
          to: application.staff.email,
          staffName: application.staff.name,
          leaveType: application.leaveType.name,
          startDate: application.startDate.toISOString(),
          endDate: application.endDate.toISOString(),
          totalDays: Number(application.totalDays),
          reason: application.reason || undefined,
          status: status,
          approverName: session.user.name || 'Administrator',
          comments: comments || undefined,
          schoolName: school.name,
          applicationId: application.id,
          schoolId: session.user.schoolId,
        });
      }

      // Send confirmation email to the approver
      if (session.user.email && school?.name) {
        // Send a different email to approver confirming their action
        await sendLeaveStatusUpdateEmail({
          to: session.user.email,
          staffName: application.staff.name,
          leaveType: application.leaveType.name,
          startDate: application.startDate.toISOString(),
          endDate: application.endDate.toISOString(),
          totalDays: Number(application.totalDays),
          reason: application.reason || undefined,
          status: status,
          approverName: session.user.name || 'Administrator',
          comments: `You have ${status} this leave application`,
          schoolName: school.name,
          applicationId: application.id,
          schoolId: session.user.schoolId,
        });
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      application: updatedApplication,
      message: `Leave application ${status} successfully`,
    });

  } catch (error: any) {
    const message = error?.message || '';

    if (
      message === 'Leave balance not found' ||
      message === 'Insufficient leave balance' ||
      message === 'Application is not in pending status'
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Error updating leave application status:', error);
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  } finally {
    await schoolPrisma.$disconnect();
  }
}
