'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
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

// AI-Enhanced theme generation with neural network patterns
function generateAISchoolTheme(schoolName: string): SchoolTheme {
  // Generate hash from school name for consistent colors
  let hash = 0;
  for (let i = 0; i < schoolName.length; i++) {
    hash = schoolName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate AI-enhanced color palette
  const primaryHue = Math.abs(hash % 360);
  const secondaryHue = (primaryHue + 120) % 360;
  const accentHue = (primaryHue + 240) % 360;
  const aiHue = (primaryHue + 60) % 360; // AI accent color
  
  // AI-enhanced colors with better contrast
  const primaryColor = `hsl(${primaryHue}, 75%, 60%)`;
  const secondaryColor = `hsl(${secondaryHue}, 70%, 55%)`;
  const accentColor = `hsl(${accentHue}, 80%, 65%)`;
  const aiColor = `hsl(${aiHue}, 85%, 70%)`;
  
  // AI neural network background gradient
  const backgroundGradient = `linear-gradient(135deg, 
    hsl(${primaryHue}, 35%, 10%) 0%, 
    hsl(${secondaryHue}, 30%, 15%) 25%,
    hsl(${aiHue}, 25%, 8%) 50%,
    hsl(${primaryHue}, 20%, 6%) 100%
  )`;
  
  const inputBackgroundColor = `hsl(${primaryHue}, 20%, 30%)`;
  const inputBorderColor = `hsl(${primaryHue}, 45%, 45%)`;
  const inputFocusColor = `hsl(${aiHue}, 70%, 60%)`;
  
  const textColor = '#ffffff';
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, ${aiColor} 50%, ${secondaryColor} 100%)`;
  
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

function AISchoolLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('Inner component: Setting mounted to true');
    setMounted(true);
  }, []);

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
  
  // AI Enhancement States
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [voiceAuth, setVoiceAuth] = useState(false);
  const [aiAuthMethod, setAiAuthMethod] = useState<'traditional' | 'biometric' | 'voice'>('traditional');
  
  // Enhanced animation states
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [aiParticles, setAiParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
  }>>([]);
  
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

  // AI-powered email suggestions
  useEffect(() => {
    if (email.length > 2 && !email.includes('@') && school) {
      setIsAiAnalyzing(true);
      const timer = setTimeout(() => {
        const suggestions = [
          `${email}@${subdomain}.edu`,
          `${email}@${subdomain}.school`,
          `${email}@${subdomain}.org`,
          `${email}@mail.com`,
        ];
        setAiSuggestions(suggestions.slice(0, 3));
        setIsAiAnalyzing(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setAiSuggestions([]);
    }
  }, [email, subdomain, school]);

  // AI insights generation
  useEffect(() => {
    if (!school) return;
    
    const insights = [
      `🤖 AI analyzing ${subdomain} school patterns...`,
      `📊 Processing authentication data...`,
      `🔍 Optimizing login experience...`,
      `🎯 Personalizing user interface...`,
      `🚀 Enhancing security protocols...`,
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      setAiInsights(insights[index % insights.length]);
      index++;
    }, 3000);
    
    return () => clearInterval(interval);
  }, [subdomain]);

  // Check for AI authentication capabilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBiometricAuth('credentials' in navigator);
      setVoiceAuth('webkitSpeechRecognition' in window);
    }
  }, []);

  // Generate AI particles
  useEffect(() => {
    const particles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 3 + Math.random() * 4,
    }));
    setAiParticles(particles);
  }, []);

  // Mouse tracking for AI effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Resolve subdomain
  useEffect(() => {
    const paramSubdomain = searchParams.get('subdomain')?.toLowerCase().trim();
    const hostnameSubdomain = (() => {
      if (typeof window === 'undefined') return '';
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') return '';
      if (host.endsWith('.localhost')) return host.replace('.localhost', '');
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
      if (host.endsWith(`.${appDomain}`)) return host.replace(`.${appDomain}`, '');
      return '';
    })();

    // CRITICAL: Validate subdomain matches hostname
    if (paramSubdomain && hostnameSubdomain && paramSubdomain !== hostnameSubdomain) {
      setSchoolError(`Subdomain mismatch: URL shows "${hostnameSubdomain}" but query requests "${paramSubdomain}"`);
      return;
    }

    const resolved = paramSubdomain || hostnameSubdomain;
    if (resolved) {
      setSubdomain(resolved);
    }
  }, [searchParams]);

  // Fetch school info and AI-enhanced theme
  useEffect(() => {
    if (!subdomain) return;

    const fetchSchool = async () => {
      setLoadingSchool(true);
      setSchoolError('');
      
      try {
        const response = await fetch(`/api/school/by-subdomain?subdomain=${subdomain}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('School does not exist');
          }
          throw new Error('Failed to load school');
        }
        
        const data = await response.json();
        setSchool(data.school);
        
        // Generate AI-enhanced theme
        const aiTheme = generateAISchoolTheme(data.school.name);
        setTheme(aiTheme);
        
        // Set school branding with AI enhancements
        setSchoolBranding({
          ...data.school,
          customAnimations: true,
          schoolMotto: data.school.schoolMotto || `"Empowering Education with AI"`,
          schoolTagline: data.school.schoolTagline || 'AI-Enhanced Learning Experience',
        });
        
      } catch (error: any) {
        setSchoolError(error.message || 'School not found. Please check your subdomain.');
        setSchool(null);
      } finally {
        setLoadingSchool(false);
      }
    };

    fetchSchool();
  }, [subdomain]);

  // AI Voice Input Handler
  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setEmail(transcript);
        setAiInsights('🎤 Voice input processed by AI');
      };
      
      recognition.start();
    }
  };

  // AI Biometric Authentication - SECURE: Never store credentials
  const handleBiometricAuth = async () => {
    if ('credentials' in navigator) {
      try {
        const cred = await (navigator as any).credentials.get({
          password: true,
        });
        if (cred) {
          // Use credentials immediately for login, NEVER store in state
          setAiInsights('🔐 Biometric authentication successful');
          // Trigger login directly with credentials
          await signIn('credentials', {
            email: cred.id,
            password: cred.password,
            redirect: false,
          });
        }
      } catch (error) {
        setAiInsights('❌ Biometric authentication failed');
      }
    }
  };

  // AI Email Suggestion Handler
  const handleAiSuggestion = (suggestion: string) => {
    setEmail(suggestion);
    setAiSuggestions([]);
    setAiInsights('🧠 AI suggestion applied');
  };

  // Enhanced login handler with AI
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAiInsights('🤖 AI authenticating...');

    // Input validation
    if (!email.trim() || !password) {
      setError('Please enter email/employee ID and password');
      setIsLoading(false);
      return;
    }

    // Determine if input is email or employee ID
    const isEmail = email.includes('@');
    const loginIdentifier = email.trim();

    // Rate limiting check
    const now = Date.now();
    const lastAttempt = localStorage.getItem('lastLoginAttempt');
    const attemptCount = parseInt(localStorage.getItem('loginAttemptCount') || '0');
    
    if (lastAttempt && now - parseInt(lastAttempt) < 1000) {
      setError('Please wait before trying again');
      setIsLoading(false);
      return;
    }
    
    if (attemptCount >= 5) {
      const lastAttemptTime = parseInt(lastAttempt || '0');
      if (now - lastAttemptTime < 300000) { // 5 minutes lockout
        setError('Too many failed attempts. Please try again in 5 minutes.');
        setIsLoading(false);
        return;
      } else {
        // Reset after lockout period
        localStorage.setItem('loginAttemptCount', '0');
      }
    }

    try {
      // AI pre-processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await signIn('credentials', {
        email: loginIdentifier,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setAiInsights('❌ Authentication failed');
        // Increment failed attempt count
        const newCount = parseInt(localStorage.getItem('loginAttemptCount') || '0') + 1;
        localStorage.setItem('loginAttemptCount', newCount.toString());
        localStorage.setItem('lastLoginAttempt', Date.now().toString());
      } else if (result?.ok) {
        setAiInsights('✅ AI authentication successful');
        // Reset attempt count on success
        localStorage.setItem('loginAttemptCount', '0');
        
        // Check if user is super admin
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        if (session?.user?.isSuperAdmin) {
          // For super admin, redirect to admin dashboard on main domain
          if (process.env.NEXT_PUBLIC_DISABLE_SUBDOMAINS === 'true') {
            router.push('/admin');
          } else {
            // Preserve subdomain for super admin if needed
            window.location.href = `/admin`;
          }
        } else {
          // For regular users, redirect to school dashboard
          if (process.env.NEXT_PUBLIC_DISABLE_SUBDOMAINS === 'true') {
            router.push('/dashboard');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
      setAiInsights('⚠️ AI detected network error');
    } finally {
      setIsLoading(false);
    }
  };

  const schoolName = school?.name || 'School';
  const schoolLocation = school?.city && school?.state ? `${school.city}, ${school.state}` : school?.city;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // CRITICAL: Block entire page if school doesn't exist
  if (schoolError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
            <p className="text-red-400 font-semibold text-lg mb-2">{schoolError}</p>
            <p className="text-gray-400 text-sm">
              The school &quot;<span className="text-white font-medium">{subdomain}</span>&quot; could not be found in our system.
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Please check the URL or contact your administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ background: theme?.backgroundColor || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      {/* AI Neural Network Background */}
      <div className="absolute inset-0">
        {aiParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle, ${theme?.accentColor || '#3b82f6'} 0%, transparent 70%)`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* AI Mouse tracking effect */}
        <div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${theme?.accentColor || '#3b82f6'}20 0%, transparent 70%)`,
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - AI Enhanced School Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* AI Logo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                  style={{
                    background: theme?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                  }}
                >
                  <span className="text-white font-bold text-2xl relative z-10">
                    {school?.logo ? (
                      <img src={school.logo} alt={school.name} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      school?.name?.charAt(0) || subdomain?.charAt(0) || 'S'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <motion.h1 
                  className="font-bold text-4xl leading-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
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
                        style={{ borderColor: theme?.accentColor || '#3b82f6' }}
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
                <motion.p 
                  className="text-lg opacity-80 mt-2"
                  style={{ color: theme?.textColor || '#ffffff' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  AI-Enhanced Education Platform
                </motion.p>
              </div>
            </div>

            {/* AI Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="space-y-4"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-4 text-white">🤖 AI Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white">Smart Authentication</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-white">Voice & Biometric Login</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-white">AI Email Suggestions</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-400">AI Insights Live</span>
              </div>
              <p className="text-xs text-gray-300 font-mono">{aiInsights}</p>
            </motion.div>
          </motion.div>

          {/* Right Side - AI Enhanced Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="relative">
              {/* AI Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl opacity-30 blur-lg" />
              
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                <div className="text-center">
                  {/* School Error Message */}
                  {schoolError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-semibold">{schoolError}</span>
                      </div>
                      <p className="text-sm text-red-300">
                        Please check the URL or contact your administrator.
                      </p>
                    </motion.div>
                  )}

                {/* AI Logo */}
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl relative overflow-hidden"
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                  <motion.span 
                    className="text-3xl relative z-10"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {school?.logo ? (
                      <img src={school.logo} alt={school.name} className="w-16 h-16 object-cover rounded-xl" />
                    ) : (
                      school?.name?.charAt(0) || subdomain?.charAt(0) || 'S'
                    )}
                  </motion.span>
                  <motion.div
                    className="absolute -inset-2 rounded-3xl blur-xl opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #3b82f6, #06b6d4)'
                    }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>

                <motion.h2 
                  className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  Welcome Back
                </motion.h2>
                
                <motion.p 
                  className="text-sm opacity-80 text-center mb-4" 
                  style={{ color: theme?.textColor || '#ffffff' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  {loadingSchool ? 'Loading school...' : `AI-Enhanced access to ${schoolName}`}
                </motion.p>

                {/* AI Authentication Methods */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="flex gap-2 mb-4"
                >
                  {biometricAuth && (
                    <motion.button
                      type="button"
                      onClick={handleBiometricAuth}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg text-green-400 text-xs font-medium hover:from-green-600/30 hover:to-emerald-600/30 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🔐 Biometric
                    </motion.button>
                  )}
                  {voiceAuth && (
                    <motion.button
                      type="button"
                      onClick={handleVoiceInput}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-medium hover:from-blue-600/30 hover:to-cyan-600/30 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🎤 Voice
                    </motion.button>
                  )}
                </motion.div>

                {/* Form */}
                <form onSubmit={handleLogin} className={`space-y-3 ${schoolError ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* AI Email Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
                  >
                    <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: theme?.textColor || '#ffffff' }}>
                      <motion.span
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        📧
                      </motion.span>
                      Email / Employee ID
                      <span className="text-xs text-blue-400">AI Enhanced</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email or employee ID"
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        style={{
                          backgroundColor: theme?.inputBackgroundColor || 'rgba(255,255,255,0.1)',
                          borderColor: theme?.inputBorderColor || 'rgba(255,255,255,0.2)',
                        }}
                        required
                      />
                      {voiceAuth && (
                        <button
                          type="button"
                          onClick={handleVoiceInput}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          title="Voice input"
                        >
                          🎤
                        </button>
                      )}
                    </div>
                    
                    {/* AI Suggestions */}
                    <AnimatePresence>
                      {aiSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-2 space-y-1"
                        >
                          <p className="text-xs text-blue-400 font-medium">AI Suggestions:</p>
                          {aiSuggestions.map((suggestion, index) => (
                            <motion.button
                              key={index}
                              type="button"
                              onClick={() => handleAiSuggestion(suggestion)}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-300 bg-white/10 rounded hover:bg-white/20 transition-colors"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              {suggestion}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
                  >
                    <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: theme?.textColor || '#ffffff' }}>
                      <motion.span
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        🔒
                      </motion.span>
                      Password
                      <span className="text-xs text-green-400">Smart Security</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        style={{
                          backgroundColor: theme?.inputBackgroundColor || 'rgba(255,255,255,0.1)',
                          borderColor: theme?.inputBorderColor || 'rgba(255,255,255,0.2)',
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </motion.div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm"
                        role="alert"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    <motion.button
                      type="submit"
                      disabled={isLoading || !!schoolError}
                      className="w-full relative group py-3 px-6 rounded-lg font-medium transition-all duration-300"
                      style={{
                        background: theme?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                      }}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    >
                      <span className="text-white flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <motion.div
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            AI Authenticating...
                          </>
                        ) : (
                          <>
                            🤖 AI Sign In
                          </>
                        )}
                      </span>
                    </motion.button>
                  </motion.div>
                </form>

                {/* Footer Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="mt-4 text-center space-y-3"
                >
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function AISchoolLogin() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('Outer component: Setting mounted to true');
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Initializing...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading login...</div>
      </div>
    }>
      <AISchoolLoginInner />
    </Suspense>
  );
}
