import { schoolPrisma, saasPrisma } from '@/lib/prisma';

function composeName(first?: string | null, last?: string | null, fallback?: string | null) {
  const fn = first?.trim();
  const ln = last?.trim();
  if (fn && ln) return `${fn} ${ln}`;
  if (fn) return fn;
  if (ln) return ln;
  if (fallback?.trim()) return fallback.trim();
  return null;
}

/**
 * Resolves the best available display name for the given user id/email.
 */
export async function resolveUserDisplayName(userId?: string | null, email?: string | null) {
  try {
    if (userId) {
      const schoolUser = await (schoolPrisma as any).school_User.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true, teacher: { select: { name: true } } }
      });

      console.log('DEBUG resolveUserDisplayName schoolUser:', { userId, schoolUser });

      // Try to get name from firstName/lastName first
      if (schoolUser?.firstName || schoolUser?.lastName) {
        const name = composeName(schoolUser.firstName, schoolUser.lastName);
        if (name) {
          console.log('DEBUG resolveUserDisplayName returning firstName/lastName:', name);
          return name;
        }
      }

      // Try to get name from related Teacher record
      if (schoolUser?.teacher?.name) {
        console.log('DEBUG resolveUserDisplayName returning teacher name:', schoolUser.teacher.name);
        return schoolUser.teacher.name;
      }

      // Fallback to email prefix
      if (schoolUser?.email) {
        const fromEmail = schoolUser.email.split('@')[0];
        console.log('DEBUG resolveUserDisplayName returning school email prefix:', fromEmail);
        return fromEmail;
      }
    }
  } catch (error) {
    console.error('resolveUserDisplayName school lookup failed:', error);
  }

  if (email) {
    try {
      const saasUser = await (saasPrisma as any).User.findUnique({
        where: { email },
        select: { email: true }
      });
      
      console.log('DEBUG resolveUserDisplayName saasUser:', { email, saasUser });

      // For SaaS users, we only have email, so use email prefix as fallback
      if (saasUser?.email) {
        const fromEmail = saasUser.email.split('@')[0];
        console.log('DEBUG resolveUserDisplayName returning saas email prefix:', fromEmail);
        return fromEmail;
      }
    } catch (error) {
      console.error('resolveUserDisplayName saas lookup failed:', error);
    }

    const fromEmail = email.split('@')[0];
    if (fromEmail) return fromEmail;
  }

  console.log('DEBUG resolveUserDisplayName returning Unknown User');
  return 'Unknown User';
}
