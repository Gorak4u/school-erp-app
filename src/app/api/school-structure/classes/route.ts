import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere, validateSchoolScopedRefs } from '@/lib/schoolScope';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const mediumId = searchParams.get('mediumId');
    const isActive = searchParams.get('isActive');
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const where: any = { ...schoolFilter };
    if (academicYearId) where.academicYearId = academicYearId;
    if (mediumId) where.mediumId = mediumId;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

    const classes = await (schoolPrisma as any).class.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        medium: true,
        academicYear: true,
        sections: { where: schoolFilter }
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { code, name, level, mediumId, academicYearId, isActive } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const { records, error: validationError } = await validateSchoolScopedRefs(
      { academicYearId, mediumId },
      ctx.schoolId,
      schoolPrisma
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existingClass = await (schoolPrisma as any).class.findFirst({
      where: { ...schoolFilter, academicYearId, code }
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
        isActive: isActive ?? true,
        schoolId: records.academicYear?.schoolId ?? records.medium?.schoolId ?? ctx.schoolId,
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { id, code, name, level, mediumId, academicYearId, isActive } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const existingClass = await (schoolPrisma as any).class.findFirst({
      where: { id, ...schoolFilter }
    });
    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const nextAcademicYearId = academicYearId || existingClass.academicYearId;
    const nextMediumId = mediumId || existingClass.mediumId;
    const { records, error: validationError } = await validateSchoolScopedRefs(
      { academicYearId: nextAcademicYearId, mediumId: nextMediumId },
      ctx.schoolId,
      schoolPrisma
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (existingClass) {
      const duplicate = await (schoolPrisma as any).class.findFirst({
        where: { 
          ...schoolFilter,
          academicYearId: nextAcademicYearId,
          code,
          id: { not: id }
        }
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Class code already exists', details: `A class with code "${code}" already exists. Please use a different code.` },
          { status: 409 }
        );
      }
    }

    const classData = await (schoolPrisma as any).class.update({
      where: { id },
      data: {
        code,
        name,
        level,
        mediumId: nextMediumId,
        academicYearId: nextAcademicYearId,
        isActive,
        schoolId: records.academicYear?.schoolId ?? records.medium?.schoolId ?? existingClass.schoolId ?? ctx.schoolId,
      },
      include: {
        medium: true,
        sections: { where: schoolFilter }
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
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cascade = searchParams.get('cascade') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const existing = await (schoolPrisma as any).class.findFirst({
      where: { id, ...schoolFilter },
      include: {
        sections: { where: schoolFilter }
      }
    });
    if (!existing) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const studentCount = await (schoolPrisma as any).student.count({ 
      where: { 
        ...schoolFilter,
        OR: [
          { class: existing.name },
          { class: existing.code }
        ]
      } 
    });

    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { ...schoolFilter, classId: id } });
    
    const sectionCount = existing.sections.length;

    if (!cascade) {
      if (studentCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete class', 
          details: `This class is being used by ${studentCount} student(s). Please reassign or remove the students first.`,
          code: 'FOREIGN_KEY_CONSTRAINT'
        }, { status: 400 });
      }
      if (feeStructureCount > 0 || sectionCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete class', 
          details: `This class is being used by ${sectionCount} section(s) and ${feeStructureCount} fee structure(s).`,
          code: 'FOREIGN_KEY_CONSTRAINT',
          counts: {
            sections: sectionCount,
            feeStructures: feeStructureCount
          }
        }, { status: 400 });
      }
    }

    if (cascade) {
      if (studentCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete class', 
          details: `This class is being used by ${studentCount} student(s). Even with cascade, students must be reassigned first.`,
          code: 'FOREIGN_KEY_CONSTRAINT'
        }, { status: 400 });
      }

      if (feeStructureCount > 0) {
        await (schoolPrisma as any).feeStructure.deleteMany({ where: { ...schoolFilter, classId: id } });
      }

      if (sectionCount > 0) {
        await (schoolPrisma as any).section.deleteMany({ where: { ...schoolFilter, classId: id } });
      }
    }

    await (schoolPrisma as any).class.delete({ where: { id } });
    
    return NextResponse.json({ 
      success: true,
      cascaded: cascade,
      deleted: {
        sections: sectionCount,
        feeStructures: feeStructureCount
      }
    });
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
