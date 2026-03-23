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

    // Update the application status
    // Find the teacher record for the current user (approver) - but allow admins without teacher records
    let approverTeacherId: string | null = null;
    
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      // For teachers, find their teacher record
      const approverTeacher = await schoolPrisma.teacher.findFirst({
        where: {
          userId: session.user.id,
          schoolId: session.user.schoolId,
        },
        select: { id: true }
      });

      if (!approverTeacher) {
        return NextResponse.json({ error: 'Approver teacher record not found' }, { status: 400 });
      }
      
      approverTeacherId = approverTeacher.id;
    }
    // For admins, approverId can be null (they don't need a teacher record)

    const updatedApplication = await schoolPrisma.leaveApplication.update({
      where: { id },
      data: {
        status,
        approverId: approverTeacherId, // Can be null for admins
        approvedAt: status === 'approved' ? new Date() : null,
        approvalComments: comments || null,
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
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update leave balance if approved
    if (status === 'approved') {
      const leaveBalance = await schoolPrisma.leaveBalance.findFirst({
        where: {
          staffId: application.staffId,
          leaveTypeId: application.leaveTypeId,
          academicYearId: application.academicYearId,
        },
      });

      if (leaveBalance) {
        const newUsed = parseFloat(leaveBalance.used.toString()) + application.totalDays;
        const newBalance = parseFloat(leaveBalance.balance.toString()) - application.totalDays;

        await schoolPrisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            used: newUsed,
            balance: newBalance,
          },
        });
      }
    }

    // Send email notifications
    try {
      // Get school name for emails
      const school = await schoolPrisma.school.findUnique({
        where: { id: session.user.schoolId },
        select: { name: true },
      });

      // Send email to the applicant about status change
      if (application.staff.email && school?.name) {
        await sendLeaveStatusUpdateEmail({
          to: application.staff.email,
          staffName: application.staff.name,
          leaveType: application.leaveType.name,
          startDate: application.startDate,
          endDate: application.endDate,
          totalDays: application.totalDays,
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
          startDate: application.startDate,
          endDate: application.endDate,
          totalDays: application.totalDays,
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

    console.log(`Leave application ${id} ${status} by ${session.user.name}`);

    return NextResponse.json({
      application: updatedApplication,
      message: `Leave application ${status} successfully`,
    });

  } catch (error) {
    console.error('Error updating leave application status:', error);
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  } finally {
    await schoolPrisma.$disconnect();
  }
}
