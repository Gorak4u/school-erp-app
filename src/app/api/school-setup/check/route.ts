import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 [SETUP CHECK] Starting setup check...');
    
    const session = await getServerSession();
    console.log('🔍 [SETUP CHECK] Session:', session?.user?.email ? 'Found' : 'Not found');
    
    if (!session?.user?.email) {
      console.log('❌ [SETUP CHECK] Unauthorized - no session email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's school - use school_User model instead of User
    console.log('🔍 [SETUP CHECK] Looking up school user for email:', session.user.email);
    const schoolUser = await (schoolPrisma as any).school_User.findUnique({
      where: { email: session.user.email },
      include: { School: true }  // Fixed: School with capital S
    });

    console.log('🔍 [SETUP CHECK] School user found:', !!schoolUser);
    console.log('🔍 [SETUP CHECK] School found:', !!schoolUser?.School);

    if (!schoolUser || !schoolUser.School) {
      console.log('❌ [SETUP CHECK] School not found for user:', session.user.email);
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const essentialChecks = [] as string[];
    const hasSchoolName = !!schoolUser.School.name?.trim();
    if (hasSchoolName) essentialChecks.push('school_name');

    console.log('🔍 [SETUP CHECK] Looking up active academic years...');
    const activeAcademicYears = await (schoolPrisma as any).academicYear.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    const hasActiveAcademicYear = activeAcademicYears.length > 0;
    if (hasActiveAcademicYear) essentialChecks.push('active_academic_year');

    const selectedAcademicYear = activeAcademicYears[0] || null;
    const mediumCount = selectedAcademicYear
      ? await (schoolPrisma as any).medium.count({
          where: { academicYearId: selectedAcademicYear.id, isActive: true }
        })
      : 0;
    const hasMediums = mediumCount > 0;
    if (hasMediums) essentialChecks.push('mediums');

    const classCount = selectedAcademicYear
      ? await (schoolPrisma as any).class.count({
          where: { academicYearId: selectedAcademicYear.id, isActive: true }
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

    console.log('✅ [SETUP CHECK] Result:', result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ [SETUP CHECK] Error checking school setup:', error);
    console.error('❌ [SETUP CHECK] Error stack:', error.stack);
    console.error('❌ [SETUP CHECK] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ 
      error: error.message || 'Unknown error occurred',
      details: error.stack 
    }, { status: 500 });
  }
}
