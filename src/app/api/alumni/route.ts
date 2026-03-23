import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canViewAlumniAccess, canViewAlumniDuesAccess } from '@/lib/permissions';

const ALUMNI_STATUSES = ['graduated', 'transferred', 'exit', 'exited', 'suspended'];

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canViewAlumniAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const canViewDues = canViewAlumniDuesAccess(ctx);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const search = searchParams.get('search') || '';
    const exitReason = searchParams.get('exitReason') || '';
    const graduationYear = searchParams.get('graduationYear') || '';
    const cls = searchParams.get('class') || '';

    const where: any = {
      ...tenantWhere(ctx),
      status: { in: ALUMNI_STATUSES },
    };

    if (exitReason) where.exitReason = exitReason;
    if (cls) where.class = cls;
    if (graduationYear) where.academicYear = graduationYear;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [alumni, total] = await Promise.all([
      schoolPrisma.student.findMany({
        where,
        select: {
          id: true, name: true, admissionNo: true, email: true, phone: true,
          photo: true, class: true, section: true, gender: true, status: true,
          academicYear: true, exitDate: true, exitReason: true, tcNumber: true,
          exitRemarks: true, higherEducation: true, employment: true,
          contactPreference: true, socialLinks: true, mentorshipAreas: true,
          parentName: true, parentPhone: true, parentEmail: true,
          city: true, state: true, dateOfBirth: true,
          arrears: canViewDues ? {
            where: { status: { not: 'paid' } },
            select: { amount: true, paidAmount: true },
          } : false,
          feeRecords: canViewDues ? {
            select: { amount: true, paidAmount: true, discount: true },
          } : false,
        },
        orderBy: [{ exitDate: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      schoolPrisma.student.count({ where }),
    ]);

    const shaped = alumni.map(a => {
      const feeRecords = Array.isArray((a as any).feeRecords) ? (a as any).feeRecords : [];
      const arrears = Array.isArray((a as any).arrears) ? (a as any).arrears : [];
      const feeTotal = feeRecords.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
      const feePaid = feeRecords.reduce((sum: number, f: any) => sum + (f.paidAmount || 0) + (f.discount || 0), 0);
      const arrearsTotal = arrears.reduce((sum: number, arr: any) => sum + (arr.amount || 0) - (arr.paidAmount || 0), 0);
      const pendingDues = canViewDues ? Math.max(0, feeTotal - feePaid) + Math.max(0, arrearsTotal) : 0;

      return {
        ...a,
        status: a.status === 'exit' ? 'exited' : a.status,
        pendingDues,
        higherEducation: a.higherEducation ? JSON.parse(a.higherEducation) : null,
        employment: a.employment ? JSON.parse(a.employment) : null,
        socialLinks: a.socialLinks ? JSON.parse(a.socialLinks) : {},
        mentorshipAreas: a.mentorshipAreas ? JSON.parse(a.mentorshipAreas) : [],
        feeRecords: undefined,
        arrears: undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: shaped,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error: any) {
    console.error('GET /api/alumni:', error);
    return NextResponse.json({ error: 'Failed to fetch alumni' }, { status: 500 });
  }
}
