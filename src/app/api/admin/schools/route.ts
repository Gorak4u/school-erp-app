import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import { logAuditAction } from '@/lib/auditLog';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get schools without cross-schema counts first
    const schools = await (saasPrisma as any).school.findMany({
      include: {
        subscription: true,
        _count: { select: { User: true } }, // Only User is in same schema
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get student and teacher counts for each school separately
    const schoolsWithCounts = await Promise.all(
      schools.map(async (school: any) => {
        const [studentCount, teacherCount] = await Promise.all([
          (schoolPrisma as any).student.count({ where: { schoolId: school.id } }),
          (schoolPrisma as any).teacher.count({ where: { schoolId: school.id } }),
        ]);

        return {
          ...school,
          _count: {
            ...school._count,
            students: studentCount,
            teachers: teacherCount,
          },
        };
      })
    );

    return NextResponse.json({ schools: schoolsWithCounts });
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
    if (!id) return NextResponse.json({ error: 'School ID required' }, { status: 400 });

    const p = saasPrisma as any;

    const school = await p.school.findUnique({ where: { id }, select: { name: true } });
    const schoolName = school?.name || id;

    if (action === 'block') {
      await p.school.update({ where: { id }, data: { isActive: false } });
      await logAuditAction({ actorEmail: session.user.email, action: 'block_school', target: id, targetName: schoolName });
      return NextResponse.json({ success: true, message: 'School blocked' });
    }
    if (action === 'unblock') {
      await p.school.update({ where: { id }, data: { isActive: true } });
      await logAuditAction({ actorEmail: session.user.email, action: 'unblock_school', target: id, targetName: schoolName });
      return NextResponse.json({ success: true, message: 'School unblocked' });
    }
    if (action === 'extend_trial') {
      const days = data.days || 30;
      const sub = await p.subscription.findUnique({ where: { schoolId: id } });
      if (sub) {
        const currentEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
        const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
        await p.subscription.update({ where: { schoolId: id }, data: { trialEndsAt: newEnd, status: 'trial' } });
        await logAuditAction({ actorEmail: session.user.email, action: 'extend_trial', target: id, targetName: schoolName, details: { days } });
        return NextResponse.json({ success: true, message: `Trial extended by ${days} days` });
      }
    }
    if (action === 'change_plan') {
      const { plan, maxStudents, maxTeachers } = data;
      // Look up plan defaults from DB
      const planConfig = await p.plan.findUnique({ where: { name: plan } });
      await p.subscription.update({
        where: { schoolId: id },
        data: {
          plan,
          status: 'active',
          maxStudents: maxStudents || planConfig?.maxStudents || 50,
          maxTeachers: maxTeachers || planConfig?.maxTeachers || 5,
          features: planConfig?.features || '[]',
        },
      });
      await logAuditAction({ actorEmail: session.user.email, action: 'change_plan', target: id, targetName: schoolName, details: { plan } });
      return NextResponse.json({ success: true, message: `Plan changed to ${plan}` });
    }
    if (action === 'bulk_block') {
      const { ids } = data;
      await p.school.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_block_schools', details: { count: ids.length } });
      return NextResponse.json({ success: true, message: `${ids.length} schools blocked` });
    }
    if (action === 'bulk_unblock') {
      const { ids } = data;
      await p.school.updateMany({ where: { id: { in: ids } }, data: { isActive: true } });
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_unblock_schools', details: { count: ids.length } });
      return NextResponse.json({ success: true, message: `${ids.length} schools unblocked` });
    }
    if (action === 'bulk_change_plan') {
      const { ids, plan } = data;
      const planConfig = await p.plan.findUnique({ where: { name: plan } });
      for (const sid of ids) {
        await p.subscription.updateMany({
          where: { schoolId: sid },
          data: {
            plan,
            status: 'active',
            maxStudents: planConfig?.maxStudents || 50,
            maxTeachers: planConfig?.maxTeachers || 5,
          },
        });
      }
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_change_plan', details: { count: ids.length, plan } });
      return NextResponse.json({ success: true, message: `Plan changed to ${plan} for ${ids.length} schools` });
    }

    if (action === 'delete') {
      // Delete school and all related data
      await p.$transaction(async (tx: any) => {
        // 1. Delete all students for this school
        await (schoolPrisma as any).student.deleteMany({ where: { schoolId: id } });
        
        // 2. Delete all teachers for this school
        await (schoolPrisma as any).teacher.deleteMany({ where: { schoolId: id } });
        
        // 3. Delete all users for this school
        await (schoolPrisma as any).school_User.deleteMany({ where: { schoolId: id } });
        
        // 4. Delete subscription
        await tx.subscription.delete({ where: { schoolId: id } });
        
        // 5. Delete the school
        await tx.school.delete({ where: { id } });
      });
      
      await logAuditAction({ actorEmail: session.user.email, action: 'delete_school', target: id, targetName: schoolName });
      return NextResponse.json({ success: true, message: 'School and all related data deleted successfully' });
    }
    
    if (action === 'bulk_delete') {
      const { ids } = data;
      await p.$transaction(async (tx: any) => {
        for (const schoolId of ids) {
          const school = await tx.school.findUnique({ where: { id: schoolId }, select: { name: true } });
          const name = school?.name || schoolId;
          
          // Delete all students for this school
          await (schoolPrisma as any).student.deleteMany({ where: { schoolId } });
          
          // Delete all teachers for this school
          await (schoolPrisma as any).teacher.deleteMany({ where: { schoolId } });
          
          // Delete all users for this school
          await (schoolPrisma as any).school_User.deleteMany({ where: { schoolId } });
          
          // Delete subscription
          await tx.subscription.delete({ where: { schoolId } });
          
          // Delete the school
          await tx.school.delete({ where: { id: schoolId } });
        }
      });
      
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_delete_schools', details: { count: ids.length } });
      return NextResponse.json({ success: true, message: `${ids.length} schools and all their related data deleted successfully` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
