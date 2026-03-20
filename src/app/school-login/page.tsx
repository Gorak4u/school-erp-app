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
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [schoolBranding, setSchoolBranding] = useState({
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',
    customBackground: '',
    schoolMotto: '',
    schoolTagline: '',
    contactInfo: '',
    socialLinks: [] as Array<{ platform: string; url: string; icon: string }>,
    customAnimations: false,
    schoolType: '',
    establishedYear: '',
    totalStudents: '',
    totalTeachers: '',
    achievements: [] as Array<{ title: string; description: string; icon: string }>
  });

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
    
    // First fetch school info with branding
    fetch(`/api/school/by-subdomain?subdomain=${encodeURIComponent(subdomain)}&includeBranding=true`)
      .then(r => r.json())
      .then(schoolData => {
        if (schoolData.school) {
          setSchool(schoolData.school);
          
          // Set comprehensive school branding
          const branding = schoolData.branding || {};
          setSchoolBranding({
            primaryColor: branding.primaryColor || generateSchoolTheme(schoolData.school.name).primaryColor,
            secondaryColor: branding.secondaryColor || generateSchoolTheme(schoolData.school.name).secondaryColor,
            accentColor: branding.accentColor || generateSchoolTheme(schoolData.school.name).accentColor,
            customBackground: branding.customBackground || '',
            schoolMotto: branding.schoolMotto || 'Excellence in Education',
            schoolTagline: branding.schoolTagline || 'Empowering Tomorrow\'s Leaders',
            contactInfo: branding.contactInfo || `${schoolData.school.city || ''}, ${schoolData.school.state || ''}`,
            socialLinks: branding.socialLinks || [],
            customAnimations: branding.customAnimations !== false,
            schoolType: branding.schoolType || 'Educational Institution',
            establishedYear: branding.establishedYear || '',
            totalStudents: branding.totalStudents || '',
            totalTeachers: branding.totalTeachers || '',
            achievements: branding.achievements || []
          });
          
          // Generate enhanced theme from school branding
          const enhancedTheme = {
            ...generateSchoolTheme(schoolData.school.name),
            primaryColor: branding.primaryColor || generateSchoolTheme(schoolData.school.name).primaryColor,
            secondaryColor: branding.secondaryColor || generateSchoolTheme(schoolData.school.name).secondaryColor,
            accentColor: branding.accentColor || generateSchoolTheme(schoolData.school.name).accentColor,
            backgroundColor: branding.customBackground || generateSchoolTheme(schoolData.school.name).backgroundColor
          };
          setTheme(enhancedTheme);
          
          // Try to load custom theme in background (non-blocking)
          getSchoolTheme(subdomain)
            .then(customTheme => {
              if (customTheme.themeType !== 'auto') {
                setTheme({ ...enhancedTheme, ...customTheme });
              }
            })
            .catch(() => {
              console.log('Using enhanced school branding theme');
            });
        } else {
          setSchoolError(schoolData.error || 'School not found');
        }
      })
      .catch(() => setSchoolError('Failed to load school information'))
      .finally(() => setLoadingSchool(false));
  }, [subdomain]);

  // Advanced mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      setMounted(true);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Calculate parallax effect based on mouse position
  const calculateParallax = (depth: number) => {
    if (!mounted) return { x: 0, y: 0 };
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const moveX = (mousePosition.x - centerX) / depth;
    const moveY = (mousePosition.y - centerY) / depth;
    return { x: moveX, y: moveY };
  };

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
    const parallax = calculateParallax(50);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Advanced animated background with school colors */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Floating particles with school colors */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0
              }}
              animate={{
                y: [null, -100, -200],
                opacity: [0, 1, 0],
                x: [null, Math.random() * 100 - 50]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "linear"
              }}
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%'
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="text-center max-w-md relative z-10"
          style={{
            transform: `translateX(${parallax.x}px) translateY(${parallax.y}px)`
          }}
        >
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="text-5xl relative z-10">🏫</span>
              <div className="absolute -inset-1 bg-gradient-to-br from-red-500 to-purple-600 rounded-3xl blur-lg opacity-50 animate-pulse"></div>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            School Not Found
          </motion.h1>
          
          <motion.p 
            className="text-gray-300 mb-6 leading-relaxed text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {schoolError}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mb-6"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-sm text-gray-300 mb-2">Looking for your school?</p>
              <p className="text-xs text-gray-400">Check your school's unique URL or contact your administrator</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg transition-all shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center gap-3">
                <motion.span
                  animate={{ x: [-5, 5, -5] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  ←
                </motion.span>
                <span>Return to main site</span>
                <span className="text-xl">🚀</span>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const schoolName = school?.name || 'School Portal';
  const schoolLocation = [school?.city, school?.state].filter(Boolean).join(', ');
  const parallax = calculateParallax(30);

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ 
        background: theme?.backgroundColor || '#030712',
        minHeight: '100vh'
      }}
    >
      {/* Advanced animated background layers with school branding */}
      <div className="absolute inset-0">
        {/* Base gradient with school colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/10 to-purple-900/20"></div>
        
        {/* School-branded animated gradient orbs */}
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: `linear-gradient(135deg, ${schoolBranding.primaryColor || theme?.gradient || '#3b82f6'} 0%, ${schoolBranding.secondaryColor || theme?.accentColor || '#8b5cf6'} 100%)` }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: schoolBranding.customAnimations ? 20 : 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: schoolBranding.accentColor || theme?.accentColor || '#60a5fa' }}
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: schoolBranding.customAnimations ? 25 : 35,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
        
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: schoolBranding.secondaryColor || theme?.secondaryColor || '#1d4ed8' }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: schoolBranding.customAnimations ? 30 : 40,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
        />
      </div>

      {/* Floating geometric shapes with school colors */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border-2 border-white/5"
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              borderRadius: Math.random() > 0.5 ? '50%' : '10%',
              borderColor: `${schoolBranding.primaryColor || theme?.accentColor || '#3b82f6'}20`
            }}
            animate={{
              rotate: [0, 360],
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: schoolBranding.customAnimations ? 20 + Math.random() * 20 : 30 + Math.random() * 30,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
          />
        ))}
      </div>

      {/* Interactive light effect following mouse with school color */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, ${schoolBranding.primaryColor || theme?.accentColor || 'rgba(59, 130, 246, 0.1)'} 0%, transparent 50%)`
        }}
      />
      {/* Header with comprehensive school branding */}
      <motion.div 
        className="flex-shrink-0 px-6 py-4 border-b backdrop-blur-sm relative z-20"
        style={{
          background: `linear-gradient(135deg, ${schoolBranding.primaryColor || theme?.secondaryColor}20 0%, ${schoolBranding.accentColor || theme?.accentColor}20 100%)`,
          borderColor: `${schoolBranding.accentColor || theme?.accentColor}30`,
          borderWidth: '1px',
          transform: `translateY(${parallax.y * 0.5}px)`
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
          >
            <div className="relative group">
              {school?.logo ? (
                <motion.div 
                  className="w-16 h-16 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 relative"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    boxShadow: `0 0 20px ${schoolBranding.primaryColor || theme?.accentColor}40`
                  }}
                >
                  <img src={school.logo} alt={schoolName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  className="w-16 h-16 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl ring-4 ring-white/20 relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${schoolBranding.primaryColor || theme?.gradient || '#3b82f6'} 0%, ${schoolBranding.secondaryColor || theme?.accentColor || '#1d4ed8'} 100%)`,
                    boxShadow: `0 0 20px ${schoolBranding.primaryColor || theme?.accentColor}40`
                  }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10">{schoolName.charAt(0)}</span>
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </div>
            <div>
              <motion.h1 
                className="font-bold text-xl leading-tight"
                style={{ color: theme?.textColor || '#ffffff' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {loadingSchool ? (
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ borderColor: schoolBranding.primaryColor || theme?.accentColor || '#3b82f6' }}
                    />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    {schoolName}
                  </motion.span>
                )}
              </motion.h1>
              <motion.div className="flex items-center gap-3">
                {schoolLocation && (
                  <motion.p 
                    className="text-sm opacity-80 flex items-center gap-2" 
                    style={{ color: theme?.textColor || '#ffffff' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.8, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      📍
                    </motion.span>
                    {schoolLocation}
                  </motion.p>
                )}
                {schoolBranding.schoolType && (
                  <motion.span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${schoolBranding.primaryColor || theme?.accentColor}20`,
                      color: theme?.textColor || '#ffffff',
                      borderColor: `${schoolBranding.primaryColor || theme?.accentColor}40`,
                      borderWidth: '1px'
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                  >
                    {schoolBranding.schoolType}
                  </motion.span>
                )}
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
            className="flex items-center gap-4"
          >
            {schoolBranding.establishedYear && (
              <motion.span 
                className="hidden sm:block text-xs opacity-80 px-3 py-1 rounded-full border border-white/20"
                style={{ color: theme?.textColor || '#ffffff' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.8, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                Since {schoolBranding.establishedYear}
              </motion.span>
            )}
            <motion.span 
              className="text-xs hidden sm:block opacity-80 px-4 py-2 rounded-full border border-white/30 backdrop-blur-sm font-medium"
              style={{ color: theme?.textColor || '#ffffff' }}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="inline-block mr-2"
              >
                ⚡
              </motion.span>
              Powered by School ERP
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-4 relative z-10"
        style={{
          transform: `translateY(${parallax.y * 0.3}px)`
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateX: 15 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1, type: "spring", stiffness: 100 }}
          className="w-full max-w-md"
          whileHover={{ scale: 1.02 }}
        >
          {mode === 'login' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              className="rounded-3xl p-8 shadow-2xl border backdrop-blur-xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme?.backgroundColor}dd 0%, ${theme?.secondaryColor}dd 100%)`,
                borderColor: `${theme?.accentColor}40`,
                borderWidth: '1px'
              }}
              whileHover={{ 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                borderColor: `${theme?.accentColor}60`
              }}
            >
              {/* Advanced decorative elements */}
              <div className="absolute inset-0">
                <motion.div
                  className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
                  style={{ background: theme?.gradient }}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15"
                  style={{ background: theme?.accentColor }}
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -180, -360]
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 2
                  }}
                />
                {/* Animated grid pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="h-full w-full" style={{
                    backgroundImage: `linear-gradient(${theme?.accentColor}40 1px, transparent 1px), linear-gradient(90deg, ${theme?.accentColor}40 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>
              </div>
              
              {/* Floating particles inside card */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/40 rounded-full"
                    animate={{
                      y: [0, -20, 0],
                      x: [0, Math.random() * 20 - 10, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                      ease: "easeInOut"
                    }}
                    style={{
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%'
                    }}
                  />
                ))}
              </div>
              
              {/* Title with school branding */}
              <div className="text-center mb-8 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                >
                  <motion.div
                    className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl relative overflow-hidden"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: `linear-gradient(135deg, ${schoolBranding.primaryColor || '#3b82f6'} 0%, ${schoolBranding.secondaryColor || '#8b5cf6'} 50%, ${schoolBranding.accentColor || '#ec4899'} 100%)`,
                      boxShadow: `0 0 30px ${schoolBranding.primaryColor || '#3b82f6'}40`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                    <motion.span 
                      className="text-4xl relative z-10"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🔐
                    </motion.span>
                    <motion.div
                      className="absolute -inset-2 rounded-3xl blur-xl opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${schoolBranding.primaryColor || '#3b82f6'}, ${schoolBranding.accentColor || '#ec4899'})`
                      }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                  
                  <motion.h2 
                    className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    Welcome Back
                  </motion.h2>
                  
                  {schoolBranding.schoolMotto && (
                    <motion.p 
                      className="text-base font-medium mb-2 italic opacity-90"
                      style={{ color: schoolBranding.accentColor || theme?.textColor || '#ffffff' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 0.9, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.6 }}
                    >
                      "{schoolBranding.schoolMotto}"
                    </motion.p>
                  )}
                  
                  <motion.p 
                    className="text-base opacity-80" 
                    style={{ color: theme?.textColor || '#ffffff' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.8, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                  >
                    {loadingSchool ? 'Loading school...' : `Sign in to ${schoolName}`}
                  </motion.p>
                  
                  {schoolBranding.schoolTagline && (
                    <motion.p 
                      className="text-sm opacity-70 mt-2"
                      style={{ color: theme?.textColor || '#ffffff' }}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 0.7, y: 0 }}
                      transition={{ delay: 1.1, duration: 0.6 }}
                    >
                      {schoolBranding.schoolTagline}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
                >
                  <motion.label 
                    className="block text-sm font-bold mb-3 flex items-center gap-2"
                    style={{ color: theme?.textColor || '#ffffff' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      📧
                    </motion.span>
                    Email or Employee ID
                  </motion.label>
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="Enter your email or Employee ID (e.g., TCH0001)"
                      className="w-full px-5 py-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all pr-14 shadow-lg"
                      style={{
                        backgroundColor: `${theme?.inputBackgroundColor}80`,
                        borderColor: theme?.inputBorderColor,
                        borderWidth: '1px'
                      }}
                      whileFocus={{ 
                        scale: 1.02,
                        boxShadow: `0 0 0 4px ${theme?.inputFocusColor}40`
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme?.inputFocusColor || '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme?.inputBorderColor || '#6b7280';
                      }}
                    />
                    <motion.div 
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-60"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                    >
                      <span className="text-lg">👤</span>
                    </motion.div>
                    {/* Animated input border with school colors */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg, ${schoolBranding.primaryColor || theme?.inputFocusColor || '#3b82f6'}, ${schoolBranding.accentColor || theme?.accentColor || '#60a5fa'}, ${schoolBranding.primaryColor || theme?.inputFocusColor || '#3b82f6'})`,
                        backgroundSize: '200% 100%',
                        opacity: 0
                      }}
                      whileFocus={{ opacity: 1 }}
                      animate={{
                        backgroundPosition: ['0% 50%', '200% 50%']
                      }}
                      transition={{
                        duration: schoolBranding.customAnimations ? 3 : 4,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
                >
                  <motion.label 
                    className="block text-sm font-bold mb-3 flex items-center gap-2"
                    style={{ color: theme?.textColor || '#ffffff' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                  >
                    <motion.span
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🔒
                    </motion.span>
                    Password
                  </motion.label>
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full px-5 py-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all pr-14 shadow-lg"
                      style={{
                        backgroundColor: `${theme?.inputBackgroundColor}80`,
                        borderColor: theme?.inputBorderColor,
                        borderWidth: '1px'
                      }}
                      whileFocus={{ 
                        scale: 1.02,
                        boxShadow: `0 0 0 4px ${theme?.inputFocusColor}40`
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme?.inputFocusColor || '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme?.inputBorderColor || '#6b7280';
                      }}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-all"
                      style={{ color: theme?.textColor || '#ffffff' }}
                      whileHover={{ scale: 1.2, rotate: showPassword ? 180 : 0 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </motion.button>
                    {/* Animated input border with school colors */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg, ${schoolBranding.primaryColor || theme?.inputFocusColor || '#3b82f6'}, ${schoolBranding.accentColor || theme?.accentColor || '#60a5fa'}, ${schoolBranding.primaryColor || theme?.inputFocusColor || '#3b82f6'})`,
                        backgroundSize: '200% 100%',
                        opacity: 0
                      }}
                      whileFocus={{ opacity: 1 }}
                      animate={{
                        backgroundPosition: ['0% 50%', '200% 50%']
                      }}
                      transition={{
                        duration: schoolBranding.customAnimations ? 3 : 4,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
                  className="flex justify-end"
                >
                  <motion.button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-sm font-bold transition-all flex items-center gap-2 group"
                    style={{ color: theme?.accentColor || '#60a5fa' }}
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      ❓
                    </motion.span>
                    <span className="group-hover:underline">Forgot password?</span>
                  </motion.button>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                    className="rounded-2xl px-4 py-4 text-sm border backdrop-blur-sm flex items-center gap-3 shadow-lg"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      borderColor: 'rgba(239, 68, 68, 0.5)',
                      color: '#f87171'
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: 2, ease: "easeInOut" }}
                    >
                      <span className="text-xl">⚠️</span>
                    </motion.div>
                    <span className="font-medium">{error}</span>
                    <motion.div
                      className="ml-auto w-2 h-2 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1, type: "spring", stiffness: 100 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 font-bold rounded-2xl transition-all disabled:cursor-not-allowed shadow-2xl relative overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${schoolBranding.primaryColor || theme?.gradient || '#3b82f6'} 0%, ${schoolBranding.secondaryColor || theme?.accentColor || '#1d4ed8'} 100%)`,
                    color: theme?.textColor || '#ffffff',
                    opacity: isLoading ? 0.7 : 1,
                    boxShadow: `0 10px 30px -10px ${schoolBranding.primaryColor || '#3b82f6'}50`
                  }}
                  whileHover={{ 
                    scale: !isLoading ? 1.03 : 1,
                    boxShadow: `0 20px 40px -15px ${schoolBranding.primaryColor || '#3b82f6'}70`
                  }}
                  whileTap={{ scale: !isLoading ? 0.98 : 1 }}
                >
                  {/* Advanced shimmer effect with school colors */}
                  <div className="absolute inset-0">
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${schoolBranding.accentColor || '#ffffff'}40, transparent)`
                      }}
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: schoolBranding.customAnimations ? 0.8 : 1, ease: "easeInOut" }}
                    />
                  </div>
                  
                  {/* Pulsing glow effect with school colors */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${schoolBranding.accentColor || theme?.accentColor || '#60a5fa'}, transparent)`,
                      opacity: 0
                    }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: schoolBranding.customAnimations ? 2 : 3, repeat: Infinity }}
                  />
                  
                  <div className="relative flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={{ borderColor: schoolBranding.accentColor || '#ffffff' }}
                        />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          🚀
                        </motion.span>
                        <span>Sign In</span>
                        <motion.div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: schoolBranding.accentColor || '#ffffff' }}
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                        />
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

          {/* Footer with comprehensive school branding */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, type: "spring", stiffness: 100 }}
            className="text-center"
            style={{
              transform: `translateY(${parallax.y * 0.2}px)`
            }}
          >
            {/* School achievements showcase */}
            {schoolBranding.achievements && schoolBranding.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="mb-6"
              >
                <div className="flex flex-wrap justify-center gap-3">
                  {schoolBranding.achievements.slice(0, 3).map((achievement, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-sm"
                      style={{
                        background: `${schoolBranding.primaryColor || theme?.accentColor}10`,
                        borderColor: `${schoolBranding.primaryColor || theme?.accentColor}30`,
                        color: theme?.textColor || '#ffffff'
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4 + index * 0.1, duration: 0.6 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-sm">{achievement.icon}</span>
                      <span className="text-xs font-medium">{achievement.title}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* School stats */}
            {(schoolBranding.totalStudents || schoolBranding.totalTeachers) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="mb-6"
              >
                <div className="flex justify-center gap-6 text-sm">
                  {schoolBranding.totalStudents && (
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span className="opacity-80">{schoolBranding.totalStudents} Students</span>
                    </div>
                  )}
                  {schoolBranding.totalTeachers && (
                    <div className="flex items-center gap-2">
                      <span>👨‍🏫</span>
                      <span className="opacity-80">{schoolBranding.totalTeachers} Teachers</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Main footer content */}
            <motion.div 
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/20 backdrop-blur-xl shadow-2xl group"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: `${schoolBranding.accentColor || theme?.accentColor}30`
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: `0 10px 30px -10px ${schoolBranding.primaryColor || '#3b82f6'}30`,
                borderColor: `${schoolBranding.accentColor || theme?.accentColor}60`
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="text-lg"
              >
                💡
              </motion.div>
              <span className="text-xs opacity-80" style={{ color: theme?.textColor || '#ffffff' }}>
                Having trouble?
              </span>
              <motion.div 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: schoolBranding.accentColor || theme?.accentColor || '#60a5fa' }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-bold" style={{ color: schoolBranding.accentColor || theme?.accentColor || '#60a5fa' }}>
                Contact your school administrator
              </span>
              
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-0"
                style={{
                  background: `radial-gradient(circle at center, ${schoolBranding.primaryColor || theme?.accentColor || '#3b82f6'}40 0%, transparent 70%)`
                }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>

            {/* Social links */}
            {schoolBranding.socialLinks && schoolBranding.socialLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7, duration: 0.6 }}
                className="mt-4"
              >
                <div className="flex justify-center gap-3">
                  {schoolBranding.socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
                      style={{
                        background: `${schoolBranding.primaryColor || theme?.accentColor}10`
                      }}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="text-sm">{social.icon}</span>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function SchoolLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
        {/* Animated background with school colors */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -180, -360]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
              delay: 5
            }}
          />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              animate={{
                y: [null, -150, -300],
                opacity: [0, 1, 0],
                x: [null, Math.random() * 100 - 50]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "linear"
              }}
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%'
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, type: "spring", stiffness: 100 }}
          className="text-center relative z-10"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl relative overflow-hidden"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
            <motion.div
              className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-pink-500 rounded-3xl blur-xl opacity-50"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          <motion.p 
            className="text-gray-300 text-lg font-medium animate-pulse"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading School Portal...
          </motion.p>
          
          {/* School-specific loading message */}
          <motion.p 
            className="text-gray-400 text-sm mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Preparing your personalized experience
          </motion.p>
          
          {/* Loading dots */}
          <div className="flex justify-center gap-2 mt-4">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    }>
      <SchoolLoginInner />
    </Suspense>
  );
}
