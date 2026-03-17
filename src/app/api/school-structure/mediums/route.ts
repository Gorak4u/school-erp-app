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
    const isActive = searchParams.get('isActive');
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const where: any = { ...schoolFilter };
    if (academicYearId) where.academicYearId = academicYearId;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

    const mediums = await (schoolPrisma as any).medium.findMany({
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { code, name, description, isActive, academicYearId } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const { records, error: validationError } = await validateSchoolScopedRefs(
      { academicYearId },
      ctx.schoolId,
      schoolPrisma
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const duplicate = await (schoolPrisma as any).medium.findFirst({
      where: { ...schoolFilter, academicYearId, code }
    });
    if (duplicate) {
      return NextResponse.json({ error: 'Medium code already exists' }, { status: 409 });
    }

    const medium = await (schoolPrisma as any).medium.create({
      data: {
        code,
        name,
        description,
        isActive: isActive ?? true,
        academicYearId,
        schoolId: records.academicYear?.schoolId ?? ctx.schoolId,
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { id, code, name, description, isActive, academicYearId } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const existing = await (schoolPrisma as any).medium.findFirst({
      where: { id, ...schoolFilter }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Medium not found' }, { status: 404 });
    }

    const nextAcademicYearId = academicYearId || existing.academicYearId;
    const { records, error: validationError } = await validateSchoolScopedRefs(
      { academicYearId: nextAcademicYearId },
      ctx.schoolId,
      schoolPrisma
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const duplicate = await (schoolPrisma as any).medium.findFirst({
      where: {
        ...schoolFilter,
        academicYearId: nextAcademicYearId,
        code,
        id: { not: id }
      }
    });
    if (duplicate) {
      return NextResponse.json({ error: 'Medium code already exists' }, { status: 409 });
    }

    const medium = await (schoolPrisma as any).medium.update({
      where: { id },
      data: {
        code,
        name,
        description,
        isActive,
        academicYearId: nextAcademicYearId,
        schoolId: records.academicYear?.schoolId ?? existing.schoolId ?? ctx.schoolId,
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cascade = searchParams.get('cascade') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Medium ID is required' }, { status: 400 });
    }

    const existing = await (schoolPrisma as any).medium.findFirst({
      where: { id, ...schoolFilter },
      include: {
        classes: {
          where: schoolFilter,
          include: {
            sections: { where: schoolFilter }
          }
        }
      }
    });
    if (!existing) return NextResponse.json({ error: 'Medium not found' }, { status: 404 });

    const classCount = existing.classes.length;
    const sectionCount = existing.classes.reduce((sum: number, cls: any) => sum + cls.sections.length, 0);
    
    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { ...schoolFilter, mediumId: id } });

    if (!cascade) {
      if (classCount > 0 || feeStructureCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete medium', 
          details: `This medium is being used by ${classCount} class(es) and ${feeStructureCount} fee structure(s).`,
          code: 'FOREIGN_KEY_CONSTRAINT',
          counts: {
            classes: classCount,
            sections: sectionCount,
            feeStructures: feeStructureCount
          }
        }, { status: 400 });
      }
    }

    if (cascade) {
      if (feeStructureCount > 0) {
        await (schoolPrisma as any).feeStructure.deleteMany({ where: { ...schoolFilter, mediumId: id } });
      }

      if (sectionCount > 0) {
        const classIds = existing.classes.map((cls: any) => cls.id);
        await (schoolPrisma as any).section.deleteMany({ where: { ...schoolFilter, classId: { in: classIds } } });
      }

      if (classCount > 0) {
        await (schoolPrisma as any).class.deleteMany({ where: { ...schoolFilter, mediumId: id } });
      }
    }

    await (schoolPrisma as any).medium.delete({ where: { id } });
    
    return NextResponse.json({ 
      success: true,
      cascaded: cascade,
      deleted: {
        classes: classCount,
        sections: sectionCount,
        feeStructures: feeStructureCount
      }
    });
  } catch (error: any) {
    console.error('Error deleting medium:', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Medium not found' }, { status: 404 });
    if (error.code === 'P2003') return NextResponse.json({ 
      error: 'Cannot delete medium', 
      details: 'This medium is referenced by other records. Please delete those records first.',
      code: 'FOREIGN_KEY_CONSTRAINT'
    }, { status: 400 });
    return NextResponse.json({ error: 'Failed to delete medium' }, { status: 500 });
  }
}
