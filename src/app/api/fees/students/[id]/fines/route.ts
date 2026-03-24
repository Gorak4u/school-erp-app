import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/fees/students/[id]/fines - Get all fines for a specific student
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id: studentId } = await context.params;

    if (!studentId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Student ID is required' 
        },
        { status: 400 }
      );
    }

    // Verify student belongs to school
    const student = await (schoolPrisma as any).Student.findFirst({
      where: { 
        id: studentId,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      }
    });

    if (!student) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Student not found' 
        },
        { status: 404 }
      );
    }

    // Get all fines for the student with related data
    const fines = await (schoolPrisma as any).Fine.findMany({
      where: {
        studentId: studentId,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        waiverRequests: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      fines,
      student: {
        id: student.id,
        name: student.name,
        admissionNo: student.admissionNo,
        class: student.class,
        section: student.section
      }
    });

  } catch (error) {
    console.error('Failed to fetch student fines:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch student fines',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
