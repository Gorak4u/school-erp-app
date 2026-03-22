// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const teacher = await (schoolPrisma as any).teacher.findFirst({ 
      where: { id, ...tenantWhere(ctx) },
      include: { user: true }
    });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('GET /api/teachers/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const existing = await (schoolPrisma as any).teacher.findFirst({ 
      where: { id, ...tenantWhere(ctx) },
      include: { user: true }
    });
    if (!existing) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const body = await request.json();
    const { action } = body; // 'activate' or 'deactivate'

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "activate" or "deactivate"' }, { status: 400 });
    }

    const newStatus = action === 'activate' ? 'active' : 'inactive';
    const newIsActive = action === 'activate';

    // Update teacher and user status in transaction
    await (schoolPrisma as any).$transaction(async (tx: any) => {
      // Update teacher status
      await tx.teacher.update({
        where: { id },
        data: { status: newStatus }
      });

      // Update associated user isActive status if user exists
      if (existing.userId) {
        await tx.school_User.update({
          where: { id: existing.userId },
          data: { isActive: newIsActive }
        });
      }
    });

    return NextResponse.json({ 
      message: `Teacher ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
      status: newStatus
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Clear-Site-Data': 'cache'
      }
    });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    console.error('PUT /api/teachers/[id]:', error);
    return NextResponse.json({ error: 'Failed to update teacher status' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const existing = await (schoolPrisma as any).teacher.findFirst({ 
      where: { id, ...tenantWhere(ctx) },
      include: { user: true }
    });
    if (!existing) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    // Delete teacher and associated user records in transaction
    await (schoolPrisma as any).$transaction(async (tx: any) => {
      // Delete associated NextAuth account if user exists
      if (existing.userId) {
        await tx.account.deleteMany({
          where: { userId: existing.userId }
        });
      }

      // Delete associated school_User record if user exists
      if (existing.userId) {
        await tx.school_User.delete({
          where: { id: existing.userId }
        });
      }

      // Delete the teacher record
      await tx.teacher.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: 'Teacher and associated user account permanently deleted' }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Clear-Site-Data': 'cache'
      }
    });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    console.error('DELETE /api/teachers/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
