// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = { schoolId: ctx.schoolId };
    if (isActive !== null && isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';

    const vehicles = await (schoolPrisma as any).vehicle.findMany({
      where,
      include: {
        routes: { where: { isActive: true }, select: { id: true, routeNumber: true, routeName: true } }
      },
      orderBy: { vehicleNumber: 'asc' }
    });

    return NextResponse.json({ vehicles });
  } catch (error: any) {
    console.error('GET /api/transport/vehicles:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }

    const body = await request.json();
    const { vehicleNumber, vehicleType, capacity, driverName, driverPhone, registrationNo, insuranceExpiry, fitnessExpiry } = body;

    if (!vehicleNumber || !driverName || !driverPhone) {
      return NextResponse.json({ error: 'vehicleNumber, driverName, driverPhone are required' }, { status: 400 });
    }

    const existing = await (schoolPrisma as any).vehicle.findFirst({
      where: { vehicleNumber, schoolId: ctx.schoolId }
    });
    if (existing) {
      return NextResponse.json({ error: `Vehicle '${vehicleNumber}' already exists` }, { status: 400 });
    }

    const vehicle = await (schoolPrisma as any).vehicle.create({
      data: {
        vehicleNumber,
        vehicleType: vehicleType || 'bus',
        capacity: capacity ?? 40,
        driverName,
        driverPhone,
        registrationNo: registrationNo || null,
        insuranceExpiry: insuranceExpiry || null,
        fitnessExpiry: fitnessExpiry || null,
        isActive: true,
        schoolId: ctx.schoolId,
      }
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/transport/vehicles:', error);
    return NextResponse.json({ error: 'Failed to create vehicle', details: error.message }, { status: 500 });
  }
}
