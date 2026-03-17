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
  isActive: boolean;
}

interface SchoolTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  gradient: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputFocusColor: string;
}

// Generate unique theme colors based on school name
function generateSchoolTheme(schoolName: string): SchoolTheme {
  // Generate hash from school name for consistent colors
  let hash = 0;
  for (let i = 0; i < schoolName.length; i++) {
    hash = schoolName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate hue value (0-360)
  const hue = Math.abs(hash % 360);
  
  // Generate complementary colors
  const primaryHue = hue;
  const secondaryHue = (hue + 120) % 360;
  const accentHue = (hue + 240) % 360;
  
  // Generate colors with improved contrast and visibility
  const primaryColor = `hsl(${primaryHue}, 70%, 55%)`;
  const secondaryColor = `hsl(${secondaryHue}, 65%, 50%)`;
  const accentColor = `hsl(${accentHue}, 75%, 60%)`;
  
  // Lighter background with subtle gradient
  const backgroundGradient = `linear-gradient(135deg, 
    hsl(${primaryHue}, 30%, 8%) 0%, 
    hsl(${secondaryHue}, 25%, 12%) 50%, 
    hsl(${primaryHue}, 20%, 6%) 100%
  )`;
  
  // Light input colors for better visibility
  const inputBackgroundColor = `hsl(${primaryHue}, 15%, 25%)`;
  const inputBorderColor = `hsl(${primaryHue}, 40%, 40%)`;
  const inputFocusColor = `hsl(${accentHue}, 65%, 55%)`;
  
  const textColor = '#ffffff';
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  
  return {
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor: backgroundGradient,
    textColor,
    gradient,
    inputBackgroundColor,
    inputBorderColor,
    inputFocusColor
  };
}

function SchoolLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subdomain, setSubdomain] = useState('');
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [schoolError, setSchoolError] = useState('');
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [theme, setTheme] = useState<SchoolTheme | null>(null);

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
          // Generate unique theme for this school
          const schoolTheme = generateSchoolTheme(data.school.name);
          setTheme(schoolTheme);
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
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        background: theme?.backgroundColor || '#030712',
        minHeight: '100vh'
      }}
    >
      {/* Header */}
      <div 
        className="flex-shrink-0 px-6 py-4 border-b"
        style={{
          backgroundColor: theme?.secondaryColor || '#1f2937',
          borderColor: theme?.accentColor || '#374151',
          borderWidth: '1px'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {school?.logo ? (
              <img src={school.logo} alt={schoolName} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div 
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ background: theme?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
              >
                {schoolName.charAt(0)}
              </div>
            )}
            <div>
              <h1 
                className="font-semibold text-base leading-tight"
                style={{ color: theme?.textColor || '#ffffff' }}
              >
                {loadingSchool ? 'Loading...' : schoolName}
              </h1>
              {schoolLocation && (
                <p className="text-xs opacity-70" style={{ color: theme?.textColor || '#ffffff' }}>
                  {schoolLocation}
                </p>
              )}
            </div>
          </div>
          <span className="text-xs hidden sm:block opacity-60" style={{ color: theme?.textColor || '#ffffff' }}>
            Powered by School ERP
          </span>
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
            <div 
              className="rounded-2xl p-8 shadow-2xl border"
              style={{
                backgroundColor: theme?.backgroundColor || '#1f2937',
                borderColor: theme?.secondaryColor || '#374151',
                borderWidth: '1px'
              }}
            >
              {/* Title */}
              <div className="text-center mb-8">
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: theme?.textColor || '#ffffff' }}
                >
                  Welcome Back
                </h2>
                <p className="text-sm mt-1 opacity-80" style={{ color: theme?.textColor || '#ffffff' }}>
                  {loadingSchool ? 'Loading school...' : `Sign in to ${schoolName}`}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme?.textColor || '#ffffff' }}
                  >
                    Email or Employee ID
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter your email or Employee ID (e.g., TCH0001)"
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none transition-all pr-12"
                    style={{
                      backgroundColor: theme?.inputBackgroundColor || '#374151',
                      borderColor: theme?.inputBorderColor || '#6b7280',
                      borderWidth: '1px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = theme?.inputFocusColor || '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = theme?.inputBorderColor || '#6b7280';
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme?.textColor || '#ffffff' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none transition-all pr-12"
                      style={{
                        backgroundColor: theme?.inputBackgroundColor || '#374151',
                        borderColor: theme?.inputBorderColor || '#6b7280',
                        borderWidth: '1px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme?.inputFocusColor || '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme?.inputBorderColor || '#6b7280';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: theme?.textColor || '#ffffff' }}
                    >
                      {showPassword ? '�️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-sm transition-colors"
                    style={{ color: theme?.accentColor || '#60a5fa' }}
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="rounded-lg px-4 py-3 text-sm border"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#f87171'
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
                  style={{
                    background: theme?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: theme?.textColor || '#ffffff',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          ) : (
            /* Forgot Password */
            <div 
              className="rounded-2xl p-8 shadow-2xl border"
              style={{
                backgroundColor: theme?.backgroundColor || '#1f2937',
                borderColor: theme?.secondaryColor || '#374151',
                borderWidth: '1px'
              }}
            >
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔑</div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: theme?.textColor || '#ffffff' }}
                >
                  Reset Password
                </h2>
                <p className="text-sm mt-1 opacity-80" style={{ color: theme?.textColor || '#ffffff' }}>
                  Enter your email to receive a reset link
                </p>
              </div>

              {forgotSent ? (
                <div className="text-center">
                  <div className="text-4xl mb-3">📧</div>
                  <p className="font-medium mb-2" style={{ color: '#4ade80' }}>Reset email sent!</p>
                  <p className="text-sm mb-6 opacity-80" style={{ color: theme?.textColor || '#ffffff' }}>
                    Check your inbox for the password reset link.
                  </p>
                  <button
                    onClick={() => { setMode('login'); setForgotSent(false); setEmail(''); }}
                    className="text-sm transition-colors"
                    style={{ color: theme?.accentColor || '#60a5fa' }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme?.textColor || '#ffffff' }}
                    >
                      Email or Employee ID
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="Enter your email or Employee ID (e.g., TCH0001)"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none transition-all"
                      style={{
                        backgroundColor: theme?.inputBackgroundColor || '#374151',
                        borderColor: theme?.inputBorderColor || '#6b7280',
                        borderWidth: '1px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme?.inputFocusColor || '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme?.inputBorderColor || '#6b7280';
                      }}
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg px-4 py-3 text-sm border"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        color: '#f87171'
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
                    style={{
                      background: theme?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: theme?.textColor || '#ffffff',
                      opacity: isLoading ? 0.7 : 1
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="w-full text-center text-sm transition-colors"
                    style={{ 
                      color: theme?.textColor || '#ffffff',
                      opacity: 0.7
                    }}
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
