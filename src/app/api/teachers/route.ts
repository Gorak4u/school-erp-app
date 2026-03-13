import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
        { subject: { contains: search } },
        { department: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (department) where.department = department;

    const allowedSortFields: Record<string, boolean> = {
      name: true, status: true, department: true, subject: true,
      experience: true, salary: true, createdAt: true, joiningDate: true,
    };
    const orderBy: any = allowedSortFields[sortBy]
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.teacher.count({ where }),
    ]);

    return NextResponse.json({
      teachers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teacher = await prisma.teacher.create({ data: body });
    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 409 });
    }
    console.error('POST /api/teachers:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
