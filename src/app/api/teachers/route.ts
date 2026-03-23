import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, checkSubscriptionLimit } from '@/lib/apiAuth';
import { BASE_ROLE_OPTIONS } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { sendSchoolEmail } from '@/lib/email';
import { sendTeacherWelcomeEmail } from '@/lib/teacher-welcome-email';
import { sendTeacherAdminNotificationEmail } from '@/lib/teacher-admin-notification-email';
import { generateEmployeeId, isValidEmployeeIdFormat } from '@/lib/employeeIdGenerator';

// Type definitions for the API
type TeacherWhereClause = {
  schoolId?: string;
  isActive?: boolean;
  OR?: Array<{
    name?: { startsWith: string; mode: 'insensitive' };
    email?: { startsWith: string; mode: 'insensitive' };
    employeeId?: { startsWith: string; mode: 'insensitive' };
    phone?: { startsWith: string; mode: 'insensitive' };
    subject?: { startsWith: string; mode: 'insensitive' };
    department?: { startsWith: string; mode: 'insensitive' };
  }>;
  status?: string;
  department?: string;
  designation?: string;
  [key: string]: any; // Allow additional properties from tenantWhere
};

interface Teacher {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  classTeacherAssignments?: Array<{
    classId?: string;
    sectionId?: string;
    className?: string;
    sectionName?: string;
    [key: string]: any; // Allow additional properties
  }>;
}

interface ClassInfo {
  id: string;
  name: string;
}

interface SectionInfo {
  id: string;
  name: string;
}

interface TeacherCreateData {
  name: string;
  email: string;
  employeeId: string;
  phone?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  department?: string;
  designation?: string;
  subject?: string;
  qualification?: string;
  experience?: number | null;
  joiningDate?: string;
  salary?: number | null;
  bloodGroup?: string;
  aadharNumber?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  panNumber?: string;
  emergencyContact?: string;
  emergencyContactRelation?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  remarks?: string;
  isClassTeacher?: boolean;
  role?: string;
  customRoleId?: string;
  permissions?: string[];
  [key: string]: any; // Allow dynamic access
}

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

    const where: TeacherWhereClause = { ...tenantWhere(ctx) };
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
        include: {
          classTeacherAssignments: {
            where: { isActive: true }
          }
        }
      }),
      (schoolPrisma as any).teacher.count({ where }),
    ]);

    // Fetch class and section details for assignments
    const classIds = new Set<string>();
    const sectionIds = new Set<string>();
    
    teachers.forEach((teacher: Teacher) => {
      teacher.classTeacherAssignments?.forEach((assignment) => {
        if (assignment.classId) classIds.add(assignment.classId);
        if (assignment.sectionId) sectionIds.add(assignment.sectionId);
      });
    });

    const [classes, sections] = await Promise.all([
      classIds.size > 0 ? (schoolPrisma as any).class.findMany({
        where: { id: { in: Array.from(classIds) } },
        select: { id: true, name: true }
      }) : [],
      sectionIds.size > 0 ? (schoolPrisma as any).section.findMany({
        where: { id: { in: Array.from(sectionIds) } },
        select: { id: true, name: true }
      }) : []
    ]);

    // Create lookup maps
    const classMap = new Map(classes.map((c: ClassInfo) => [c.id, c.name]));
    const sectionMap = new Map(sections.map((s: SectionInfo) => [s.id, s.name]));

    // Attach class and section names to assignments
    teachers.forEach((teacher: Teacher) => {
      if (teacher.classTeacherAssignments) {
        teacher.classTeacherAssignments.forEach((assignment) => {
          assignment.className = (classMap.get(assignment.classId!) as string | undefined) || 'Unknown';
          assignment.sectionName = (sectionMap.get(assignment.sectionId!) as string | undefined) || '';
        });
      }
    });

    const response = NextResponse.json({
      teachers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

    // Add caching headers for better performance (reduced for real-time data)
    response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');
    response.headers.set('CDN-Cache-Control', 'max-age=30');

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

    const body: TeacherCreateData & {
      email: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      customRoleId?: string;
      employeeId?: string;
    } = await request.json();
    const {
      email,
      password,
      name,
      firstName: providedFirstName,
      lastName: providedLastName,
      role,
      customRoleId,
      phone,
      employeeId: providedEmployeeId,
      ...teacherData
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
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

    if (!email) {
      return NextResponse.json({ error: 'Email is required to create staff login' }, { status: 400 });
    }

    // Check if email already exists in school_User
    const existingUser = await (schoolPrisma as any).school_User.findUnique({
      where: { email }
    });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const allowedBaseRoles = new Set(BASE_ROLE_OPTIONS.map((option: { value: string }) => option.value));
    const finalRole = allowedBaseRoles.has(role || '') ? role : 'teacher';

    let validatedCustomRoleId: string | null = null;
    if (customRoleId) {
      console.log('POST /api/teachers - Validating customRoleId:', customRoleId);
      const customRole = await (schoolPrisma as any).CustomRole.findFirst({
        where: {
          id: customRoleId,
          schoolId: ctx.schoolId,
        }
      });

      if (!customRole) {
        return NextResponse.json({ error: 'Invalid custom role' }, { status: 400 });
      }

      validatedCustomRoleId = customRoleId;
    }

    // Generate default password if not provided
    const defaultPassword = password || `Teach@${Date.now().toString().slice(-6)}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const resolvedFirstName = (providedFirstName || name || '').trim().split(/\s+/)[0] || 'Staff';
    const resolvedLastName = (providedLastName || name || '').trim().split(/\s+/).slice(1).join(' ') || 'Member';

    // Prepare teacher data with name field and filter only valid fields
    const teacherName = name;
    
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

    // Create Teacher and linked school_User records in transaction
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

      // Create school_User record for login (can login with email OR employeeId)
      const user = await (tx as any).school_User.create({
        data: {
          id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          employeeId,
          password: hashedPassword,
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          role: finalRole,
          customRoleId: validatedCustomRoleId,
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

      await tx.teacher.update({
        where: { id: teacher.id },
        data: { userId: user.id },
      });

      return { teacher, user, defaultPassword };
    });

    // Send emails (non-blocking)
    if (ctx.schoolId) {
      // Send welcome email to teacher
      sendTeacherWelcomeEmail(result.user, result.teacher, result.defaultPassword, ctx.schoolId).catch((error: any) => {
        console.error('Teacher welcome email failed:', error);
      });

      // Send notification email to admin who added the teacher
      sendTeacherAdminNotificationEmail(
        ctx.email, // Admin who created the teacher
        result.teacher, 
        result.user,
        result.defaultPassword,
        true,
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
        name: `${result.user.firstName} ${result.user.lastName}`.trim(),
        role: result.user.role,
      } : null,
      temporaryPassword: result.defaultPassword,
      createUserAccount: true,
      message: 'Teacher created successfully. Linked user account created with the selected role and welcome email sent.'
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 409 });
    }
    console.error('POST /api/teachers:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
