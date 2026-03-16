import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const mediumId = searchParams.get('mediumId');

    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (mediumId) where.mediumId = mediumId;

    const classes = await (schoolPrisma as any).class.findMany({
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

    // Check if class code already exists
    const existingClass = await (schoolPrisma as any).class.findFirst({
      where: { code }
    });

    if (existingClass) {
      return NextResponse.json(
        { error: 'Class code already exists', details: `A class with code "${code}" already exists. Please use a different code.` },
        { status: 409 }
      );
    }

    const classData = await (schoolPrisma as any).class.create({
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
    
    // Handle unique constraint error
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return NextResponse.json(
        { error: 'Class code already exists', details: 'A class with this code already exists. Please use a different code.' },
        { status: 409 }
      );
    }
    
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

    // Check if class code already exists (excluding current class)
    const existingClass = await (schoolPrisma as any).class.findFirst({
      where: { 
        code,
        id: { not: id }
      }
    });

    if (existingClass) {
      return NextResponse.json(
        { error: 'Class code already exists', details: `A class with code "${code}" already exists. Please use a different code.` },
        { status: 409 }
      );
    }

    const classData = await (schoolPrisma as any).class.update({
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
    
    // Handle unique constraint error
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return NextResponse.json(
        { error: 'Class code already exists', details: 'A class with this code already exists. Please use a different code.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update class', details: error.message },
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
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Verify class exists
    const existing = await (schoolPrisma as any).class.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    // Check for foreign key relationships - students using this class
    const studentCount = await (schoolPrisma as any).student.count({ 
      where: { 
        OR: [
          { class: existing.name },
          { class: existing.code }
        ]
      } 
    });
    if (studentCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete class', 
        details: `This class is being used by ${studentCount} student(s). Please reassign or remove the students first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    // Check for fee structures using this class
    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { classId: id } });
    if (feeStructureCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete class', 
        details: `This class is being used by ${feeStructureCount} fee structure(s). Please delete the fee structures first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    // Check for sections using this class
    const sectionCount = await (schoolPrisma as any).section.count({ where: { classId: id } });
    if (sectionCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete class', 
        details: `This class has ${sectionCount} section(s). Please delete the sections first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    await (schoolPrisma as any).class.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting class:', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    if (error.code === 'P2003') return NextResponse.json({ 
      error: 'Cannot delete class', 
      details: 'This class is referenced by other records. Please delete those records first.',
      code: 'FOREIGN_KEY_CONSTRAINT'
    }, { status: 400 });
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
