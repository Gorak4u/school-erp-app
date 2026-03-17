import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const academicYears = await (schoolPrisma as any).academicYear.findMany({
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

    // Check if academic year already exists
    const existingYear = await (schoolPrisma as any).academicYear.findFirst({
      where: { year }
    });

    if (existingYear) {
      return NextResponse.json(
        { error: 'Academic year already exists', details: `Year '${year}' is already in use` },
        { status: 409 }
      );
    }

    // If this is set as active, deactivate all others
    if (isActive) {
      await (schoolPrisma as any).academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const academicYear = await (schoolPrisma as any).academicYear.create({
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
    
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Academic year already exists', details: 'This academic year is already in the system' },
        { status: 409 }
      );
    }
    
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
      await (schoolPrisma as any).academicYear.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false }
      });
    }

    const academicYear = await (schoolPrisma as any).academicYear.update({
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cascade = searchParams.get('cascade') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Academic year ID is required' }, { status: 400 });
    }

    // Verify academic year exists
    const existing = await (schoolPrisma as any).academicYear.findUnique({ 
      where: { id },
      include: {
        mediums: {
          include: {
            classes: {
              include: {
                sections: true
              }
            }
          }
        }
      }
    });
    if (!existing) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });

    // Check for students using this academic year
    const studentCount = await (schoolPrisma as any).student.count({ where: { academicYearId: id } });
    
    // Check for fee structures using this academic year
    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { academicYearId: id } });

    // Calculate other counts for information
    const mediumCount = existing.mediums.length;
    const classCount = existing.mediums.reduce((sum: number, m: any) => sum + m.classes.length, 0);
    const sectionCount = existing.mediums.reduce((sum: number, m: any) => 
      sum + m.classes.reduce((s: number, c: any) => s + c.sections.length, 0), 0);

    // If not cascading, check for foreign key relationships
    if (!cascade) {
      if (studentCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete academic year', 
          details: `This academic year is being used by ${studentCount} student(s). Please reassign or remove the students first.`,
          code: 'FOREIGN_KEY_CONSTRAINT'
        }, { status: 400 });
      }

      if (feeStructureCount > 0 || mediumCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete academic year', 
          details: `This academic year contains ${mediumCount} medium(s) and ${feeStructureCount} fee structure(s).`,
          code: 'FOREIGN_KEY_CONSTRAINT',
          counts: {
            mediums: mediumCount,
            classes: classCount,
            sections: sectionCount,
            feeStructures: feeStructureCount
          }
        }, { status: 400 });
      }
    }

    // Perform cascading deletion if requested
    if (cascade) {
      // Still block if students exist
      if (studentCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete academic year', 
          details: `This academic year is being used by ${studentCount} student(s). Even with cascade, students must be promoted or removed first.`,
          code: 'FOREIGN_KEY_CONSTRAINT'
        }, { status: 400 });
      }

      // Delete fee structures for this academic year
      await (schoolPrisma as any).feeStructure.deleteMany({ where: { academicYearId: id } });

      // Delete structure in order: sections -> classes -> mediums
      const mediumIds = existing.mediums.map((m: any) => m.id);
      const classIds: string[] = [];
      existing.mediums.forEach((m: any) => m.classes.forEach((c: any) => classIds.push(c.id)));

      if (classIds.length > 0) {
        await (schoolPrisma as any).section.deleteMany({ where: { classId: { in: classIds } } });
        await (schoolPrisma as any).class.deleteMany({ where: { id: { in: classIds } } });
      }
      
      if (mediumIds.length > 0) {
        await (schoolPrisma as any).medium.deleteMany({ where: { id: { in: mediumIds } } });
      }
    }

    await (schoolPrisma as any).academicYear.delete({ where: { id } });
    
    return NextResponse.json({ 
      success: true,
      cascaded: cascade,
      deleted: {
        mediums: mediumCount,
        classes: classCount,
        sections: sectionCount,
        feeStructures: feeStructureCount
      }
    });
  } catch (error: any) {
    console.error('Error deleting academic year:', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    if (error.code === 'P2003') return NextResponse.json({ 
      error: 'Cannot delete academic year', 
      details: 'This academic year is referenced by other records. Please delete those records first.',
      code: 'FOREIGN_KEY_CONSTRAINT'
    }, { status: 400 });
    return NextResponse.json({ error: 'Failed to delete academic year' }, { status: 500 });
  }
}
