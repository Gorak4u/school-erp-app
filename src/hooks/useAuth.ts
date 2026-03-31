'use client';

import { useSession } from 'next-auth/react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  avatar?: string;
  schoolId?: string;
  classId?: string;
  grade?: string;
  employeeId?: string | null;
}

export function useAuth() {
  const { data: session, status } = useSession();
  
  const user: User | null = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: (session.user as any).firstName || '',
    lastName: (session.user as any).lastName || '',
    role: (session.user as any).role || 'student',
    avatar: (session.user as any).avatar || undefined,
    employeeId: (session.user as any).employeeId || null,
  } : null;

  return {
    user,
    isAuthenticated: !!user,
    loading: status === 'loading',
    error: null,
  };
}

export function useRoleAccess() {
  const { user } = useAuth();
  
  return {
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isParent: user?.role === 'parent',
  };
}

export function usePermissions() {
  const { isAdmin, isTeacher, isStudent, isParent } = useRoleAccess();
  
  return {
    // User management
    canManageUsers: isAdmin,
    
    // Class management
    canManageClasses: isAdmin || isTeacher,
    
    // Grade management
    canManageGrades: isAdmin || isTeacher,
    canViewGrades: true,
    
    // Schedule management
    canManageSchedule: isAdmin || isTeacher,
    canViewSchedule: true,
    
    // Attendance
    canManageAttendance: isAdmin || isTeacher,
    canViewAttendance: true,
    
    // Fees
    canManageFees: isAdmin,
    canViewFees: true,
    
    // Exams
    canManageExams: isAdmin || isTeacher,
    canViewExams: true,
  };
}
