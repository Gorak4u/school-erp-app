// Production-Grade Login Page - Next.js App Router
// Based on the School Management ERP UI Design Documents

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ButtonAdvanced, Input, Card, CardContent, Badge } from '@/lib/design-system';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Demo login logic
      if (formData.email === 'admin@schoolerp.in' && formData.password === 'admin123') {
        router.push('/dashboard');
      } else if (formData.email === 'teacher@schoolerp.in' && formData.password === 'teacher123') {
        router.push('/dashboard');
      } else if (formData.email === 'student@schoolerp.in' && formData.password === 'student123') {
        router.push('/dashboard');
      } else if (formData.email === 'parent@schoolerp.in' && formData.password === 'parent123') {
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Floating Particles */}
        {[...Array(30)].map((_, i) => {
          const seed = i * 1000;
          const left = ((seed * 9.9) % 100);
          const top = ((seed * 7.3) % 100);
          
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30"
              animate={{
                x: [0, ((seed * 4.7) % 100) - 50, 0],
                y: [0, ((seed * 6.1) % 100) - 50, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 2 + (seed % 3),
                repeat: Infinity,
                delay: (seed % 2),
              }}
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
            />
          );
        })}

        {/* Gradient Orbs */}
        <motion.div
          className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            left: '10%',
            top: '20%',
          }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-10"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            right: '10%',
            bottom: '20%',
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo and Brand */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">ERP</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">School ERP</h1>
          <p className="text-blue-200">Indian Education Management System</p>
        </motion.div>

        {/* Login Card */}
        <Card variant="elevated" className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardContent className="p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-blue-200">Sign in to your account</p>
              </div>

              {/* Demo Credentials */}
              <div className="mb-6">
                <Badge variant="primary" className="mb-3 bg-white/10 text-white border-white/20">
                  🎓 Demo Credentials Available
                </Badge>
                <div className="space-y-2 text-xs text-blue-200">
                  <div>Admin: admin@schoolerp.in / admin123</div>
                  <div>Teacher: teacher@schoolerp.in / teacher123</div>
                  <div>Student: student@schoolerp.in / student123</div>
                  <div>Parent: parent@schoolerp.in / parent123</div>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <ButtonAdvanced
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-transparent"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </ButtonAdvanced>
              </form>

              {/* Footer Links */}
              <div className="mt-6 text-center">
                <div className="space-y-2">
                  <Link
                    href="/register"
                    className="text-blue-200 hover:text-white transition-colors text-sm"
                  >
                    Don't have an account? Sign up
                  </Link>
                  <div>
                    <Link
                      href="#"
                      className="text-blue-200 hover:text-white transition-colors text-sm"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link
            href="/"
            className="text-blue-200 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
