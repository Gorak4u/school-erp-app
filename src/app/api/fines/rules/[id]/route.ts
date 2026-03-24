import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/fines/rules/[id] - Get single fine rule
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    const rule = await schoolPrisma.fineRule.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      },
      include: {
        academicYear: {
          select: { id: true, name: true, year: true }
        },
        school: ctx.isSuperAdmin ? {
          select: { id: true, name: true }
        } : false,
        _count: {
          select: { fines: true }
        }
      }
    });

    if (!rule) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine rule not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rule
    });

  } catch (error) {
    console.error('GET /api/fines/rules/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch fine rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/fines/rules/[id] - Update fine rule
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
      name,
      code,
      type,
      baseAmount,
      dailyRate,
      maxAmount,
      percentageOf,
      graceDays,
      triggerEvent,
      applicableTo,
      classIds,
      categoryIds,
      autoApply,
      autoNotify,
      requiresApproval,
      academicYearId,
      isActive
    } = body;

    // Check if rule exists and belongs to school
    const existingRule = await schoolPrisma.fineRule.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine rule not found' 
        },
        { status: 404 }
      );
    }

    // Check for duplicate code (if code is being changed)
    if (code && code !== existingRule.code) {
      const duplicateRule = await schoolPrisma.fineRule.findFirst({
        where: {
          code,
          schoolId: ctx.schoolId!,
          id: { not: id }
        }
      });

      if (duplicateRule) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Fine rule with this code already exists' 
          },
          { status: 409 }
        );
      }
    }

    // Validate academic year if provided
    if (academicYearId) {
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
    }

    // Update fine rule
    const updatedRule = await schoolPrisma.fineRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(type && { type }),
        ...(baseAmount !== undefined && { baseAmount }),
        ...(dailyRate !== undefined && { dailyRate }),
        ...(maxAmount !== undefined && { maxAmount }),
        ...(percentageOf !== undefined && { percentageOf }),
        ...(graceDays !== undefined && { graceDays }),
        ...(triggerEvent && { triggerEvent }),
        ...(applicableTo && { applicableTo }),
        ...(classIds !== undefined && { classIds }),
        ...(categoryIds !== undefined && { categoryIds }),
        ...(autoApply !== undefined && { autoApply }),
        ...(autoNotify !== undefined && { autoNotify }),
        ...(requiresApproval !== undefined && { requiresApproval }),
        ...(academicYearId !== undefined && { academicYearId }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        academicYear: {
          select: { id: true, name: true, year: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      rule: updatedRule,
      message: 'Fine rule updated successfully'
    });

  } catch (error) {
    console.error('PUT /api/fines/rules/[id]:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Fine rule with this code already exists' 
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid reference to academic year or school' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update fine rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/fines/rules/[id] - Delete fine rule
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;

    // Check if rule exists and belongs to school
    const existingRule = await schoolPrisma.fineRule.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      },
      include: {
        _count: {
          select: { fines: true }
        }
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine rule not found' 
        },
        { status: 404 }
      );
    }

    // Check if rule has associated fines
    if (existingRule._count.fines > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete fine rule',
          details: `Used by ${existingRule._count.fines} fine(s). Please delete the fines first or deactivate the rule.`
        },
        { status: 400 }
      );
    }

    // Delete fine rule
    await schoolPrisma.fineRule.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Fine rule deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/fines/rules/[id]:', error);
    
    // Handle foreign key constraint
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete fine rule',
          details: 'This rule is referenced by existing fines'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete fine rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
