import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/attendance/fine-counters - Get attendance fine counters
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const academicYearId = searchParams.get('academicYearId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Build where clause
    const where: any = {};
    
    // School filtering
    if (!ctx.isSuperAdmin || ctx.schoolId) {
      where.schoolId = ctx.schoolId!;
    }
    
    if (studentId) {
      where.studentId = studentId;
    }
    
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }
    
    if (month) {
      where.month = parseInt(month);
    }
    
    if (year) {
      where.year = parseInt(year);
    }

    const counters = await schoolPrisma.attendanceFineCounter.findMany({
      where,
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
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { student: { name: 'asc' } }
      ]
    });

    return NextResponse.json({ 
      success: true,
      counters,
      total: counters.length
    });

  } catch (error) {
    console.error('GET /api/attendance/fine-counters:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch attendance fine counters',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/attendance/fine-counters - Update attendance fine counters
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      studentId,
      academicYearId,
      month,
      year,
      lateCount = 0,
      absenceCount = 0
    } = body;

    // Validation
    if (!studentId || !academicYearId || !month || !year) {
      return NextResponse.json(
        { 
          success: false,
          error: 'studentId, academicYearId, month, and year are required' 
        },
        { status: 400 }
      );
    }

    // Verify student belongs to school
    const student = await schoolPrisma.student.findFirst({
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

    // Verify academic year
    const academicYear = await schoolPrisma.academicYear.findFirst({
      where: { 
        id: academicYearId,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      }
    });

    if (!academicYear) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Academic year not found' 
        },
        { status: 404 }
      );
    }

    // Create or update counter
    const counter = await schoolPrisma.attendanceFineCounter.upsert({
      where: {
        schoolId_studentId_academicYearId_month_year: {
          schoolId: ctx.schoolId!,
          studentId,
          academicYearId,
          month,
          year
        }
      },
      update: {
        lateCount: { increment: lateCount },
        absenceCount: { increment: absenceCount }
      },
      create: {
        schoolId: ctx.schoolId!,
        studentId,
        academicYearId,
        month,
        year,
        lateCount,
        absenceCount
      },
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
      counter,
      message: 'Attendance fine counter updated successfully'
    });

  } catch (error) {
    console.error('POST /api/attendance/fine-counters:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid reference to student, academic year, or school' 
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

