import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere, validateSchoolScopedRefs } from '@/lib/schoolScope';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const academicYearId = searchParams.get('academicYearId');
    const isActive = searchParams.get('isActive');
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const where: any = { ...schoolFilter };
    if (classId) where.classId = classId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { code, name, classId, academicYearId, capacity, roomNumber, isActive } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const { records, error: validationError } = await validateSchoolScopedRefs(
      { classId, academicYearId },
      ctx.schoolId,
      schoolPrisma
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const resolvedAcademicYearId = academicYearId || records.class?.academicYearId;

    const duplicate = await (schoolPrisma as any).section.findFirst({
      where: {
        ...schoolFilter,
        academicYearId: resolvedAcademicYearId,
        code
      }
    });
    if (duplicate) {
      return NextResponse.json({ error: 'Section code already exists' }, { status: 409 });
    }

    const section = await schoolPrisma.section.create({
      data: {
        code: code || `${name.toUpperCase()}-SECTION`,
        name,
        classId,
        academicYearId: resolvedAcademicYearId || '',
        capacity: capacity || 0,
        roomNumber: roomNumber || '',
        isActive: isActive ?? true,
        schoolId: records.class?.schoolId ?? records.academicYear?.schoolId ?? ctx.schoolId,
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { code, name, classId, academicYearId, capacity, roomNumber, isActive } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const existing = await schoolPrisma.section.findFirst({ where: { id, ...schoolFilter } });
    if (!existing) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const nextClassId = classId || existing.classId;
    const nextAcademicYearId = academicYearId || existing.academicYearId;
    const { records, error: validationError } = await validateSchoolScopedRefs(
      { classId: nextClassId, academicYearId: nextAcademicYearId },
      ctx.schoolId,
      schoolPrisma
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const duplicate = await (schoolPrisma as any).section.findFirst({
      where: {
        ...schoolFilter,
        academicYearId: nextAcademicYearId,
        code,
        id: { not: id }
      }
    });
    if (duplicate) {
      return NextResponse.json({ error: 'Section code already exists' }, { status: 409 });
    }

    const section = await schoolPrisma.section.update({
      where: { id },
      data: {
        code,
        name,
        classId: nextClassId,
        academicYearId: nextAcademicYearId,
        capacity,
        roomNumber,
        isActive,
        schoolId: records.class?.schoolId ?? records.academicYear?.schoolId ?? existing.schoolId ?? ctx.schoolId,
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
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const existing = await schoolPrisma.section.findFirst({ where: { id, ...schoolFilter } });
    if (!existing) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

    const studentCount = await (schoolPrisma as any).student.count({ 
      where: { 
        ...schoolFilter,
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
