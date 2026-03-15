import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const schoolId = ctx.schoolId;
    
    console.log('🔧 Fixing from_email for schoolId:', schoolId);

    // Update the from_email to match the authenticated Gmail user
    const updatedSetting = await (schoolPrisma as any).schoolSetting.updateMany({
      where: {
        group: 'smtp',
        key: 'from_email',
        schoolId: schoolId
      },
      data: {
        value: 'gondagorakh@gmail.com'
      }
    });

    console.log('🔧 Updated from_email setting:', updatedSetting);

    return NextResponse.json({
      success: true,
      message: `Updated from_email to gondagorakh@gmail.com for schoolId: ${schoolId}`,
      updatedCount: updatedSetting.count
    });
  } catch (error: any) {
    console.error('🔧 Error fixing from_email:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
