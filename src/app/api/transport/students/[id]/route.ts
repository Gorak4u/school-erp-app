// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const existing = await (schoolPrisma as any).studentTransport.findFirst({
      where: { id, student: { schoolId: ctx.schoolId } }
    });
    if (!existing) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    const body = await request.json();
    const { pickupStop, dropStop, monthlyFee, isActive } = body;

    const updated = await (schoolPrisma as any).studentTransport.update({
      where: { id },
      data: {
        ...(pickupStop !== undefined && { pickupStop }),
        ...(dropStop !== undefined && { dropStop }),
        ...(monthlyFee !== undefined && { monthlyFee }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        student: { select: { id: true, name: true, class: true, admissionNo: true } },
        route: { select: { id: true, routeNumber: true, routeName: true } }
      }
    });

    // If deactivated, update student transport field
    if (isActive === false) {
      await (schoolPrisma as any).student.update({
        where: { id: existing.studentId },
        data: { transport: 'No', transportRoute: null }
      });
    }

    return NextResponse.json({ assignment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update assignment', details: error.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const assignment = await (schoolPrisma as any).studentTransport.findFirst({
      where: { id, student: { schoolId: ctx.schoolId } }
    });
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    await (schoolPrisma as any).studentTransport.delete({ where: { id } });

    // Update student transport fields
    await (schoolPrisma as any).student.update({
      where: { id: assignment.studentId },
      data: { transport: 'No', transportRoute: null }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to remove assignment', details: error.message }, { status: 500 });
  }
}
