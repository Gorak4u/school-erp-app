import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// PUT /api/attendance/fine-counters/[id] - Reset attendance fine counter
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;
    const body = await request.json();
    const {
      action, // 'reset' or 'update'
      lateCount,
      absenceCount
    } = body;

    // Validation
    if (!action || !['reset', 'update'].includes(action)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'action must be either "reset" or "update"' 
        },
        { status: 400 }
      );
    }

    // Check if counter exists and belongs to school
    const existingCounter = await schoolPrisma.attendanceFineCounter.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      }
    });

    if (!existingCounter) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Attendance fine counter not found' 
        },
        { status: 404 }
      );
    }

    let updateData: any = {};

    if (action === 'reset') {
      updateData = {
        lateCount: 0,
        absenceCount: 0,
        lastLateFineAt: null,
        lastAbsenceFineAt: null
      };
    } else if (action === 'update') {
      if (lateCount !== undefined) updateData.lateCount = lateCount;
      if (absenceCount !== undefined) updateData.absenceCount = absenceCount;
    }

    const updatedCounter = await schoolPrisma.attendanceFineCounter.update({
      where: { id },
      data: updateData,
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      counter: updatedCounter,
      message: `Attendance fine counter ${action} successfully`
    });

  } catch (error) {
    console.error('PUT /api/attendance/fine-counters/[id]:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid reference to counter or school' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update attendance fine counter',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
