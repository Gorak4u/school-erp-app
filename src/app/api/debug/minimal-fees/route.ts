import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    console.log('=== MINIMAL FEE STRUCTURES TEST ===');
    console.log('School ID:', ctx.schoolId);
    console.log('Academic Year ID:', academicYearId);

    // Test 1: Check if we can connect to the database at all
    console.log('\n--- Test 1: Database connection ---');
    const dbTest = await (schoolPrisma as any).$queryRaw`SELECT 1 as test`;
    console.log('Database connection OK:', dbTest);

    // Test 2: Check if fee structure table exists
    console.log('\n--- Test 2: Table existence ---');
    const tableTest = await (schoolPrisma as any).feeStructure.count();
    console.log('Total fee structures in DB:', tableTest);

    // Test 3: Simple query with just school filter
    console.log('\n--- Test 3: School filter only ---');
    const schoolStructures = await (schoolPrisma as any).feeStructure.findMany({
      where: { schoolId: ctx.schoolId },
      select: { id: true, name: true, schoolId: true }
    });
    console.log('Structures for school:', schoolStructures.length);

    // Test 4: Add academic year filter
    console.log('\n--- Test 4: School + AY filter ---');
    const filteredStructures = await (schoolPrisma as any).feeStructure.findMany({
      where: { 
        schoolId: ctx.schoolId,
        ...(academicYearId && { academicYearId })
      },
      select: { id: true, name: true, schoolId: true, academicYearId: true }
    });
    console.log('Structures for school + AY:', filteredStructures.length);

    // Test 5: Add isActive filter
    console.log('\n--- Test 5: School + AY + isActive filter ---');
    const activeStructures = await (schoolPrisma as any).feeStructure.findMany({
      where: { 
        schoolId: ctx.schoolId,
        ...(academicYearId && { academicYearId }),
        isActive: true
      },
      select: { id: true, name: true, schoolId: true, academicYearId: true, isActive: true }
    });
    console.log('Active structures:', activeStructures.length);

    return NextResponse.json({
      success: true,
      tests: {
        dbConnection: !!dbTest,
        totalRecords: tableTest,
        schoolRecords: schoolStructures.length,
        filteredRecords: filteredStructures.length,
        activeRecords: activeStructures.length,
        sampleData: activeStructures.slice(0, 3)
      }
    });

  } catch (error: any) {
    console.error('MINIMAL TEST ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 });
  }
}
