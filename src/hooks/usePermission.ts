'use client';

import { useSession } from 'next-auth/react';
import type { Permission } from '@/lib/permissions';

/**
 * Returns helpers for checking the current user's permissions.
 * Super admins bypass all permission checks.
 */
export function usePermission() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isSuperAdmin = !!user?.isSuperAdmin;
  const permissions: Permission[] = user?.permissions || [];

  function can(permission: Permission): boolean {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  }

  function canAny(...perms: Permission[]): boolean {
    if (isSuperAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }

  function canAll(...perms: Permission[]): boolean {
    if (isSuperAdmin) return true;
    return perms.every(p => permissions.includes(p));
  }

  return {
    can,
    canAny,
    canAll,
    permissions,
    isSuperAdmin,
    role: user?.role,
    customRoleName: user?.customRoleName,
  };
}
