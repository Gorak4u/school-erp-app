import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const timings = await prisma.schoolTiming.findMany({ orderBy: { sortOrder: 'asc' } });
    return NextResponse.json({ timings });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch timings', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const timing = await prisma.schoolTiming.create({ data: body });
    return NextResponse.json({ timing }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create timing', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const timing = await prisma.schoolTiming.update({ where: { id }, data });
    return NextResponse.json({ timing });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update timing', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await prisma.schoolTiming.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete timing', details: error.message }, { status: 500 });
  }
}
