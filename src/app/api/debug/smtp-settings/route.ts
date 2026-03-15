import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma, saasPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    console.log('🔍 Debug SMTP Settings - Context:', {
      schoolId: ctx.schoolId,
      isSuperAdmin: ctx.isSuperAdmin,
      email: ctx.email
    });

    // Check all SMTP settings in the database
    const allSmtpSettings = await (schoolPrisma as any).schoolSetting.findMany({
      where: { group: 'smtp' }
    });

    console.log('🔍 All SMTP settings in DB:', allSmtpSettings);

    // Check SMTP settings for this school
    const schoolSmtpSettings = await (schoolPrisma as any).schoolSetting.findMany({
      where: { 
        group: 'smtp',
        schoolId: ctx.schoolId 
      }
    });

    console.log('🔍 School SMTP settings:', schoolSmtpSettings);

    // Check if school exists
    if (ctx.schoolId) {
      const school = await (saasPrisma as any).school.findUnique({
        where: { id: ctx.schoolId }
      });
      console.log('🔍 School info:', school);
    }

    return NextResponse.json({
      context: {
        schoolId: ctx.schoolId,
        isSuperAdmin: ctx.isSuperAdmin,
        email: ctx.email
      },
      allSmtpSettings,
      schoolSmtpSettings,
      summary: {
        totalSmtpSettings: allSmtpSettings.length,
        schoolSmtpSettingsCount: schoolSmtpSettings.length,
        hasSmtpConfig: schoolSmtpSettings.length > 0
      }
    });
  } catch (error: any) {
    console.error('🔍 Debug SMTP Settings Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
