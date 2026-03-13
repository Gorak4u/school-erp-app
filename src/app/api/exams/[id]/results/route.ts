// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const results = await prisma.examResult.findMany({
      where: { examId: id },
      include: { student: { select: { id: true, name: true, rollNo: true, class: true, section: true } } },
      orderBy: { marksObtained: 'desc' },
    });
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];

    const results = await Promise.all(
      records.map(r =>
        prisma.examResult.upsert({
          where: { examId_studentId: { examId: id, studentId: r.studentId } },
          update: { marksObtained: r.marksObtained, grade: r.grade, remarks: r.remarks, isAbsent: r.isAbsent },
          create: { examId: id, studentId: r.studentId, marksObtained: r.marksObtained, grade: r.grade, remarks: r.remarks, isAbsent: r.isAbsent || false },
        })
      )
    );

    return NextResponse.json({ results, count: results.length }, { status: 201 });
  } catch (error) {
    console.error('POST /api/exams/[id]/results:', error);
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }
}
