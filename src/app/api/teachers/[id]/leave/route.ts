// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const where: any = { teacherId: id, schoolId: ctx.schoolId };
    if (status) where.status = status;
    if (year) where.fromDate = { startsWith: year };

    const leaves = await (schoolPrisma as any).teacherLeave.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Summary stats
    const approved = leaves.filter((l: any) => l.status === 'approved');
    const totalDaysTaken = approved.reduce((sum: number, l: any) => sum + l.days, 0);
    const summary = {
      total: leaves.length,
      pending: leaves.filter((l: any) => l.status === 'pending').length,
      approved: approved.length,
      rejected: leaves.filter((l: any) => l.status === 'rejected').length,
      totalDaysTaken,
      byType: approved.reduce((acc: any, l: any) => {
        acc[l.leaveType] = (acc[l.leaveType] || 0) + l.days;
        return acc;
      }, {}),
    };

    return NextResponse.json({ leaves, summary });
  } catch (err) {
    console.error('GET /api/teachers/[id]/leave:', err);
    return NextResponse.json({ error: 'Failed to fetch leave records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const body = await request.json();
    const leave = await (schoolPrisma as any).teacherLeave.create({
      data: { ...body, teacherId: id, schoolId: ctx.schoolId, status: 'pending' },
    });
    return NextResponse.json({ leave }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const body = await request.json();
    const { leaveId, status, remarks } = body;

    const leave = await (schoolPrisma as any).teacherLeave.update({
      where: { id: leaveId },
      data: {
        status,
        remarks,
        approvedBy: status === 'approved' ? ctx.email : undefined,
        approvedAt: status === 'approved' ? new Date() : undefined,
      },
    });
    return NextResponse.json({ leave });
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 });
  }
}
