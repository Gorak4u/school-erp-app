import { NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere, getActiveAcademicYearForSchool } from '@/lib/schoolScope';

// Single endpoint that returns ALL school configuration data
// Used by SchoolConfigContext to populate dropdowns across the entire app
export async function GET() {
  const { ctx, error } = await getSessionContext();
  if (error) return error;

  try {
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const academicYears = await schoolPrisma.academicYear.findMany({
      where: schoolFilter,
      orderBy: [{ isActive: 'desc' }, { year: 'desc' }]
    });
    const activeAcademicYear = await getActiveAcademicYearForSchool(ctx.schoolId, schoolPrisma) || academicYears[0] || null;
    const activeAYId = activeAcademicYear?.id;

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

    return NextResponse.json({
      academicYears,
      activeAcademicYear,
      boards,
      mediums,
      classes,
      sections,
      timings,
      settings,
      dropdowns,
    });
  } catch (error: any) {
    console.error('Error fetching school config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school config', details: error.message },
      { status: 500 }
    );
  }
}
