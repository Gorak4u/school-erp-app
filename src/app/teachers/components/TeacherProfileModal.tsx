// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import TeacherDashboardTab from './tabs/TeacherDashboardTab';
import TeacherScheduleTab from './tabs/TeacherScheduleTab';
import TeacherAttendanceTab from './tabs/TeacherAttendanceTab';
import TeacherLessonsTab from './tabs/TeacherLessonsTab';
import TeacherAssignmentsTab from './tabs/TeacherAssignmentsTab';
import TeacherAnalyticsTab from './tabs/TeacherAnalyticsTab';
import TeacherLeaveTab from './tabs/TeacherLeaveTab';
import TeacherNotesTab from './tabs/TeacherNotesTab';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'schedule',  label: 'Schedule',  icon: '📅' },
  { id: 'attendance',label: 'Attendance',icon: '✅' },
  { id: 'lessons',   label: 'Lessons',   icon: '📚' },
  { id: 'assignments',label:'Assignments',icon: '📝' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'leave',     label: 'Leave',     icon: '🗓️' },
  { id: 'notes',     label: 'Notes',     icon: '🗒️' },
];

interface Props {
  teacherId: string;
  onClose: () => void;
}

export default function TeacherProfileModal({ teacherId, onClose }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teacher, setTeacher] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [schoolConfig, setSchoolConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bg     = isDark ? 'bg-gray-900'    : 'bg-gray-50';
  const card   = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const txt    = isDark ? 'text-white'     : 'text-gray-900';
  const sub    = isDark ? 'text-gray-400'  : 'text-gray-500';
  const tabBg  = isDark ? 'bg-gray-800'    : 'bg-white';
  const activeBg = isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white';
  const inactiveBg = isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, configRes] = await Promise.all([
        fetch(`/api/teachers/${teacherId}/dashboard`),
        fetch('/api/school-config'),
      ]);
      if (dashRes.ok) {
        const data = await dashRes.json();
        setTeacher(data.teacher);
        setDashboard(data.dashboard);
      }
      if (configRes.ok) {
        setSchoolConfig(await configRes.json());
      }
    } catch (e) {
      console.error('Failed to load teacher dashboard', e);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-green-500/15 text-green-400' : s === 'on_leave' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400';

  const sharedProps = { teacherId, teacher, schoolConfig, theme, isDark, txt, sub, card };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4 px-2">
      <div className={`w-full max-w-6xl rounded-2xl border shadow-2xl flex flex-col ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`} style={{ minHeight: '90vh' }}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} rounded-t-2xl`}>
          {loading ? (
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className="space-y-1">
                <div className={`h-4 w-40 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className={`h-3 w-24 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              </div>
            </div>
          ) : teacher ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                {teacher.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-bold ${txt}`}>{teacher.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(teacher.status)}`}>{teacher.status}</span>
                  {teacher.isClassTeacher && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">Class Teacher</span>}
                </div>
                <p className={`text-sm ${sub}`}>{teacher.employeeId} · {teacher.department || 'No Department'} · {teacher.subject || 'No Subject'}</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            {dashboard && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className={`font-bold text-blue-400`}>{dashboard.attendanceRate}%</p>
                  <p className={`text-xs ${sub}`}>Attendance</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold text-green-400`}>{dashboard.activeAssignments}</p>
                  <p className={`text-xs ${sub}`}>Assignments</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold text-purple-400`}>{dashboard.classTeacherOf}</p>
                  <p className={`text-xs ${sub}`}>Classes</p>
                </div>
              </div>
            )}
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex items-center gap-1 px-4 py-2 border-b overflow-x-auto scrollbar-hide ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? activeBg : inactiveBg}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'attendance' && dashboard?.pendingSubmissions > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">{dashboard.pendingSubmissions}</span>
              )}
              {tab.id === 'leave' && dashboard?.pendingLeaves > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-orange-500 text-white">{dashboard.pendingLeaves}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${sub}`}>Loading teacher data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard'   && <TeacherDashboardTab   {...sharedProps} dashboard={dashboard} onRefresh={loadDashboard} />}
              {activeTab === 'schedule'    && <TeacherScheduleTab    {...sharedProps} />}
              {activeTab === 'attendance'  && <TeacherAttendanceTab  {...sharedProps} />}
              {activeTab === 'lessons'     && <TeacherLessonsTab     {...sharedProps} />}
              {activeTab === 'assignments' && <TeacherAssignmentsTab {...sharedProps} />}
              {activeTab === 'analytics'   && <TeacherAnalyticsTab   {...sharedProps} />}
              {activeTab === 'leave'       && <TeacherLeaveTab       {...sharedProps} />}
              {activeTab === 'notes'       && <TeacherNotesTab       {...sharedProps} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
