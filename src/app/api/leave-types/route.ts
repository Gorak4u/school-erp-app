import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { schoolPrisma } from '@/lib/prisma';

// GET - Fetch all leave types for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {
      schoolId: session.user.schoolId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [leaveTypes, total] = await Promise.all([
      schoolPrisma.leaveType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              leaveApplications: true,
            },
          },
        },
      }),
      schoolPrisma.leaveType.count({ where }),
    ]);

    return NextResponse.json({
      leaveTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching leave types:', error);
    return NextResponse.json({ error: 'Failed to fetch leave types' }, { status: 500 });
  }
}

// POST - Create a new leave type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      code,
      maxDaysPerYear,
      isPaid,
      requiresDocument,
      accrualRate,
      canCarryForward,
      maxCarryForwardDays,
      description,
    } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    // Check if code already exists for this school
    const existingLeaveType = await schoolPrisma.leaveType.findFirst({
      where: {
        schoolId: session.user.schoolId,
        code: code.toUpperCase(),
      },
    });

    if (existingLeaveType) {
      return NextResponse.json({ error: 'Leave type code already exists' }, { status: 400 });
    }

    const leaveType = await schoolPrisma.leaveType.create({
      data: {
        schoolId: session.user.schoolId,
        name,
        code: code.toUpperCase(),
        maxDaysPerYear: maxDaysPerYear ? parseFloat(maxDaysPerYear) : null,
        isPaid: isPaid ?? true,
        requiresDocument: requiresDocument ?? false,
        accrualRate: accrualRate ? parseFloat(accrualRate) : null,
        canCarryForward: canCarryForward ?? true,
        maxCarryForwardDays: maxCarryForwardDays ? parseFloat(maxCarryForwardDays) : null,
        description,
      },
    });

    return NextResponse.json({ leaveType }, { status: 201 });
  } catch (error) {
    console.error('Error creating leave type:', error);
    return NextResponse.json({ error: 'Failed to create leave type' }, { status: 500 });
  }
}
