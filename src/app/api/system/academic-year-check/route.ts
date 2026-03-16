import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if there's an active academic year
    const activeAcademicYear = await schoolPrisma.academicYear.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        year: true,
        name: true,
        startDate: true,
        endDate: true
      }
    });
    
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
