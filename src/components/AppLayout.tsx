'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NavigationSidebar from './NavigationSidebar';
import { useTheme } from '@/contexts/ThemeContext';
import Toast from './Toast';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  title?: string;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
}

export default function AppLayout({ 
  children, 
  currentPage, 
  title = 'School ERP',
  theme = 'dark',
  onThemeChange
}: AppLayoutProps) {
  const { theme: globalTheme, setTheme, toggleTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTimeout, setSidebarTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(!isSidebarOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const handleSidebarMouseEnter = () => {
    if (sidebarTimeout) {
      clearTimeout(sidebarTimeout);
      setSidebarTimeout(null);
    }
    setIsSidebarOpen(true);
  };

  const handleSidebarMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsSidebarOpen(false);
    }, 300);
    setSidebarTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (sidebarTimeout) {
        clearTimeout(sidebarTimeout);
      }
    };
  }, [sidebarTimeout]);

  return (
    <div className={`min-h-screen overflow-hidden relative transition-colors duration-300 ${
      globalTheme === 'dark' ? 'bg-black text-white' : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900'
    }`}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Mesh */}
        <div className={`absolute inset-0 ${
          globalTheme === 'dark' 
            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' 
            : 'bg-gradient-to-br from-blue-100/50 via-white/50 to-indigo-100/50'
        }`} />
        
        {/* Animated Gradient Orbs */}
        {isClient && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, ${
                globalTheme === 'dark' 
                  ? 'rgba(59, 130, 246, 0.15)' 
                  : 'rgba(59, 130, 246, 0.08)'
              }, transparent 40%)`,
            }}
          />
        )}
        
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Navigation Sidebar */}
      <NavigationSidebar 
        theme={theme} 
        currentPage={currentPage} 
        isSidebarOpen={isSidebarOpen}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      />

      {/* Hover Zone for Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full w-2 z-30 ${isSidebarOpen ? 'hidden' : 'block'}`}
        onMouseEnter={handleSidebarMouseEnter}
      />

      {/* Header */}
      <motion.header
        className={`relative z-30 backdrop-blur-xl border-b sticky top-0 transition-all duration-300 ${
          globalTheme === 'dark' 
            ? 'bg-gray-900/80 border-gray-800' 
            : 'bg-white/80 border-gray-200'
        }`}
        style={{ marginLeft: isSidebarOpen ? '16rem' : '0' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Header Title */}
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle Indicator */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  globalTheme === 'dark' 
                    ? 'hover:bg-gray-800 text-gray-400' 
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title="Toggle Sidebar (Ctrl/Cmd + B)"
              >
                <svg 
                  className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <h1 className={`text-2xl font-bold ${
                globalTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{title}</h1>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  globalTheme === 'dark' 
                    ? 'hover:bg-gray-800 text-gray-300' 
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                {globalTheme === 'dark' ? 'Dark' : 'Light'}
              </button>

              {/* Notifications */}
              <button className={`relative p-2 rounded-lg transition-colors ${
                globalTheme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    globalTheme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">A</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute right-0 mt-2 w-48 rounded-lg border shadow-lg ${
                        globalTheme === 'dark' 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            globalTheme === 'dark' 
                              ? 'hover:bg-gray-700 text-gray-300' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          👤 Profile
                        </Link>
                        <Link
                          href="/settings"
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            globalTheme === 'dark' 
                              ? 'hover:bg-gray-700 text-gray-300' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          ⚙️ Settings
                        </Link>
                        <hr className={`my-2 ${
                          globalTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`} />
                        <button
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            globalTheme === 'dark' 
                              ? 'hover:bg-gray-700 text-gray-300' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 transition-all duration-300" style={{ marginLeft: isSidebarOpen ? '16rem' : '0' }}>
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      {/* Toast Notifications */}
      <Toast theme={globalTheme} />
    </div>
  );
}
