'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { schoolSettingsApi } from '@/lib/apiClient';

interface WeeklyHolidaysSettingsProps {
  canManageSettings: boolean;
  settingsMap: Record<string, Record<string, string>>;
  isDark: boolean;
  showToast: (options: { type: string; title: string; message: string }) => void;
  card: string;
  btnPrimary: string;
  label: string;
}

export default function WeeklyHolidaysSettings({
  canManageSettings,
  settingsMap,
  isDark,
  showToast,
  card,
  btnPrimary,
  label,
}: WeeklyHolidaysSettingsProps) {
  const [weeklyHolidays, setWeeklyHolidays] = useState<number[]>([]);
  const [savingHolidays, setSavingHolidays] = useState(false);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadWeeklyHolidays = useCallback(() => {
    const holidaysSetting = settingsMap?.timings?.weekly_holidays;
    if (holidaysSetting) {
      try {
        setWeeklyHolidays(JSON.parse(holidaysSetting));
      } catch (e) {
        console.error('Failed to parse weekly holidays:', e);
        setWeeklyHolidays([]);
      }
    } else {
      // Default to Saturday as holiday
      setWeeklyHolidays([6]);
    }
  }, [settingsMap]);

  const toggleWeeklyHoliday = (dayIndex: number) => {
    if (!canManageSettings) return;
    
    setWeeklyHolidays(prev => {
      const newHolidays = [...prev];
      const index = newHolidays.indexOf(dayIndex);
      if (index > -1) {
        newHolidays.splice(index, 1); // Remove holiday
      } else {
        newHolidays.push(dayIndex); // Add holiday
      }
      return newHolidays.sort();
    });
  };

  const saveWeeklyHolidays = async () => {
    if (!canManageSettings) return;
    setSavingHolidays(true);
    try {
      await schoolSettingsApi.upsert({
        group: 'timings',
        key: 'weekly_holidays',
        value: JSON.stringify(weeklyHolidays)
      });
      showToast({ type: 'success', title: 'Weekly holidays updated', message: 'Holiday configuration saved successfully' });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to save weekly holidays', message: e.message });
    } finally {
      setSavingHolidays(false);
    }
  };

  useEffect(() => {
    loadWeeklyHolidays();
  }, [loadWeeklyHolidays]);

  return (
    <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Weekly Holidays</h4>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Select days that are weekly holidays (no attendance allowed)</p>
        </div>
        <button 
          className={btnPrimary} 
          disabled={!canManageSettings || savingHolidays} 
          onClick={saveWeeklyHolidays}
        >
          {savingHolidays ? 'Saving...' : 'Save Holidays'}
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, index) => {
          const isHoliday = weeklyHolidays.includes(index);
          return (
            <button
              key={day}
              disabled={!canManageSettings}
              onClick={() => toggleWeeklyHoliday(index)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer hover:scale-105 ${
                isHoliday 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                  : isDark 
                    ? 'border-gray-600 text-gray-300 hover:border-green-500' 
                    : 'border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              <div className="text-xs font-medium">{day.substring(0, 3)}</div>
              <div className="text-xs mt-1">
                {isHoliday ? '🏖️' : '📚'}
              </div>
            </button>
          );
        })}
      </div>
      
      {weeklyHolidays.length > 0 && (
        <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            📅 Weekly holidays: {weeklyHolidays.map(dayIndex => DAYS[dayIndex]).join(', ')}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            Attendance will be blocked on these days
          </p>
        </div>
      )}
    </div>
  );
}
