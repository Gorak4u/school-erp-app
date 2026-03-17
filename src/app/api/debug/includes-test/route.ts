import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    console.log('=== INCLUDES TEST ===');
    console.log('School ID:', ctx.schoolId);
    console.log('Academic Year ID:', academicYearId);

    const baseWhere = {
      schoolId: ctx.schoolId,
      ...(academicYearId && { academicYearId }),
      isActive: true
    };

    // Test 1: Include academicYear only
    console.log('\n--- Test 1: Include academicYear ---');
    try {
      const withAcademicYear = await (schoolPrisma as any).feeStructure.findMany({
        where: baseWhere,
        include: {
          academicYear: { select: { id: true, name: true, year: true } }
        }
      });
      console.log('✅ academicYear include OK, count:', withAcademicYear.length);
    } catch (e: any) {
      console.error('❌ academicYear include failed:', e.message);
    }

    // Test 2: Include board only
    console.log('\n--- Test 2: Include board ---');
    try {
      const withBoard = await (schoolPrisma as any).feeStructure.findMany({
        where: baseWhere,
        include: {
          board: { select: { id: true, name: true, code: true } }
        }
      });
      console.log('✅ board include OK, count:', withBoard.length);
    } catch (e: any) {
      console.error('❌ board include failed:', e.message);
    }

    // Test 3: Include medium only
    console.log('\n--- Test 3: Include medium ---');
    try {
      const withMedium = await (schoolPrisma as any).feeStructure.findMany({
        where: baseWhere,
        include: {
          medium: { select: { id: true, name: true, code: true } }
        }
      });
      console.log('✅ medium include OK, count:', withMedium.length);
    } catch (e: any) {
      console.error('❌ medium include failed:', e.message);
    }

    // Test 4: Include class only
    console.log('\n--- Test 4: Include class ---');
    try {
      const withClass = await (schoolPrisma as any).feeStructure.findMany({
        where: baseWhere,
        include: {
          class: { select: { id: true, name: true, code: true } }
        }
      });
      console.log('✅ class include OK, count:', withClass.length);
    } catch (e: any) {
      console.error('❌ class include failed:', e.message);
    }

    // Test 5: All includes together (the original failing query)
    console.log('\n--- Test 5: All includes together ---');
    try {
      const INCLUDE_RELATIONS = {
        academicYear: { select: { id: true, name: true, year: true } },
        board: { select: { id: true, name: true, code: true } },
        medium: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
      };

      const withAllIncludes = await (schoolPrisma as any).feeStructure.findMany({
        where: baseWhere,
        include: INCLUDE_RELATIONS,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
      console.log('✅ All includes OK, count:', withAllIncludes.length);

      return NextResponse.json({
        success: true,
        message: 'All includes work fine',
        count: withAllIncludes.length,
        sample: withAllIncludes.slice(0, 2)
      });

    } catch (e: any) {
      console.error('❌ All includes failed:', e.message);
      console.error('Error details:', {
        code: e.code,
        meta: e.meta,
        cause: e.cause
      });

      return NextResponse.json({
        error: 'All includes failed',
        message: e.message,
        code: e.code,
        meta: e.meta
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('INCLUDES TEST ERROR:', error);
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 });
  }
}
