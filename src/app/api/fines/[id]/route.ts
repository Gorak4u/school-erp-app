import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/fines/[id] - Get single fine
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    const fine = await (schoolPrisma as any).Fine.findFirst({
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
        },
        rule: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            baseAmount: true,
            dailyRate: true,
            maxAmount: true,
            graceDays: true,
            triggerEvent: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        waiverRequests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!fine) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      fine
    });

  } catch (error) {
    console.error('GET /api/fines/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch fine',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/fines/[id] - Update fine
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
      description,
      amount,
      dueDate,
      remarks
    } = body;

    // Check if fine exists and belongs to school
    const existingFine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      }
    });

    if (!existingFine) {
      return NextResponse.json({ error: 'Fine not found' }, { status: 404 });
    }

    // Don't allow updates to paid fines
    if (existingFine.status === 'paid') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot update paid fines' 
        },
        { status: 400 }
      );
    }

    // Update fine
    const updatedFine = await (schoolPrisma as any).Fine.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(amount !== undefined && { amount }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        // Recalculate pending amount if amount changed
        ...(amount !== undefined && { 
          pendingAmount: amount - existingFine.paidAmount - existingFine.waivedAmount 
        })
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
        },
        rule: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            baseAmount: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      fine: updatedFine,
      message: 'Fine updated successfully'
    });

  } catch (error) {
    console.error('PUT /api/fines/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update fine',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/fines/[id] - Delete fine
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    // Check if fine exists and belongs to school
    const existingFine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      },
      include: {
        _count: {
          select: { payments: true, waiverRequests: true }
        }
      }
    });

    if (!existingFine) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine not found' 
        },
        { status: 404 }
      );
    }

    // Don't allow deletion of fines with payments
    if (existingFine._count.payments > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete fine with payments',
          details: 'This fine has payment records and cannot be deleted'
        },
        { status: 400 }
      );
    }

    // Delete fine
    await (schoolPrisma as any).Fine.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Fine deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/fines/[id]:', error);
    
    // Handle foreign key constraint
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete fine',
          details: 'This fine is referenced by other records'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete fine',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
