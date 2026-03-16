// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const academicYearId = searchParams.get('academicYearId');

    const where: any = { schoolId: ctx.schoolId };
    if (isActive !== null && isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    if (academicYearId) where.academicYearId = academicYearId;

    const routes = await (schoolPrisma as any).transportRoute.findMany({
      where,
      include: {
        vehicle: true,
        students: {
          where: { isActive: true },
          include: { student: { select: { id: true, name: true, class: true, section: true, admissionNo: true } } }
        }
      },
      orderBy: { routeNumber: 'asc' }
    });

    return NextResponse.json({ routes });
  } catch (error: any) {
    console.error('GET /api/transport/routes:', error);
    return NextResponse.json({ error: 'Failed to fetch transport routes', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { routeNumber, routeName, description, stops, vehicleId, driverName, driverPhone, capacity, monthlyFee, academicYearId, isActive } = body;

    if (!routeNumber || !routeName) {
      return NextResponse.json({ error: 'routeNumber and routeName are required' }, { status: 400 });
    }

    const existing = await (schoolPrisma as any).transportRoute.findFirst({
      where: { routeNumber, schoolId: ctx.schoolId }
    });
    if (existing) {
      return NextResponse.json({ error: `Route number '${routeNumber}' already exists` }, { status: 400 });
    }

    const route = await (schoolPrisma as any).transportRoute.create({
      data: {
        routeNumber,
        routeName,
        description: description || null,
        stops: stops ? JSON.stringify(stops) : '[]',
        vehicleId: vehicleId || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        capacity: capacity ?? 40,
        monthlyFee: monthlyFee ?? 0,
        isActive: isActive ?? true,
        schoolId: ctx.schoolId,
        academicYearId: academicYearId || null,
      },
      include: { vehicle: true }
    });

    return NextResponse.json({ route }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/transport/routes:', error);
    return NextResponse.json({ error: 'Failed to create transport route', details: error.message }, { status: 500 });
  }
}
