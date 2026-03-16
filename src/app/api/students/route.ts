// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, checkSubscriptionLimit } from '@/lib/apiAuth';
import { validateSearchQuery, rateLimit, getClientIdentifier, sanitizePaginationParams } from '@/lib/apiSecurity';

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
    console.log('DEBUG: Students API - search:', search, 'where clause:', where);
    
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
          fatherName: true, motherName: true,
          gpa: true, rank: true, disciplineScore: true, incidents: true, achievements: true,
          documents: true, remarks: true, admissionDate: true, enrollmentDate: true,
          createdAt: true, updatedAt: true,
        },
      }),
      schoolPrisma.student.count({ where }),
    ]);

    console.log('DEBUG: Students API - query results:', { 
      studentsCount: students.length, 
      total,
      firstStudent: students[0] ? { name: students[0].name, id: students[0].id } : null 
    });

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
      feeLastPayment.map(p => [p.studentId, p.paidDate?.toISOString().split('T')[0]])
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        return NextResponse.json({ 
          error: 'Invalid email format' 
        }, { status: 400 });
      }
    }

    // Validate phone format if provided
    if (data.phone && !/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) {
      return NextResponse.json({ 
        error: 'Phone number must be 10 digits' 
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
    
    const student = await schoolPrisma.student.create({
      data: {
        ...dataWithoutInvalidFields,
        schoolId: ctx.schoolId,
        admissionNo, // Use the generated/validated admission number
        transferCertificateNo: transferCertificateNumber, // Map the field name
        documents: documents ? JSON.stringify(documents) : null,
        gpa: academics?.gpa ?? 0,
        rank: academics?.rank ?? 0,
        disciplineScore: behavior?.disciplineScore ?? 100,
        incidents: behavior?.incidents ?? 0,
        achievements: behavior?.achievements ?? 0,
      },
    });

    // Auto-apply fee structures based on student's class, category, and medium
    try {
      // Get the active academic year from database
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
      console.log('DEBUG: Using academic year for fee records:', academicYear);
      
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

    return NextResponse.json({ student }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/students error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Admission number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 });
  }
}
