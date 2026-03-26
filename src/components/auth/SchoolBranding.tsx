'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SchoolTheme } from '@/lib/school-theme';

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

interface SchoolBrandingProps {
  school: SchoolInfo | null;
  theme: SchoolTheme | null;
  loadingSchool: boolean;
}

export function SchoolBranding({ school, theme, loadingSchool }: SchoolBrandingProps) {
  const schoolName = school?.name || 'School';
  const schoolLocation = school?.city && school?.state ? `${school.city}, ${school.state}` : school?.city;

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Logo and Name */}
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
                school?.name?.charAt(0) || 'S'
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
            {schoolLocation && `${schoolLocation} • `}
            Education Management System
          </motion.p>
        </div>
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="space-y-4"
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold mb-4 text-white">✨ Features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white">Secure Authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-white">Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-white">Smart Management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
              <span className="text-white">Mobile Friendly</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
