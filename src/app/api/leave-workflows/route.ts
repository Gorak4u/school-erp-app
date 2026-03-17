import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    const workflows = await (schoolPrisma as any).LeaveWorkflow.findMany({
      where: {
        ...tenantWhere(ctx),
        academicYearId,
      },
      include: {
        role: true,
        leaveType: true,
      },
      orderBy: {
        sequence: 'asc',
      },
    });

    return NextResponse.json({ workflows });
  } catch (err: any) {
    console.error('GET /api/leave-workflows:', err);
    return NextResponse.json({ error: 'Failed to fetch leave workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can manage leave workflows' }, { status: 403 });
    }

    const body = await request.json();
    const { workflows, academicYearId } = body;

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    if (!Array.isArray(workflows)) {
      return NextResponse.json({ error: 'workflows must be an array' }, { status: 400 });
    }

    // Use a transaction to replace existing workflows for this academic year
    await schoolPrisma.$transaction(async (tx: any) => {
      // 1. Delete existing workflows for this academic year
      await (tx as any).LeaveWorkflow.deleteMany({
        where: {
          ...tenantWhere(ctx),
          academicYearId,
        },
      });

      // 2. Create new workflows
      if (workflows.length > 0) {
        await (tx as any).LeaveWorkflow.createMany({
          data: workflows.map((wf: any, index: number) => ({
            schoolId: ctx.schoolId,
            academicYearId,
            leaveTypeId: wf.leaveTypeId || null,
            roleId: wf.roleId,
            requiredPermission: wf.requiredPermission || 'approve_department_leave',
            sequence: index + 1,
            isActive: wf.isActive !== undefined ? wf.isActive : true,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST /api/leave-workflows:', err);
    return NextResponse.json({ error: 'Failed to save leave workflows' }, { status: 500 });
  }
}
