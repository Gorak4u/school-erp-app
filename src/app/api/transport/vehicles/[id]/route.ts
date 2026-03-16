// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const existing = await (schoolPrisma as any).vehicle.findFirst({ where: { id, schoolId: ctx.schoolId } });
    if (!existing) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });

    const body = await request.json();
    const { vehicleNumber, vehicleType, capacity, driverName, driverPhone, registrationNo, insuranceExpiry, fitnessExpiry, isActive } = body;

    const updated = await (schoolPrisma as any).vehicle.update({
      where: { id },
      data: {
        ...(vehicleNumber !== undefined && { vehicleNumber }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(capacity !== undefined && { capacity }),
        ...(driverName !== undefined && { driverName }),
        ...(driverPhone !== undefined && { driverPhone }),
        ...(registrationNo !== undefined && { registrationNo }),
        ...(insuranceExpiry !== undefined && { insuranceExpiry }),
        ...(fitnessExpiry !== undefined && { fitnessExpiry }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    return NextResponse.json({ vehicle: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update vehicle', details: error.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const vehicle = await (schoolPrisma as any).vehicle.findFirst({ where: { id, schoolId: ctx.schoolId } });
    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });

    const routeCount = await (schoolPrisma as any).transportRoute.count({ where: { vehicleId: id, isActive: true } });
    if (routeCount > 0) {
      return NextResponse.json({ error: `Cannot delete — vehicle is assigned to ${routeCount} active route(s)` }, { status: 400 });
    }

    await (schoolPrisma as any).vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete vehicle', details: error.message }, { status: 500 });
  }
}
