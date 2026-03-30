'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import NavigationSidebar from './NavigationSidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { smartLogoutRedirect } from '@/lib/subdomain-redirect';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationBell } from '@/components/NotificationBell';
import { MessengerBubble } from '@/components/MessengerBubble';
import { useAppConfig } from '@/contexts/SchoolConfigContext';
import Link from 'next/link';
import Toast from './Toast';
import TrialBanner from './TrialBanner';
import { CallModal } from '@/components/CallModal';
import { ScheduleMeetingModal } from '@/components/ScheduleMeetingModal';
import { GlobalCallNotification } from '@/components/GlobalCallNotification';
import { unlockAudio } from '@/lib/ringtone';
import { useGlobalSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';

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
  const { messengerEnabled } = useAppConfig();
  const { pendingCount, approvals, showToast, dismissToast } = useNotifications();
  const [isClient, setIsClient] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTimeout, setSidebarTimeout] = useState<NodeJS.Timeout | null>(null);

  const { socket } = useGlobalSocket();
  const [showCallModal, setShowCallModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const [isMessengerPage, setIsMessengerPage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    unlockAudio();
    
    // Track if we're on messenger page
    setIsMessengerPage(window.location.pathname === '/messenger');

    const unlockHandler = () => unlockAudio();
    window.addEventListener('click', unlockHandler);
    window.addEventListener('keydown', unlockHandler);

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
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };
  }, []);

  // Global Call Listener - only show full modal on non-messenger pages
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleIncomingCall = (data: any) => {
      console.log('📞 Global incoming call:', data);
      setIncomingCallData(data);
      
      // Only open full modal if NOT on messenger page (messenger has its own)
      if (typeof window !== 'undefined' && window.location.pathname !== '/messenger') {
        setShowCallModal(true);
      }
    };

    socket.on('call-incoming', handleIncomingCall);
    return () => {
      socket.off('call-incoming', handleIncomingCall);
    };
  }, [socket, user?.id]);

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

  const handleMouseEnter = () => {
    if (sidebarTimeout) {
      clearTimeout(sidebarTimeout);
      setSidebarTimeout(null);
    }
    setIsSidebarOpen(true);
  };

  const handleMouseLeave = () => {
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

      {/* Navigation Sidebar - Unified for all roles, permission-filtered */}
      <NavigationSidebar 
        theme={globalTheme} 
        currentPage={currentPage} 
        isSidebarOpen={isSidebarOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Hover Zone for Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full w-2 z-30 ${isSidebarOpen ? 'hidden' : 'block'}`}
        onMouseEnter={handleMouseEnter}
      />

      {/* Advanced Header */}
      <motion.header
        className={`relative z-30 backdrop-blur-xl border-b sticky top-0 transition-all duration-300 ${
          globalTheme === 'dark' 
            ? 'bg-gray-900/90 border-gray-800/50' 
            : 'bg-white/90 border-gray-200/50'
        }`}
        style={{ marginLeft: isSidebarOpen ? '16rem' : '0' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header Background Gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r opacity-5"
          animate={{
            background: [
              'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))',
              'linear-gradient(90deg, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
              'linear-gradient(90deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))'
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Enhanced Sidebar Toggle & Page Info */}
            <div className="flex items-center gap-6">
              {/* Advanced Sidebar Toggle */}
              <motion.button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`group relative p-3 rounded-xl transition-all duration-300 ${
                  globalTheme === 'dark' 
                    ? 'hover:bg-gray-800/50 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-900'
                }`}
                title="Toggle Sidebar (Ctrl/Cmd + B)"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Toggle Background Glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl"
                  animate={{
                    opacity: isSidebarOpen ? [0.3, 0.6, 0.3] : 0,
                    scale: isSidebarOpen ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: 2,
                    repeat: isSidebarOpen ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                />
                
                <motion.svg 
                  className={`w-5 h-5 transition-transform duration-300 relative z-10 ${isSidebarOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{
                    rotate: isSidebarOpen ? 180 : 0
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </motion.svg>
              </motion.button>

              {/* Enhanced Page Title Section */}
              <motion.div
                className="flex flex-col gap-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.h1 
                  className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                    globalTheme === 'dark' 
                      ? 'from-blue-400 via-cyan-400 to-blue-400' 
                      : 'from-blue-600 via-cyan-600 to-blue-600'
                  }`}
                  whileHover={{ x: 2 }}
                  style={{
                    backgroundSize: '200% auto',
                    animation: 'shimmer 3s linear infinite'
                  }}
                >
                  {title}
                </motion.h1>
                
                {/* Enhanced User Welcome */}
                {user && (
                  <motion.div
                    className="flex items-center gap-3 flex-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className={`text-sm ${
                      globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Welcome back, 
                      <motion.span 
                        className={`font-semibold ml-1 ${
                          globalTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {user.firstName} {user.lastName}
                      </motion.span>
                    </p>
                    
                    {/* Employee ID Badge */}
                    {user.employeeId && (
                      <motion.div
                        className={`px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                          globalTheme === 'dark' 
                            ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' 
                            : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ID: {user.employeeId}
                      </motion.div>
                    )}
                    
                    {/* Role Badge */}
                    <motion.div
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        globalTheme === 'dark' 
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </motion.div>
                    
                    {/* Status Indicator */}
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-green-500"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [1, 0.7, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <span className={`text-xs ${
                        globalTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Active
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Right Section - Enhanced Actions */}
            <div className="flex items-center gap-3">
              {/* AI-Powered Global Search */}
              <div className="relative">
                <motion.div
                  className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                    globalTheme === 'dark' 
                      ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50' 
                      : 'bg-gray-100/50 border-gray-300 hover:bg-gray-200/50'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Search Icon with AI Badge */}
                  <div className="relative">
                    <svg className={`w-4 h-4 ${
                      globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <motion.div
                      className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  
                  {/* Enhanced Search Input */}
                  <input
                    type="text"
                    placeholder="AI Search..."
                    className={`bg-transparent outline-none text-sm w-32 lg:w-48 xl:w-64 transition-all duration-300 ${
                      globalTheme === 'dark' ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
                    }`}
                    onFocus={(e) => {
                      e.target.placeholder = "Search students, fees, teachers...";
                      e.target.classList.add('w-64');
                    }}
                    onBlur={(e) => {
                      e.target.placeholder = "AI Search...";
                      e.target.classList.remove('w-64');
                    }}
                  />
                  
                  {/* AI Assistant Button */}
                  <motion.button
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      globalTheme === 'dark'
                        ? 'hover:bg-blue-600/20 text-blue-400'
                        : 'hover:bg-blue-100 text-blue-600'
                    }`}
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    title="AI Search Assistant"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                    </svg>
                  </motion.button>
                </motion.div>
                
                {/* AI Search Suggestions Dropdown */}
                <AnimatePresence>
                  {/* This would be controlled by search state */}
                </AnimatePresence>
              </div>

              {/* Advanced Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className={`group relative p-3 rounded-xl transition-all duration-300 ${
                  globalTheme === 'dark' 
                    ? 'hover:bg-gray-800/50 text-gray-300' 
                    : 'hover:bg-gray-100/50 text-gray-600'
                }`}
                title="Toggle Theme"
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {/* Theme Toggle Background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r rounded-xl"
                  animate={{
                    background: globalTheme === 'dark'
                      ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))'
                      : 'linear-gradient(45deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))'
                  }}
                />
                
                <div className="relative z-10">
                  {globalTheme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </div>
              </motion.button>

              {/* Messenger Bubble - real-time messenger notifications */}
              {messengerEnabled && <MessengerBubble />}

              {/* Notification Bell - Real-time notifications */}
              <NotificationBell isDark={globalTheme === 'dark'} userId={user?.id} />

              {/* Enhanced User Menu */}
              <div className="relative">
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    globalTheme === 'dark' 
                      ? 'hover:bg-gray-800/50 text-gray-300' 
                      : 'hover:bg-gray-100/50 text-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* User Avatar with Status */}
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">
                        {user ? (user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase() : 'U'}
                      </span>
                    </div>
                    
                    {/* Online Status Indicator */}
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-current"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  
                  {/* User Info */}
                  <div className="hidden lg:block text-left">
                    <div className={`text-sm font-semibold ${
                      globalTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className={`text-xs ${
                      globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {user?.role}
                    </div>
                  </div>
                  
                  {/* Dropdown Arrow */}
                  <motion.svg 
                    className={`w-4 h-4 transition-transform duration-300 ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{
                      rotate: userMenuOpen ? 180 : 0
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut"
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-xl ${
                        globalTheme === 'dark' 
                          ? 'bg-gray-900/95 border-gray-700' 
                          : 'bg-white/95 border-gray-200'
                      }`}
                    >
                      {/* User Profile Section */}
                      {user && (
                        <motion.div
                          className={`px-6 py-4 border-b ${
                            globalTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-lg font-bold">
                                {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm ${
                                globalTheme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {user.firstName} {user.lastName}
                              </p>
                              <p className={`text-xs truncate ${
                                globalTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {user.email}
                              </p>
                              <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                globalTheme === 'dark' 
                                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                <motion.div
                                  className="w-1.5 h-1.5 rounded-full bg-current"
                                  animate={{
                                    opacity: [1, 0.5, 1]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        {[
                          {
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            ),
                            label: 'Profile',
                            href: '/profile'
                          },
                          {
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            ),
                            label: 'Settings',
                            href: '/settings'
                          },
                          {
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            ),
                            label: 'Logout',
                            action: 'logout'
                          }
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                          >
                            {item.action === 'logout' ? (
                              <motion.button
                                onClick={() => {
                                  smartLogoutRedirect();
                                }}
                                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                                  globalTheme === 'dark'
                                    ? 'hover:bg-red-600/10 text-red-400'
                                    : 'hover:bg-red-50 text-red-600'
                                }`}
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {item.icon}
                                <span className="text-sm font-medium">{item.label}</span>
                              </motion.button>
                            ) : (
                              <Link
                                href={item.href || '#'}
                                onClick={() => setUserMenuOpen(false)}
                                className={`flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                                  globalTheme === 'dark'
                                    ? 'hover:bg-gray-800 text-gray-300'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                {item.icon}
                                <span className="text-sm font-medium">{item.label}</span>
                              </Link>
                            )}
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Footer */}
                      <motion.div
                        className={`px-6 py-3 border-t ${
                          globalTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className={`text-xs text-center ${
                          globalTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          School ERP System v2.0
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Light Animated Ribbon with Continuous Left-to-Right Movement */}
      <div 
        className="relative z-20 transition-all duration-300 overflow-hidden" 
        style={{ marginLeft: isSidebarOpen ? '16rem' : '0' }}
      >
        {/* Small ribbon container */}
        <motion.div 
          className="h-1 w-full relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Continuous moving medium gradient wave */}
          <motion.div 
            className="absolute inset-0 h-full"
            animate={{
              background: [
                'linear-gradient(90deg, #A5B4FC 0%, #C4B5FD 25%, #F9A8D4 50%, #86EFAC 75%, #FCD34D 100%, #FCA5A5 125%, #A5B4FC 150%)',
                'linear-gradient(90deg, #C4B5FD 0%, #F9A8D4 25%, #86EFAC 50%, #FCD34D 75%, #FCA5A5 100%, #A5B4FC 125%, #C4B5FD 150%)',
                'linear-gradient(90deg, #F9A8D4 0%, #86EFAC 25%, #FCD34D 50%, #FCA5A5 75%, #A5B4FC 100%, #C4B5FD 125%, #F9A8D4 150%)',
                'linear-gradient(90deg, #86EFAC 0%, #FCD34D 25%, #FCA5A5 50%, #A5B4FC 75%, #C4B5FD 100%, #F9A8D4 125%, #86EFAC 150%)',
                'linear-gradient(90deg, #FCD34D 0%, #FCA5A5 25%, #A5B4FC 50%, #C4B5FD 75%, #F9A8D4 100%, #86EFAC 125%, #FCD34D 150%)',
                'linear-gradient(90deg, #FCA5A5 0%, #A5B4FC 25%, #C4B5FD 50%, #F9A8D4 75%, #86EFAC 100%, #FCD34D 125%, #FCA5A5 150%)',
                'linear-gradient(90deg, #A5B4FC 0%, #C4B5FD 25%, #F9A8D4 50%, #86EFAC 75%, #FCD34D 100%, #FCA5A5 125%, #A5B4FC 150%)'
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Fast moving medium color segments */}
          <motion.div 
            className="absolute inset-0 h-full opacity-70"
            animate={{
              background: [
                'linear-gradient(90deg, transparent 0%, #A5B4FC 10%, #A5B4FC 20%, transparent 30%, transparent 100%)',
                'linear-gradient(90deg, transparent 20%, transparent 30%, #C4B5FD 40%, #C4B5FD 50%, transparent 60%, transparent 100%)',
                'linear-gradient(90deg, transparent 40%, transparent 50%, #F9A8D4 60%, #F9A8D4 70%, transparent 80%, transparent 100%)',
                'linear-gradient(90deg, transparent 60%, transparent 70%, #86EFAC 80%, #86EFAC 90%, transparent 100%, transparent 100%)',
                'linear-gradient(90deg, transparent 80%, transparent 90%, #FCD34D 100%, #FCD34D 110%, transparent 120%, transparent 100%)',
                'linear-gradient(90deg, transparent 100%, transparent 110%, #FCA5A5 120%, #FCA5A5 130%, transparent 140%, transparent 100%)',
                'linear-gradient(90deg, transparent 0%, transparent 10%, #A5B4FC 20%, #A5B4FC 30%, transparent 40%, transparent 100%)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Reverse moving overlay for depth */}
          <motion.div 
            className="absolute inset-0 h-full opacity-30"
            animate={{
              background: [
                'linear-gradient(270deg, #93C5FD 0%, #A78BFA 25%, #E879F9 50%, #4ADE80 75%, #FACC15 100%, #93C5FD 125%)',
                'linear-gradient(270deg, #A78BFA 0%, #E879F9 25%, #4ADE80 50%, #FACC15 75%, #93C5FD 100%, #A78BFA 125%)',
                'linear-gradient(270deg, #E879F9 0%, #4ADE80 25%, #FACC15 50%, #93C5FD 75%, #A78BFA 100%, #E879F9 125%)',
                'linear-gradient(270deg, #4ADE80 0%, #FACC15 25%, #93C5FD 50%, #A78BFA 75%, #E879F9 100%, #4ADE80 125%)',
                'linear-gradient(270deg, #FACC15 0%, #93C5FD 25%, #A78BFA 50%, #E879F9 75%, #4ADE80 100%, #FACC15 125%)',
                'linear-gradient(270deg, #93C5FD 0%, #A78BFA 25%, #E879F9 50%, #4ADE80 75%, #FACC15 100%, #93C5FD 125%)'
              ]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Fast shimmer effect moving left to right */}
          <motion.div 
            className="absolute inset-0 h-full opacity-50"
            animate={{
              background: [
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,0.9) 20%, transparent 30%, transparent 100%)',
                'linear-gradient(90deg, transparent 20%, transparent 30%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.9) 50%, transparent 60%, transparent 100%)',
                'linear-gradient(90deg, transparent 40%, transparent 50%, rgba(255,255,255,0.9) 60%, rgba(255,255,255,0.9) 70%, transparent 80%, transparent 100%)',
                'linear-gradient(90deg, transparent 60%, transparent 70%, rgba(255,255,255,0.9) 80%, rgba(255,255,255,0.9) 90%, transparent 100%, transparent 100%)',
                'linear-gradient(90deg, transparent 80%, transparent 90%, rgba(255,255,255,0.9) 100%, rgba(255,255,255,0.9) 110%, transparent 120%, transparent 100%)',
                'linear-gradient(90deg, transparent 100%, transparent 110%, transparent 120%, transparent 130%, transparent 140%, transparent 100%)',
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,0.9) 20%, transparent 30%, transparent 100%)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Small medium moving accent dots */}
          {[0, 20, 40, 60, 80].map((position, index) => (
            <motion.div
              key={position}
              className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                ['#93C5FD', '#A78BFA', '#E879F9', '#4ADE80', '#FACC15'][index % 5]
              }`}
              style={{ left: `${position}%` }}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
                x: [0, 6, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
          
          {/* Pulsing medium color waves */}
          <motion.div 
            className="absolute inset-0 h-full opacity-20"
            animate={{
              background: [
                'radial-gradient(circle at 10% 50%, rgba(165, 180, 252, 0.8) 0%, transparent 30%)',
                'radial-gradient(circle at 30% 50%, rgba(196, 181, 253, 0.8) 0%, transparent 30%)',
                'radial-gradient(circle at 50% 50%, rgba(249, 168, 212, 0.8) 0%, transparent 30%)',
                'radial-gradient(circle at 70% 50%, rgba(134, 239, 172, 0.8) 0%, transparent 30%)',
                'radial-gradient(circle at 90% 50%, rgba(252, 211, 77, 0.8) 0%, transparent 30%)',
                'radial-gradient(circle at 110% 50%, rgba(252, 165, 165, 0.8) 0%, transparent 30%)',
                'radial-gradient(circle at 130% 50%, rgba(165, 180, 252, 0.8) 0%, transparent 30%)'
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>

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

      {/* Global Call UI - Compact notification on non-messenger pages */}
      {isClient && !isMessengerPage && incomingCallData && (
        <GlobalCallNotification
          incomingCallData={incomingCallData}
          socket={socket}
          onAccept={() => {
            // Redirect to messenger and open call modal there
            setIncomingCallData(null);
            router.push('/messenger');
          }}
          onReject={() => {
            setIncomingCallData(null);
          }}
        />
      )}

      {/* Schedule Meeting Modal - available globally */}
      {isClient && (
        <ScheduleMeetingModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          signalingSocket={socket}
        />
      )}
    </div>
  );
}
