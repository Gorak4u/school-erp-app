import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Fetch leave workflow configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const leaveTypeId = searchParams.get('leaveTypeId');

    if (!academicYearId) {
      return NextResponse.json({ error: 'Academic year ID is required' }, { status: 400 });
    }

    const where: any = {
      schoolId: session.user.schoolId,
      academicYearId,
      isActive: true,
    };

    if (leaveTypeId) {
      where.leaveTypeId = leaveTypeId;
    } else {
      where.leaveTypeId = null; // Default workflow
    }

    const workflows = await schoolPrisma.leaveWorkflow.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        leaveType: leaveTypeId ? {
          select: {
            id: true,
            name: true,
            code: true,
          },
        } : false,
      },
      orderBy: { sequence: 'asc' },
    });

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error fetching leave workflow:', error);
    return NextResponse.json({ error: 'Failed to fetch leave workflow' }, { status: 500 });
  }
}

// POST - Create or update leave workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      academicYearId,
      leaveTypeId,
      roleId,
      requiredPermission,
      sequence,
      isActive,
    } = body;

    // Validate required fields
    if (!academicYearId || !roleId || !requiredPermission || sequence === undefined) {
      return NextResponse.json({ 
        error: 'Academic year ID, role ID, required permission, and sequence are required' 
      }, { status: 400 });
    }

    // Check if role exists and belongs to school
    const role = await schoolPrisma.customRole.findFirst({
      where: {
        id: roleId,
        schoolId: session.user.schoolId,
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Create workflow step
    const workflow = await schoolPrisma.leaveWorkflow.create({
      data: {
        schoolId: session.user.schoolId,
        academicYearId,
        leaveTypeId: leaveTypeId || null,
        roleId,
        requiredPermission,
        sequence,
        isActive: isActive ?? true,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        leaveType: leaveTypeId ? {
          select: {
            id: true,
            name: true,
            code: true,
          },
        } : false,
      },
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error('Error creating leave workflow:', error);
    return NextResponse.json({ error: 'Failed to create leave workflow' }, { status: 500 });
  }
}

// PUT - Update leave workflow
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      roleId,
      requiredPermission,
      sequence,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Check if workflow exists and belongs to school
    const existingWorkflow = await schoolPrisma.leaveWorkflow.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (roleId !== undefined) updateData.roleId = roleId;
    if (requiredPermission !== undefined) updateData.requiredPermission = requiredPermission;
    if (sequence !== undefined) updateData.sequence = sequence;
    if (isActive !== undefined) updateData.isActive = isActive;

    const workflow = await schoolPrisma.leaveWorkflow.update({
      where: { id },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
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

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error updating leave workflow:', error);
    return NextResponse.json({ error: 'Failed to update leave workflow' }, { status: 500 });
  }
}

// DELETE - Delete leave workflow
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Check if workflow exists and belongs to school
    const existingWorkflow = await schoolPrisma.leaveWorkflow.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    await schoolPrisma.leaveWorkflow.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave workflow:', error);
    return NextResponse.json({ error: 'Failed to delete leave workflow' }, { status: 500 });
  }
}
