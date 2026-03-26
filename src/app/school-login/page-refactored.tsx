'use client';

import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '@/components/auth/LoginForm';
import { SchoolBranding } from '@/components/auth/SchoolBranding';
import { LoginBackground } from '@/components/auth/LoginBackground';
import { LoginFooter } from '@/components/auth/LoginFooter';
import { useSchoolAuth } from '@/hooks/useSchoolAuth';

function SchoolLoginInner() {
  const {
    school,
    loadingSchool,
    theme,
    email,
    password,
    showPassword,
    isLoading,
    error,
    setEmail,
    setPassword,
    setShowPassword,
    handleLogin,
  } = useSchoolAuth();

  if (!theme) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ background: theme?.backgroundColor || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      {/* Background Effects */}
      <LoginBackground theme={theme} />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - School Info */}
          <SchoolBranding 
            school={school} 
            theme={theme} 
            loadingSchool={loadingSchool} 
          />

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl opacity-30 blur-lg" />
              
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                
                {/* Logo */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl relative overflow-hidden"
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                  <span className="text-3xl relative z-10">
                    {school?.logo ? (
                      <img src={school.logo} alt={school.name} className="w-16 h-16 object-cover rounded-xl" />
                    ) : (
                      '🎓'
                    )}
                  </span>
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
                  className="text-sm opacity-80 text-center mb-6" 
                  style={{ color: theme?.textColor || '#ffffff' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  {loadingSchool ? 'Loading school...' : `Sign in to ${school?.name || 'your school'}`}
                </motion.p>

                {/* Login Form */}
                <LoginForm
                  email={email}
                  password={password}
                  showPassword={showPassword}
                  isLoading={isLoading}
                  error={error}
                  theme={theme}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  onSubmit={handleLogin}
                />

                {/* Footer Links */}
                <LoginFooter />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SchoolLogin() {
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading login...</div>
      </div>
    }>
      <SchoolLoginInner />
    </Suspense>
  );
}
