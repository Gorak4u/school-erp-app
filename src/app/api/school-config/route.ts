import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { schoolPrisma } from '@/lib/prisma';

// Single endpoint that returns ALL school configuration data
// Used by SchoolConfigContext to populate dropdowns across the entire app
export async function GET() {
  // Require authentication — never expose school data to unauthenticated requests
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      academicYears,
      boards,
      mediums,
      classes,
      sections,
      timings,
      settingsRaw,
    ] = await Promise.all([
      (schoolPrisma as any).academicYear.findMany({ orderBy: { year: 'desc' } }),
      (schoolPrisma as any).board.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      (schoolPrisma as any).medium.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: { academicYear: true },
      }),
      (schoolPrisma as any).class.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: { medium: true, academicYear: true, sections: { where: { isActive: true }, orderBy: { name: 'asc' } } },
      }),
      (schoolPrisma as any).section.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: { class: { include: { medium: true } } },
      }),
      (schoolPrisma as any).schoolTiming.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      (schoolPrisma as any).schoolSetting.findMany(),
    ]);

    // Group settings into a nested object
    const settings: Record<string, Record<string, string>> = {};
    for (const s of settingsRaw) {
      if (!settings[s.group]) settings[s.group] = {};
      settings[s.group][s.key] = s.value;
    }

    const activeAcademicYear = academicYears.find((a: any) => a.isActive) || null;

    // Pre-built dropdown options for direct consumption by UI components
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
      // Flat list of class names for simple <select> (e.g. "Class 1 - English")
      classNames: classes.map((c: any) => c.name),
      // Unique class codes for simple filtering
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
