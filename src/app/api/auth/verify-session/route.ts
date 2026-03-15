import { NextResponse } from 'next/server';
import { schoolPrisma, saasPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ valid: false });
    }

    const email = session.user.email;
    let exists = false;
    
    if (session.user.schema === 'saas') {
      const saasUser = await (saasPrisma as any).$queryRaw`SELECT id, "isActive" FROM saas."User" WHERE email = ${email}`;
      exists = saasUser.length > 0 && saasUser[0].isActive;
    } else {
      const schoolUser = await (schoolPrisma as any).school_User.findUnique({
        where: { email },
        select: { id: true, isActive: true }
      });
      exists = !!schoolUser && schoolUser.isActive;
    }
    
    return NextResponse.json({ valid: exists });
  } catch (error) {
    console.error('Session verification DB check failed:', error);
    return NextResponse.json({ valid: false });
  }
}
