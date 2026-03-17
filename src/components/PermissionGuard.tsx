'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { type Permission } from '@/lib/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: Permission | Permission[];
  requireAll?: boolean; // If true, requires ALL permissions; if false, requires ANY
  role?: string | string[];
  fallback?: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  role,
  fallback = null,
  adminOnly = false,
  superAdminOnly = false,
}: PermissionGuardProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    isTeacher,
    isStudent,
    isParent,
    isLoading,
  } = usePermissions();

  // Show loading state
  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // Check admin-only restriction
  if (adminOnly && !isAdmin) {
    return <>{fallback}</>;
  }

  // Check super admin-only restriction
  if (superAdminOnly && !isSuperAdmin) {
    return <>{fallback}</>;
  }

  // Check role restriction
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    const hasRole = allowedRoles.some(r => {
      switch (r) {
        case 'admin': return isAdmin;
        case 'super_admin': return isSuperAdmin;
        case 'teacher': return isTeacher;
        case 'student': return isStudent;
        case 'parent': return isParent;
        default: return false;
      }
    });
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Check permissions
  if (permissions) {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissionArray)
      : hasAnyPermission(permissionArray);
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  // All checks passed
  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard adminOnly fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function SuperAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard superAdminOnly fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function RequirePermission({ 
  permission, 
  children, 
  fallback 
}: { 
  permission: Permission; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
