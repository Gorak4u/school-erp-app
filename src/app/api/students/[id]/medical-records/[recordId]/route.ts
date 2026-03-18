import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// PUT update medical record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id, recordId } = await params;
    const body = await request.json();

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'School context not found' }, { status: 401 });
    }

    // Verify medical record exists and belongs to user's school
    const existingRecord = await schoolPrisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: { schoolId: true, studentId: true }
    });

    if (!existingRecord || existingRecord.schoolId !== ctx.schoolId || existingRecord.studentId !== id) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
    }

    // Validate required fields
    const { type, title, date, doctor, description, status } = body;
    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      );
    }

    const medicalRecord = await schoolPrisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        type,
        title,
        date: date ? new Date(date) : undefined,
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
    console.error('Error updating medical record:', error);
    return NextResponse.json(
      { error: 'Failed to update medical record' },
      { status: 500 }
    );
  }
}

// DELETE medical record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id, recordId } = await params;

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'School context not found' }, { status: 401 });
    }

    // Verify medical record exists and belongs to user's school
    const existingRecord = await schoolPrisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: { schoolId: true, studentId: true }
    });

    if (!existingRecord || existingRecord.schoolId !== ctx.schoolId || existingRecord.studentId !== id) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
    }

    await schoolPrisma.medicalRecord.delete({
      where: { id: recordId }
    });

    return NextResponse.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    return NextResponse.json(
      { error: 'Failed to delete medical record' },
      { status: 500 }
    );
  }
}
