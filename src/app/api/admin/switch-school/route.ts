import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

// Super admin can switch their user record to point to any school
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { schoolId } = await req.json();
    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId required' }, { status: 400 });
    }

    const p = prisma as any;

    // Verify school exists
    const school = await p.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Update super admin's schoolId to the target school
    await p.user.update({
      where: { email: session.user.email },
      data: { schoolId: school.id },
    });

    return NextResponse.json({
      success: true,
      message: `Switched to ${school.name}`,
      school: { id: school.id, name: school.name, slug: school.slug },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
