'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

interface SchoolInfo {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo: string | null;
  city: string | null;
  state: string | null;
}

function SchoolLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subdomain, setSubdomain] = useState('');
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [schoolError, setSchoolError] = useState('');
  const [loadingSchool, setLoadingSchool] = useState(false);

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Resolve subdomain: from URL param or from hostname
  useEffect(() => {
    const paramSubdomain = searchParams.get('subdomain');
    const hostnameSubdomain = (() => {
      if (typeof window === 'undefined') return '';
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') return '';
      if (host.endsWith('.localhost')) return host.replace('.localhost', '');
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
      if (host.endsWith(`.${appDomain}`)) return host.replace(`.${appDomain}`, '');
      return '';
    })();

    const resolved = paramSubdomain || hostnameSubdomain;
    if (resolved) {
      setSubdomain(resolved);
    }
  }, [searchParams]);

  // Fetch school info when subdomain is resolved
  useEffect(() => {
    if (!subdomain) return;
    setLoadingSchool(true);
    fetch(`/api/school/by-subdomain?subdomain=${encodeURIComponent(subdomain)}`)
      .then(r => r.json())
      .then(data => {
        if (data.school) {
          setSchool(data.school);
        } else {
          setSchoolError(data.error || 'School not found');
        }
      })
      .catch(() => setSchoolError('Failed to load school information'))
      .finally(() => setLoadingSchool(false));
  }, [subdomain]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else if (result?.ok) {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        if (session?.user?.isSuperAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('An error occurred. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setForgotSent(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send reset email');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid subdomain screen
  if (!loadingSchool && subdomain && schoolError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🏫</div>
          <h1 className="text-2xl font-bold text-white mb-2">School Not Found</h1>
          <p className="text-gray-400 mb-6">{schoolError}</p>
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            Return to main site
          </Link>
        </div>
      </div>
    );
  }

  const schoolName = school?.name || 'School Portal';
  const schoolLocation = [school?.city, school?.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {school?.logo ? (
              <img src={school.logo} alt={schoolName} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {schoolName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-white font-semibold text-base leading-tight">
                {loadingSchool ? 'Loading...' : schoolName}
              </h1>
              {schoolLocation && (
                <p className="text-gray-400 text-xs">{schoolLocation}</p>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-500 hidden sm:block">Powered by School ERP</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {mode === 'login' ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
              {/* Title */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {loadingSchool ? 'Loading school...' : `Sign in to ${schoolName}`}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          ) : (
            /* Forgot Password */
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔑</div>
                <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Enter your email to receive a reset link
                </p>
              </div>

              {forgotSent ? (
                <div className="text-center">
                  <div className="text-4xl mb-3">📧</div>
                  <p className="text-green-400 font-medium mb-2">Reset email sent!</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Check your inbox for the password reset link.
                  </p>
                  <button
                    onClick={() => { setMode('login'); setForgotSent(false); setEmail(''); }}
                    className="text-blue-400 hover:underline text-sm"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-xl transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="w-full text-center text-sm text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-600 mt-6">
            Having trouble? Contact your school administrator.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SchoolLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    }>
      <SchoolLoginInner />
    </Suspense>
  );
}
