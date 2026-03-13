// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await prisma.feeRecord.findUnique({
      where: { id },
      include: {
        student: true,
        feeStructure: true,
        payments: true,
      },
    });
    if (!record) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fee record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const record = await prisma.feeRecord.update({ where: { id }, data: body });
    return NextResponse.json({ record });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update fee record' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.feeRecord.delete({ where: { id } });
    return NextResponse.json({ message: 'Fee record deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete fee record' }, { status: 500 });
  }
}
