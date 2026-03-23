import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Type definitions for Prisma clients
type PrismaClient = typeof saasPrisma;
type SchoolPrismaClient = typeof schoolPrisma;

export interface SessionContext {
  schoolId: string | null;
  userId: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  customRoleId?: string | null;
  permissions?: string[];
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
  
  // Use permissions from JWT token (cached during login)
  // Don't fetch from database - this eliminates 1 DB query per request
  const customRoleId = u.customRoleId || null;
  const permissions = u.permissions || [];
  
  return {
    ctx: {
      schoolId,
      userId: u.id || '',
      email: u.email || '',
      role: u.role || 'admin',
      isSuperAdmin,
      customRoleId,
      permissions,
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
  prisma: PrismaClient
): Promise<NextResponse | null> {
  if (!ctx.schoolId) return null;

  // Get school and subscription separately since they're in different schemas
  let subscription = null;
  try {
    const school = await (prisma as PrismaClient).school.findUnique({
      where: { id: ctx.schoolId },
      include: { subscription: true },
    });
    subscription = school?.subscription;
  } catch (error) {
    logger.error('Error fetching school for subscription check', { error, schoolId: ctx.schoolId });
    return null;
  }
  if (!subscription) return null;

  const maxLimit = resourceType === 'students' ? subscription.maxStudents : subscription.maxTeachers;
  
  // Use proper typed access instead of dynamic property access
  const currentCount = resourceType === 'students' 
    ? await (prisma as SchoolPrismaClient).student.count({ where: { schoolId: ctx.schoolId } })
    : await (prisma as SchoolPrismaClient).teacher.count({ where: { schoolId: ctx.schoolId } });

  
  if (currentCount >= maxLimit) {
    const resourceName = resourceType === 'students' ? 'Student' : 'Teacher';
    return NextResponse.json(
      { error: `${resourceName} limit reached. Your plan allows ${maxLimit} ${resourceType}. Upgrade your plan to add more.` },
      { status: 403 }
    );
  }

  return null;
}
