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
    const classId = searchParams.get('classId') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'));

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const where: any = { teacherId: id, schoolId: ctx.schoolId };
    if (status) where.status = status;
    if (classId) where.classId = classId;
    if (from) where.date = { ...where.date, gte: from };
    if (to) where.date = { ...where.date, lte: to };

    const [lessons, total] = await Promise.all([
      (schoolPrisma as any).lessonPlan.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).lessonPlan.count({ where }),
    ]);

    return NextResponse.json({ lessons, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error('GET /api/teachers/[id]/lessons:', err);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
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
    const lesson = await (schoolPrisma as any).lessonPlan.create({
      data: { ...body, teacherId: id, schoolId: ctx.schoolId },
    });
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teachers/[id]/lessons:', err);
    return NextResponse.json({ error: 'Failed to create lesson plan' }, { status: 500 });
  }
}
