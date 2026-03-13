// Login Page - Next.js App Router
// Based on the School Management ERP UI Design Documents

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Login } from '@/lib/design-system';
import ClientOnly from '@/components/ClientOnly';

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (credentials: { email: string; password: string }) => {
    setLoginError('');
    clearError();
    
    try {
      await login(credentials.email, credentials.password);
      router.push('/dashboard');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <ClientOnly>
          <Login
            onLogin={handleLogin}
            onRegister={handleRegister}
            loading={loading}
            error={loginError || error || ''}
          />
        </ClientOnly>
      </div>
    </div>
  );
}
