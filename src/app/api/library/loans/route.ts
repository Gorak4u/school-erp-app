import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/library/loans - List book loans
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue');

    // Build where clause
    const where: any = {};
    
    // School filtering
    if (!ctx.isSuperAdmin || ctx.schoolId) {
      where.schoolId = ctx.schoolId;
    }
    
    if (studentId) {
      where.studentId = studentId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (overdue === 'true') {
      where.dueDate = {
        lt: new Date()
      };
      where.status = 'active';
    }

    const loans = await schoolPrisma.bookLoan.findMany({
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
        { status: 'asc' }, // active first
        { dueDate: 'asc' }
      ]
    });

    return NextResponse.json({ 
      success: true,
      loans,
      total: loans.length
    });

  } catch (error) {
    console.error('GET /api/library/loans:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch book loans',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/library/loans - Create book loan
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      studentId,
      bookId,
      bookTitle,
      bookAccessionNo,
      dueDate
    } = body;

    // Validation
    if (!studentId || !bookId || !bookTitle || !dueDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'studentId, bookId, bookTitle, and dueDate are required' 
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

    // Create book loan
    const loan = await schoolPrisma.bookLoan.create({
      data: {
        schoolId: ctx.schoolId!,
        studentId,
        bookId,
        bookTitle,
        bookAccessionNo,
        issuedAt: new Date(),
        dueDate: new Date(dueDate),
        status: 'active'
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
      loan,
      message: 'Book loan created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/library/loans:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid reference to student or school' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create book loan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
