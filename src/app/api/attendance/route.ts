import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '';
    const cls = searchParams.get('class') || '';
    const section = searchParams.get('section') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));

    const where: any = {};
    // Tenant isolation via student relation
    if (!ctx.isSuperAdmin && ctx.schoolId) where.student = { schoolId: ctx.schoolId };
    if (studentId) where.studentId = studentId;
    if (cls) where.class = cls;
    if (section) where.section = section;
    if (status) where.status = status;
    if (date) {
      where.date = date;
    } else if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const [records, total] = await Promise.all([
      (schoolPrisma as any).attendanceRecord.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, class: true, section: true, rollNo: true } },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).attendanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();

    // Support bulk attendance (array) or single record
    if (Array.isArray(body)) {
      const results = await Promise.allSettled(
        body.map(rec =>
          (schoolPrisma as any).attendanceRecord.upsert({
            where: {
              studentId_date_subject: {
                studentId: rec.studentId,
                date: rec.date,
                subject: rec.subject || '',
              },
            },
            update: { status: rec.status, remarks: rec.remarks, teacherId: rec.teacherId },
            create: {
              studentId: rec.studentId,
              date: rec.date,
              status: rec.status,
              subject: rec.subject || '',
              class: rec.class,
              section: rec.section,
              teacherId: rec.teacherId,
              remarks: rec.remarks,
            },
          })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      return NextResponse.json({ message: `Saved ${succeeded} records, ${failed} failed` }, { status: 201 });
    }

    // Single record
    const { studentId, date, status, subject = '', cls, section, teacherId, remarks } = body;
    if (!studentId || !date || !status) {
      return NextResponse.json({ error: 'studentId, date, status are required' }, { status: 400 });
    }

    const record = await (schoolPrisma as any).attendanceRecord.upsert({
      where: { studentId_date_subject: { studentId, date, subject } },
      update: { status, remarks, teacherId },
      create: { studentId, date, status, subject, class: cls, section, teacherId, remarks },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('POST /api/attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
