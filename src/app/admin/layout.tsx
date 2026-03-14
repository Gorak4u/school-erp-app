'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/schools', label: 'Schools', icon: '🏫' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/plans', label: 'Plans & Pricing', icon: '💰' },
  { href: '/admin/payments', label: 'Payment Config', icon: '💳' },
  { href: '/admin/settings', label: 'Platform Settings', icon: '⚙️' },
];

interface SchoolOption {
  id: string;
  name: string;
  slug: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(d => setSchools((d.schools || []).map((s: any) => ({ id: s.id, name: s.name, slug: s.slug }))))
      .catch(() => {});
  }, []);

  const switchToSchool = async (schoolId: string) => {
    setSwitching(true);
    try {
      const res = await fetch('/api/admin/switch-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowSchoolPicker(false);
        router.push('/dashboard');
      } else {
        alert(data.error || 'Failed to switch school');
      }
    } catch {
      alert('Network error');
    } finally {
      setSwitching(false);
    }
  };

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 z-40 border-r transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Logo */}
        <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">👑</span>
            </div>
            <div>
              <h1 className="font-bold text-sm">SaaS Admin</h1>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Platform Owner</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item)
                  ? isDark
                    ? 'bg-orange-600/20 text-orange-400 border-l-3 border-orange-400'
                    : 'bg-orange-50 text-orange-700'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <button onClick={() => setShowSchoolPicker(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              isDark ? 'text-green-400 hover:bg-green-500/10' : 'text-green-600 hover:bg-green-50'
            }`}>
            <span>�</span>
            <span>View School ERP</span>
          </button>
          <button onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <span>{isDark ? '☀️' : '🌙'}</span>
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
            }`}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
          isDark ? 'bg-gray-950/80 border-gray-800' : 'bg-gray-50/80 border-gray-200'
        }`}>
          <div className="flex items-center justify-between px-6 py-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className={`text-xs px-3 py-1 rounded-full ${
              isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
            }`}>
              Super Admin Mode
            </div>
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>

      {/* School Picker Modal */}
      {showSchoolPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-xl border p-6 w-[480px] max-h-[80vh] flex flex-col ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Switch to School</h3>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Select a school to view its dashboard and data
                </p>
              </div>
              <button onClick={() => setShowSchoolPicker(false)}
                className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-1.5">
              {schools.length === 0 ? (
                <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No schools found</p>
              ) : (
                schools.map(school => (
                  <button key={school.id} onClick={() => switchToSchool(school.id)} disabled={switching}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      isDark ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-50 text-gray-900'
                    }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                    }`}>🏫</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{school.name}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/{school.slug}</div>
                    </div>
                    <svg className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
