import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import { logAuditAction } from '@/lib/auditLog';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const p = saasPrisma as any;
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';
    const where: any = activeOnly ? { isActive: true } : {};
    const announcements = await p.saasAnnouncement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    const { title, message, type = 'info', targetPlans, expiresAt } = body;
    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
    }
    const p = saasPrisma as any;
    const announcement = await p.saasAnnouncement.create({
      data: {
        title,
        message,
        type,
        targetPlans: targetPlans ? JSON.stringify(targetPlans) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.email,
      },
    });
    await logAuditAction({
      actorEmail: session.user.email,
      action: 'create_announcement',
      targetName: title,
      details: { type, targetPlans },
    });
    return NextResponse.json({ announcement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const p = saasPrisma as any;
    const announcement = await p.saasAnnouncement.update({
      where: { id },
      data: {
        ...data,
        targetPlans: data.targetPlans ? JSON.stringify(data.targetPlans) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
    await logAuditAction({
      actorEmail: session.user.email,
      action: 'update_announcement',
      target: id,
      targetName: data.title,
    });
    return NextResponse.json({ announcement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const p = saasPrisma as any;
    await p.saasAnnouncement.delete({ where: { id } });
    await logAuditAction({
      actorEmail: session.user.email,
      action: 'delete_announcement',
      target: id,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
