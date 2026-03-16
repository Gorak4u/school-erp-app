import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, checkSubscriptionLimit } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));

    const where: any = { ...tenantWhere(ctx) };
    if (search) {
      // Use startsWith for better performance on large datasets
      where.OR = [
        { name: { startsWith: search, mode: 'insensitive' } },
        { email: { startsWith: search, mode: 'insensitive' } },
        { employeeId: { startsWith: search, mode: 'insensitive' } },
        { subject: { startsWith: search, mode: 'insensitive' } },
        { department: { startsWith: search, mode: 'insensitive' } },
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
      (schoolPrisma as any).teacher.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).teacher.count({ where }),
    ]);

    const response = NextResponse.json({
      teachers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    response.headers.set('CDN-Cache-Control', 'max-age=300');

    return response;
  } catch (error) {
    console.error('GET /api/teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Check subscription limits
    const limitError = await checkSubscriptionLimit(ctx, 'teachers', schoolPrisma);
    if (limitError) return limitError;

    const body = await request.json();
    const teacher = await (schoolPrisma as any).teacher.create({ data: { ...body, schoolId: ctx.schoolId } });
    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 409 });
    }
    console.error('POST /api/teachers:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
