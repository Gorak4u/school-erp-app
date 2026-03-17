// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const route = await (schoolPrisma as any).transportRoute.findFirst({
      where: { id, schoolId: ctx.schoolId },
      include: {
        vehicle: true,
        students: {
          include: { student: { select: { id: true, name: true, class: true, section: true, admissionNo: true, phone: true } } }
        }
      }
    });
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    return NextResponse.json({ route });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch route', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const existing = await (schoolPrisma as any).transportRoute.findFirst({ where: { id, schoolId: ctx.schoolId } });
    if (!existing) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

    const body = await request.json();
    const { routeNumber, routeName, description, stops, vehicleId, driverName, driverPhone, capacity, monthlyFee, yearlyFee, academicYearId, isActive } = body;

    const updated = await (schoolPrisma as any).transportRoute.update({
      where: { id },
      data: {
        ...(routeNumber !== undefined && { routeNumber }),
        ...(routeName !== undefined && { routeName }),
        ...(description !== undefined && { description }),
        ...(stops !== undefined && { stops: JSON.stringify(stops) }),
        ...(vehicleId !== undefined && { vehicleId: vehicleId || null }),
        ...(driverName !== undefined && { driverName }),
        ...(driverPhone !== undefined && { driverPhone }),
        ...(capacity !== undefined && { capacity }),
        ...(monthlyFee !== undefined && { monthlyFee }),
        ...(yearlyFee !== undefined && { yearlyFee }),
        ...(academicYearId !== undefined && { academicYearId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { vehicle: true }
    });

    return NextResponse.json({ route: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update route', details: error.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const route = await (schoolPrisma as any).transportRoute.findFirst({ where: { id, schoolId: ctx.schoolId } });
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

    const studentCount = await (schoolPrisma as any).studentTransport.count({ where: { routeId: id, isActive: true } });
    if (studentCount > 0) {
      return NextResponse.json({ error: `Cannot delete — ${studentCount} student(s) are assigned to this route` }, { status: 400 });
    }

    await (schoolPrisma as any).transportRoute.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete route', details: error.message }, { status: 500 });
  }
}
