// Authentication Library for Next.js
// Based on the School Management ERP UI Design Documents

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
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

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

// Real API functions
const api = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    return data.user;
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
  }): Promise<User> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    return data.user;
  },
};

// Create auth store with Zustand
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        
        try {
          const user = await api.login(email, password);
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (userData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role: 'student' | 'teacher' | 'parent' | 'admin';
      }) => {
        set({ loading: true, error: null });
        
        try {
          const user = await api.register(userData);
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Custom hooks for auth
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    loading: store.loading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
    setLoading: store.setLoading,
  };
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

// Server-side auth utilities
export const verifyAuth = async (request: Request): Promise<User | null> => {
  // For server-side auth, you would verify JWT tokens or session cookies
  // This is a placeholder for actual server-side authentication
  const token = request.headers.get('authorization');
  
  if (!token) {
    return null;
  }

  // Mock server-side user verification
  // In production, you would verify the JWT token here
  try {
    // For now, return null - implement actual token verification
    return null;
  } catch (error) {
    return null;
  }
};

export const requireAuth = (user: User | null, requiredRole?: 'student' | 'teacher' | 'parent' | 'admin') => {
  if (!user) {
    throw new Error('Authentication required');
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}`);
  }

  return user;
};

export default useAuth;
