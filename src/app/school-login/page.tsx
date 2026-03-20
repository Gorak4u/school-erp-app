'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { getSchoolTheme, type SchoolTheme } from '@/lib/school-theme';

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
    inputFocusColor,
    themeType: 'auto'
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

  // Fetch school info and theme when subdomain is resolved
  useEffect(() => {
    if (!subdomain) return;
    setLoadingSchool(true);
    
    // First fetch school info
    fetch(`/api/school/by-subdomain?subdomain=${encodeURIComponent(subdomain)}`)
      .then(r => r.json())
      .then(schoolData => {
        if (schoolData.school) {
          setSchool(schoolData.school);
          // Generate theme from school name (reliable fallback)
          const fallbackTheme = generateSchoolTheme(schoolData.school.name);
          setTheme(fallbackTheme);
          
          // Try to load custom theme in background (non-blocking)
          getSchoolTheme(subdomain)
            .then(customTheme => {
              if (customTheme.themeType !== 'auto') {
                setTheme(customTheme);
              }
            })
            .catch(() => {
              // Silently fail, keep using fallback theme
              console.log('Using auto-generated theme for school');
            });
        } else {
          setSchoolError(schoolData.error || 'School not found');
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🏫</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
              School Not Found
            </h1>
            <p className="text-gray-400 mb-8 leading-relaxed">{schoolError}</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all transform hover:scale-105 shadow-lg"
            >
              <span>←</span>
              Return to main site
            </Link>
          </div>
        </motion.div>
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
        className="flex-shrink-0 px-6 py-4 border-b backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, ${theme?.secondaryColor}20 0%, ${theme?.accentColor}20 100%)`,
          borderColor: `${theme?.accentColor}30`,
          borderWidth: '1px'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              {school?.logo ? (
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/10">
                  <img src={school.logo} alt={schoolName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white/10"
                  style={{ background: theme?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                >
                  {schoolName.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 
                className="font-bold text-lg leading-tight"
                style={{ color: theme?.textColor || '#ffffff' }}
              >
                {loadingSchool ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Loading...
                  </div>
                ) : schoolName}
              </h1>
              {schoolLocation && (
                <p className="text-xs opacity-70 flex items-center gap-1" style={{ color: theme?.textColor || '#ffffff' }}>
                  <span>📍</span>
                  {schoolLocation}
                </p>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs hidden sm:block opacity-60 px-3 py-1 rounded-full border border-white/20" style={{ color: theme?.textColor || '#ffffff' }}>
              ⚡ Powered by School ERP
            </span>
          </motion.div>
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
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl p-8 shadow-2xl border backdrop-blur-xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme?.backgroundColor}dd 0%, ${theme?.secondaryColor}dd 100%)`,
                borderColor: `${theme?.accentColor}40`,
                borderWidth: '1px'
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ background: theme?.gradient }}
              ></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
                style={{ background: theme?.accentColor }}
              ></div>
              
              {/* Title */}
              <div className="text-center mb-8 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <h2 
                    className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent"
                  >
                    Welcome Back
                  </h2>
                  <p className="text-sm opacity-80" style={{ color: theme?.textColor || '#ffffff' }}>
                    {loadingSchool ? 'Loading school...' : `Sign in to ${schoolName}`}
                  </p>
                </motion.div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <label 
                    className="block text-sm font-semibold mb-2 flex items-center gap-2"
                    style={{ color: theme?.textColor || '#ffffff' }}
                  >
                    <span>📧</span>
                    Email or Employee ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="Enter your email or Employee ID (e.g., TCH0001)"
                      className="w-full px-4 py-3.5 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all pr-12 shadow-lg"
                      style={{
                        backgroundColor: `${theme?.inputBackgroundColor}80`,
                        borderColor: theme?.inputBorderColor,
                        borderWidth: '1px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme?.inputFocusColor || '#3b82f6';
                        e.target.style.boxShadow = `0 0 0 3px ${theme?.inputFocusColor}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme?.inputBorderColor || '#6b7280';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-50">
                      <span className="text-sm">👤</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <label 
                    className="block text-sm font-semibold mb-2 flex items-center gap-2"
                    style={{ color: theme?.textColor || '#ffffff' }}
                  >
                    <span>🔒</span>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full px-4 py-3.5 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all pr-12 shadow-lg"
                      style={{
                        backgroundColor: `${theme?.inputBackgroundColor}80`,
                        borderColor: theme?.inputBorderColor,
                        borderWidth: '1px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme?.inputFocusColor || '#3b82f6';
                        e.target.style.boxShadow = `0 0 0 3px ${theme?.inputFocusColor}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme?.inputBorderColor || '#6b7280';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-all hover:scale-110"
                      style={{ color: theme?.textColor || '#ffffff' }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex justify-end"
                >
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-sm font-medium transition-all hover:scale-105 flex items-center gap-1"
                    style={{ color: theme?.accentColor || '#60a5fa' }}
                  >
                    <span>❓</span>
                    Forgot password?
                  </button>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl px-4 py-3.5 text-sm border backdrop-blur-sm flex items-center gap-3"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      color: '#f87171'
                    }}
                  >
                    <span className="text-lg">⚠️</span>
                    <span>{error}</span>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 font-bold rounded-2xl transition-all disabled:cursor-not-allowed shadow-lg relative overflow-hidden group"
                  style={{
                    background: theme?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: theme?.textColor || '#ffffff',
                    opacity: isLoading ? 0.7 : 1
                  }}
                  whileHover={{ scale: !isLoading ? 1.02 : 1 }}
                  whileTap={{ scale: !isLoading ? 0.98 : 1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        Sign In
                      </>
                    )}
                  </div>
                </motion.button>
              </form>
            </motion.div>
          ) : (
            /* Forgot Password */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl p-8 shadow-2xl border backdrop-blur-xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme?.backgroundColor}dd 0%, ${theme?.secondaryColor}dd 100%)`,
                borderColor: `${theme?.accentColor}40`,
                borderWidth: '1px'
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ background: theme?.gradient }}
              ></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
                style={{ background: theme?.accentColor }}
              ></div>
              
              <div className="text-center mb-8 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🔑</span>
                  </div>
                  <h2 
                    className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent"
                  >
                    Reset Password
                  </h2>
                  <p className="text-sm opacity-80" style={{ color: theme?.textColor || '#ffffff' }}>
                    Enter your email to receive a reset link
                  </p>
                </motion.div>
              </div>

              {forgotSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center relative z-10"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <span className="text-2xl">📧</span>
                  </div>
                  <p className="font-bold text-lg mb-2 text-green-400">Reset email sent!</p>
                  <p className="text-sm mb-6 opacity-80" style={{ color: theme?.textColor || '#ffffff' }}>
                    Check your inbox for the password reset link.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setMode('login'); setForgotSent(false); setEmail(''); }}
                    className="font-medium transition-all flex items-center gap-2 mx-auto"
                    style={{ color: theme?.accentColor || '#60a5fa' }}
                  >
                    <span>←</span>
                    Back to sign in
                  </motion.button>
                </motion.div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5 relative z-10">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <label 
                      className="block text-sm font-semibold mb-2 flex items-center gap-2"
                      style={{ color: theme?.textColor || '#ffffff' }}
                    >
                      <span>📧</span>
                      Email or Employee ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoFocus
                        placeholder="Enter your email or Employee ID (e.g., TCH0001)"
                        className="w-full px-4 py-3.5 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all pr-12 shadow-lg"
                        style={{
                          backgroundColor: `${theme?.inputBackgroundColor}80`,
                          borderColor: theme?.inputBorderColor,
                          borderWidth: '1px'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = theme?.inputFocusColor || '#3b82f6';
                          e.target.style.boxShadow = `0 0 0 3px ${theme?.inputFocusColor}20`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = theme?.inputBorderColor || '#6b7280';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-50">
                        <span className="text-sm">👤</span>
                      </div>
                    </div>
                  </motion.div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl px-4 py-3.5 text-sm border backdrop-blur-sm flex items-center gap-3"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        color: '#f87171'
                      }}
                    >
                      <span className="text-lg">⚠️</span>
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 font-bold rounded-2xl transition-all disabled:cursor-not-allowed shadow-lg relative overflow-hidden group"
                    style={{
                      background: theme?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: theme?.textColor || '#ffffff',
                      opacity: isLoading ? 0.7 : 1
                    }}
                    whileHover={{ scale: !isLoading ? 1.02 : 1 }}
                    whileTap={{ scale: !isLoading ? 0.98 : 1 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <div className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <span>📤</span>
                          Send Reset Link
                        </>
                      )}
                    </div>
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="w-full text-center text-sm font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
                    style={{ 
                      color: theme?.textColor || '#ffffff',
                      opacity: 0.7
                    }}
                  >
                    <span>←</span>
                    Back to sign in
                  </motion.button>
                </form>
              )}
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="text-xs opacity-60" style={{ color: theme?.textColor || '#ffffff' }}>
                💡 Having trouble? 
              </span>
              <span className="text-xs font-medium" style={{ color: theme?.accentColor || '#60a5fa' }}>
                Contact your school administrator
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SchoolLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 animate-pulse">Loading School Portal...</p>
        </motion.div>
      </div>
    }>
      <SchoolLoginInner />
    </Suspense>
  );
}
