// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const { ctx, error } = await getSessionContext();
  if (error) return error;
  if (!ctx.schoolId) {
    return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get('academicYearId');
  try {

    // Optimized parallel queries for stats
    const [totalRoutes, totalVehicles, totalStudents] = await Promise.all([
      (schoolPrisma as any).transportRoute.count({ 
        where: { schoolId: ctx.schoolId, ...(academicYearId && { academicYearId }) }
      }),
      (schoolPrisma as any).vehicle.count({ where: { schoolId: ctx.schoolId, isActive: true } }),
      (schoolPrisma as any).studentTransport.count({ 
        where: { 
          student: { schoolId: ctx.schoolId },
          isActive: true,
          ...(academicYearId && { academicYearId })
        }
      })
    ]);

    // Get route utilization with optimized query
    const routes = await (schoolPrisma as any).transportRoute.findMany({
      where: { 
        schoolId: ctx.schoolId,
        ...(academicYearId && { academicYearId })
      },
      select: { id: true, routeNumber: true, routeName: true, capacity: true }
    });

    const routeIds = routes.map(r => r.id);
    const studentCounts = await (schoolPrisma as any).studentTransport.groupBy({
      by: ['routeId'],
      where: { 
        routeId: { in: routeIds },
        isActive: true,
        ...(academicYearId && { academicYearId })
      },
      _count: { _all: true }
    });

    const countMap = new Map(studentCounts.map(sc => [sc.routeId, sc._count._all]));
    
    const routeUtilization = routes.map(route => {
      const studentCount = countMap.get(route.id) || 0;
      return {
        id: route.id,
        routeNumber: route.routeNumber,
        routeName: route.routeName,
        capacity: route.capacity,
        studentsAssigned: studentCount,
        utilizationRate: route.capacity > 0 ? Math.round((studentCount / route.capacity) * 100) : 0,
        status: route.capacity > 0 && studentCount >= route.capacity ? 'full' : 
               studentCount === 0 ? 'empty' : 'available'
      };
    });

    // Get pending transport fees
    let pendingTransportFees = 0;
    try {
      const feeResult = await (schoolPrisma as any).feeRecord.aggregate({
        where: {
          student: { schoolId: ctx.schoolId },
          status: { in: ['pending', 'partial'] },
          feeStructure: { category: 'transport' },
          ...(academicYearId && {
            feeStructure: { academicYearId }
          })
        },
        _sum: { pendingAmount: true }
      });
      pendingTransportFees = feeResult._sum.pendingAmount || 0;
    } catch (feeError) {
      console.warn('Failed to fetch pending fees:', feeError);
    }

    return NextResponse.json({
      totalRoutes,
      totalVehicles,
      totalStudents,
      pendingTransportFees,
      routeUtilization
    });
  } catch (error: any) {
    console.error('GET /api/transport/stats:', error);
    
    // Fallback to individual queries if the complex query fails
    try {
      const [totalRoutes, totalVehicles, totalStudents] = await Promise.all([
        (schoolPrisma as any).transportRoute.count({ 
          where: { schoolId: ctx.schoolId, ...(academicYearId && { academicYearId }) }
        }),
        (schoolPrisma as any).vehicle.count({ where: { schoolId: ctx.schoolId, isActive: true } }),
        (schoolPrisma as any).studentTransport.count({ 
          where: { 
            student: { schoolId: ctx.schoolId },
            isActive: true,
            ...(academicYearId && { academicYearId })
          }
        })
      ]);

      // Simplified route utilization
      const routes = await (schoolPrisma as any).transportRoute.findMany({
        where: { 
          schoolId: ctx.schoolId,
          ...(academicYearId && { academicYearId })
        },
        select: { id: true, routeNumber: true, routeName: true, capacity: true }
      });

      const routeIds = routes.map(r => r.id);
      const studentCounts = await (schoolPrisma as any).studentTransport.groupBy({
        by: ['routeId'],
        where: { 
          routeId: { in: routeIds },
          isActive: true,
          ...(academicYearId && { academicYearId })
        },
        _count: { _all: true }
      });

      const countMap = new Map(studentCounts.map(sc => [sc.routeId, sc._count._all]));
      
      const routeUtilization = routes.map(route => {
        const studentCount = countMap.get(route.id) || 0;
        return {
          id: route.id,
          routeNumber: route.routeNumber,
          routeName: route.routeName,
          capacity: route.capacity,
          studentsAssigned: studentCount,
          utilizationRate: route.capacity > 0 ? Math.round((studentCount / route.capacity) * 100) : 0,
          status: route.capacity > 0 && studentCount >= route.capacity ? 'full' : 
                 studentCount === 0 ? 'empty' : 'available'
        };
      });

      return NextResponse.json({
        totalRoutes,
        totalVehicles,
        totalStudents,
        pendingTransportFees: 0,
        routeUtilization
      });
    } catch (fallbackError: any) {
      console.error('Fallback query also failed:', fallbackError);
      return NextResponse.json({ error: 'Failed to fetch transport statistics', details: error.message }, { status: 500 });
    }
  }
}
