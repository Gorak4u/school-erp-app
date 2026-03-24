import { NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere, getActiveAcademicYearForSchool } from '@/lib/schoolScope';

// Single endpoint that returns ALL school configuration data
// Used by SchoolConfigContext to populate dropdowns across the entire app
export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    console.log('[API] School config: Session context loaded', { 
      schoolId: ctx.schoolId, 
      isSuperAdmin: ctx.isSuperAdmin,
      role: ctx.role 
    });

    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    console.log('[API] School config: Using school filter', schoolFilter);

    const academicYears = await schoolPrisma.academicYear.findMany({
      where: schoolFilter,
      orderBy: [{ isActive: 'desc' }, { year: 'desc' }]
    });
    console.log('[API] School config: Found', academicYears.length, 'academic years');
    
    const activeAcademicYear = await getActiveAcademicYearForSchool(ctx.schoolId, schoolPrisma) || academicYears[0] || null;
    const activeAYId = activeAcademicYear?.id;
    console.log('[API] School config: Active academic year', activeAcademicYear?.id);

    const [
      boards,
      mediums,
      classes,
      sections,
      timings,
      settingsRaw,
    ] = await Promise.all([
      schoolPrisma.board.findMany({ where: { ...schoolFilter, isActive: true }, orderBy: { name: 'asc' } }),
      schoolPrisma.medium.findMany({
        where: { 
          ...schoolFilter,
          isActive: true,
          ...(activeAYId && { academicYearId: activeAYId })
        },
        orderBy: { name: 'asc' },
        include: { academicYear: true },
      }),
      schoolPrisma.class.findMany({
        where: { 
          ...schoolFilter,
          isActive: true,
          ...(activeAYId && { academicYearId: activeAYId })
        },
        orderBy: { name: 'asc' },
        include: { medium: true, academicYear: true, sections: { where: { isActive: true }, orderBy: { name: 'asc' } } },
      }),
      schoolPrisma.section.findMany({
        where: { 
          ...schoolFilter,
          isActive: true,
          ...(activeAYId && { academicYearId: activeAYId })
        },
        orderBy: { name: 'asc' },
        include: { class: { include: { medium: true } } },
      }),
      schoolPrisma.schoolTiming.findMany({ where: { ...schoolFilter, isActive: true }, orderBy: { sortOrder: 'asc' } }),
      schoolPrisma.schoolSetting.findMany({ where: schoolFilter }),
    ]);

    console.log('[API] School config: Data loaded', {
      boards: boards.length,
      mediums: mediums.length,
      classes: classes.length,
      sections: sections.length,
      timings: timings.length,
      settings: settingsRaw.length
    });

    const settings: Record<string, Record<string, string>> = {};
    for (const s of settingsRaw) {
      if (!settings[s.group]) settings[s.group] = {};
      settings[s.group][s.key] = s.value;
    }

    const dropdowns = {
      academicYears: academicYears.map((a: any) => ({ value: a.id, label: a.name, year: a.year, isActive: a.isActive })),
      boards: boards.map((b: any) => ({ value: b.id, label: b.name, code: b.code })),
      mediums: mediums.map((m: any) => ({ value: m.id, label: m.name, code: m.code })),
      classes: classes.map((c: any) => ({
        value: c.id,
        label: c.name,
        code: c.code,
        level: c.level,
        mediumId: c.mediumId,
        mediumName: c.medium?.name || '',
        academicYearId: c.academicYearId,
        sectionCount: c.sections?.length || 0,
      })),
      sections: sections.map((s: any) => ({
        value: s.id,
        label: `${s.class?.name || ''} - ${s.name}`,
        name: s.name,
        code: s.code,
        classId: s.classId,
        className: s.class?.name || '',
        mediumName: s.class?.medium?.name || '',
        capacity: s.capacity,
        roomNumber: s.roomNumber,
      })),
      classNames: classes.map((c: any) => c.name),
      classCodes: [...new Set(classes.map((c: any) => c.code))],
    };

    const response = {
      academicYears,
      activeAcademicYear,
      boards,
      mediums,
      classes,
      sections,
      timings,
      settings,
      dropdowns,
    };

    console.log('[API] School config: Response prepared successfully');
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('[API] School config error:', error);
    console.error('[API] School config error stack:', error.stack);
    
    // Check if it's a database connection error
    if (error.code === 'P1001' || error.message.includes('database') || error.message.includes('connection')) {
      console.error('[API] Database connection error detected');
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: 'Unable to connect to the database. Please check your database configuration.',
          code: 'DATABASE_ERROR'
        }, 
        { status: 503 }
      );
    }
    
    // Check if it's a Prisma validation error
    if (error.code === 'P2002' || error.code === 'P2025') {
      console.error('[API] Prisma validation error:', error);
      return NextResponse.json(
        { 
          error: 'Data validation failed', 
          details: error.message,
          code: 'VALIDATION_ERROR'
        }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch school config', 
        details: error.message,
        code: 'UNKNOWN_ERROR'
      }, 
      { status: 500 }
    );
  }
}
