import { getServerSession } from 'next-auth';
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
  const session = await getServerSession() as any;
  if (!session?.user?.email) {
    return { ctx: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const u = session.user as any;
  
  // Check if user is a super admin from environment variables
  // This is more reliable than JWT token for super admin detection
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isSuperAdmin = superAdminEmails.includes(u.email?.toLowerCase());
  
  // For super admins, fetch the latest schoolId from school schema
  // This handles the case where super admin switched schools
  let schoolId = u.schoolId || null;
  if (isSuperAdmin) {
    try {
      const schoolUser = await (schoolPrisma as any).school_User.findUnique({
        where: { email: u.email },
        select: { schoolId: true }
      });
      if (schoolUser?.schoolId) {
        schoolId = schoolUser.schoolId;
      }
    } catch (error) {
      // If school user doesn't exist, use session schoolId (or null)
      console.log('School user not found for super admin, using session schoolId');
    }
  }
  
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
 * Super admins get no restriction (see all data).
 */
export function tenantWhere(ctx: SessionContext): Record<string, any> {
  if (ctx.isSuperAdmin || !ctx.schoolId) return {};
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
  if (ctx.isSuperAdmin || !ctx.schoolId) return null;

  const user = await (schoolPrisma as any).school_User.findUnique({
    where: { email: ctx.email },
  });

  // Get school and subscription separately since they're in different schemas
  let subscription = null;
  if (user?.schoolId) {
    const school = await (saasPrisma as any).school.findUnique({
      where: { id: user.schoolId },
      include: { subscription: true },
    });
    subscription = school?.subscription;
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
