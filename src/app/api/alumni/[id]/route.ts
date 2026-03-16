// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const alumni = await schoolPrisma.student.findFirst({
      where: { id, ...tenantWhere(ctx) },
      include: {
        feeRecords: {
          select: { id: true, amount: true, paidAmount: true, discount: true, status: true, dueDate: true, paidDate: true },
          orderBy: { createdAt: 'desc' },
        },
        arrears: {
          select: { id: true, amount: true, paidAmount: true, fromAcademicYear: true, dueDate: true, status: true, description: true },
          orderBy: { createdAt: 'desc' },
        },
        promotions: {
          select: { fromClass: true, toClass: true, fromAcademicYear: true, toAcademicYear: true, promotedAt: true },
          orderBy: { promotedAt: 'desc' },
        },
      },
    });

    if (!alumni) return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });

    const feeTotal = alumni.feeRecords.reduce((sum, f) => sum + (f.amount || 0), 0);
    const feePaid = alumni.feeRecords.reduce((sum, f) => sum + (f.paidAmount || 0) + (f.discount || 0), 0);
    const arrearsTotal = alumni.arrears.reduce((sum, a) => sum + (a.amount || 0) - (a.paidAmount || 0), 0);
    const pendingDues = Math.max(0, feeTotal - feePaid) + Math.max(0, arrearsTotal);

    return NextResponse.json({
      success: true,
      data: {
        ...alumni,
        documents: alumni.documents ? JSON.parse(alumni.documents) : {},
        higherEducation: alumni.higherEducation ? JSON.parse(alumni.higherEducation) : null,
        employment: alumni.employment ? JSON.parse(alumni.employment) : null,
        socialLinks: alumni.socialLinks ? JSON.parse(alumni.socialLinks) : {},
        mentorshipAreas: alumni.mentorshipAreas ? JSON.parse(alumni.mentorshipAreas) : [],
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
