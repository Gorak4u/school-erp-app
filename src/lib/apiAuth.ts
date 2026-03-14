import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { schoolPrisma, saasPrisma } from '@/lib/prisma';

export interface SessionContext {
  schoolId: string | null;
  userId: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
}

/**
 * Resolves the current user's session and returns tenant context.
 * Returns null + a 401 NextResponse if unauthenticated.
 */
export async function getSessionContext(): Promise<
  { ctx: SessionContext; error: null } | { ctx: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.email) {
    return { ctx: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const u = session.user as any;
  
  // Check if user is a super admin from environment variables
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isSuperAdmin = superAdminEmails.includes(u.email?.toLowerCase());
  
  // Use schoolId from the JWT session
  let schoolId = u.schoolId || null;
  
  return {
    ctx: {
      schoolId,
      userId: u.id || '',
      email: u.email || '',
      role: u.role || 'admin',
      isSuperAdmin,
    },
    error: null,
  };
}

/**
 * Returns a Prisma `where` clause fragment that scopes queries to the tenant.
 * Super admins are scoped to their currently selected school.
 */
export function tenantWhere(ctx: SessionContext): Record<string, any> {
  if (!ctx.schoolId) return {};
  return { schoolId: ctx.schoolId };
}

/**
 * Checks if the school has reached its subscription limit for a resource.
 * Returns an error NextResponse if limit is reached, null otherwise.
 */
export async function checkSubscriptionLimit(
  ctx: SessionContext,
  resourceType: 'students' | 'teachers',
  prisma: any
): Promise<NextResponse | null> {
  if (!ctx.schoolId) return null;

  // Get school and subscription separately since they're in different schemas
  let subscription = null;
  try {
    const school = await (saasPrisma as any).school.findUnique({
      where: { id: ctx.schoolId },
      include: { subscription: true },
    });
    subscription = school?.subscription;
  } catch (error) {
    console.error('Error fetching school for subscription check:', error);
    return null;
  }
  if (!subscription) return null;

  const maxLimit = resourceType === 'students' ? subscription.maxStudents : subscription.maxTeachers;
  const modelName = resourceType === 'students' ? 'student' : 'teacher';
  const currentCount = await prisma[modelName].count({ where: { schoolId: ctx.schoolId } });

  
  if (currentCount >= maxLimit) {
    const resourceName = resourceType === 'students' ? 'Student' : 'Teacher';
    return NextResponse.json(
      { error: `${resourceName} limit reached. Your plan allows ${maxLimit} ${resourceType}. Upgrade your plan to add more.` },
      { status: 403 }
    );
  }

  return null;
}
