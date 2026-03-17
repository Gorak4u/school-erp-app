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
      include: { school: true }
    });

    console.log('🔍 [SETUP CHECK] School user found:', !!schoolUser);
    console.log('🔍 [SETUP CHECK] School found:', !!schoolUser?.school);

    if (!schoolUser || !schoolUser.school) {
      console.log('❌ [SETUP CHECK] School not found for user:', session.user.email);
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Check essential school settings
    const essentialSettings = [
      'school_name',
      'school_address', 
      'school_phone',
      'school_email'
    ];

    console.log('🔍 [SETUP CHECK] Fetching settings for school ID:', schoolUser.school.id);
    const settings = await (schoolPrisma as any).schoolSetting.findMany({
      where: {
        schoolId: schoolUser.school.id,
        key: { in: essentialSettings }
      }
    });

    console.log('🔍 [SETUP CHECK] Found settings:', settings.length);

    const configuredSettings = settings.filter((s: any) => s.value && s.value.trim() !== '');
    const isConfigured = configuredSettings.length >= essentialSettings.length * 0.5; // At least 50% configured

    console.log('🔍 [SETUP CHECK] Configured settings:', configuredSettings.length, '/', essentialSettings.length);

    // Check for academic years (critical for school operations)
    console.log('🔍 [SETUP CHECK] Checking academic years...');
    const academicYears = await (schoolPrisma as any).academicYear.findMany({
      where: { schoolId: schoolUser.school.id }
    });

    console.log('🔍 [SETUP CHECK] Found academic years:', academicYears.length);

    const hasAcademicYears = academicYears.length > 0;

    const result = {
      isConfigured,
      configuredSettings: configuredSettings.length,
      totalEssential: essentialSettings.length,
      hasAcademicYears,
      academicYearsCount: academicYears.length,
      redirectToSettings: !isConfigured || !hasAcademicYears,
      missingEssential: essentialSettings.filter(key => 
        !settings.find((s: any) => s.key === key && s.value && s.value.trim() !== '')
      )
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
