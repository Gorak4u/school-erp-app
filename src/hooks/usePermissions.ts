'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, DEFAULT_ROLE_PERMISSIONS, type Permission } from '@/lib/permissions';

interface UsePermissionsReturn {
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
  isLoading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  // Get user permissions from session or fallback to default role permissions
  const userRole = (session?.user as any)?.role || '';
  const userPermissions: Permission[] = 
    (session?.user as any)?.permissions || 
    DEFAULT_ROLE_PERMISSIONS[userRole] || 
    [];

  const userIsSuperAdmin = (session?.user as any)?.isSuperAdmin === true;
  const isAdmin = userRole === 'admin' || userIsSuperAdmin;
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';
  const isParent = userRole === 'parent';

  return {
    permissions: userPermissions,
    hasPermission: (permission: Permission) => hasPermission(userPermissions, permission),
    hasAnyPermission: (permissions: Permission[]) => 
      permissions.some(p => hasPermission(userPermissions, p)),
    hasAllPermissions: (permissions: Permission[]) => 
      permissions.every(p => hasPermission(userPermissions, p)),
    isAdmin,
    isSuperAdmin: userIsSuperAdmin,
    isTeacher,
    isStudent,
    isParent,
    isLoading,
  };
}
