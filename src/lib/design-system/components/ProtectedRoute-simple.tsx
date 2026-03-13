// Protected Route Component - Simple Version
// Based on the School Management ERP UI Design Documents

'use client';

import React from 'react';
import { useAuth, User } from '../contexts/AuthContext-simple';
import { Button } from './Button-simple';
import { colors } from '../tokens/colors-simple';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'parent' | 'admin';
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return fallback || <LoginPrompt />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return <AccessDenied requiredRole={requiredRole} userRole={user?.role} />;
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

// Loading Spinner Component
const LoadingSpinner: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: colors.neutral[50],
  };

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: `4px solid ${colors.neutral[200]}`,
    borderTop: `4px solid ${colors.primary[500]}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Login Prompt Component
const LoginPrompt: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: colors.neutral[50],
    padding: '2rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '4rem',
    marginBottom: '1rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: '0.5rem',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: colors.neutral[600],
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>🔒</div>
        <h2 style={titleStyle}>Authentication Required</h2>
        <p style={messageStyle}>
          Please sign in to access this content. You'll need to authenticate to continue.
        </p>
        <Button variant="primary" onClick={() => window.location.href = '/login'}>
          Sign In
        </Button>
      </div>
    </div>
  );
};

// Access Denied Component
const AccessDenied: React.FC<{
  requiredRole: string;
  userRole?: string;
}> = ({ requiredRole, userRole }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: colors.neutral[50],
    padding: '2rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '4rem',
    marginBottom: '1rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: colors.error[700],
    marginBottom: '0.5rem',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: colors.neutral[600],
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  };

  const detailsStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: colors.neutral[500],
    marginBottom: '1.5rem',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>🚫</div>
        <h2 style={titleStyle}>Access Denied</h2>
        <p style={messageStyle}>
          You don't have permission to access this content.
        </p>
        <div style={detailsStyle}>
          <p><strong>Required Role:</strong> {requiredRole}</p>
          {userRole && <p><strong>Your Role:</strong> {userRole}</p>}
        </div>
        <Button 
          variant="primary" 
          onClick={() => window.location.href = '/dashboard'}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

// Role-based access control hook
export const useRoleAccess = () => {
  const { user } = useAuth();

  const hasRole = (role: 'student' | 'teacher' | 'parent' | 'admin'): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: ('student' | 'teacher' | 'parent' | 'admin')[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isTeacher = (): boolean => hasRole('teacher');
  const isStudent = (): boolean => hasRole('student');
  const isParent = (): boolean => hasRole('parent');

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
  };
};

// Permission-based access control hook
export const usePermissions = () => {
  const { user } = useAuth();

  const canViewDashboard = (): boolean => {
    return !!user; // All authenticated users can view dashboard
  };

  const canManageUsers = (): boolean => {
    return user?.role === 'admin';
  };

  const canManageClasses = (): boolean => {
    return user?.role === 'admin' || user?.role === 'teacher';
  };

  const canManageGrades = (): boolean => {
    return user?.role === 'admin' || user?.role === 'teacher';
  };

  const canViewGrades = (): boolean => {
    return user?.role === 'student' || user?.role === 'parent' || user?.role === 'teacher' || user?.role === 'admin';
  };

  const canManageSchedule = (): boolean => {
    return user?.role === 'admin' || user?.role === 'teacher';
  };

  const canViewSchedule = (): boolean => {
    return !!user; // All authenticated users can view schedule
  };

  const canManageAttendance = (): boolean => {
    return user?.role === 'admin' || user?.role === 'teacher';
  };

  const canViewAttendance = (): boolean => {
    return user?.role === 'student' || user?.role === 'parent' || user?.role === 'teacher' || user?.role === 'admin';
  };

  return {
    user,
    canViewDashboard,
    canManageUsers,
    canManageClasses,
    canManageGrades,
    canViewGrades,
    canManageSchedule,
    canViewSchedule,
    canManageAttendance,
    canViewAttendance,
  };
};

export default ProtectedRoute;
