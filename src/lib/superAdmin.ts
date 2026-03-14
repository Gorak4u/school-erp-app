/**
 * Super Admin utilities
 * 
 * Super admins are the PLATFORM OWNERS — they manage plans, Razorpay config,
 * view all schools, and control the SaaS business.
 * 
 * Regular school admins (role: 'admin') can only manage their own school's settings.
 * 
 * Super admin emails are defined in the SUPER_ADMIN_EMAILS environment variable.
 */

export function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.toLowerCase());
}
