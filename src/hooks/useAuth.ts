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
}

export function useAuth() {
  const { data: session, status } = useSession();
  
  const user: User | null = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || '',
    lastName: session.user.lastName || '',
    role: session.user.role as any || 'student',
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
