import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await schoolPrisma.$connect();

    console.log('Debug API - Current User:', session.user.id);

    // Get all staff in the school
    const allStaff = await schoolPrisma.teacher.findMany({
      where: {
        schoolId: session.user.schoolId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        userId: true, // Check if there's a userId field
      },
    });

    console.log('All Staff:', allStaff);

    // Get all leave balances for this school
    const allLeaveBalances = await schoolPrisma.leaveBalance.findMany({
      where: {
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

    console.log('All Leave Balances:', allLeaveBalances);

    // Get all leave applications for this school
    const allLeaveApplications = await schoolPrisma.leaveApplication.findMany({
      where: {
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
      take: 10,
    });

    console.log('All Leave Applications:', allLeaveApplications);

    return NextResponse.json({
      currentUser: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      allStaff,
      allLeaveBalances,
      allLeaveApplications,
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 });
  } finally {
    await schoolPrisma.$disconnect();
  }
}
