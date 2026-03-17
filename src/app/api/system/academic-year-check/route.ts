import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { getActiveAcademicYearForSchool } from '@/lib/schoolScope';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const activeAcademicYear = await getActiveAcademicYearForSchool(ctx.schoolId, schoolPrisma);
    
    if (!activeAcademicYear) {
      return NextResponse.json({
        hasActiveAcademicYear: false,
        message: 'No active academic year found. Please set an active academic year in Settings > School Structure > Academic Years.',
        activeAcademicYear: null
      });
    }
    
    return NextResponse.json({
      hasActiveAcademicYear: true,
      message: `Active academic year found: ${activeAcademicYear.name} (${activeAcademicYear.year})`,
      activeAcademicYear
    });
    
  } catch (error: any) {
    console.error('Error checking academic year:', error);
    return NextResponse.json({ 
      error: 'Failed to check academic year status',
      details: error.message 
    }, { status: 500 });
  }
}
