import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    // Test 1: Get all fee structures without any filters
    const allStructures = await (schoolPrisma as any).feeStructure.findMany({
      select: {
        id: true,
        name: true,
        academicYearId: true,
        schoolId: true,
        mediumId: true,
        classId: true,
        isActive: true,
        category: true,
        amount: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Test 2: Get all academic years
    const academicYears = await (schoolPrisma as any).academicYear.findMany({
      select: { id: true, name: true, year: true, isActive: true }
    });

    // Test 3: Get all classes
    const classes = await (schoolPrisma as any).class.findMany({
      select: { id: true, name: true, mediumId: true },
      take: 5
    });

    // Test 4: Test the specific query that's failing
    let where: any = {};
    if (ctx.schoolId) where.schoolId = ctx.schoolId;
    if (academicYearId) where.academicYearId = academicYearId;
    where.isActive = true;

    const filteredStructures = await (schoolPrisma as any).feeStructure.findMany({
      where,
      select: {
        id: true,
        name: true,
        academicYearId: true,
        schoolId: true,
        mediumId: true,
        classId: true,
        isActive: true,
        category: true,
        amount: true
      }
    });

    return NextResponse.json({
      debug: {
        schoolId: ctx.schoolId,
        academicYearId,
        allStructuresCount: allStructures.length,
        filteredCount: filteredStructures.length,
        allStructures,
        academicYears,
        classes,
        filteredStructures,
        whereClause: where
      }
    });
  } catch (error: any) {
    console.error('Debug test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
