import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const cls = searchParams.get('class') || '';
    const academicYear = searchParams.get('academicYear') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const subject = searchParams.get('subject') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));

    const where: any = { ...tenantWhere(ctx) };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { subject: { contains: search } },
        { venue: { contains: search } },
      ];
    }
    if (cls) where.class = cls;
    if (academicYear) where.academicYear = academicYear;
    if (status) where.status = status;
    if (type) where.type = type;
    if (subject) where.subject = subject;

    const allowedSortFields: Record<string, boolean> = {
      date: true, name: true, class: true, status: true,
      type: true, subject: true, createdAt: true,
    };
    const orderBy: any = allowedSortFields[sortBy]
      ? { [sortBy]: sortOrder }
      : { date: 'desc' };

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { results: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({
      exams,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/exams:', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const exam = await prisma.exam.create({ data: { ...body, schoolId: ctx.schoolId } });
    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error('POST /api/exams:', error);
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}
