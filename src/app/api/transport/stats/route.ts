// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(_: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const [totalRoutes, totalVehicles, totalStudents, pendingFees] = await Promise.all([
      (schoolPrisma as any).transportRoute.count({ where: { schoolId: ctx.schoolId, isActive: true } }),
      (schoolPrisma as any).vehicle.count({ where: { schoolId: ctx.schoolId, isActive: true } }),
      (schoolPrisma as any).studentTransport.count({ where: { isActive: true, student: { schoolId: ctx.schoolId } } }),
      (schoolPrisma as any).feeRecord.aggregate({
        where: {
          status: { in: ['pending', 'partial'] },
          feeStructure: { category: 'transport', schoolId: ctx.schoolId }
        },
        _sum: { pendingAmount: true }
      })
    ]);

    const routes = await (schoolPrisma as any).transportRoute.findMany({
      where: { schoolId: ctx.schoolId, isActive: true },
      include: {
        _count: { select: { students: { where: { isActive: true } } } },
        vehicle: { select: { vehicleNumber: true, driverName: true } }
      },
      orderBy: { routeNumber: 'asc' }
    });

    return NextResponse.json({
      stats: {
        totalRoutes,
        totalVehicles,
        totalStudents,
        pendingTransportFees: pendingFees._sum.pendingAmount || 0,
      },
      routes: routes.map((r: any) => ({
        id: r.id,
        routeNumber: r.routeNumber,
        routeName: r.routeName,
        studentCount: r._count.students,
        capacity: r.capacity,
        utilization: r.capacity > 0 ? Math.round((r._count.students / r.capacity) * 100) : 0,
        vehicle: r.vehicle,
        monthlyFee: r.monthlyFee,
      }))
    });
  } catch (error: any) {
    console.error('GET /api/transport/stats:', error);
    return NextResponse.json({ error: 'Failed to fetch transport stats', details: error.message }, { status: 500 });
  }
}
