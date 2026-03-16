// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, checkSubscriptionLimit } from '@/lib/apiAuth';
import { rateLimit, getClientIdentifier } from '@/lib/apiSecurity';
import { validateSearchQuery, sanitizePaginationParams } from '@/lib/apiSecurity';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Rate limiting check
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 200, 60000); // 200 requests per minute for students API
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const search = validateSearchQuery(searchParams.get('search') || '');
    const cls = searchParams.get('class') || '';
    const status = searchParams.get('status') || '';
    const gender = searchParams.get('gender') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Validate and sanitize pagination parameters
    const { page, pageSize } = sanitizePaginationParams(
      searchParams.get('page'),
      searchParams.get('pageSize')
    );

    const where: any = { ...tenantWhere(ctx) };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (cls) where.class = cls;
    if (status) where.status = status;
    if (gender) where.gender = gender;

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
        },
      }),
      schoolPrisma.student.count({ where }),
    ]);

    if (students.length === 0) {
      return NextResponse.json({ students: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    }

    // 2. Batch aggregate fee and attendance data for the page's students only
    const studentIds = students.map(s => s.id);

    const [feeAgg, feeLastPayment, attendanceAgg] = await Promise.all([
      // Sum fees per student
      schoolPrisma.feeRecord.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds } },
        _sum: { amount: true, paidAmount: true },
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

    // 4. Shape the final response
    const shaped = students.map(s => {
      const fees = feeMap.get(s.id) || { amount: 0, paidAmount: 0 };
      const present = attMap.get(s.id)?.present || 0;
      const absent = attMap.get(s.id)?.absent || 0;
      const late = attMap.get(s.id)?.late || 0;
      const totalAtt = present + absent + late;

      return {
        ...s,
        documents: s.documents && s.documents !== "NULL" ? JSON.parse(s.documents) : {},
        fees: {
          total: fees.amount || 0,
          paid: fees.paidAmount || 0,
          pending: (fees.amount || 0) - (fees.paidAmount || 0),
          lastPaymentDate: lastPayMap.get(s.id) || '',
        },
        attendance: {
          present,
          absent,
          late,
          percentage: totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0,
        },
      };
    });

    return NextResponse.json({
      students: shaped,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error('GET /api/students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Rate limiting check for student creation (more restrictive)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 5, 60000); // 5 student creations per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: 'Too many student creation requests',
        message: 'Please wait before creating another student',
        retryAfter: rateLimitResult.retryAfter
      }, { status: 429 });
    }

    const body = await request.json();
    const { documents, fees, attendance, academics, behavior, transferCertificateNumber, grade, timestamp, isAutoSave, ...data } = body;

    // Check subscription limits
    const limitError = await checkSubscriptionLimit(ctx, 'students', schoolPrisma);
    if (limitError) return limitError;

    // Validate required fields
    const requiredFields = ['name', 'dateOfBirth', 'gender'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Validate email format if provided (relaxed validation)
    if (data.email && data.email.trim()) {
      // Relaxed email validation - just basic format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]*$/;
      if (!emailRegex.test(data.email.trim())) {
        return NextResponse.json({ 
          error: 'Invalid email format',
          field: 'email',
          message: 'Email should be in format: name@domain.com (domain extension optional)',
          received: data.email,
          expected: 'e.g., student@school.com or student@school'
        }, { status: 400 });
      }
    }

    // Enhanced validation functions
    const validatePhone = (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15; // Support international numbers
    };

    const validateAadhar = (aadhar: string) => {
      if (!aadhar) return true; // Optional field
      const digits = aadhar.replace(/\D/g, '');
      return digits.length === 12;
    };

    const validatePinCode = (pinCode: string) => {
      if (!pinCode) return true; // Optional field
      const digits = pinCode.replace(/\D/g, '');
      return digits.length === 6;
    };

    const validateIFSC = (ifsc: string) => {
      if (!ifsc) return true; // Optional field
      return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
    };

    // Validate phone format if provided
    if (data.phone && !validatePhone(data.phone)) {
      return NextResponse.json({ 
        error: 'Invalid phone format',
        field: 'phone',
        message: 'Phone number must be 10-15 digits (international numbers supported)',
        received: data.phone,
        expected: 'e.g., 9876543210 or +919876543210'
      }, { status: 400 });
    }

    // Validate Aadhar number if provided
    if (data.aadharNumber && !validateAadhar(data.aadharNumber)) {
      return NextResponse.json({ 
        error: 'Invalid Aadhar number format',
        field: 'aadharNumber',
        message: 'Aadhar number must be exactly 12 digits',
        received: data.aadharNumber,
        expected: 'e.g., 123456789012'
      }, { status: 400 });
    }

    // Validate pin code if provided
    if (data.pinCode && !validatePinCode(data.pinCode)) {
      return NextResponse.json({ 
        error: 'Invalid pin code format',
        field: 'pinCode',
        message: 'Pin code must be exactly 6 digits',
        received: data.pinCode,
        expected: 'e.g., 560001'
      }, { status: 400 });
    }

    // Validate IFSC code if provided
    if (data.bankIfsc && !validateIFSC(data.bankIfsc)) {
      return NextResponse.json({ 
        error: 'Invalid IFSC code format',
        field: 'bankIfsc',
        message: 'IFSC code must be 11 characters (4 letters + 0 + 6 alphanumeric)',
        received: data.bankIfsc,
        expected: 'e.g., SBIN0001234'
      }, { status: 400 });
    }

    // Validate date format
    if (data.dateOfBirth && isNaN(Date.parse(data.dateOfBirth))) {
      return NextResponse.json({ 
        error: 'Invalid date format' 
      }, { status: 400 });
    }

    // Validate gender
    const validGenders = ['Male', 'Female', 'Other'];
    if (data.gender && !validGenders.includes(data.gender)) {
      return NextResponse.json({ 
        error: 'Gender must be Male, Female, or Other' 
      }, { status: 400 });
    }

    // Always generate a unique admission number to avoid conflicts
    const currentYear = new Date().getFullYear();
    let admissionNo;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      const count = await schoolPrisma.student.count({
        where: { admissionNo: { startsWith: currentYear.toString() } }
      });
      admissionNo = `${currentYear}${String(count + attempts + 1).padStart(4, '0')}`;
      
      const existing = await schoolPrisma.student.findUnique({
        where: { admissionNo }
      });
      
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Unable to generate unique admission number' }, { status: 500 });
    }

    // Provide default rollNo if not provided
    if (!data.rollNo) {
      const classRollCount = await schoolPrisma.student.count({
        where: { class: data.class, section: data.section }
      });
      data.rollNo = String(classRollCount + 1);
    }

    // Remove fields that don't exist in schema
    const { 
      grade: _, 
      mediumId, 
      classId, 
      sectionId, 
      _ts, 
      _mediumId, 
      _classId, 
      _sectionId,
      ...dataWithoutInvalidFields 
    } = data;

    // Get the active academic year from database BEFORE creating student
    const activeAcademicYear = await schoolPrisma.academicYear.findFirst({
      where: { isActive: true }
    });
    
    if (!activeAcademicYear) {
      console.error('No active academic year found in database');
      return NextResponse.json({ 
        error: 'No active academic year found. Please set an active academic year in Settings > School Structure > Academic Years before admitting students.',
        code: 'NO_ACTIVE_ACADEMIC_YEAR'
      }, { status: 400 });
    }
    
    const academicYear = activeAcademicYear.year;
    
    const student = await schoolPrisma.student.create({
      data: {
        ...dataWithoutInvalidFields,
        schoolId: ctx.schoolId,
        admissionNo, // Use the generated/validated admission number
        transferCertificateNo: transferCertificateNumber, // Map the field name
        documents: documents ? JSON.stringify(documents) : null,
        academicYear: academicYear, // FIX: Use dynamic academic year from DB
        gpa: academics?.gpa ?? 0,
        rank: academics?.rank ?? 0,
        disciplineScore: behavior?.disciplineScore ?? 100,
        incidents: behavior?.incidents ?? 0,
        achievements: behavior?.achievements ?? 0,
      },
    });

    // Auto-apply fee structures based on student's class, category, and medium
    try {
      // academicYear is already defined above from activeAcademicYear.year
      
      // Find fee structures matching the student's class (by classId or no class restriction)
      const feeStructures = await schoolPrisma.feeStructure.findMany({
        where: { isActive: true },
        include: { class: true },
      });

      const currentYear = new Date().getFullYear();
      
      for (const structure of feeStructures) {
        // Class match: either no specific class (applies to all) or class name matches student's class
        const classMatch = !structure.classId || structure.class?.name === student.class;
        // Category match: 'all' or student's category is included
        const cats = structure.applicableCategories || 'all';
        const categoryMatch = cats === 'all' || cats.includes(student.category || 'General');
        
        if (classMatch && categoryMatch) {
          const dueDate = new Date(currentYear, 3, structure.dueDate); // April or as set
          
          await schoolPrisma.feeRecord.create({
            data: {
              studentId: student.id,
              feeStructureId: structure.id,
              amount: structure.amount,
              paidAmount: 0,
              pendingAmount: structure.amount,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'pending',
              academicYear: academicYear, // Use dynamic academic year from DB
              receiptNumber: `FEE-${currentYear}-${student.admissionNo}-${structure.name.replace(' ', '').toUpperCase()}`,
              remarks: `Auto-applied during admission for ${student.name}`
            }
          });
        }
      }
    } catch (feeError) {
      console.error('Failed to auto-apply fees:', feeError);
      // Don't fail student creation if fee application fails
    }

    // Create audit log for successful student creation
    try {
      await schoolPrisma.auditLog.create({
        data: {
          action: 'student_created',
          userId: ctx.userId,
          schoolId: ctx.schoolId,
          details: JSON.stringify({
            studentId: student.id,
            admissionNo: student.admissionNo,
            name: student.name,
            class: student.class,
            academicYear: student.academicYear,
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the response if audit logging fails
    }

    return NextResponse.json({ student }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/students error:', error);
    
    // Create audit log for failed student creation
    try {
      if (ctx && !error.message.includes('Unauthorized')) {
        await schoolPrisma.auditLog.create({
          data: {
            action: 'student_creation_failed',
            userId: ctx.userId,
            schoolId: ctx.schoolId,
            details: JSON.stringify({
              error: error.message,
              timestamp: new Date().toISOString(),
              userAgent: request.headers.get('user-agent')
            })
          }
        });
      }
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Admission number already exists',
        field: 'admissionNo',
        message: 'Please try again to generate a new admission number'
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create student',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
