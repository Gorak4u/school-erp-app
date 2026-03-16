import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulateNoActive = searchParams.get('simulateNoActive') === 'true';
    
    // Test the same logic as in student admission
    const activeAcademicYear = simulateNoActive ? null : await schoolPrisma.academicYear.findFirst({
      where: { isActive: true }
    });
    
    if (!activeAcademicYear) {
      return NextResponse.json({
        error: 'No active academic year found. Please set an active academic year in Settings > School Structure > Academic Years before admitting students.',
        code: 'NO_ACTIVE_ACADEMIC_YEAR'
      }, { status: 400 });
    }
    
    const academicYear = activeAcademicYear.year;
    const currentYear = new Date().getFullYear();
    
    return NextResponse.json({
      activeAcademicYear: activeAcademicYear.year,
      academicYearUsed: academicYear,
      currentYear,
      message: `Student admission will use academic year: ${academicYear}`
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to get academic year',
      details: error.message 
    }, { status: 500 });
  }
}
