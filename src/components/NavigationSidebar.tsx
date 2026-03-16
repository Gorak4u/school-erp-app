'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface NavigationSidebarProps {
  theme: 'dark' | 'light';
  currentPage?: string;
  isSidebarOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function NavigationSidebar({ 
  theme, 
  currentPage = 'dashboard',
  isSidebarOpen,
  onMouseEnter,
  onMouseLeave
}: NavigationSidebarProps) {
  const [isClient, setIsClient] = useState(false);
  const { data: session } = useSession();
  const userIsSuperAdmin = (session?.user as any)?.isSuperAdmin === true;
  const userRole = (session?.user as any)?.role || '';
  const isAdmin = userRole === 'admin' || userIsSuperAdmin;

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <motion.aside
      className={`fixed left-0 top-0 h-full w-64 z-40 backdrop-blur-xl border-r transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-900/80 border-gray-800' 
          : 'bg-white/80 border-gray-200'
      }`}
      initial={{ x: -256 }}
      animate={{ x: isSidebarOpen ? 0 : -256 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">ERP</span>
          </div>
          <span className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>School ERP</span>
        </Link>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          <div className={`text-xs font-semibold uppercase tracking-wider ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          } mb-4`}>
            Main
          </div>
          
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'dashboard'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">📊</span>
            <span className="font-medium">Dashboard</span>
          </Link>

          <Link
            href="/students"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'students'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">👥</span>
            <span className="font-medium">Students</span>
          </Link>

          <Link
            href="/alumni"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'alumni'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">🎓</span>
            <span className="font-medium">Alumni</span>
          </Link>

          <Link
            href="/fees"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'fees'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">💰</span>
            <span className="font-medium">Fees</span>
          </Link>

          <div className={`text-xs font-semibold uppercase tracking-wider ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          } mb-4 mt-6`}>
            Academic
          </div>

          <Link
            href="/teachers"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'teachers'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">👨‍🏫</span>
            <span className="font-medium">Teachers</span>
          </Link>

          <Link
            href="/attendance"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'attendance'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">📝</span>
            <span className="font-medium">Attendance</span>
          </Link>

          <Link
            href="/assignments"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'assignments'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">📚</span>
            <span className="font-medium">Assignments</span>
          </Link>

          <div className={`text-xs font-semibold uppercase tracking-wider ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          } mb-4 mt-6`}>
            Administration
          </div>

          <Link
            href="/subscription"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'subscription'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">💳</span>
            <span className="font-medium">Subscription</span>
          </Link>

          {isAdmin && (
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === 'settings'
                  ? theme === 'dark' 
                    ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                    : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : theme === 'dark' 
                    ? 'hover:bg-gray-800 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span className="font-medium">Settings</span>
            </Link>
          )}

          {userIsSuperAdmin && (
            <Link
              href="/admin/saas"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === 'saas-settings'
                  ? theme === 'dark' 
                    ? 'bg-orange-600/20 text-orange-400 border-l-4 border-orange-400' 
                    : 'bg-orange-50 text-orange-600 border-l-4 border-orange-600'
                  : theme === 'dark' 
                    ? 'hover:bg-gray-800 text-orange-300' 
                    : 'hover:bg-gray-100 text-orange-700'
              }`}
            >
              <span className="text-lg">�</span>
              <span className="font-medium">SaaS Admin</span>
            </Link>
          )}

          <Link
            href="/reports"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === 'reports'
                ? theme === 'dark' 
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : theme === 'dark' 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">📈</span>
            <span className="font-medium">Reports</span>
          </Link>
        </nav>

        {/* Quick Stats */}
        <div className={`mt-8 p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
        }`}>
          <h4 className={`text-sm font-semibold mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Quick Access
          </h4>
          <div className="space-y-2">
            <Link
              href="/fees"
              className={`block p-2 rounded text-sm transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-blue-400' 
                  : 'hover:bg-white text-blue-600'
              }`}
            >
              💰 Fee Collection
            </Link>
            <Link
              href="/students"
              className={`block p-2 rounded text-sm transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-green-400' 
                  : 'hover:bg-white text-green-600'
              }`}
            >
              👥 Add Student
            </Link>
            <Link
              href="/attendance"
              className={`block p-2 rounded text-sm transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-orange-400' 
                  : 'hover:bg-white text-orange-600'
              }`}
            >
              📝 Mark Attendance
            </Link>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
