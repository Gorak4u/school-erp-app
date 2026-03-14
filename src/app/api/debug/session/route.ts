import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession() as any;
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  return NextResponse.json({
    session: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        schoolId: session.user.schoolId,
        isSuperAdmin: session.user.isSuperAdmin,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      }
    }
  });
}
