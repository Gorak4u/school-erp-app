import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    const where = classId ? { classId } : {};

    const sections = await schoolPrisma.section.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        class: {
          include: {
            medium: true
          }
        }
      }
    });

    return NextResponse.json({ sections });
  } catch (error: any) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, classId, capacity, roomNumber, isActive } = body;

    const section = await schoolPrisma.section.create({
      data: {
        code,
        name,
        classId,
        capacity,
        roomNumber,
        isActive: isActive ?? true,
        academicYear: '2024-25' // Default academic year
      } as any,
      include: {
        class: true
      }
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, name, capacity, roomNumber, isActive } = body;

    const section = await schoolPrisma.section.update({
      where: { id },
      data: {
        code,
        name,
        capacity,
        roomNumber,
        isActive
      },
      include: {
        class: true
      }
    });

    return NextResponse.json({ section });
  } catch (error: any) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Failed to update section', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    // Verify section exists
    const existing = await schoolPrisma.section.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

    // Check for foreign key relationships - students using this section
    const studentCount = await (schoolPrisma as any).student.count({ 
      where: { 
        OR: [
          { section: existing.name },
          { section: existing.code }
        ]
      } 
    });
    if (studentCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete section', 
        details: `This section is being used by ${studentCount} student(s). Please reassign or remove the students first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    await schoolPrisma.section.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting section:', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    if (error.code === 'P2003') return NextResponse.json({ 
      error: 'Cannot delete section', 
      details: 'This section is referenced by other records. Please delete those records first.',
      code: 'FOREIGN_KEY_CONSTRAINT'
    }, { status: 400 });
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
  }
}
