// @ts-nocheck
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
    const status = searchParams.get('status') || '';
    const gender = searchParams.get('gender') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));

    const where: any = { ...tenantWhere(ctx) };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { admissionNo: { contains: search } },
        { email: { contains: search } },
        { rollNo: { contains: search } },
        { parentName: { contains: search } },
      ];
    }
    if (cls) where.class = cls;
    if (status) where.status = status;
    if (gender) where.gender = gender;

    const allowedSortFields: Record<string, boolean> = {
      name: true, class: true, status: true, gender: true,
      admissionNo: true, createdAt: true, gpa: true, rollNo: true,
    };
    const orderBy: any = allowedSortFields[sortBy]
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    // 1. Fetch the page of students (no heavy includes)
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy,
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
      prisma.student.count({ where }),
    ]);

    if (students.length === 0) {
      return NextResponse.json({ students: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    }

    // 2. Batch aggregate fee and attendance data for the page's students only
    const studentIds = students.map(s => s.id);

    const [feeAgg, feeLastPayment, attendanceAgg] = await Promise.all([
      // Sum fees per student
      prisma.feeRecord.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds } },
        _sum: { amount: true, paidAmount: true },
      }),
      // Last payment date per student
      prisma.feeRecord.findMany({
        where: { studentId: { in: studentIds }, paidDate: { not: null } },
        select: { studentId: true, paidDate: true },
        orderBy: { paidDate: 'desc' },
        distinct: ['studentId'],
      }),
      // Attendance counts per student per status
      prisma.attendanceRecord.groupBy({
        by: ['studentId', 'status'],
        where: { studentId: { in: studentIds } },
        _count: { status: true },
      }),
    ]);

    // Build lookup maps
    const feeMap = new Map(feeAgg.map(f => [f.studentId, f._sum]));
    const lastPayMap = new Map(feeLastPayment.map(f => [f.studentId, f.paidDate]));
    const attMap = new Map<string, Record<string, number>>();
    for (const a of attendanceAgg) {
      if (!attMap.has(a.studentId)) attMap.set(a.studentId, {});
      attMap.get(a.studentId)![a.status] = a._count.status;
    }

    const shaped = students.map(s => {
      const fees = feeMap.get(s.id);
      const totalFees = fees?.amount || 0;
      const paidFees = fees?.paidAmount || 0;
      const att = attMap.get(s.id) || {};
      const present = att['present'] || 0;
      const absent = att['absent'] || 0;
      const late = att['late'] || 0;
      const totalAtt = present + absent + late;

      return {
        ...s,
        documents: s.documents && s.documents !== "NULL" ? JSON.parse(s.documents) : {},
        fees: {
          total: totalFees,
          paid: paidFees,
          pending: totalFees - paidFees,
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
  } catch (error) {
    console.error('GET /api/students error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { documents, fees, attendance, academics, behavior, transferCertificateNumber, grade, timestamp, isAutoSave, ...data } = body;

    // Check subscription limits (skip for super admins)
    if (!ctx.isSuperAdmin && ctx.schoolId) {
      const user = await (prisma as any).user.findUnique({
        where: { email: ctx.email },
        include: { school: { include: { subscription: true } } },
      });
      
      const subscription = user?.school?.subscription;
      if (subscription) {
        const currentStudentCount = await prisma.student.count({ where: { schoolId: ctx.schoolId } });
        if (currentStudentCount >= subscription.maxStudents) {
          return NextResponse.json({ 
            error: `Student limit reached. Your plan allows ${subscription.maxStudents} students. Upgrade your plan to add more.` 
          }, { status: 403 });
        }
      }
    }

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
      const count = await prisma.student.count({
        where: { admissionNo: { startsWith: currentYear.toString() } }
      });
      admissionNo = `${currentYear}${String(count + attempts + 1).padStart(4, '0')}`;
      
      const existing = await prisma.student.findUnique({
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
      const classRollCount = await prisma.student.count({
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
    
    const student = await prisma.student.create({
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
      // Find fee structures matching the student's class (by classId or no class restriction)
      const feeStructures = await prisma.feeStructure.findMany({
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
          
          await prisma.feeRecord.create({
            data: {
              studentId: student.id,
              feeStructureId: structure.id,
              amount: structure.amount,
              paidAmount: 0,
              pendingAmount: structure.amount,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'pending',
              academicYear: currentYear.toString(),
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
