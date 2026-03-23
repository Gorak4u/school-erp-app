import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendLeaveCancelledEmail } from '@/lib/leave-notification-emails';

// DELETE - Cancel leave application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if user can cancel this application (either own application or admin)
    if (application.staffId !== session.user.id && 
        session.user.role !== 'admin' && 
        session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'You can only cancel your own applications' }, { status: 403 });
    }

    // Check if application can be cancelled (only pending or approved)
    if (!['pending', 'approved'].includes(application.status)) {
      return NextResponse.json({ error: 'Cannot cancel application that is already rejected or completed' }, { status: 400 });
    }

    // If approved, restore leave balance
    if (application.status === 'approved') {
      const leaveBalance = await schoolPrisma.leaveBalance.findFirst({
        where: {
          staffId: application.staffId,
          leaveTypeId: application.leaveTypeId,
          academicYearId: application.academicYearId,
        },
      });

      if (leaveBalance) {
        const newUsed = parseFloat(leaveBalance.used.toString()) - Number(application.totalDays);
        const newBalance = parseFloat(leaveBalance.balance.toString()) + Number(application.totalDays);

        await schoolPrisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            used: newUsed,
            balance: newBalance,
          },
        });
      }
    }

    // Update the application status to cancelled
    const updatedApplication = await schoolPrisma.leaveApplication.update({
      where: { id },
      data: {
        status: 'cancelled',
        approvalComments: 'Application cancelled by ' + (session.user.name || 'user'),
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
      },
    });

    // Send email notification to the applicant
    try {
      const school = await schoolPrisma.school.findUnique({
        where: { id: session.user.schoolId },
        select: { name: true },
      });

      if (application.staff.email && school?.name) {
        await sendLeaveCancelledEmail({
          to: application.staff.email,
          staffName: application.staff.name,
          leaveType: application.leaveType.name,
          startDate: application.startDate.toISOString(),
          endDate: application.endDate.toISOString(),
          totalDays: Number(application.totalDays),
          reason: application.reason || undefined,
          schoolName: school.name,
          applicationId: application.id,
          schoolId: session.user.schoolId,
        });
      }
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the request if email fails
    }

    console.log(`Leave application ${id} cancelled by ${session.user.name}`);

    return NextResponse.json({
      application: updatedApplication,
      message: 'Leave application cancelled successfully',
    });

  } catch (error) {
    console.error('Error cancelling leave application:', error);
    return NextResponse.json({ error: 'Failed to cancel application' }, { status: 500 });
  } finally {
    await schoolPrisma.$disconnect();
  }
}
