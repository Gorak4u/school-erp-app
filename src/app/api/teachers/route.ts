import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, checkSubscriptionLimit } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';
import { sendTeacherWelcomeEmail } from '@/lib/teacher-welcome-email';

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
    const { email, password, firstName, lastName, phone, ...teacherData } = body;

    // Validate required fields for user account
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, first name, and last name are required' }, { status: 400 });
    }

    // Check if email already exists in school_User
    const existingUser = await (schoolPrisma as any).school_User.findUnique({
      where: { email }
    });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    // Generate default password if not provided
    const defaultPassword = password || `Teach@${Date.now().toString().slice(-6)}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create both Teacher and school_User records in transaction
    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      // Create Teacher record
      const teacher = await tx.teacher.create({
        data: {
          ...teacherData,
          email,
          phone: phone || null,
          schoolId: ctx.schoolId,
        },
      });

      // Create school_User record for login
      const user = await (tx as any).school_User.create({
        data: {
          id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'teacher',
          schoolId: ctx.schoolId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create NextAuth Account record
      await (tx as any).account.create({
        data: {
          id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: user.id,
        },
      });

      return { teacher, user, defaultPassword };
    });

    // Send welcome email (non-blocking)
    if (ctx.schoolId) {
      sendTeacherWelcomeEmail(result.user, result.teacher, result.defaultPassword, ctx.schoolId).catch(error => {
        console.error('Teacher welcome email failed:', error);
      });
    }

    return NextResponse.json({ 
      teacher: result.teacher,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: `${result.user.firstName} ${result.user.lastName}`,
        role: result.user.role,
      },
      temporaryPassword: result.defaultPassword,
      message: 'Teacher created successfully. Welcome email sent with login credentials.'
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 409 });
    }
    console.error('POST /api/teachers:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
