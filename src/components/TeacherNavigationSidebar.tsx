'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSchoolDetails } from '@/contexts/SchoolConfigContext';

interface TeacherNavigationSidebarProps {
  theme: 'dark' | 'light';
  currentPage?: string;
  isSidebarOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function TeacherNavigationSidebar({ 
  theme, 
  currentPage = 'teacher-dashboard',
  isSidebarOpen,
  onMouseEnter,
  onMouseLeave
}: TeacherNavigationSidebarProps) {
  const [isClient, setIsClient] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as any;
  const schoolDetails = useSchoolDetails();

  useEffect(() => {
    setIsClient(true);
    console.log('🏫 School Details in Teacher Sidebar:', {
      name: schoolDetails.name,
      logo_url: schoolDetails.logo_url,
      isClient
    });
  }, [schoolDetails, isClient]);

  const teacherMenuItems = [
    {
      section: 'Main',
      items: [
        { href: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/teacher/profile', label: 'My Profile', icon: '👤' },
      ]
    },
    {
      section: 'Academic',
      items: [
        { href: '/teacher/schedule', label: 'My Schedule', icon: '📅' },
        { href: '/teacher/assignments', label: 'Assignments', icon: '📚' },
        { href: '/teacher/lessons', label: 'Lessons', icon: '📖' },
        { href: '/teacher/notes', label: 'Notes', icon: '📝' },
      ]
    },
    {
      section: 'Classroom',
      items: [
        { href: '/teacher/students', label: 'My Students', icon: '👥' },
        { href: '/teacher/attendance', label: 'Attendance', icon: '✅' },
        { href: '/teacher/leave', label: 'Leave Request', icon: '🏖️' },
      ]
    },
    {
      section: 'Tools',
      items: [
        { href: '/teacher/analytics', label: 'Analytics', icon: '📈' },
        { href: '/teacher/messages', label: 'Messages', icon: '💬' },
      ]
    }
  ];

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
      <div className="flex flex-col h-full p-6">
        {/* Logo */}
        <Link href="/teacher/dashboard" className="flex items-center gap-3 mb-8 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {schoolDetails.logo_url ? (
              <img 
                src={schoolDetails.logo_url} 
                alt="School Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<span class="text-white font-bold text-lg">T</span>';
                }}
              />
            ) : (
              <span className="text-white font-bold text-lg">T</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-xl font-bold truncate block ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {schoolDetails.name || 'School ERP'}
            </span>
            <span className={`text-xs truncate block ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Teacher Portal
            </span>
          </div>
        </Link>

        {/* User Info */}
        <div className={`p-3 rounded-lg mb-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'T'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {user?.name || 'Teacher'}
              </p>
              <p className={`text-xs truncate ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {user?.email || 'teacher@school.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu - Scrollable */}
        <nav className="space-y-6 flex-1 overflow-y-auto pr-2">
          {teacherMenuItems.map((section) => (
            <div key={section.section}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              } mb-3`}>
                {section.section}
              </div>
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentPage === item.href.replace('/teacher/', '');
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? theme === 'dark' 
                            ? 'bg-green-600/20 text-green-400 border-l-4 border-green-400' 
                            : 'bg-green-50 text-green-600 border-l-4 border-green-600'
                          : theme === 'dark' 
                            ? 'hover:bg-gray-800 text-gray-300' 
                            : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-gray-700">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-800 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <span className="text-lg">🔙</span>
            <span className="font-medium text-sm">Switch to Admin</span>
          </Link>
        </div>
      </div>
    </motion.aside>
  );
}
