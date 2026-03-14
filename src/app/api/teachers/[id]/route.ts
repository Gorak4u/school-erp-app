// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const teacher = await prisma.teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ teacher });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!existing) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const body = await request.json();
    const teacher = await prisma.teacher.update({ where: { id }, data: body });
    return NextResponse.json({ teacher });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!existing) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    await prisma.teacher.update({ where: { id }, data: { status: 'inactive' } });
    return NextResponse.json({ message: 'Teacher deactivated' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
