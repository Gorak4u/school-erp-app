// Refactored School Login Page - Modern Architecture
// Component-based, reusable, and maintainable

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLoginForm } from './hooks/useLoginForm';
import LoginCard from './components/LoginCard';
import HeroSection from './components/HeroSection';
import Background from './components/Background';

export default function LoginPage() {
  const {
    formData,
    formErrors,
    isLoading,
    error,
    showPassword,
    setShowPassword,
    focusedField,
    setFocusedField,
    handleInputChange,
    handleLogin,
  } = useLoginForm();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Dynamic Background */}
      <Background />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Brand & Features */}
          <HeroSection />

          {/* Right Side - Login Form */}
          <motion.div
            className="w-full max-w-md mx-auto"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          >
            <LoginCard
              onSubmit={handleLogin}
              formData={formData}
              onInputChange={handleInputChange}
              isLoading={isLoading}
              error={error}
              formErrors={formErrors}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
