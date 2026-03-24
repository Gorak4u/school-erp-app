import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/library/loans/[id] - Get single book loan
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    const loan = await schoolPrisma.bookLoan.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true,
            section: true,
            rollNo: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!loan) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Book loan not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      loan
    });

  } catch (error) {
    console.error('GET /api/library/loans/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch book loan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/library/loans/[id] - Update book loan (return book, renew)
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
      action, // 'return' or 'renew'
      newDueDate, // for renew
      remarks
    } = body;

    // Validation
    if (!action || !['return', 'renew'].includes(action)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'action must be either "return" or "renew"' 
        },
        { status: 400 }
      );
    }

    // Check if loan exists and belongs to school
    const existingLoan = await schoolPrisma.bookLoan.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      }
    });

    if (!existingLoan) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Book loan not found' 
        },
        { status: 404 }
      );
    }

    if (action === 'return') {
      // Return book
      const updatedLoan = await schoolPrisma.bookLoan.update({
        where: { id },
        data: {
          status: 'returned',
          returnedAt: new Date()
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
        loan: updatedLoan,
        message: 'Book returned successfully'
      });

    } else if (action === 'renew') {
      // Renew loan
      if (!newDueDate) {
        return NextResponse.json(
          { 
            success: false,
            error: 'newDueDate is required for renewal' 
          },
          { status: 400 }
        );
      }

      if (existingLoan.renewals >= 3) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Maximum renewal limit reached (3 renewals)' 
          },
          { status: 400 }
        );
      }

      const updatedLoan = await schoolPrisma.bookLoan.update({
        where: { id },
        data: {
          dueDate: new Date(newDueDate),
          renewals: existingLoan.renewals + 1
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
        loan: updatedLoan,
        message: 'Book renewed successfully'
      });
    }

  } catch (error) {
    console.error('PUT /api/library/loans/[id]:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid reference to loan or school' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update book loan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/library/loans/[id] - Delete book loan
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    // Check if loan exists and belongs to school
    const existingLoan = await schoolPrisma.bookLoan.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      }
    });

    if (!existingLoan) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Book loan not found' 
        },
        { status: 404 }
      );
    }

    // Only allow deletion of returned loans
    if (existingLoan.status !== 'returned') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete active book loans. Please return the book first.' 
        },
        { status: 400 }
      );
    }

    // Delete book loan
    await schoolPrisma.bookLoan.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Book loan deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/library/loans/[id]:', error);
    
    // Handle foreign key constraint
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete book loan',
          details: 'This loan is referenced by other records'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete book loan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
