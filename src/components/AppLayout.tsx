'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import NavigationSidebar from './NavigationSidebar';
import TeacherNavigationSidebar from './TeacherNavigationSidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import Toast from './Toast';
import TrialBanner from './TrialBanner';

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
  const { user } = useAuth();
  const { pendingCount, approvals, showToast, dismissToast } = useNotifications();
  const [isClient, setIsClient] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTimeout, setSidebarTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Global fetch interceptor for X-Toast headers
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const toastHeader = response.headers.get('X-Toast');
      if (toastHeader) {
        try {
          const toastData = JSON.parse(toastHeader);
          if ((window as any).toast) {
            (window as any).toast(toastData);
          }
        } catch (e) {
          console.error('Failed to parse X-Toast header:', e);
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
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

  // Show toast notification when new approvals arrive
  useEffect(() => {
    if (showToast && pendingCount > 0) {
      if ((window as any).toast) {
        (window as any).toast({
          type: 'info',
          title: 'New Approval Request',
          message: `You have ${pendingCount} pending ${pendingCount === 1 ? 'approval' : 'approvals'} waiting for your review.`,
          duration: 5000,
          action: {
            label: 'View Now',
            onClick: () => {
              window.location.href = '/fees?tab=discounts';
            }
          }
        });
      }
      dismissToast();
    }
  }, [showToast, pendingCount, dismissToast]);

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

      {/* Navigation Sidebar - Role Based */}
      {user?.role === 'teacher' ? (
        <TeacherNavigationSidebar 
          theme={theme} 
          currentPage={currentPage} 
          isSidebarOpen={isSidebarOpen}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        />
      ) : (
        <NavigationSidebar 
          theme={theme} 
          currentPage={currentPage} 
          isSidebarOpen={isSidebarOpen}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        />
      )}

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
            {/* Header Title + Welcome */}
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
              <div>
                <h1 className={`text-2xl font-bold ${
                  globalTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{title}</h1>
                {user && (
                  <p className={`text-sm ${
                    globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Welcome back, <span className="font-medium">{user.firstName} {user.lastName}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs ${
                      globalTheme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                    }">{user.role}</span>
                  </p>
                )}
              </div>
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
              <div className="relative">
                <button 
                  onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                  className={`relative p-2 rounded-lg transition-colors ${
                    globalTheme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {notificationMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl border overflow-hidden ${
                        globalTheme === 'dark' 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className={`px-4 py-3 border-b ${
                        globalTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <h3 className="font-semibold">Pending Approvals</h3>
                        <p className={`text-xs ${
                          globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {pendingCount} {pendingCount === 1 ? 'item' : 'items'} waiting for your approval
                        </p>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {approvals.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className={globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              No pending approvals
                            </p>
                          </div>
                        ) : (
                          approvals.map((approval: any) => (
                            <Link
                              key={approval.id}
                              href={approval.link}
                              onClick={() => setNotificationMenuOpen(false)}
                              className={`block px-4 py-3 border-b transition-colors ${
                                globalTheme === 'dark' 
                                  ? 'border-gray-700 hover:bg-gray-700' 
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{approval.title}</p>
                                  <p className={`text-xs mt-1 ${
                                    globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {approval.description}
                                  </p>
                                  {approval.reason && (
                                    <p className={`text-xs mt-1 italic ${
                                      globalTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
                                      "{approval.reason}"
                                    </p>
                                  )}
                                  <p className={`text-xs mt-1 ${
                                    globalTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                  }`}>
                                    {new Date(approval.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      
                      {approvals.length > 0 && (
                        <div className={`px-4 py-2 border-t ${
                          globalTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <Link
                            href="/fees?tab=discounts"
                            onClick={() => setNotificationMenuOpen(false)}
                            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                          >
                            View all approvals →
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                    <span className="text-white text-sm font-bold">
                      {user ? (user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase() : 'U'}
                    </span>
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
                      className={`absolute right-0 mt-2 w-56 rounded-lg border shadow-lg ${
                        globalTheme === 'dark' 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* User Info in Dropdown */}
                      {user && (
                        <div className={`px-4 py-3 border-b ${
                          globalTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <p className={`font-medium text-sm ${
                            globalTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{user.firstName} {user.lastName}</p>
                          <p className={`text-xs ${
                            globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>{user.email}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                            globalTheme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                          }`}>{user.role}</span>
                        </div>
                      )}
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
                          onClick={() => signOut({ callbackUrl: '/login' })}
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

      {/* Trial/Subscription Banner */}
      <div className="relative z-20 transition-all duration-300" style={{ marginLeft: isSidebarOpen ? '16rem' : '0' }}>
        <TrialBanner />
      </div>

      {/* Main Content */}
      <main className="relative transition-all duration-300" style={{ marginLeft: isSidebarOpen ? '16rem' : '0' }}>
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      {/* Toast Notifications */}
      <Toast theme={globalTheme} />
    </div>
  );
}
