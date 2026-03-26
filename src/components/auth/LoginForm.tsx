'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { SchoolTheme } from '@/lib/school-theme';

interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string;
  theme: SchoolTheme | null;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  email,
  password,
  showPassword,
  isLoading,
  error,
  theme,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Email Field */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
      >
        <label className="block text-sm font-bold mb-3" style={{ color: theme?.textColor || '#ffffff' }}>
          📧 Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
          style={{
            backgroundColor: theme?.inputBackgroundColor || 'rgba(255,255,255,0.1)',
            borderColor: theme?.inputBorderColor || 'rgba(255,255,255,0.2)',
          }}
          required
        />
      </motion.div>

      {/* Password Field */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
      >
        <label className="block text-sm font-bold mb-3" style={{ color: theme?.textColor || '#ffffff' }}>
          🔒 Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            style={{
              backgroundColor: theme?.inputBackgroundColor || 'rgba(255,255,255,0.1)',
              borderColor: theme?.inputBorderColor || 'rgba(255,255,255,0.2)',
            }}
            required
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <motion.button
          type="submit"
          disabled={isLoading}
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
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </span>
        </motion.button>
      </motion.div>
    </form>
  );
}
