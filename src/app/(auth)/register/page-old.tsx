// Register Page - Next.js App Router
// Based on the School Management ERP UI Design Documents

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Register } from '@/lib/design-system';
import ClientOnly from '@/components/ClientOnly';

export default function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const router = useRouter();
  const [registerError, setRegisterError] = useState('');

  const handleRegister = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
  }) => {
    setRegisterError('');
    clearError();
    
    try {
      await register({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });
      router.push('/dashboard');
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <ClientOnly>
          <Register
            onRegister={handleRegister}
            onLogin={handleLogin}
            loading={loading}
            error={registerError || error || ''}
          />
        </ClientOnly>
      </div>
    </div>
  );
}
