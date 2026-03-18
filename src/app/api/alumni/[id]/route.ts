// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canManageAlumniAccess, canViewAlumniAccess, canViewAlumniDuesAccess } from '@/lib/permissions';

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canViewAlumniAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const canViewDues = canViewAlumniDuesAccess(ctx);

    const { id } = await params;
    const alumni = await schoolPrisma.student.findFirst({
      where: { id, ...tenantWhere(ctx) },
      include: {
        feeRecords: canViewDues ? {
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            discount: true,
            status: true,
            dueDate: true,
            paidDate: true,
            academicYear: true,
            feeStructure: { select: { name: true, category: true } }
          },
          orderBy: { createdAt: 'desc' },
        } : false,
        arrears: canViewDues ? {
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            fromAcademicYear: true,
            toAcademicYear: true,
            dueDate: true,
            status: true,
            remarks: true
          },
          orderBy: { createdAt: 'desc' },
        } : false,
        promotions: {
          select: { fromClass: true, toClass: true, fromAcademicYear: true, toAcademicYear: true, promotedAt: true },
          orderBy: { promotedAt: 'desc' },
        },
      },
    });

    if (!alumni) return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });

    const feeRecords = Array.isArray((alumni as any).feeRecords)
      ? (alumni as any).feeRecords.map((fee: any) => ({
          ...fee,
          description: fee.feeStructure?.name || fee.feeStructure?.category || 'Fee Record'
        }))
      : [];
    const arrears = Array.isArray((alumni as any).arrears)
      ? (alumni as any).arrears.map((arrear: any) => ({
          ...arrear,
          description: arrear.remarks || `Arrear from ${arrear.fromAcademicYear || arrear.toAcademicYear || 'previous academic year'}`
        }))
      : [];
    const feeTotal = feeRecords.reduce((sum, f) => sum + (f.amount || 0), 0);
    const feePaid = feeRecords.reduce((sum, f) => sum + (f.paidAmount || 0) + (f.discount || 0), 0);
    const arrearsTotal = arrears.reduce((sum, a) => sum + (a.amount || 0) - (a.paidAmount || 0), 0);
    const pendingDues = canViewDues ? Math.max(0, feeTotal - feePaid) + Math.max(0, arrearsTotal) : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...alumni,
        status: alumni.status === 'exit' ? 'exited' : alumni.status,
        feeRecords,
        arrears,
        documents: parseJson(alumni.documents, {}),
        higherEducation: parseJson(alumni.higherEducation, null),
        employment: parseJson(alumni.employment, null),
        socialLinks: parseJson(alumni.socialLinks, {}),
        mentorshipAreas: parseJson(alumni.mentorshipAreas, []),
        pendingDues,
      },
    });
  } catch (error: any) {
    console.error('GET /api/alumni/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch alumni' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canManageAlumniAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { higherEducation, employment, socialLinks, mentorshipAreas, contactPreference } = body;

    const existing = await schoolPrisma.student.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!existing) return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });

    const updated = await schoolPrisma.student.update({
      where: { id },
      data: {
        higherEducation: higherEducation !== undefined ? JSON.stringify(higherEducation) : undefined,
        employment: employment !== undefined ? JSON.stringify(employment) : undefined,
        socialLinks: socialLinks !== undefined ? JSON.stringify(socialLinks) : undefined,
        mentorshipAreas: mentorshipAreas !== undefined ? JSON.stringify(mentorshipAreas) : undefined,
        contactPreference: contactPreference || undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('PUT /api/alumni/[id]:', error);
    return NextResponse.json({ error: 'Failed to update alumni profile' }, { status: 500 });
  }
}
