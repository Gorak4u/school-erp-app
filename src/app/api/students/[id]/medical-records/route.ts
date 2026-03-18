import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

// GET medical records for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      studentId: id,
      ...tenantWhere(ctx)
    };

    if (type) where.type = type;
    if (status) where.status = status;

    const medicalRecords = await schoolPrisma.medicalRecord.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({
      success: true,
      records: medicalRecords
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}

// POST create new medical record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'School context not found' }, { status: 401 });
    }

    // Verify student belongs to user's school
    const student = await schoolPrisma.student.findUnique({
      where: { id: id },
      select: { schoolId: true }
    });

    if (!student || student.schoolId !== ctx.schoolId) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Validate required fields
    const { type, title, date, doctor, description, status } = body;
    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      );
    }

    const medicalRecord = await schoolPrisma.medicalRecord.create({
      data: {
        studentId: id,
        schoolId: ctx.schoolId,
        type,
        title,
        date: date ? new Date(date) : new Date(),
        doctor: doctor || null,
        description: description || null,
        status: status || 'pending',
        notes: body.notes || null,
        attachments: body.attachments || null
      }
    });

    return NextResponse.json({
      success: true,
      record: medicalRecord
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    );
  }
}
