import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const mediumId = searchParams.get('mediumId');

    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (mediumId) where.mediumId = mediumId;

    const classes = await prisma.class.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        medium: true,
        academicYear: true,
        sections: true
      }
    });

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, level, mediumId, academicYearId, isActive } = body;

    const classData = await prisma.class.create({
      data: {
        code,
        name,
        level,
        mediumId,
        academicYearId,
        isActive: isActive ?? true
      },
      include: {
        medium: true,
        sections: true
      }
    });

    return NextResponse.json({ class: classData }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to create class', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, name, level, mediumId, isActive } = body;

    const classData = await prisma.class.update({
      where: { id },
      data: {
        code,
        name,
        level,
        mediumId,
        isActive
      },
      include: {
        medium: true,
        sections: true
      }
    });

    return NextResponse.json({ class: classData });
  } catch (error: any) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Failed to update class', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    await prisma.class.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Failed to delete class', details: error.message },
      { status: 500 }
    );
  }
}
