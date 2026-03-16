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
        select: { firstName: true, lastName: true, name: true }
      });

      const schoolName = composeName(schoolUser?.firstName, schoolUser?.lastName, schoolUser?.name);
      if (schoolName) return schoolName;
    }
  } catch (error) {
    console.error('resolveUserDisplayName school lookup failed:', error);
  }

  if (email) {
    try {
      const saasUser = await (saasPrisma as any).User.findUnique({
        where: { email },
        select: { firstName: true, lastName: true, name: true }
      });
      const saasName = composeName(saasUser?.firstName, saasUser?.lastName, saasUser?.name);
      if (saasName) return saasName;
    } catch (error) {
      console.error('resolveUserDisplayName saas lookup failed:', error);
    }

    const fromEmail = email.split('@')[0];
    if (fromEmail) return fromEmail;
  }

  return 'Unknown User';
}
