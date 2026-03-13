// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        feeRecords: { include: { feeStructure: true, payments: true } },
        attendanceRecords: { orderBy: { date: 'desc' }, take: 90 },
        examResults: { include: { exam: true } },
      },
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    return NextResponse.json({
      ...student,
      documents: student.documents ? JSON.parse(student.documents) : {},
    });
  } catch (error) {
    console.error('GET /api/students/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { documents, fees, attendance, academics, behavior, feeRecords, attendanceRecords, examResults, ...data } = body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...data,
        documents: documents ? JSON.stringify(documents) : undefined,
        gpa: academics?.gpa,
        rank: academics?.rank,
        disciplineScore: behavior?.disciplineScore,
        incidents: behavior?.incidents,
        achievements: behavior?.achievements,
      },
    });

    return NextResponse.json({ student });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    console.error('PUT /api/students/[id]:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    console.error('DELETE /api/students/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
