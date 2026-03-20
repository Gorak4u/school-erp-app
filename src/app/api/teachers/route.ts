import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, checkSubscriptionLimit } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';
import { sendSchoolEmail } from '@/lib/email';
import { sendTeacherWelcomeEmail } from '@/lib/teacher-welcome-email';
import { sendTeacherAdminNotificationEmail } from '@/lib/teacher-admin-notification-email';
import { generateEmployeeId, isValidEmployeeIdFormat } from '@/lib/employeeIdGenerator';

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
    const { email, password, firstName, lastName, phone, employeeId: providedEmployeeId, ...teacherData } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Auto-generate or validate Employee ID
    let employeeId = providedEmployeeId;
    if (!employeeId) {
      // Auto-generate Employee ID using school abbreviation format
      employeeId = await generateEmployeeId(ctx.schoolId!);
      console.log(`✅ Auto-generated Employee ID: ${employeeId}`);
    } else if (!isValidEmployeeIdFormat(employeeId)) {
      return NextResponse.json({ 
        error: 'Invalid Employee ID format. Use {SchoolAbbreviation}{####} format' 
      }, { status: 400 });
    } else {
      // Check if Employee ID already exists in this school
      const existingTeacher = await (schoolPrisma as any).teacher.findFirst({
        where: { employeeId, schoolId: ctx.schoolId }
      });
      if (existingTeacher) {
        return NextResponse.json({ error: 'This Employee ID already exists in your school' }, { status: 409 });
      }
    }

    // Email is optional for teacher record but required for user account
    let createUserAccount = true;
    if (!email) {
      console.log('Teacher email not provided - creating teacher record without user account');
      createUserAccount = false;
    } else {
      // Check if email already exists in school_User
      const existingUser = await (schoolPrisma as any).school_User.findUnique({
        where: { email }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
      }
    }

    // Generate default password if not provided (only if creating user account)
    const defaultPassword = createUserAccount ? (password || `Teach@${Date.now().toString().slice(-6)}`) : '';
    const hashedPassword = createUserAccount ? await bcrypt.hash(defaultPassword, 12) : '';

    // Prepare teacher data with name field and filter only valid fields
    const teacherName = `${firstName} ${lastName}`.trim();
    
    // Only include valid Teacher model fields
    const validTeacherData: any = {};
    const allowedFields = [
      'employeeId', 'department', 'subject', 'qualification', 
      'experience', 'status', 'joiningDate', 'address', 'photo', 
      'salary', 'designation', 'bloodGroup', 'aadharNumber', 
      'bankName', 'bankAccountNo', 'bankIfsc', 'emergencyName', 
      'emergencyPhone', 'remarks', 'gender', 'dateOfBirth'
    ];
    
    allowedFields.forEach(field => {
      if (teacherData[field] !== undefined) {
        validTeacherData[field] = teacherData[field];
      }
    });

    // Create Teacher and optionally school_User records in transaction
    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      // Create Teacher record
      const teacher = await tx.teacher.create({
        data: {
          name: teacherName,
          email,
          phone: phone || null,
          employeeId,
          schoolId: ctx.schoolId,
          ...validTeacherData,
        },
      });

      let user = null;
      if (createUserAccount) {
        // Create school_User record for login (can login with email OR employeeId)
        user = await (tx as any).school_User.create({
          data: {
            id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email,
            employeeId,
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
      }

      return { teacher, user, defaultPassword, createUserAccount };
    });

    // Send emails (non-blocking)
    if (ctx.schoolId) {
      // Send welcome email to teacher (only if user account was created)
      if (result.createUserAccount && result.user) {
        sendTeacherWelcomeEmail(result.user, result.teacher, result.defaultPassword, ctx.schoolId).catch((error: any) => {
          console.error('Teacher welcome email failed:', error);
        });
      }

      // Send notification email to admin who added the teacher
      sendTeacherAdminNotificationEmail(
        ctx.email, // Admin who created the teacher
        result.teacher, 
        result.user,
        result.defaultPassword,
        result.createUserAccount,
        ctx.schoolId
      ).catch((error: any) => {
        console.error('Teacher admin notification email failed:', error);
      });
    }

    return NextResponse.json({ 
      teacher: result.teacher,
      user: result.user ? {
        id: result.user.id,
        email: result.user.email,
        name: `${result.user.firstName} ${result.user.lastName}`,
        role: result.user.role,
      } : null,
      temporaryPassword: result.createUserAccount ? result.defaultPassword : null,
      createUserAccount: result.createUserAccount,
      message: result.createUserAccount 
        ? 'Teacher created successfully. Welcome email sent to teacher and notification sent to admin.'
        : 'Teacher record created successfully. No email provided - admin notification sent. User account not created.'
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 409 });
    }
    console.error('POST /api/teachers:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
