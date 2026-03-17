'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSchoolDetails } from '@/contexts/SchoolConfigContext';
import { hasPermission, DEFAULT_ROLE_PERMISSIONS, type Permission } from '@/lib/permissions';

interface NavigationSidebarProps {
  theme: 'dark' | 'light';
  currentPage?: string;
  isSidebarOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  pageKey: string;
  permission?: Permission;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// All navigation items organized by group, with permission requirements
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊', pageKey: 'dashboard', permission: 'view_dashboard' },
      { href: '/students', label: 'Students', icon: '👥', pageKey: 'students', permission: 'view_students' },
      { href: '/alumni', label: 'Alumni', icon: '🎓', pageKey: 'alumni', permission: 'view_alumni' },
      { href: '/fees', label: 'Fees', icon: '💰', pageKey: 'fees', permission: 'view_fees' },
      { href: '/expenses', label: 'Expenses', icon: '💸', pageKey: 'expenses', adminOnly: true },
      { href: '/transport', label: 'Transport', icon: '🚌', pageKey: 'transport', adminOnly: true },
    ],
  },
  {
    label: 'Academic',
    items: [
      { href: '/teachers', label: 'Staff', icon: '👨‍🏫', pageKey: 'teachers', permission: 'view_teachers' },
      { href: '/attendance', label: 'Attendance', icon: '📝', pageKey: 'attendance', permission: 'view_attendance' },
      { href: '/assignments', label: 'Assignments', icon: '📚', pageKey: 'assignments', permission: 'view_exams' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/subscription', label: 'Subscription', icon: '💳', pageKey: 'subscription', adminOnly: true },
      { href: '/settings', label: 'Settings', icon: '⚙️', pageKey: 'settings', permission: 'view_settings' },
      { href: '/reports', label: 'Reports', icon: '📈', pageKey: 'reports', permission: 'view_reports' },
    ],
  },
];

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
  const userPermissions: Permission[] = (session?.user as any)?.permissions || DEFAULT_ROLE_PERMISSIONS[userRole] || [];
  const isAdmin = userRole === 'admin' || userIsSuperAdmin;
  const schoolDetails = useSchoolDetails();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter navigation items based on role + permissions
  const filteredGroups = useMemo(() => {
    const filtered = NAV_GROUPS
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          // Super admin sees everything
          if (userIsSuperAdmin) return true;
          // Admin-only items hidden from non-admins
          if (item.adminOnly && !isAdmin) return false;
          // Permission-based: check if user has the required permission
          if (item.permission) {
            // Admins get all permissions
            if (isAdmin) return true;
            return hasPermission(userPermissions, item.permission);
          }
          return true;
        }),
      }))
      .filter(group => group.items.length > 0); // Hide empty groups
    
    return filtered;
  }, [userRole, userPermissions, isAdmin, userIsSuperAdmin]);

  const linkCls = (pageKey: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      currentPage === pageKey
        ? theme === 'dark'
          ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
          : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
        : theme === 'dark'
          ? 'hover:bg-gray-800 text-gray-300'
          : 'hover:bg-gray-100 text-gray-700'
    }`;

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
        <Link href="/dashboard" className="flex items-center gap-3 mb-8 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {schoolDetails.logo_url ? (
              <img 
                src={schoolDetails.logo_url} 
                alt="School Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<span class="text-white font-bold text-lg">ERP</span>';
                }}
              />
            ) : (
              <span className="text-white font-bold text-lg">ERP</span>
            )}
          </div>
          <span className={`text-xl font-bold truncate ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {schoolDetails.name || 'School ERP'}
          </span>
        </Link>

        {/* Navigation Menu - Scrollable */}
        <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
          {filteredGroups.map((group, gi) => (
            <div key={group.label}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              } mb-4 ${gi > 0 ? 'mt-6' : ''}`}>
                {group.label}
              </div>
              {group.items.map(item => (
                <Link key={item.pageKey} href={item.href} className={linkCls(item.pageKey)}>
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}

          {/* SaaS Admin - Super admin only */}
          {userIsSuperAdmin && (
            <div>
              <div className={`text-xs font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              } mb-4 mt-6`}>
                Platform
              </div>
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
                <span className="text-lg">🛡️</span>
                <span className="font-medium">SaaS Admin</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </motion.aside>
  );
}
