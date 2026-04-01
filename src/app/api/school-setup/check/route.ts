import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's school - use school_User model instead of User
    const schoolUser = await (schoolPrisma as any).school_User.findUnique({
      where: { email: session.user.email },
      include: { School: true }  // Fixed: School with capital S
    });

    if (!schoolUser || !schoolUser.School) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const essentialChecks = [] as string[];
    const hasSchoolName = !!schoolUser.School.name?.trim();
    if (hasSchoolName) essentialChecks.push('school_name');

    const activeAcademicYears = await (schoolPrisma as any).academicYear.findMany({
      where: { schoolId: schoolUser.schoolId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    const hasActiveAcademicYear = activeAcademicYears.length > 0;
    if (hasActiveAcademicYear) essentialChecks.push('active_academic_year');

    const selectedAcademicYear = activeAcademicYears[0] || null;
    const mediumCount = selectedAcademicYear
      ? await (schoolPrisma as any).medium.count({
          where: { schoolId: schoolUser.schoolId, academicYearId: selectedAcademicYear.id, isActive: true }
        })
      : 0;
    const hasMediums = mediumCount > 0;
    if (hasMediums) essentialChecks.push('mediums');

    const classCount = selectedAcademicYear
      ? await (schoolPrisma as any).class.count({
          where: { schoolId: schoolUser.schoolId, academicYearId: selectedAcademicYear.id, isActive: true }
        })
      : 0;
    const hasClasses = classCount > 0;
    if (hasClasses) essentialChecks.push('classes');

    const configuredSettings = essentialChecks.length;
    const isConfigured = hasSchoolName && hasActiveAcademicYear && hasMediums && hasClasses;

    const totalEssential = 4;
    const missingEssential = [] as string[];
    if (!hasSchoolName) missingEssential.push('school_name');
    if (!hasActiveAcademicYear) missingEssential.push('active_academic_year');
    if (!hasMediums) missingEssential.push('mediums');
    if (!hasClasses) missingEssential.push('classes');

    const result = {
      isConfigured,
      configuredSettings,
      totalEssential,
      hasAcademicYears: hasActiveAcademicYear,
      academicYearsCount: activeAcademicYears.length,
      hasSchoolName,
      hasActiveAcademicYear,
      hasMediums,
      hasClasses,
      redirectToSettings: !isConfigured,
      missingEssential
    };

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Unknown error occurred',
      details: error.stack 
    }, { status: 500 });
  }
}
