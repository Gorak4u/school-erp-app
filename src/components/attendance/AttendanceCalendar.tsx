'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AttendanceCalendarProps {
  type: 'student' | 'staff';
  personId: string;
  isDark: boolean;
}

interface CalendarDay {
  date: string;
  day: number;
  dayOfWeek: number;
  isWeeklyHoliday: boolean;
  isWeekend: boolean;
  attendance: {
    status: string;
    remarks: string;
    source: string;
    leaveType?: any;
  } | null;
}

export default function AttendanceCalendar({ type, personId, isDark }: AttendanceCalendarProps) {
  const { theme } = useTheme();
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarData, setCalendarData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const loadCalendar = async () => {
    if (!personId) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/attendance/calendar/${type}/${personId}?year=${calendarYear}&month=${calendarMonth}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to load calendar');
      
      setCalendarData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [type, personId, calendarYear, calendarMonth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'absent': return isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-rose-100 text-rose-700 border-rose-200';
      case 'late': return isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200';
      case 'on_leave': return isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200';
      case 'half_day': return isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' : 'bg-purple-100 text-purple-700 border-purple-200';
      default: return isDark ? 'bg-gray-500/20 text-gray-400 border-gray-500/20' : 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'P';
      case 'absent': return 'A';
      case 'late': return 'L';
      case 'on_leave': return 'L';
      case 'half_day': return 'H';
      default: return '-';
    }
  };

  const changeMonth = (direction: number) => {
    if (direction === -1) {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    }
  };

  if (!personId) {
    return (
      <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Please select a {type === 'student' ? 'student' : 'staff member'} to view their attendance calendar.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
        <div className="text-lg font-semibold mb-2">Error loading calendar</div>
        <div className="text-sm">{error}</div>
        <button 
          onClick={loadCalendar}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        No calendar data available.
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => changeMonth(-1)}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          ←
        </button>
        
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {monthNames[calendarMonth]} {calendarYear}
          </h3>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {calendarData.person?.name || 'Unknown'}
          </div>
        </div>
        
        <button 
          onClick={() => changeMonth(1)}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map((day) => (
            <div key={day} className={`text-xs font-semibold p-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarData.calendar.map((day: CalendarDay, index: number) => {
            if (!day) {
              return <div key={`empty-${index}`} className="p-2"></div>;
            }
            
            return (
              <div
                key={day.date}
                className={`p-2 border rounded-lg text-center ${
                  day.isWeeklyHoliday 
                    ? isDark ? 'bg-red-900/30 border-red-500/50' : 'bg-red-50 border-red-200'
                    : day.isWeekend
                    ? isDark ? 'bg-gray-800/50 border-gray-600/50' : 'bg-gray-50 border-gray-200'
                    : isDark ? 'border-gray-600/50' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {day.day}
                </div>
                
                {day.attendance && (
                  <div className={`mt-1 px-1 py-0.5 rounded text-xs font-medium border ${getStatusColor(day.attendance.status)}`}>
                    {getStatusText(day.attendance.status)}
                  </div>
                )}
                
                {day.isWeeklyHoliday && (
                  <div className="text-xs mt-1 text-red-500">🏖️</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {calendarData.summary && (
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800/50 border-gray-600/50' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Monthly Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Present</div>
              <div className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {calendarData.summary.present}
              </div>
            </div>
            <div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Absent</div>
              <div className={`font-semibold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                {calendarData.summary.absent}
              </div>
            </div>
            <div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Late</div>
              <div className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {calendarData.summary.late}
              </div>
            </div>
            <div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>On Leave</div>
              <div className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {calendarData.summary.onLeave}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
