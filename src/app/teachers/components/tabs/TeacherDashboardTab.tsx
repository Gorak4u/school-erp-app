// @ts-nocheck
'use client';
import React from 'react';

interface Props {
  teacher: any; dashboard: any; schoolConfig: any;
  isDark: boolean; txt: string; sub: string; card: string;
  onRefresh: () => void;
}

export default function TeacherDashboardTab({ teacher, dashboard, schoolConfig, isDark, txt, sub, card, onRefresh }: Props) {
  if (!teacher || !dashboard) return null;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const statCards = [
    { label: 'Attendance Rate',  value: `${dashboard.attendanceRate}%`,    icon: '📊', color: 'text-blue-400',   bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' },
    { label: 'Active Assignments', value: dashboard.activeAssignments,       icon: '📝', color: 'text-green-400', bg: isDark ? 'bg-green-500/10' : 'bg-green-50' },
    { label: 'Pending Grading',  value: dashboard.pendingSubmissions,        icon: '⏳', color: 'text-orange-400',bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50' },
    { label: 'Class Teacher Of', value: dashboard.classTeacherOf,            icon: '🎓', color: 'text-purple-400',bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50' },
    { label: 'Classes Assigned', value: dashboard.classesAssigned,           icon: '🏫', color: 'text-cyan-400',  bg: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50' },
    { label: 'Pending Leaves',   value: dashboard.pendingLeaves,             icon: '📅', color: 'text-red-400',   bg: isDark ? 'bg-red-500/10' : 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className={`p-4 rounded-xl border ${card}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${txt}`}>Welcome back, {teacher.name?.split(' ')[0]}!</h3>
            <p className={`text-sm mt-0.5 ${sub}`}>{today}</p>
          </div>
          <button onClick={onRefresh} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map(s => (
          <div key={s.label} className={`p-4 rounded-xl border ${card} ${s.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
            <p className={`text-xs font-medium ${sub}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>📅 Today's Schedule</h4>
          {dashboard.todaySchedule?.length > 0 ? (
            <div className="space-y-2">
              {dashboard.todaySchedule.map((s: any, i: number) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="text-center min-w-[44px]">
                    <p className={`text-xs font-bold text-blue-400`}>P{s.periodNumber}</p>
                    <p className={`text-xs ${sub}`}>{s.startTime}</p>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${txt}`}>{s.subject}</p>
                    <p className={`text-xs ${sub}`}>Class {s.classId} {s.sectionId ? `· Sec ${s.sectionId}` : ''} {s.roomNumber ? `· Room ${s.roomNumber}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-6 ${sub}`}>
              <p className="text-2xl mb-1">🎉</p>
              <p className="text-sm">No classes scheduled today</p>
            </div>
          )}
        </div>

        {/* Upcoming Assignments Due */}
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>⏰ Upcoming Due Dates</h4>
          {dashboard.upcomingDueDates?.length > 0 ? (
            <div className="space-y-2">
              {dashboard.upcomingDueDates.map((a: any, i: number) => {
                const due = new Date(a.dueDate);
                const diffDays = Math.ceil((due.getTime() - Date.now()) / 86400000);
                const urgency = diffDays <= 1 ? 'text-red-400' : diffDays <= 3 ? 'text-orange-400' : 'text-green-400';
                return (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-xs font-bold ${urgency} min-w-[40px] text-center`}>
                      {diffDays === 0 ? 'TODAY' : diffDays === 1 ? '1 day' : `${diffDays}d`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${txt}`}>{a.title}</p>
                      <p className={`text-xs ${sub}`}>{a.subject} · {a.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-6 ${sub}`}>
              <p className="text-2xl mb-1">✅</p>
              <p className="text-sm">No upcoming deadlines</p>
            </div>
          )}
        </div>

        {/* Teacher Profile Quick View */}
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>👤 Profile Overview</h4>
          <div className="space-y-2">
            {[
              { label: 'Email', value: teacher.email },
              { label: 'Phone', value: teacher.phone || '—' },
              { label: 'Department', value: teacher.department || '—' },
              { label: 'Designation', value: teacher.designation || '—' },
              { label: 'Qualification', value: teacher.qualification || '—' },
              { label: 'Experience', value: teacher.experience ? `${teacher.experience} years` : '—' },
              { label: 'Joining Date', value: teacher.joiningDate || '—' },
            ].map(f => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className={sub}>{f.label}</span>
                <span className={`font-medium ${txt} text-right max-w-[60%] truncate`}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>⚡ Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '✅', label: 'Mark Attendance', action: 'attendance' },
              { icon: '📝', label: 'New Assignment', action: 'assignments' },
              { icon: '📚', label: 'Plan Lesson', action: 'lessons' },
              { icon: '📊', label: 'View Analytics', action: 'analytics' },
              { icon: '🗓️', label: 'Apply Leave', action: 'leave' },
              { icon: '🗒️', label: 'Add Note', action: 'notes' },
            ].map(qa => (
              <div key={qa.label} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <span className="text-lg">{qa.icon}</span>
                <span className={`text-xs font-medium ${txt}`}>{qa.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      {dashboard.attendanceTakenToday !== undefined && (
        <div className={`p-4 rounded-xl border ${card}`}>
          <h4 className={`text-sm font-semibold mb-3 ${txt}`}>📊 Today's Attendance Summary</h4>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{dashboard.presentToday}</p>
              <p className={`text-xs ${sub}`}>Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{Math.max(0, dashboard.studentsMarkedToday - dashboard.presentToday)}</p>
              <p className={`text-xs ${sub}`}>Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{dashboard.studentsMarkedToday}</p>
              <p className={`text-xs ${sub}`}>Total Marked</p>
            </div>
            <div className="flex-1">
              <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-2 rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${dashboard.studentsMarkedToday > 0 ? (dashboard.presentToday / dashboard.studentsMarkedToday) * 100 : 0}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${sub}`}>
                {dashboard.attendanceTakenToday ? '✅ Attendance marked today' : '⚠️ No attendance taken today'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
