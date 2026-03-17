import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere } from '@/lib/schoolScope';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const timings = await (schoolPrisma as any).schoolTiming.findMany({
      where: schoolFilter,
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json({ timings });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch timings', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const timing = await (schoolPrisma as any).schoolTiming.create({
      data: {
        ...body,
        schoolId: ctx.schoolId,
      }
    });
    return NextResponse.json({ timing }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create timing', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id, ...data } = await request.json();
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const existing = await (schoolPrisma as any).schoolTiming.findFirst({ where: { id, ...schoolFilter } });
    if (!existing) return NextResponse.json({ error: 'Timing not found' }, { status: 404 });

    const timing = await (schoolPrisma as any).schoolTiming.update({
      where: { id },
      data: { ...data, schoolId: existing.schoolId ?? ctx.schoolId }
    });
    return NextResponse.json({ timing });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update timing', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Timing ID is required' }, { status: 400 });

    const existing = await (schoolPrisma as any).schoolTiming.findFirst({ where: { id, ...schoolFilter } });
    if (!existing) return NextResponse.json({ error: 'Timing not found' }, { status: 404 });

    await (schoolPrisma as any).schoolTiming.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting timing:', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Timing not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete timing' }, { status: 500 });
  }
}
