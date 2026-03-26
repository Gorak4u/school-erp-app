'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'text' | 'avatar' | 'button';
  count?: number;
  className?: string;
  theme?: 'dark' | 'light';
  themeConfig?: any;
  getCardClass?: () => string;
}

export default function SkeletonLoader({
  type = 'card',
  count = 1,
  className = '',
  theme = 'dark',
  themeConfig,
  getCardClass
}: SkeletonLoaderProps) {
  const isDark = theme === 'dark';
  const cardClass = getCardClass?.() || (isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200');
  
  const baseClasses = isDark 
    ? 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700' 
    : 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200';
  
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-6 rounded-2xl ${cardClass} shadow-lg border-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <motion.div
                  className={`w-12 h-12 rounded-xl ${baseClasses} animate-pulse`}
                />
                <div className="flex-1 space-y-2">
                  <motion.div className={`h-4 rounded-lg ${baseClasses} animate-pulse w-3/4`} />
                  <motion.div className={`h-3 rounded-lg ${baseClasses} animate-pulse w-1/2`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <motion.div className={`h-3 rounded-lg ${baseClasses} animate-pulse`} />
                <motion.div className={`h-3 rounded-lg ${baseClasses} animate-pulse`} />
              </div>
              <motion.div className={`h-20 rounded-xl ${baseClasses} animate-pulse`} />
            </div>
          </motion.div>
        );
        
      case 'table':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-2xl ${cardClass} shadow-lg border-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm overflow-hidden`}
          >
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-4 rounded-lg ${baseClasses} animate-pulse`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              {[...Array(5)].map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-6 gap-4">
                  {[...Array(6)].map((_, colIndex) => (
                    <motion.div
                      key={colIndex}
                      className={`h-3 rounded-lg ${baseClasses} animate-pulse`}
                      style={{ animationDelay: `${(rowIndex * 6 + colIndex) * 0.05}s` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        );
        
      case 'text':
        return (
          <div className="space-y-2">
            {[...Array(count)].map((_, i) => (
              <motion.div
                key={i}
                className={`h-3 rounded-lg ${baseClasses} animate-pulse`}
                style={{ 
                  width: `${Math.random() * 40 + 60}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        );
        
      case 'avatar':
        return (
          <motion.div
            className={`w-10 h-10 rounded-xl ${baseClasses} animate-pulse`}
          />
        );
        
      case 'button':
        return (
          <motion.div
            className={`h-10 rounded-xl ${baseClasses} animate-pulse w-32`}
          />
        );
        
      default:
        return (
          <motion.div
            className={`h-4 rounded-lg ${baseClasses} animate-pulse w-full`}
          />
        );
    }
  };
  
  return (
    <div className={className}>
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={index > 0 ? 'mt-4' : ''}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </div>
  );
}

// Modern Spinner Component
export function ModernSpinner({ size = 'md', theme = 'dark' }: { size?: 'sm' | 'md' | 'lg'; theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <div className={`absolute inset-0 rounded-full border-2 ${isDark ? 'border-gray-700' : 'border-gray-300'} border-t-transparent border-l-transparent`} />
      <div className={`absolute inset-1 rounded-full border-2 ${isDark ? 'border-blue-500' : 'border-blue-600'} border-t-transparent border-r-transparent animate-spin`} />
    </motion.div>
  );
}

// Loading Overlay Component
export function LoadingOverlay({ 
  message = 'Loading...', 
  theme = 'dark',
  showSpinner = true 
}: { 
  message?: string; 
  theme?: 'dark' | 'light';
  showSpinner?: boolean;
}) {
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`p-8 rounded-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-2xl border-2 backdrop-blur-sm`}
      >
        <div className="flex flex-col items-center gap-4">
          {showSpinner && <ModernSpinner size="lg" theme={theme} />}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {message}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
