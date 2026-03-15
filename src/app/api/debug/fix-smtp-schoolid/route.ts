import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const schoolId = ctx.schoolId;
    
    console.log('🔧 Fixing SMTP settings for schoolId:', schoolId);

    // Update all SMTP settings that have "default" schoolId to the correct schoolId
    const updatedSettings = await (schoolPrisma as any).schoolSetting.updateMany({
      where: {
        group: 'smtp',
        schoolId: 'default'
      },
      data: {
        schoolId: schoolId
      }
    });

    console.log('🔧 Updated SMTP settings:', updatedSettings);

    // Also check for any settings without schoolId (shouldn't happen with new schema but just in case)
    const nullSchoolIdSettings = await (schoolPrisma as any).schoolSetting.findMany({
      where: {
        group: 'smtp',
        schoolId: null
      }
    });

    if (nullSchoolIdSettings.length > 0) {
      console.log('🔧 Found settings with null schoolId, updating...');
      await (schoolPrisma as any).schoolSetting.updateMany({
        where: {
          group: 'smtp',
          schoolId: null
        },
        data: {
          schoolId: schoolId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedSettings.count} SMTP settings to schoolId: ${schoolId}`,
      updatedCount: updatedSettings.count,
      nullSchoolIdCount: nullSchoolIdSettings.length
    });
  } catch (error: any) {
    console.error('🔧 Error fixing SMTP settings:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
