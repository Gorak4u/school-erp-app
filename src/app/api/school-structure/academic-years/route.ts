import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere } from '@/lib/schoolScope';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const academicYears = await (schoolPrisma as any).academicYear.findMany({
      where: schoolFilter,
      orderBy: { year: 'desc' },
      include: {
        mediums: { where: schoolFilter },
        classes: { where: schoolFilter },
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { year, name, startDate, endDate, isActive } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const existingYear = await (schoolPrisma as any).academicYear.findFirst({
      where: { year, ...schoolFilter }
    });

    if (existingYear) {
      return NextResponse.json(
        { error: 'Academic year already exists', details: `Year '${year}' is already in use` },
        { status: 409 }
      );
    }

    if (isActive) {
      await (schoolPrisma as any).academicYear.updateMany({
        where: { isActive: true, ...schoolFilter },
        data: { isActive: false }
      });
    }

    const academicYear = await (schoolPrisma as any).academicYear.create({
      data: {
        year,
        name,
        startDate,
        endDate,
        isActive: isActive ?? false,
        schoolId: ctx.schoolId,
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { id, year, name, startDate, endDate, isActive } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const existing = await (schoolPrisma as any).academicYear.findFirst({
      where: { id, ...schoolFilter }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    const duplicate = await (schoolPrisma as any).academicYear.findFirst({
      where: {
        ...schoolFilter,
        year,
        id: { not: id }
      }
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'Academic year already exists', details: `Year '${year}' is already in use` },
        { status: 409 }
      );
    }

    if (isActive) {
      await (schoolPrisma as any).academicYear.updateMany({
        where: { ...schoolFilter, isActive: true, id: { not: id } },
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
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cascade = searchParams.get('cascade') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Academic year ID is required' }, { status: 400 });
    }

    const existing = await (schoolPrisma as any).academicYear.findFirst({
      where: { id, ...schoolFilter },
      include: {
        mediums: {
          where: schoolFilter,
          include: {
            classes: {
              where: schoolFilter,
              include: {
                sections: { where: schoolFilter }
              }
            }
          }
        }
      }
    });
    if (!existing) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });

    const studentCount = await (schoolPrisma as any).student.count({ where: { ...schoolFilter, academicYearId: id } });
    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { ...schoolFilter, academicYearId: id } });

    // Calculate other counts for information
    const mediumCount = existing.mediums.length;
    const classCount = existing.mediums.reduce((sum: number, m: any) => sum + m.classes.length, 0);
    const sectionCount = existing.mediums.reduce((sum: number, m: any) => 
      sum + m.classes.reduce((s: number, c: any) => s + c.sections.length, 0), 0);

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

    if (cascade) {
      if (studentCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete academic year', 
          details: `This academic year is being used by ${studentCount} student(s). Even with cascade, students must be promoted or removed first.`,
          code: 'FOREIGN_KEY_CONSTRAINT'
        }, { status: 400 });
      }

      await (schoolPrisma as any).feeStructure.deleteMany({ where: { ...schoolFilter, academicYearId: id } });

      const mediumIds = existing.mediums.map((m: any) => m.id);
      const classIds: string[] = [];
      existing.mediums.forEach((m: any) => m.classes.forEach((c: any) => classIds.push(c.id)));

      if (classIds.length > 0) {
        await (schoolPrisma as any).section.deleteMany({ where: { ...schoolFilter, classId: { in: classIds } } });
        await (schoolPrisma as any).class.deleteMany({ where: { ...schoolFilter, id: { in: classIds } } });
      }
      
      if (mediumIds.length > 0) {
        await (schoolPrisma as any).medium.deleteMany({ where: { ...schoolFilter, id: { in: mediumIds } } });
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
