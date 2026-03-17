import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's school
    const user = await (schoolPrisma as any).user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    });

    if (!user || !user.school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Check essential school settings
    const essentialSettings = [
      'school_name',
      'school_address', 
      'school_phone',
      'school_email'
    ];

    const settings = await (schoolPrisma as any).schoolSetting.findMany({
      where: {
        schoolId: user.school.id,
        key: { in: essentialSettings }
      }
    });

    const configuredSettings = settings.filter((s: any) => s.value && s.value.trim() !== '');
    const isConfigured = configuredSettings.length >= essentialSettings.length * 0.5; // At least 50% configured

    // Check for academic years (critical for school operations)
    const academicYears = await (schoolPrisma as any).academicYear.findMany({
      where: { schoolId: user.school.id }
    });

    const hasAcademicYears = academicYears.length > 0;

    return NextResponse.json({
      isConfigured,
      configuredSettings: configuredSettings.length,
      totalEssential: essentialSettings.length,
      hasAcademicYears,
      academicYearsCount: academicYears.length,
      redirectToSettings: !isConfigured || !hasAcademicYears,
      missingEssential: essentialSettings.filter(key => 
        !settings.find((s: any) => s.key === key && s.value && s.value.trim() !== '')
      )
    });

  } catch (error: any) {
    console.error('Error checking school setup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
