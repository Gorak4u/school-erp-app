import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/fines/rules - List fine rules
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const triggerEvent = searchParams.get('triggerEvent');
    const academicYearId = searchParams.get('academicYearId');

    // Build where clause
    const where: any = {};
    
    // School filtering
    if (!ctx.isSuperAdmin || ctx.schoolId) {
      where.schoolId = ctx.schoolId;
    }
    
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    
    if (triggerEvent) {
      where.triggerEvent = triggerEvent;
    }
    
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const rules = await schoolPrisma.fineRule.findMany({
      where,
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
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ 
      success: true,
      rules,
      total: rules.length
    });

  } catch (error) {
    console.error('GET /api/fines/rules:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch fine rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/fines/rules - Create fine rule
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      name,
      code,
      type,
      baseAmount,
      dailyRate,
      maxAmount,
      percentageOf,
      graceDays = 0,
      triggerEvent,
      applicableTo = 'all',
      classIds,
      categoryIds,
      autoApply = false,
      autoNotify = true,
      requiresApproval = false,
      academicYearId,
      isActive = true
    } = body;

    // Validation
    if (!name || !code || !type || !baseAmount || !triggerEvent) {
      return NextResponse.json(
        { 
          success: false,
          error: 'name, code, type, baseAmount, and triggerEvent are required' 
        },
        { status: 400 }
      );
    }

    // Validate type-specific fields
    if (type === 'daily_accumulating' && !dailyRate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'dailyRate is required for daily_accumulating type' 
        },
        { status: 400 }
      );
    }

    if (type === 'percentage' && !percentageOf) {
      return NextResponse.json(
        { 
          success: false,
          error: 'percentageOf is required for percentage type' 
        },
        { status: 400 }
      );
    }

    // Check for duplicate code within school
    const existingRule = await schoolPrisma.fineRule.findFirst({
      where: {
        code,
        schoolId: ctx.schoolId!
      }
    });

    if (existingRule) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine rule with this code already exists' 
        },
        { status: 409 }
      );
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

    // Create fine rule
    const rule = await schoolPrisma.fineRule.create({
      data: {
        schoolId: ctx.schoolId!,
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
      },
      include: {
        academicYear: {
          select: { id: true, name: true, year: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      rule,
      message: 'Fine rule created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/fines/rules:', error);
    
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
        error: 'Failed to create fine rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
