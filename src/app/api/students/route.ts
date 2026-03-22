// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, checkSubscriptionLimit } from '@/lib/apiAuth';
import { rateLimit, getClientIdentifier, validateSearchQuery, sanitizePaginationParams } from '@/lib/apiSecurity';
import { welcomeEmailHtml, parentWelcomeEmailHtml } from '@/lib/email';
import { apiError } from '@/lib/apiError';
import { logAuditAction } from '@/lib/auditLog';
import { enqueueEmailBatch } from '@/lib/queues/emailQueue';
import { getActiveAcademicYearForSchool } from '@/lib/schoolScope';
import { canCreateStudentsAccess, canViewStudentsAccess } from '@/lib/permissions';
import { ARCHIVED_STUDENT_STATUSES } from '@/lib/studentStatus';
import {
  isValidEmail,
  isValidPhone,
  isValidAadhar,
  isValidPinCode,
  isValidIFSC,
  isValidDate,
  isValidGender,
} from '@/lib/validation';

const STUDENT_LIST_RATE_LIMIT = Number(process.env.STUDENT_LIST_RATE_LIMIT_PER_MINUTE || '200');
const STUDENT_CREATE_RATE_LIMIT = Number(process.env.STUDENT_CREATE_RATE_LIMIT_PER_MINUTE || '5');
const RATE_LIMIT_WINDOW = 60_000; // 1 minute

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canViewStudentsAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting check
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, STUDENT_LIST_RATE_LIMIT, RATE_LIMIT_WINDOW);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const search = validateSearchQuery(searchParams.get('search') || '');
    const cls = searchParams.get('class') || '';
    const status = searchParams.get('status') || '';
    const gender = searchParams.get('gender') || '';
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const needsPromotion = searchParams.get('needsPromotion') || '';
    
    // Validate and sanitize pagination parameters
    const { page, pageSize } = sanitizePaginationParams(
      searchParams.get('page'),
      searchParams.get('pageSize')
    );

    const where: any = { ...tenantWhere(ctx) };
    const andConditions: any[] = [];
    
    if (search) {
      // Use startsWith for better performance on 10M+ records
      // startsWith uses index, contains requires full scan
      where.OR = [
        { name: { startsWith: search, mode: 'insensitive' } },
        { admissionNo: { startsWith: search, mode: 'insensitive' } },
        { email: { startsWith: search, mode: 'insensitive' } },
        { rollNo: { startsWith: search, mode: 'insensitive' } },
        { parentName: { startsWith: search, mode: 'insensitive' } },
      ];
    }
    if (cls) where.class = cls;
    if (status) {
      andConditions.push(
        status === 'exited' || status === 'exit'
          ? { status: { in: ['exit', 'exited'] } }
          : { status }
      );
    }
    
    if (!includeArchived) {
      andConditions.push({ NOT: { status: { in: ARCHIVED_STUDENT_STATUSES as unknown as string[] } } });
    }
    if (gender) where.gender = gender;
    // Filter for students who need promotion: have academicYearId set but it differs from active AY
    if (needsPromotion === 'true') {
      const activeAY = await getActiveAcademicYearForSchool(ctx.schoolId, schoolPrisma);
      if (activeAY) {
        andConditions.push({ academicYearId: { not: activeAY.id } });
        andConditions.push({ status: 'active' });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const allowedSortFields: Record<string, boolean> = {
      name: true, class: true, status: true, gender: true,
      admissionNo: true, createdAt: true, gpa: true, rollNo: true,
    };
    const sortField = allowedSortFields[sortBy] ? sortBy : 'createdAt';
    const sortOrderValue = sortOrder === 'asc' ? 'asc' : 'desc';

    const [students, total] = await Promise.all([
      schoolPrisma.student.findMany({
        where,
        orderBy: { [sortField]: sortOrderValue },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, admissionNo: true, name: true, email: true, photo: true,
          class: true, section: true, rollNo: true, gender: true, dateOfBirth: true,
          status: true, phone: true, address: true, city: true, state: true,
          category: true, motherTongue: true, languageMedium: true, bloodGroup: true,
          parentName: true, parentPhone: true, parentEmail: true,
          fatherName: true, fatherPhone: true, fatherEmail: true,
          motherName: true, motherPhone: true, motherEmail: true,
          emergencyContact: true, emergencyRelation: true,
          gpa: true, rank: true, disciplineScore: true, incidents: true, achievements: true,
          documents: true, remarks: true, admissionDate: true, enrollmentDate: true,
          createdAt: true, updatedAt: true,
          academicYear: true, academicYearId: true,
        },
      }),
      schoolPrisma.student.count({ where }),
    ]);

    if (students.length === 0) {
      return NextResponse.json({ students: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    }

    // Fetch active AY once for needsPromotion computation
    const activeAYForLock = await (schoolPrisma as any).academicYear.findFirst({
      where: { ...(ctx.schoolId ? { schoolId: ctx.schoolId } : {}), isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });

    // 2. Batch aggregate fee and attendance data for the page's students only
    const studentIds = students.map(s => s.id);

    const [feeAgg, feeLastPayment, attendanceAgg, transportStudents] = await Promise.all([
      // Sum fees per student
      schoolPrisma.feeRecord.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds } },
        _sum: { amount: true, paidAmount: true, discount: true },
      }),
      // Last payment date per student
      schoolPrisma.feeRecord.findMany({
        where: { studentId: { in: studentIds }, paidDate: { not: null } },
        select: { studentId: true, paidDate: true },
        orderBy: { paidDate: 'desc' },
        distinct: ['studentId'],
      }),
      // Attendance counts per student per status
      schoolPrisma.attendanceRecord.groupBy({
        by: ['studentId', 'status'],
        where: { studentId: { in: studentIds } },
        _count: true,
      }),
      // Transport students data - just routeId
      (schoolPrisma as any).studentTransport.findMany({
        where: { studentId: { in: studentIds }, isActive: true },
        select: {
          id: true,
          studentId: true,
          routeId: true,
          isActive: true
        }
      })
    ]);

    // 3. Build lookup maps
    const feeMap = new Map(feeAgg.map(f => [f.studentId, f._sum]));
    const lastPayMap = new Map(
      feeLastPayment.map(p => [p.studentId, p.paidDate ? (typeof p.paidDate === 'string' ? p.paidDate.split('T')[0] : p.paidDate.toISOString().split('T')[0]) : ''])
    );
    const attMap = new Map();
    attendanceAgg.forEach(att => {
      const studentAtt = attMap.get(att.studentId) || { present: 0, absent: 0, late: 0 };
      studentAtt[att.status] = (studentAtt[att.status] || 0) + att._count;
      attMap.set(att.studentId, studentAtt);
    });

    // Build transport lookup maps
    const transportMap = new Map();
    transportStudents.forEach(ts => {
      transportMap.set(ts.studentId, {
        id: ts.id,
        routeId: ts.routeId,
        isActive: ts.isActive
      });
    });

    // 4. Shape the final response
    const shaped = students.map(s => {
      const normalizedStatus = s.status === 'exit' ? 'exited' : s.status;
      const fees = feeMap.get(s.id) || { amount: 0, paidAmount: 0 };
      const present = attMap.get(s.id)?.present || 0;
      const absent = attMap.get(s.id)?.absent || 0;
      const late = attMap.get(s.id)?.late || 0;
      const totalAtt = present + absent + late;
      const transportInfo = transportMap.get(s.id);

      // A student needs promotion if:
      // - academicYearId is set (admitted after this feature) AND
      // - it doesn't match the current active AY AND
      // - their status is 'active' (not already graduated/transferred etc)
      const needsPromotion = !!(s.academicYearId && activeAYForLock && s.academicYearId !== activeAYForLock.id && s.status === 'active');

      return {
        ...s,
        status: normalizedStatus,
        needsPromotion,
        documents: s.documents && s.documents !== "NULL" ? JSON.parse(s.documents) : {},
        fees: {
          total: fees.amount || 0,
          paid: fees.paidAmount || 0,
          discount: fees.discount || 0,
          pending: (fees.amount || 0) - (fees.paidAmount || 0) - (fees.discount || 0),
          lastPaymentDate: lastPayMap.get(s.id) || '',
        },
        attendance: {
          present,
          absent,
          late,
          percentage: totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0,
        },
        transport: transportInfo ? {
          id: transportInfo.id,
          routeId: transportInfo.routeId,
          isActive: transportInfo.isActive,
        } : null,
      };
    });

    const response = NextResponse.json({
      students: shaped,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    response.headers.set('CDN-Cache-Control', 'max-age=300');

    return response;
  } catch (error: any) {
    console.error('GET /api/students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await getSessionContext();
  if (error) return error;
  if (!canCreateStudentsAccess(ctx)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, STUDENT_CREATE_RATE_LIMIT, RATE_LIMIT_WINDOW);
    if (!rateLimitResult.allowed) {
      return apiError(429, {
        message: 'Too many student creation requests. Please wait before creating another student.',
        code: 'RATE_LIMITED',
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    const body = await request.json();
    const { documents, academics, behavior, transferCertificateNumber, _skipWelcomeEmails, ...rawData } = body;

    const limitError = await checkSubscriptionLimit(ctx, 'students', schoolPrisma);
    if (limitError) return limitError;

    const requiredFields = ['name', 'dateOfBirth', 'gender'];
    const missingFields = requiredFields.filter(field => !rawData[field]);
    if (missingFields.length) {
      return apiError(400, {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
    }

    if (rawData.email && !isValidEmail(rawData.email)) {
      return apiError(400, {
        message: 'Email should be in format name@domain.com',
        field: 'email',
        code: 'INVALID_EMAIL',
        details: rawData.email,
      });
    }

    if (rawData.phone && !isValidPhone(rawData.phone)) {
      return apiError(400, {
        message: 'Phone number must be 10-15 digits (international numbers supported)',
        field: 'phone',
        code: 'INVALID_PHONE',
        details: rawData.phone,
      });
    }

    if (rawData.aadharNumber && !isValidAadhar(rawData.aadharNumber)) {
      return apiError(400, {
        message: 'Aadhar number must be exactly 12 digits',
        field: 'aadharNumber',
        code: 'INVALID_AADHAR',
        details: rawData.aadharNumber,
      });
    }

    if (rawData.pinCode && !isValidPinCode(rawData.pinCode)) {
      return apiError(400, {
        message: 'Pin code must be exactly 6 digits',
        field: 'pinCode',
        code: 'INVALID_PINCODE',
        details: rawData.pinCode,
      });
    }

    if (rawData.bankIfsc && !isValidIFSC(rawData.bankIfsc)) {
      return apiError(400, {
        message: 'IFSC code must be 11 characters (4 letters + 0 + 6 alphanumeric)',
        field: 'bankIfsc',
        code: 'INVALID_IFSC',
        details: rawData.bankIfsc,
      });
    }

    if (rawData.dateOfBirth && !isValidDate(rawData.dateOfBirth)) {
      return apiError(400, { message: 'Invalid date of birth', field: 'dateOfBirth', code: 'INVALID_DATE' });
    }

    if (!isValidGender(rawData.gender)) {
      return apiError(400, { message: 'Gender must be Male, Female, or Other', field: 'gender', code: 'INVALID_GENDER' });
    }

    const currentYear = new Date().getFullYear();
    const generatedAdmissionNo = await generateAdmissionNumber(currentYear, ctx.schoolId);
    if (!generatedAdmissionNo) {
      return apiError(500, { message: 'Unable to generate unique admission number', code: 'ADMISSION_NO_FAILURE' });
    }

    const effectiveRollNo = rawData.rollNo || await nextRollNumber(rawData.class, rawData.section, ctx.schoolId);
    const sanitizedData = stripUnsupportedFields(rawData);

    const activeAcademicYear = await getActiveAcademicYearForSchool(ctx.schoolId, schoolPrisma);
    if (!activeAcademicYear) {
      return apiError(400, {
        message: 'No active academic year found. Please set one before admitting students.',
        code: 'NO_ACTIVE_ACADEMIC_YEAR',
      });
    }

    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      const student = await tx.student.create({
        data: {
          ...sanitizedData,
          schoolId: ctx.schoolId,
          admissionNo: generatedAdmissionNo,
          rollNo: effectiveRollNo,
          transferCertificateNo: transferCertificateNumber || null,
          documents: documents ? JSON.stringify(documents) : null,
          academicYear: activeAcademicYear.year,
          academicYearId: activeAcademicYear.id,
          gpa: academics?.gpa ?? 0,
          rank: academics?.rank ?? 0,
          disciplineScore: behavior?.disciplineScore ?? 100,
          incidents: behavior?.incidents ?? 0,
          achievements: behavior?.achievements ?? 0,
        },
      });

      await autoApplyFees(tx, {
        student,
        ctx,
        academicYear: activeAcademicYear,
      });

      return student;
    });

    if (!_skipWelcomeEmails) {
      const schoolName = await getSchoolDisplayName(ctx.schoolId);
      enqueueWelcomeEmails(result, ctx.schoolId, schoolName);
    }
    await logAuditActionSafe(ctx.email, 'student_created', result.id, result.name, {
      admissionNo: result.admissionNo,
      academicYear: result.academicYear,
    });

    return NextResponse.json({ student: result }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/students error:', err);
    await logAuditActionSafe(ctx?.email, 'student_creation_failed', undefined, undefined, {
      error: err.message,
    }, request.headers.get('user-agent') || undefined);

    if (err.code === 'P2002') {
      return apiError(409, {
        message: 'Admission number already exists. Please retry to generate a new number.',
        field: 'admissionNo',
        code: 'ADMISSION_NO_EXISTS',
      });
    }

    return apiError(500, {
      message: err.message || 'Failed to create student',
      code: 'UNKNOWN_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}

async function generateAdmissionNumber(currentYear: number, schoolId: string | null): Promise<string | null> {
  const prefix = `${currentYear}`;
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const count = await schoolPrisma.student.count({
      where: {
        ...(schoolId ? { schoolId } : {}),
        admissionNo: { startsWith: prefix },
      },
    });
    const admissionNo = `${prefix}${String(count + attempt + 1).padStart(4, '0')}`;
    const existing = await schoolPrisma.student.findUnique({ where: { admissionNo } });
    if (!existing) return admissionNo;
  }
  return null;
}

async function nextRollNumber(className: string, section: string, schoolId: string | null): Promise<string> {
  const count = await schoolPrisma.student.count({
    where: { class: className, section, ...(schoolId ? { schoolId } : {}) },
  });
  return String(count + 1);
}

function stripUnsupportedFields(data: Record<string, any>) {
  const {
    grade,
    boardId,
    mediumId,
    classId,
    sectionId,
    _ts,
    _mediumId,
    _classId,
    _sectionId,
    _skipWelcomeEmails,
    ...rest
  } = data;
  return rest;
}

async function autoApplyFees(tx: any, {
  student,
  ctx,
  academicYear,
}: {
  student: any;
  ctx: any;
  academicYear: any;
}) {
  try {
    const feeStructures = await tx.feeStructure.findMany({
      where: {
        isActive: true,
        academicYearId: academicYear.id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId }),
      },
      include: { class: true, board: true, medium: true },
    });

    const year = new Date().getFullYear();
    for (const structure of feeStructures) {
      const classMatch = !structure.classId || structure.class?.name === student.class;
      const boardMatch = !structure.boardId || structure.board?.name === student.board;
      const mediumMatch = !structure.mediumId || structure.medium?.name === student.languageMedium;
      const cats = structure.applicableCategories || 'all';
      const categoryMatch = cats === 'all' || cats.includes(student.category || 'General');
      if (!classMatch || !boardMatch || !mediumMatch || !categoryMatch) continue;

      const existing = await tx.feeRecord.findFirst({
        where: { studentId: student.id, feeStructureId: structure.id },
      });
      if (existing) continue;

      const dueDate = new Date(year, 3, structure.dueDate ?? 1).toISOString().split('T')[0];
      await tx.feeRecord.create({
        data: {
          studentId: student.id,
          feeStructureId: structure.id,
          amount: structure.amount,
          paidAmount: 0,
          pendingAmount: structure.amount,
          dueDate,
          status: 'pending',
          academicYear: academicYear.year,
          receiptNumber: `FEE-${year}-${student.admissionNo}-${structure.name.replace(/\s+/g, '').toUpperCase().slice(0, 10)}-${Date.now()}`,
          remarks: `Auto-applied on admission (AY: ${academicYear.year})`,
        },
      });
    }
  } catch (error) {
    console.error('Failed to auto-apply fees:', error);
  }
}

function enqueueWelcomeEmails(student: any, schoolId: string | null, schoolName: string) {
  try {
    if (!schoolId) return;
    const jobs = [] as any[];
    const placeholders = {
      name: student.name,
      admissionNo: student.admissionNo,
      className: student.class,
    };

    if (student.email?.trim()) {
      jobs.push({
        to: student.email,
        subject: `Welcome to ${schoolName} - Admission ${student.admissionNo}`,
        html: welcomeEmailHtml(placeholders.name, placeholders.admissionNo, placeholders.className, schoolName),
        schoolId,
      });
    }

    const parentTargets = [
      { email: student.parentEmail, name: student.parentName || 'Parent' },
      { email: student.fatherEmail, name: student.fatherName || 'Father' },
      { email: student.motherEmail, name: student.motherName || 'Mother' },
    ];

    const seen = new Set<string>();
    for (const target of parentTargets) {
      const email = target.email?.trim();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      jobs.push({
        to: email,
        subject: `Student Admission Confirmation - ${student.name}`,
        html: parentWelcomeEmailHtml(student.name, student.admissionNo, student.class, schoolName, target.name),
        schoolId,
      });
    }

    if (jobs.length) enqueueEmailBatch(jobs);
  } catch (error) {
    console.error('Failed to enqueue welcome emails:', error);
  }
}

async function getSchoolDisplayName(schoolId: string | null): Promise<string> {
  if (!schoolId) return 'Our School';
  try {
    const settings = await (schoolPrisma as any).schoolSetting.findMany({
      where: { schoolId, group: 'school_details', key: { in: ['name', 'school_name'] } },
    });
    const byKey = new Map(settings.map((setting: any) => [setting.key, setting.value]));
    return byKey.get('name') || byKey.get('school_name') || 'Our School';
  } catch (error) {
    console.error('Failed to fetch school name:', error);
    return 'Our School';
  }
}

async function logAuditActionSafe(
  actorEmail: string | undefined,
  action: string,
  target?: string,
  targetName?: string,
  details?: Record<string, any>,
  ipAddress?: string,
) {
  if (!actorEmail) return;
  await logAuditAction({
    actorEmail,
    action,
    target,
    targetName,
    details,
    ipAddress,
  });
}
