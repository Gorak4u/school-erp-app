'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';

interface Alumni {
  id: string;
  name: string;
  admissionNo: string;
  email?: string;
  phone?: string;
  photo?: string;
  class: string;
  section: string;
  gender: string;
  status: string;
  academicYear: string;
  exitDate?: string;
  exitReason?: string;
  tcNumber?: string;
  higherEducation?: { institution?: string; degree?: string; field?: string; year?: string } | null;
  employment?: { company?: string; position?: string; industry?: string; location?: string } | null;
  contactPreference?: string;
  parentName?: string;
  parentPhone?: string;
  city?: string;
  state?: string;
  pendingDues: number;
}

const STATUS_COLORS: Record<string, string> = {
  graduated: 'bg-green-500/10 text-green-500',
  transferred: 'bg-blue-500/10 text-blue-500',
  exit: 'bg-gray-500/10 text-gray-400',
  exited: 'bg-gray-500/10 text-gray-400',
  suspended: 'bg-amber-500/10 text-amber-500',
};

const STATUS_LABELS: Record<string, string> = {
  graduated: '🎓 Graduated',
  transferred: '🔄 Transferred',
  exit: '🚪 Exited',
  exited: '🚪 Exited',
  suspended: '⚠️ Suspended',
};

export default function AlumniPage() {
  const { theme } = useTheme();
  const { isAdmin, hasPermission } = usePermissions();
  const isDark = theme === 'dark';
  const canViewAlumniDues = isAdmin || hasPermission('view_fees') || hasPermission('manage_fees');

  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [stats, setStats] = useState({ total: 0, graduated: 0, transferred: 0, withDues: 0 });

  const card = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputClass = `px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  const loadAlumni = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), pageSize: '24' });
      if (search) params.set('search', search);
      if (filterReason) params.set('exitReason', filterReason);
      if (filterYear) params.set('graduationYear', filterYear);

      const res = await fetch(`/api/alumni?${params}`);
      
      // Check for non-OK responses before parsing JSON
      if (!res.ok) {
        if (res.status === 401) {
          console.error('Session expired - please log in again');
          // Optionally redirect to login or show auth error
          setAlumni([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setAlumni(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        setPage(pg);

        const all = data.data as Alumni[];
        setStats({
          total: data.pagination.total,
          graduated: all.filter(a => a.exitReason === 'graduated').length,
          transferred: all.filter(a => a.exitReason === 'transferred').length,
          withDues: canViewAlumniDues ? all.filter(a => a.pendingDues > 0).length : 0,
        });
      } else {
        console.error('API error:', data.error);
        setAlumni([]);
      }
    } catch (err) {
      console.error('Failed to load alumni:', err);
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterReason, filterYear, canViewAlumniDues]);

  useEffect(() => {
    const t = setTimeout(() => loadAlumni(1), 300);
    return () => clearTimeout(t);
  }, [search, filterReason, filterYear]);

  const statCards = [
    { label: 'Total Alumni', value: total, icon: '👥', color: 'text-blue-500' },
    { label: 'Graduated', value: stats.graduated, icon: '🎓', color: 'text-green-500' },
    { label: 'Transferred', value: stats.transferred, icon: '🔄', color: 'text-purple-500' },
    ...(canViewAlumniDues ? [{ label: 'With Dues', value: stats.withDues, icon: '💸', color: 'text-red-500' }] : []),
  ];

  return (
    <AppLayout currentPage="alumni" title="Alumni Portal">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Alumni Portal</h1>
            <p className={`text-sm ${subText}`}>Manage graduated, transferred, and exited students</p>
          </div>
          <Link
            href="/students"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            ← Back to Students
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl ${card}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{s.icon}</span>
                <span className={`text-xs font-medium ${subText}`}>{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-xl ${card}`}>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by name, admission no, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${inputClass} flex-1 min-w-48`}
            />
            <select value={filterReason} onChange={e => setFilterReason(e.target.value)} className={inputClass}>
              <option value="">All Exit Types</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="expelled">Expelled</option>
              <option value="suspended">Suspended</option>
            </select>
            {filterReason || filterYear || search ? (
              <button
                onClick={() => { setSearch(''); setFilterReason(''); setFilterYear(''); }}
                className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* Alumni Grid */}
        {loading ? (
          <div className={`text-center py-16 ${subText}`}>
            <div className="text-4xl mb-3 animate-pulse">👥</div>
            <p>Loading alumni...</p>
          </div>
        ) : alumni.length === 0 ? (
          <div className={`text-center py-16 rounded-xl ${card}`}>
            <div className="text-5xl mb-4">🎓</div>
            <h3 className={`text-lg font-semibold mb-1 ${text}`}>No Alumni Found</h3>
            <p className={`text-sm ${subText}`}>
              {search || filterReason ? 'Try adjusting your filters.' : 'Exit students from the Students page to see them here.'}
            </p>
            {!search && !filterReason && (
              <Link href="/students" className="inline-block mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                → Go to Students
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={`text-sm ${subText} mb-2`}>
              Showing {alumni.length} of {total} alumni
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alumni.map(a => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-4 ${card} hover:shadow-lg transition-shadow`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {a.photo ? (
                          <img src={a.photo} alt={a.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          a.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${text}`}>{a.name}</div>
                        <div className={`text-xs ${subText}`}>{a.admissionNo}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || STATUS_COLORS.exit}`}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className={`text-xs space-y-1 mb-3 ${subText}`}>
                    <div className="flex justify-between">
                      <span>Class</span>
                      <span className={`font-medium ${text}`}>{a.class} {a.section}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Academic Year</span>
                      <span className={`font-medium ${text}`}>{a.academicYear}</span>
                    </div>
                    {a.exitDate && (
                      <div className="flex justify-between">
                        <span>Exit Date</span>
                        <span className={`font-medium ${text}`}>{a.exitDate}</span>
                      </div>
                    )}
                    {a.employment?.company && (
                      <div className="flex justify-between">
                        <span>Works at</span>
                        <span className={`font-medium ${text} truncate max-w-32`}>{a.employment.company}</span>
                      </div>
                    )}
                    {a.higherEducation?.institution && (
                      <div className="flex justify-between">
                        <span>Studies at</span>
                        <span className={`font-medium ${text} truncate max-w-32`}>{a.higherEducation.institution}</span>
                      </div>
                    )}
                  </div>

                  {/* Dues warning */}
                  {canViewAlumniDues && a.pendingDues > 0 && (
                    <div className={`text-xs px-2 py-1 rounded-lg mb-3 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                      ⚠️ Pending dues: <strong>₹{a.pendingDues.toLocaleString()}</strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/alumni/${a.id}`}
                      className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                    >
                      View Profile
                    </Link>
                    {canViewAlumniDues && a.pendingDues > 0 && (
                      <Link
                        href={`/alumni/${a.id}?tab=dues`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                      >
                        💸 Dues
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  disabled={page === 1}
                  onClick={() => loadAlumni(page - 1)}
                  className={`px-4 py-2 rounded-lg text-sm ${page === 1 ? 'opacity-40 cursor-not-allowed' : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  ← Prev
                </button>
                <span className={`px-4 py-2 text-sm ${subText}`}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => loadAlumni(page + 1)}
                  className={`px-4 py-2 rounded-lg text-sm ${page === totalPages ? 'opacity-40 cursor-not-allowed' : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
