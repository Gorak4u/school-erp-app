'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Home, User, Settings, Calendar, BookOpen, Users, DollarSign } from 'lucide-react';

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const getNavItems = () => {
    const role = user?.role;
    
    const commonItems = [
      { href: '/dashboard', icon: Home, label: 'Home' },
      { href: '/profile', icon: User, label: 'Profile' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ];

    if (role === 'student') {
      return [
        { href: '/dashboard', icon: Home, label: 'Home' },
        { href: '/attendance', icon: Calendar, label: 'Attendance' },
        { href: '/assignments', icon: BookOpen, label: 'Work' },
        { href: '/fees', icon: DollarSign, label: 'Fees' },
        { href: '/profile', icon: User, label: 'Profile' },
      ];
    }

    if (role === 'teacher') {
      return [
        { href: '/dashboard', icon: Home, label: 'Home' },
        { href: '/attendance', icon: Calendar, label: 'Attendance' },
        { href: '/assignments', icon: BookOpen, label: 'Assignments' },
        { href: '/students', icon: Users, label: 'Students' },
        { href: '/profile', icon: User, label: 'Profile' },
      ];
    }

    if (role === 'parent') {
      return [
        { href: '/dashboard', icon: Home, label: 'Home' },
        { href: '/students', icon: Users, label: 'Children' },
        { href: '/fees', icon: DollarSign, label: 'Fees' },
        { href: '/profile', icon: User, label: 'Profile' },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                active ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
