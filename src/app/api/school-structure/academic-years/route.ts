import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: { year: 'desc' },
      include: {
        mediums: true,
        classes: true,
      }
    });

    return NextResponse.json({ academicYears });
  } catch (error: any) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic years', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, name, startDate, endDate, isActive } = body;

    // If this is set as active, deactivate all others
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        name,
        startDate,
        endDate,
        isActive: isActive ?? false
      }
    });

    return NextResponse.json({ academicYear }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating academic year:', error);
    return NextResponse.json(
      { error: 'Failed to create academic year', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, year, name, startDate, endDate, isActive } = body;

    // If this is set as active, deactivate all others
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false }
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        year,
        name,
        startDate,
        endDate,
        isActive
      }
    });

    return NextResponse.json({ academicYear });
  } catch (error: any) {
    console.error('Error updating academic year:', error);
    return NextResponse.json(
      { error: 'Failed to update academic year', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Academic year ID is required' }, { status: 400 });
    }

    await prisma.academicYear.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json(
      { error: 'Failed to delete academic year', details: error.message },
      { status: 500 }
    );
  }
}
