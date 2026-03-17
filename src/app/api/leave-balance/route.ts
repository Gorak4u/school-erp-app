import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Fetch leave balance for staff
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const academicYearId = searchParams.get('academicYearId');
    const leaveTypeId = searchParams.get('leaveTypeId');

    const where: any = {
      schoolId: session.user.schoolId,
    };

    if (staffId) where.staffId = staffId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;

    const leaveBalances = await schoolPrisma.leaveBalance.findMany({
      where,
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
            maxDaysPerYear: true,
            isPaid: true,
            canCarryForward: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            year: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { academicYear: { year: 'desc' } },
        { leaveType: { name: 'asc' } },
      ],
    });

    return NextResponse.json({ leaveBalances });
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    return NextResponse.json({ error: 'Failed to fetch leave balances' }, { status: 500 });
  }
}

// POST - Create or update leave balance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      staffId,
      leaveTypeId,
      academicYearId,
      totalAllocated,
      carriedForward,
      action, // 'allocate', 'accrue', 'adjust'
    } = body;

    // Validate required fields
    if (!staffId || !leaveTypeId || !academicYearId) {
      return NextResponse.json({ 
        error: 'Staff ID, leave type ID, and academic year ID are required' 
      }, { status: 400 });
    }

    // Check if staff exists and belongs to school
    const staff = await schoolPrisma.teacher.findFirst({
      where: {
        id: staffId,
        schoolId: session.user.schoolId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Check if leave type exists and belongs to school
    const leaveType = await schoolPrisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        schoolId: session.user.schoolId,
      },
    });

    if (!leaveType) {
      return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    }

    // Create or update leave balance
    const leaveBalance = await schoolPrisma.leaveBalance.upsert({
      where: {
        staffId_leaveTypeId_academicYearId: {
          staffId,
          leaveTypeId,
          academicYearId,
        },
      },
      update: {},
      create: {
        staffId,
        leaveTypeId,
        academicYearId,
        totalAllocated: totalAllocated || 0,
        carriedForward: carriedForward || 0,
        used: 0,
        balance: (totalAllocated || 0) + (carriedForward || 0),
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
            id: true,
            name: true,
            code: true,
            isPaid: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    });

    return NextResponse.json({ leaveBalance }, { status: 201 });
  } catch (error) {
    console.error('Error creating leave balance:', error);
    return NextResponse.json({ error: 'Failed to create leave balance' }, { status: 500 });
  }
}

// PUT - Adjust leave balance
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      totalAllocated,
      used,
      balance,
      carriedForward,
      adjustment,
      adjustmentReason,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Leave balance ID is required' }, { status: 400 });
    }

    // Find existing leave balance
    const existingBalance = await schoolPrisma.leaveBalance.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
    });

    if (!existingBalance) {
      return NextResponse.json({ error: 'Leave balance not found' }, { status: 404 });
    }

    // Calculate new values
    let newTotalAllocated = totalAllocated ?? existingBalance.totalAllocated;
    let newUsed = used ?? existingBalance.used;
    let newCarriedForward = carriedForward ?? existingBalance.carriedForward;
    let newBalance = balance ?? (newTotalAllocated + newCarriedForward - newUsed);

    // Apply adjustment if provided
    if (adjustment !== undefined) {
      newBalance += adjustment;
    }

    const updatedBalance = await schoolPrisma.leaveBalance.update({
      where: { id },
      data: {
        totalAllocated: newTotalAllocated,
        used: newUsed,
        balance: newBalance,
        carriedForward: newCarriedForward,
        lastAccrualDate: new Date(),
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
            id: true,
            name: true,
            code: true,
            isPaid: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    });

    return NextResponse.json({ updatedBalance });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    return NextResponse.json({ error: 'Failed to update leave balance' }, { status: 500 });
  }
}
