// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';

interface Props { teacherId: string; teacher: any; isDark: boolean; txt: string; sub: string; card: string; }

export default function TeacherAnalyticsTab({ teacherId, teacher, isDark, txt, sub, card }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/analytics?period=${period}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [teacherId, period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  const { overview, attendanceTrend, assignmentStats, lessonStats, leaveStats } = data;

  const Bar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
      <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
    </div>
  );

  const engagementColor = overview.engagementScore >= 80 ? 'text-green-400' : overview.engagementScore >= 50 ? 'text-yellow-400' : 'text-red-400';
  const engagementBg = overview.engagementScore >= 80 ? 'bg-green-500' : overview.engagementScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-5">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-semibold ${txt}`}>Teaching Analytics</h3>
        <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
          {(['month', 'quarter', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${period === p ? 'bg-blue-600 text-white' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Engagement Score */}
      <div className={`p-5 rounded-xl border ${card} flex items-center gap-6`}>
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" className={isDark ? 'stroke-gray-700' : 'stroke-gray-200'} strokeWidth="3.2" />
            <circle cx="18" cy="18" r="15.9" fill="none" className={engagementBg.replace('bg-', 'stroke-')} strokeWidth="3.2"
              strokeDasharray={`${overview.engagementScore} ${100 - overview.engagementScore}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${engagementColor}`}>{overview.engagementScore}</span>
          </div>
        </div>
        <div>
          <h4 className={`text-base font-semibold ${txt}`}>Teaching Engagement Score</h4>
          <p className={`text-sm mt-1 ${sub}`}>Based on lessons, assignments, attendance & grading activity</p>
          <div className="flex gap-3 mt-2">
            {[
              { l: 'Lessons', v: overview.totalLessons, c: 'text-blue-400' },
              { l: 'Assignments', v: overview.totalAssignments, c: 'text-green-400' },
              { l: 'Graded', v: overview.submissionsGraded, c: 'text-purple-400' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                <p className={`text-xs ${sub}`}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Lessons', value: overview.totalLessons, icon: '📚', color: 'text-blue-400', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' },
          { label: 'Assignments Created', value: overview.totalAssignments, icon: '📝', color: 'text-green-400', bg: isDark ? 'bg-green-500/10' : 'bg-green-50' },
          { label: 'Submissions Graded', value: overview.submissionsGraded, icon: '✅', color: 'text-purple-400', bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50' },
          { label: 'Exams Conducted', value: data.examsCount, icon: '📊', color: 'text-orange-400', bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl border ${card} ${s.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">{s.icon}</span>
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
            <p className={`text-xs ${sub}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assignment Breakdown */}
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>📝 Assignment Breakdown</h4>
          <div className="space-y-2">
            {[
              { label: 'Active', value: assignmentStats.active, max: assignmentStats.total, color: 'bg-green-500' },
              { label: 'Closed', value: assignmentStats.closed, max: assignmentStats.total, color: 'bg-gray-500' },
              { label: 'Graded', value: assignmentStats.graded, max: assignmentStats.total, color: 'bg-blue-500' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={sub}>{r.label}</span>
                  <span className={`font-medium ${txt}`}>{r.value}</span>
                </div>
                <Bar value={r.value} max={assignmentStats.total || 1} color={r.color} />
              </div>
            ))}
            <div className="pt-2 border-t border-dashed border-gray-600 mt-2">
              <p className={`text-xs ${sub}`}>By type:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(assignmentStats.byType || {}).map(([type, count]: [string, any]) => (
                  <span key={type} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{type}: {count}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Plans Breakdown */}
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>📚 Lesson Plans</h4>
          <div className="space-y-2">
            {[
              { label: 'Draft', value: lessonStats.draft, max: lessonStats.total, color: 'bg-gray-500' },
              { label: 'Published', value: lessonStats.published, max: lessonStats.total, color: 'bg-blue-500' },
              { label: 'Completed', value: lessonStats.completed, max: lessonStats.total, color: 'bg-green-500' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={sub}>{r.label}</span>
                  <span className={`font-medium ${txt}`}>{r.value}</span>
                </div>
                <Bar value={r.value} max={lessonStats.total || 1} color={r.color} />
              </div>
            ))}
            <div className={`p-2 rounded-lg mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${sub}`}>Completion Rate</p>
              <p className={`text-lg font-bold text-green-400`}>{lessonStats.total > 0 ? Math.round((lessonStats.completed / lessonStats.total) * 100) : 0}%</p>
            </div>
          </div>
        </div>

        {/* Attendance Trend */}
        {attendanceTrend.length > 0 && (
          <div className={`p-4 rounded-xl border ${card} md:col-span-2`}>
            <h4 className={`text-sm font-semibold mb-3 ${txt}`}>📊 Monthly Attendance Rate Trend</h4>
            <div className="flex items-end gap-2 h-24 overflow-x-auto pb-2">
              {attendanceTrend.map((m: any) => (
                <div key={m.month} className="flex flex-col items-center gap-1 shrink-0 min-w-[40px]">
                  <span className={`text-xs font-bold ${m.rate >= 90 ? 'text-green-400' : m.rate >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>{m.rate}%</span>
                  <div className={`w-8 rounded-t-sm ${m.rate >= 90 ? 'bg-green-500' : m.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ height: `${Math.max(4, m.rate * 0.6)}px` }} />
                  <span className={`text-xs ${sub}`}>{m.month.substring(5)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave Stats */}
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>🗓️ Leave Summary (This Year)</h4>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={`text-2xl font-bold text-orange-400`}>{leaveStats.totalDays}</p>
              <p className={`text-xs ${sub}`}>Days Taken</p>
            </div>
            <div className="flex-1 space-y-1">
              {Object.entries(leaveStats.byType || {}).map(([type, days]: [string, any]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className={sub}>{type}</span>
                  <span className={`font-medium ${txt}`}>{days} days</span>
                </div>
              ))}
              {Object.keys(leaveStats.byType || {}).length === 0 && <p className={`text-xs ${sub}`}>No approved leaves this year</p>}
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>👤 Professional Profile</h4>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Experience', value: teacher?.experience ? `${teacher.experience} years` : '—' },
              { label: 'Joined', value: teacher?.joiningDate || '—' },
              { label: 'Department', value: teacher?.department || '—' },
              { label: 'Qualification', value: teacher?.qualification || '—' },
            ].map(f => (
              <div key={f.label} className="flex justify-between">
                <span className={sub}>{f.label}</span>
                <span className={`font-medium ${txt}`}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
