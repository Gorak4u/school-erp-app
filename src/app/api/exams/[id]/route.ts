import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const exam = await (schoolPrisma as any).exam.findFirst({
      where: { id, ...tenantWhere(ctx) },
      include: { results: { include: { student: { select: { id: true, name: true, rollNo: true } } } } },
    });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    return NextResponse.json({ exam });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const existing = await (schoolPrisma as any).exam.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!existing) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const body = await request.json();
    const exam = await (schoolPrisma as any).exam.update({ where: { id }, data: body });
    return NextResponse.json({ exam });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const existing = await (schoolPrisma as any).exam.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!existing) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    await (schoolPrisma as any).exam.update({ where: { id }, data: { status: 'cancelled' } });
    return NextResponse.json({ message: 'Exam cancelled' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to cancel exam' }, { status: 500 });
  }
}
