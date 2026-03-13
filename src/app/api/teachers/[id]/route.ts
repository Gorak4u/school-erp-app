// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ teacher });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const { id } = await params;
    await prisma.teacher.update({ where: { id }, data: { status: 'inactive' } });
    return NextResponse.json({ message: 'Teacher deactivated' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
