import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    const where = academicYearId ? { academicYearId } : {};

    const mediums = await prisma.medium.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        academicYear: true,
        classes: {
          include: {
            sections: true
          }
        }
      }
    });

    return NextResponse.json({ mediums });
  } catch (error: any) {
    console.error('Error fetching mediums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mediums', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, isActive, academicYearId } = body;

    const medium = await prisma.medium.create({
      data: {
        code,
        name,
        description,
        isActive: isActive ?? true,
        academicYearId
      }
    });

    return NextResponse.json({ medium }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating medium:', error);
    return NextResponse.json(
      { error: 'Failed to create medium', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, name, description, isActive } = body;

    const medium = await prisma.medium.update({
      where: { id },
      data: {
        code,
        name,
        description,
        isActive
      }
    });

    return NextResponse.json({ medium });
  } catch (error: any) {
    console.error('Error updating medium:', error);
    return NextResponse.json(
      { error: 'Failed to update medium', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Medium ID is required' }, { status: 400 });
    }

    await prisma.medium.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting medium:', error);
    return NextResponse.json(
      { error: 'Failed to delete medium', details: error.message },
      { status: 500 }
    );
  }
}
