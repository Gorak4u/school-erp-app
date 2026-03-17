import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    console.log('Debug Fee Structures:');
    console.log('School ID:', ctx.schoolId);
    console.log('Academic Year ID:', academicYearId);
    console.log('Is Super Admin:', ctx.isSuperAdmin);

    // Check if fee structures exist at all
    const allFeeStructures = await (schoolPrisma as any).feeStructure.findMany({
      take: 5,
      include: {
        academicYear: { select: { id: true, name: true, year: true } },
        school: { select: { id: true, name: true } }
      }
    });

    console.log('All fee structures (first 5):', allFeeStructures);

    // Check with specific academic year
    let where: any = {};
    if (ctx.schoolId) where.schoolId = ctx.schoolId;
    if (academicYearId) where.academicYearId = academicYearId;

    console.log('Where clause:', where);

    const filteredStructures = await (schoolPrisma as any).feeStructure.findMany({
      where,
      include: {
        academicYear: { select: { id: true, name: true, year: true } },
        school: { select: { id: true, name: true } }
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    console.log('Filtered structures:', filteredStructures);

    return NextResponse.json({ 
      debug: {
        schoolId: ctx.schoolId,
        academicYearId,
        isSuperAdmin: ctx.isSuperAdmin,
        totalFeeStructures: allFeeStructures.length,
        filteredCount: filteredStructures.length,
        allFeeStructures,
        filteredStructures,
        whereClause: where
      }
    });
  } catch (error: any) {
    console.error('Debug fee structures error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
