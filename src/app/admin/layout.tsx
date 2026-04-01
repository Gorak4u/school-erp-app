'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import Toast from '@/components/Toast';
import { showToast } from '@/lib/toastUtils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/schools', label: 'Schools', icon: '🏫' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/plans', label: 'Plans & Pricing', icon: '💰' },
  { href: '/admin/promo-codes', label: 'Promo Codes', icon: '🎁' },
  { href: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { href: '/admin/payments', label: 'Payment Config', icon: '💳' },
  { href: '/admin/reminder-settings', label: 'Reminder Settings', icon: '🔔' },
  { href: '/admin/cron', label: 'Cron Jobs', icon: '⏰' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '🔍' },
  { href: '/admin/student-data-deletion', label: 'Student Data Deletion', icon: '🗑️' },
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
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [searchResults, setSearchResults] = useState<SchoolOption[]>([]);

  useEffect(() => {
    // Fetch schools with pagination (get first 100 for dropdown)
    fetch('/api/admin/schools?page=1&limit=100&includeCounts=false')
      .then(r => r.json())
      .then(d => {
        const list = (d.schools || []).map((s: any) => ({ id: s.id, name: s.name, slug: s.slug }));
        setSchools(list);
      })
      .catch(() => {});
    // Fetch trial expiry alert count with caching
    fetch('/api/admin/dashboard?period=30days&cache=true')
      .then(r => r.json())
      .then(d => setAlertCount(d.trialsExpiringSoon?.length || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!globalSearch.trim()) { setSearchResults([]); return; }
    const q = globalSearch.toLowerCase();
    setSearchResults(schools.filter(s => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)).slice(0, 6));
  }, [globalSearch, schools]);

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
        showToast('error', 'Switch Failed', data.error || 'Failed to switch school');
      }
    } catch {
      showToast('error', 'Network Error', 'Network error');
    } finally {
      setSwitching(false);
    }
  };

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 z-40 border-r transition-transform duration-300 flex flex-col ${
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
        <nav className="p-3 space-y-1 overflow-y-auto overflow-x-hidden flex-1">
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
        <div className={`p-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} mt-auto`}>
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
          <div className="flex items-center justify-between px-6 py-3 gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg flex-shrink-0 ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Global Search */}
            <div className="flex-1 max-w-md relative">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}>
                <svg className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                  placeholder="Search schools... (by name or slug)"
                  value={globalSearch}
                  onChange={e => { setGlobalSearch(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                />
                {globalSearch && (
                  <button onClick={() => { setGlobalSearch(''); setSearchResults([]); }}
                    className={`text-xs ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>✕</button>
                )}
              </div>
              {/* Search Dropdown */}
              {showSearch && searchResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  {searchResults.map(s => (
                    <button key={s.id} onClick={() => { setShowSchoolPicker(false); switchToSchool(s.id); setGlobalSearch(''); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-500/10 transition-colors ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                      <span className="text-base">🏫</span>
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/{s.slug}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Alert Bell */}
              <Link href="/admin" className="relative p-2 rounded-lg">
                <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </Link>
              <div className={`text-xs px-3 py-1 rounded-full ${
                isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
              }`}>
                👑 Super Admin
              </div>
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
      
      {/* Toast Component */}
      <Toast theme={theme} />
    </div>
  );
}
