import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// Helper function to generate fine numbers
function generateFineNumber(year: string, index: number): string {
  return `F-${year}-${String(index).padStart(4, '0')}`;
}

// GET /api/fines - List fines with filters
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const search = searchParams.get('search');

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
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { fineNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get total count for pagination
    const total = await (schoolPrisma as any).Fine.count({ where });

    // Get fines with pagination
    const fines = await (schoolPrisma as any).Fine.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true,
            section: true
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
            maxAmount: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            receiptNumber: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        waiverRequests: {
          select: {
            id: true,
            status: true,
            requestedBy: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { dueDate: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    // Calculate summary statistics
    const summary = await (schoolPrisma as any).Fine.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: {
        amount: true,
        paidAmount: true,
        waivedAmount: true,
        pendingAmount: true
      }
    });

    return NextResponse.json({
      success: true,
      fines,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1
      },
      summary: summary.reduce((acc: any, item: any) => {
        acc[item.status] = {
          count: item._count,
          amount: item._sum.amount || 0,
          paidAmount: item._sum.paidAmount || 0,
          waivedAmount: item._sum.waivedAmount || 0,
          pendingAmount: item._sum.pendingAmount || 0
        };
        return acc;
      }, {} as Record<string, any>)
    });

  } catch (error) {
    console.error('GET /api/fines:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch fines',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/fines - Create fine (manual)
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      studentId,
      ruleId,
      type,
      category,
      description,
      amount,
      dueDate,
      sourceType = 'manual',
      sourceId,
      remarks
    } = body;

    // Validation
    if (!studentId || !type || !category || !description || !amount || !dueDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'studentId, type, category, description, amount, and dueDate are required' 
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

    // Verify rule if provided
    if (ruleId) {
      const rule = await (schoolPrisma as any).FineRule.findFirst({
        where: { 
          id: ruleId,
          schoolId: ctx.schoolId!
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
    }

    // Get current academic year for fine numbering
    const currentAcademicYear = await (schoolPrisma as any).AcademicYear.findFirst({
      where: { isActive: true }
    });

    const year = currentAcademicYear?.year || new Date().getFullYear().toString();

    // Get next fine number
    const lastFine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        fineNumber: {
          startsWith: `F-${year}-`
        }
      },
      orderBy: { fineNumber: 'desc' }
    });

    let nextNumber = 1;
    if (lastFine) {
      const parts = lastFine.fineNumber.split('-');
      nextNumber = parseInt(parts[2]) + 1;
    }

    const fineNumber = generateFineNumber(year, nextNumber);

    // Create fine
    const fine = await (schoolPrisma as any).Fine.create({
      data: {
        schoolId: ctx.schoolId!,
        studentId,
        ruleId,
        fineNumber,
        type,
        category,
        description,
        amount,
        paidAmount: 0,
        waivedAmount: 0,
        pendingAmount: amount,
        status: 'pending',
        sourceType,
        sourceId,
        issuedAt: new Date(),
        dueDate: new Date(dueDate)
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

    // Create notification if auto-notify is enabled
    if (ruleId) {
      const rule = await (schoolPrisma as any).FineRule.findUnique({
        where: { id: ruleId },
        select: { autoNotify: true }
      });

      if (rule?.autoNotify) {
        // TODO: Create notification for parent/student
        // await createFineNotification(fine);
      }
    }

    return NextResponse.json({
      success: true,
      fine,
      message: 'Fine created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/fines:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Fine with this number already exists' 
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid reference to student, rule, or school' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create fine',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
