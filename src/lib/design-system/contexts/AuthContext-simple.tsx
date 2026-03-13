// Authentication Context - Simple Version
// Based on the School Management ERP UI Design Documents

'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

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

export interface AuthContextType extends AuthState {
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
}

// Auth Actions
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Mock API functions (replace with real API calls)
const mockApi = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    if (email === 'admin@schoolerp.com' && password === 'admin123') {
      return {
        id: '1',
        email: 'admin@schoolerp.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        schoolId: 'school1',
      };
    }
    
    if (email === 'teacher@schoolerp.com' && password === 'teacher123') {
      return {
        id: '2',
        email: 'teacher@schoolerp.com',
        firstName: 'Teacher',
        lastName: 'User',
        role: 'teacher',
        schoolId: 'school1',
      };
    }
    
    if (email === 'student@schoolerp.com' && password === 'student123') {
      return {
        id: '3',
        email: 'student@schoolerp.com',
        firstName: 'Student',
        lastName: 'User',
        role: 'student',
        schoolId: 'school1',
        classId: 'class1',
        grade: '10',
      };
    }
    
    if (email === 'parent@schoolerp.com' && password === 'parent123') {
      return {
        id: '4',
        email: 'parent@schoolerp.com',
        firstName: 'Parent',
        lastName: 'User',
        role: 'parent',
        schoolId: 'school1',
      };
    }
    
    throw new Error('Invalid email or password');
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
  }): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user creation
    return {
      id: Math.random().toString(36).substr(2, 9),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      schoolId: 'school1',
      ...(userData.role === 'student' && {
        classId: 'class1',
        grade: '10',
      }),
    };
  },
};

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch (error) {
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const user = await mockApi.login(email, password);
      localStorage.setItem('authUser', JSON.stringify(user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Register function
  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
  }): Promise<void> => {
    dispatch({ type: 'REGISTER_START' });
    
    try {
      const user = await mockApi.register(userData);
      localStorage.setItem('authUser', JSON.stringify(user));
      dispatch({ type: 'REGISTER_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('authUser');
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { auth: AuthContextType }> => {
  return (props) => {
    const auth = useAuth();
    return <Component {...props} auth={auth} />;
  };
};

export default AuthContext;
