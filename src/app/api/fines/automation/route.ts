import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { runFineAutomation } from '@/lib/fineAutomation';

// POST /api/fines/automation - Run fine automation manually or via cron
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { trigger, schoolId } = body;

    // For cron jobs, schoolId should be provided in the request
    // For manual runs, use the user's school context
    const targetSchoolId = schoolId || ctx.schoolId;

    if (!targetSchoolId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'School ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate permissions for manual runs
    if (!schoolId && !ctx.permissions?.includes('manage_fines')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient permissions to run fine automation' 
        },
        { status: 403 }
      );
    }

    console.log(`🚀 Running fine automation for school: ${targetSchoolId}, trigger: ${trigger || 'manual'}`);

    const result = await runFineAutomation(targetSchoolId);

    return NextResponse.json({
      success: true,
      result,
      message: `Fine automation completed successfully. Created ${result.totalCreated} fines.`
    });

  } catch (error) {
    console.error('POST /api/fines/automation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run fine automation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/fines/automation - Get automation logs
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const triggerType = searchParams.get('triggerType');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    // Build where clause
    const where: any = {};
    
    if (!ctx.isSuperAdmin || ctx.schoolId) {
      where.schoolId = ctx.schoolId;
    }
    
    if (triggerType && triggerType !== 'all') {
      where.triggerType = triggerType;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get total count for pagination
    const total = await schoolPrisma.fineAutomationLog.count({ where });

    // Get logs with pagination
    const logs = await schoolPrisma.fineAutomationLog.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('GET /api/fines/automation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch automation logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
