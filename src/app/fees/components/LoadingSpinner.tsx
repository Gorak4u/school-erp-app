// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  theme: 'dark' | 'light';
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export default function LoadingSpinner({ theme, size = 'medium', message }: LoadingSpinnerProps) {
  const isDark = theme === 'dark';
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        className={`${sizeClasses[size]} border-2 ${isDark ? 'border-blue-500 border-t-transparent' : 'border-blue-600 border-t-transparent'} rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {message && (
        <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
