import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import { logAuditAction } from '@/lib/auditLog';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await (saasPrisma as any).user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        schoolName: 'SaaS Platform', // SaaS users don't belong to schools
        schoolId: null, // SaaS users don't belong to schools
        createdAt: u.createdAt,
      })),
    });
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

    const { id, action, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'school_User ID required' }, { status: 400 });

    const p = saasPrisma as any;

    if (action === 'block') {
      await (schoolPrisma as any).school_User.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ success: true, message: 'school_User blocked' });
    }
    if (action === 'unblock') {
      await (schoolPrisma as any).school_User.update({ where: { id }, data: { isActive: true } });
      return NextResponse.json({ success: true, message: 'school_User unblocked' });
    }
    if (action === 'reset_password') {
      const newPassword = data.password || 'Reset@123';
      const hashed = await bcrypt.hash(newPassword, 10);
      await (schoolPrisma as any).school_User.update({ where: { id }, data: { password: hashed } });
      return NextResponse.json({ success: true, message: `Password reset to: ${newPassword}` });
    }
    if (action === 'change_role') {
      await (schoolPrisma as any).school_User.update({ where: { id }, data: { role: data.role } });
      return NextResponse.json({ success: true, message: `Role changed to ${data.role}` });
    }
    if (action === 'delete') {
      // Get user details for audit log
      const user = await (schoolPrisma as any).school_User.findUnique({ where: { id } });
      const userName = user ? `${user.firstName} ${user.lastName}` : id;
      
      // Delete the user
      await (schoolPrisma as any).school_User.delete({ where: { id } });
      
      await logAuditAction({ actorEmail: session.user.email, action: 'delete_user', target: id, targetName: userName });
      return NextResponse.json({ success: true, message: 'User deleted successfully' });
    }

    if (action === 'bulk_delete') {
      const { ids } = data;
      const deletedCount = await (schoolPrisma as any).school_User.deleteMany({ where: { id: { in: ids } } });
      
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_delete_users', details: { count: ids.length } });
      return NextResponse.json({ success: true, message: `${ids.length} users deleted successfully` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
