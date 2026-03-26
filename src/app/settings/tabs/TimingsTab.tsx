'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../utils';

interface TimingsTabProps {
  isDark: boolean;
  canManageSettings: boolean;
  timings: any[];
  timingsApi: any;
  openCreate: (type: string, initialData: any) => void;
  openEdit: (type: string, data: any) => void;
  handleDelete: (entity: string, id: string, name: string) => void;
  fetchAll: () => void;
  card: string;
  heading: string;
  btnPrimary: string;
  btnSecondary: string;
  btnDanger: string;
  input: string;
  label: string;
  badge: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMING_TYPES = [
  { value: 'period', label: 'Class Period', icon: '📚', color: 'blue', gradient: 'from-blue-500 to-blue-600' },
  { value: 'break', label: 'Break', icon: '☕', color: 'green', gradient: 'from-green-500 to-green-600' },
  { value: 'lunch', label: 'Lunch', icon: '🍽️', color: 'orange', gradient: 'from-orange-500 to-orange-600' },
  { value: 'assembly', label: 'Assembly', icon: '🎯', color: 'purple', gradient: 'from-purple-500 to-purple-600' }
];

export const TimingsTab: React.FC<TimingsTabProps> = ({
  isDark,
  canManageSettings,
  timings,
  timingsApi,
  fetchAll,
  card,
  heading,
  btnPrimary,
  btnSecondary,
  btnDanger,
  input,
  label,
  badge,
}) => {
  const [editingTiming, setEditingTiming] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [timingRows, setTimingRows] = useState<any[]>([]);
  const [timingDrafts, setTimingDrafts] = useState<Record<string, any>>({});
  const [editingDays, setEditingDays] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'timeline'>('grid');

  // World-class theme classes
  const theme = useMemo(() => ({
    background: isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white via-gray-50 to-white',
    card: `backdrop-blur-xl ${isDark ? 'bg-gray-800/80 border-gray-700/50 shadow-2xl' : 'bg-white/80 border-gray-200/50 shadow-xl'} rounded-3xl border-2`,
    header: isDark ? 'text-white' : 'text-gray-900',
    subheader: isDark ? 'text-gray-400' : 'text-gray-600',
    input: `w-full px-4 py-3 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
      isDark 
        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700' 
        : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'
    }`,
    button: {
      primary: `px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
        isDark 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
      }`,
      secondary: `px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
        isDark 
          ? 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:text-white' 
          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
      }`,
      danger: `px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
        isDark 
          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' 
          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
      }`,
      icon: `w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:rotate-12 ${
        isDark ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`
    },
    grid: {
      container: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      card: `backdrop-blur-xl rounded-3xl border-2 p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
        isDark 
          ? 'bg-gradient-to-br from-gray-800/80 to-gray-700/80 border-gray-700/50 hover:border-gray-600/50' 
          : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 hover:border-gray-300/50'
      }`,
      title: `text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`,
      subtitle: `text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`,
      badge: `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium`,
      time: `text-2xl font-bold font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`,
      dayButton: `w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 transform hover:scale-110 active:scale-95`
    }
  }), [isDark]);

  // Calculate duration between times
  const calculateDuration = useCallback((startTime: string, endTime: string): string => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, []);

  // Get unique period names with enhanced data
  const uniquePeriods = useMemo(() => {
    const periods = new Map<string, any[]>();
    
    timings.forEach((timing: any) => {
      if (!periods.has(timing.name)) {
        periods.set(timing.name, []);
      }
      periods.get(timing.name)!.push(timing);
    });
    
    return Array.from(periods.entries())
      .map(([name, periodTimings]) => {
        const firstTiming = periodTimings[0];
        const timingType = TIMING_TYPES.find(t => t.value === firstTiming?.type) || TIMING_TYPES[0];
        
        return {
          name,
          timings: periodTimings.sort((a, b) => DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek)),
          type: timingType,
          startTime: firstTiming?.startTime || '',
          endTime: firstTiming?.endTime || '',
          duration: firstTiming?.startTime && firstTiming?.endTime ? 
            calculateDuration(firstTiming.startTime, firstTiming.endTime) : '0h'
        };
      })
      .sort((a, b) => {
        // Sort by start time chronologically
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [timings, calculateDuration]);

  // Enhanced handlers
  const toggleEditingDay = useCallback((day: string) => {
    setEditingDays(prev => {
      const newDays = new Set(prev);
      if (newDays.has(day)) {
        newDays.delete(day);
      } else {
        newDays.add(day);
      }
      return newDays;
    });
  }, []);

  const addTimingRow = useCallback(() => {
    const id = Date.now().toString();
    setTimingRows(prev => [...prev, { id }]);
    setTimingDrafts(prev => ({ 
      ...prev, 
      [id]: { 
        name: '', 
        type: 'period', 
        startTime: '09:00', 
        endTime: '10:00', 
        days: new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) 
      } 
    }));
  }, []);

  const toggleDay = useCallback((rowId: string, day: string) => {
    setTimingDrafts(prev => {
      const draft = prev[rowId] || { days: new Set() };
      const days = new Set(draft.days);
      if (days.has(day)) {
        days.delete(day);
      } else {
        days.add(day);
      }
      return { ...prev, [rowId]: { ...draft, days } };
    });
  }, []);

  const updateDraft = useCallback((rowId: string, field: string, value: any) => {
    setTimingDrafts(prev => ({ ...prev, [rowId]: { ...prev[rowId], [field]: value } }));
  }, []);

  const saveTimingRow = useCallback(async (rowId: string) => {
    const draft = timingDrafts[rowId];
    if (!draft?.name?.trim()) {
      showToast({ type: 'error', title: 'Error', message: 'Please enter a period name' });
      return;
    }
    
    setTimingRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: true } : r));
    
    try {
      const days = Array.from(draft.days || new Set());
      if (days.length === 0) {
        showToast({ type: 'error', title: 'Error', message: 'Please select at least one day' });
        return;
      }

      const promises = days.map((day, index) => 
        timingsApi.create({
          name: draft.name.trim(),
          type: draft.type || 'period',
          startTime: draft.startTime,
          endTime: draft.endTime,
          dayOfWeek: day,
          sortOrder: index,
          isActive: true,
        })
      );

      await Promise.all(promises);
      await fetchAll();
      setTimingRows(prev => prev.filter((r: any) => r.id !== rowId));
      setTimingDrafts(prev => {
        const { [rowId]: _, ...rest } = prev;
        return rest;
      });
      
      showToast({ type: 'success', title: 'Success', message: 'Timing saved successfully' });
    } catch (error: any) {
      setTimingRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: false } : r));
      showToast({ type: 'error', title: 'Error', message: 'Failed to save timing' });
    }
  }, [timingDrafts, timingsApi, fetchAll]);

  const deleteTimingRow = useCallback((rowId: string) => {
    setTimingRows(prev => prev.filter((r: any) => r.id !== rowId));
    setTimingDrafts(prev => {
      const { [rowId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const deleteEntirePeriod = useCallback(async (periodName: string) => {
    if (!confirm(`Delete "${periodName}" for all days? This cannot be undone.`)) return;
    
    try {
      const periodTimings = timings.filter((t: any) => t.name === periodName);
      const deletePromises = periodTimings.map((t: any) => timingsApi.delete(t.id));
      await Promise.all(deletePromises);
      
      await fetchAll();
      showToast({ type: 'success', title: 'Success', message: 'Period deleted successfully' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete period' });
    }
  }, [timings, timingsApi, fetchAll]);

  const saveTimingEdit = useCallback(async (timing: any) => {
    if (!editingTiming?.name?.trim()) {
      showToast({ type: 'error', title: 'Error', message: 'Please enter a period name' });
      return;
    }
    
    setSaving(true);
    try {
      const currentTimings = timings.filter((t: any) => t.name === timing.name);
      const currentDays = new Set(currentTimings.map((t: any) => t.dayOfWeek));
      
      const daysToAdd = Array.from(editingDays).filter(day => !currentDays.has(day));
      const daysToRemove = Array.from(currentDays).filter(day => !editingDays.has(day));
      
      if (daysToRemove.length > 0) {
        const deletePromises = daysToRemove.map(day => {
          const timingToDelete = currentTimings.find(t => t.dayOfWeek === day);
          return timingToDelete ? timingsApi.delete(timingToDelete.id) : Promise.resolve();
        });
        await Promise.all(deletePromises);
      }
      
      const updatePromises = Array.from(editingDays).map((day, index) => {
        const existingTiming = currentTimings.find(t => t.dayOfWeek === day);
        if (existingTiming) {
          return timingsApi.update(existingTiming.id, { 
            ...existingTiming, 
            name: editingTiming.name.trim(), 
            type: editingTiming.type || 'period',
            startTime: editingTiming.startTime, 
            endTime: editingTiming.endTime,
            sortOrder: index
          });
        } else {
          return timingsApi.create({
            name: editingTiming.name.trim(),
            type: editingTiming.type || 'period',
            startTime: editingTiming.startTime,
            endTime: editingTiming.endTime,
            dayOfWeek: day,
            sortOrder: index,
            isActive: true
          });
        }
      });
      
      await Promise.all(updatePromises);
      await fetchAll();
      setEditingTiming(null);
      setEditingDays(new Set());
      
      showToast({ type: 'success', title: 'Success', message: 'Timing updated successfully' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update timing' });
    } finally {
      setSaving(false);
    }
  }, [timings, editingDays, editingTiming, timingsApi, fetchAll]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} p-6`}>
      {/* Beautiful Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/25' : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-2xl shadow-blue-500/25'
              }`}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <div>
              <h1 className={`text-4xl font-bold bg-gradient-to-r ${
                isDark ? 'from-blue-400 via-purple-400 to-pink-400' : 'from-blue-600 via-indigo-600 to-purple-600'
              } bg-clip-text text-transparent`}>
                Schedule & Timings
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Manage your school's daily schedule with ease
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addTimingRow}
            disabled={!canManageSettings}
            className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              isDark 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
            } ${!canManageSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Period
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Beautiful Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl overflow-hidden shadow-2xl ${
            isDark ? 'bg-slate-800/90 backdrop-blur-xl border border-slate-700' : 'bg-white/90 backdrop-blur-xl border border-gray-200'
          }`}
        >
          {/* Table Header */}
          <div className={`px-6 py-4 border-b ${
            isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50/80 border-gray-200'
          }`}>
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className={`col-span-3 font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Period Name
              </div>
              <div className={`col-span-2 font-bold text-sm text-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Type
              </div>
              <div className={`col-span-2 font-bold text-sm text-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Time Schedule
              </div>
              <div className={`col-span-1 font-bold text-sm text-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Duration
              </div>
              <div className={`col-span-3 font-bold text-sm text-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Days
              </div>
              <div className={`col-span-1 font-bold text-sm text-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Actions
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="max-h-[600px] overflow-y-auto">
            <AnimatePresence>
              {uniquePeriods.map((period, index) => {
                const isEditing = editingTiming?.name === period.name;
                const firstTiming = period.timings[0];
                
                return (
                  <motion.div
                    key={period.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`px-6 py-4 border-b transition-all duration-200 ${
                      isDark 
                        ? 'border-slate-700 hover:bg-slate-700/30' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Period Name */}
                      <div className="col-span-3">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editingTiming?.name || ''}
                            onChange={e => setEditingTiming({ ...editingTiming, name: e.target.value })}
                            className={`w-full px-4 py-2 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                              isDark 
                                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                            }`}
                            placeholder="Enter period name"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${period.type.gradient} text-white shadow-lg`}>
                              {period.type.icon}
                            </div>
                            <span className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {period.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Type */}
                      <div className="col-span-2 text-center">
                        {isEditing ? (
                          <select
                            value={editingTiming?.type || 'period'}
                            onChange={e => setEditingTiming({ ...editingTiming, type: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                              isDark 
                                ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500' 
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                            }`}
                          >
                            {TIMING_TYPES.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${period.type.gradient} text-white shadow-md`}>
                            {period.type.label}
                          </span>
                        )}
                      </div>

                      {/* Time Schedule */}
                      <div className="col-span-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={editingTiming?.startTime || ''}
                              onChange={e => setEditingTiming({ ...editingTiming, startTime: e.target.value })}
                              className={`flex-1 px-2 py-2 rounded-xl border-2 text-sm font-mono font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                isDark 
                                  ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500' 
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                              }`}
                            />
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>to</span>
                            <input
                              type="time"
                              value={editingTiming?.endTime || ''}
                              onChange={e => setEditingTiming({ ...editingTiming, endTime: e.target.value })}
                              className={`flex-1 px-2 py-2 rounded-xl border-2 text-sm font-mono font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                isDark 
                                  ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500' 
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                              }`}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className={`text-sm font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              {period.startTime}
                            </span>
                            <span className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>→</span>
                            <span className={`text-sm font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              {period.endTime}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="col-span-1 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                          isDark 
                            ? 'bg-slate-700 text-slate-300' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {period.duration}
                        </span>
                      </div>

                      {/* Days */}
                      <div className="col-span-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {DAYS_OF_WEEK.map(day => {
                            const hasTiming = period.timings.some((t: any) => t.dayOfWeek === day);
                            const isSelected = isEditing ? editingDays.has(day) : hasTiming;
                            
                            return (
                              <motion.button
                                key={day}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => isEditing ? toggleEditingDay(day) : null}
                                disabled={!isEditing}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                                  isSelected
                                    ? `bg-gradient-to-br ${period.type.gradient} text-white shadow-md`
                                    : isDark 
                                      ? 'bg-slate-700 text-slate-400 border-2 border-slate-600' 
                                      : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                                } ${!isEditing && 'cursor-default'}`}
                              >
                                {day.slice(0, 2)}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => saveTimingEdit(firstTiming)}
                                disabled={saving}
                                className={`w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center font-bold text-sm shadow-lg hover:bg-green-600 transition-colors ${
                                  saving ? 'animate-pulse' : ''
                                }`}
                              >
                                {saving ? '...' : '✓'}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setEditingTiming(null);
                                  setEditingDays(new Set());
                                }}
                                className="w-8 h-8 rounded-lg bg-gray-400 text-white flex items-center justify-center font-bold text-sm shadow-lg hover:bg-gray-500 transition-colors"
                              >
                                ✕
                              </motion.button>
                            </>
                          ) : (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  const currentDays = new Set(period.timings.map((t: any) => t.dayOfWeek));
                                  setEditingDays(currentDays);
                                  setEditingTiming(firstTiming);
                                }}
                                disabled={!canManageSettings}
                                className={`w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-lg hover:bg-blue-600 transition-colors ${
                                  !canManageSettings ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                ✎
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => deleteEntirePeriod(period.name)}
                                disabled={!canManageSettings}
                                className={`w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center font-bold text-sm shadow-lg hover:bg-red-600 transition-colors ${
                                  !canManageSettings ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                🗑
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* New Period Rows */}
              {timingRows.map((row: any, index) => {
                const draft = timingDrafts[row.id];
                const selectedType = TIMING_TYPES.find(t => t.value === draft?.type) || TIMING_TYPES[0];
                
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`px-6 py-4 border-b transition-all duration-200 ${
                      isDark 
                        ? 'border-slate-700 bg-gradient-to-r from-blue-900/20 to-purple-900/20' 
                        : 'border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Period Name */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${selectedType.gradient} text-white shadow-lg animate-pulse`}>
                            {selectedType.icon}
                          </div>
                          <input
                            value={draft?.name || ''}
                            onChange={e => updateDraft(row.id, 'name', e.target.value)}
                            placeholder="New period name"
                            className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                              isDark 
                                ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-green-500' 
                                : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Type */}
                      <div className="col-span-2 text-center">
                        <select
                          value={draft?.type || 'period'}
                          onChange={e => updateDraft(row.id, 'type', e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                            isDark 
                              ? 'bg-slate-700/50 border-slate-600 text-white focus:border-green-500' 
                              : 'bg-white/80 border-gray-300 text-gray-900 focus:border-green-500'
                          }`}
                        >
                          {TIMING_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Time Schedule */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={draft?.startTime || ''}
                            onChange={e => updateDraft(row.id, 'startTime', e.target.value)}
                            className={`flex-1 px-2 py-2 rounded-xl border-2 text-sm font-mono font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                              isDark 
                                ? 'bg-slate-700/50 border-slate-600 text-white focus:border-green-500' 
                                : 'bg-white/80 border-gray-300 text-gray-900 focus:border-green-500'
                            }`}
                          />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>to</span>
                          <input
                            type="time"
                            value={draft?.endTime || ''}
                            onChange={e => updateDraft(row.id, 'endTime', e.target.value)}
                            className={`flex-1 px-2 py-2 rounded-xl border-2 text-sm font-mono font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                              isDark 
                                ? 'bg-slate-700/50 border-slate-600 text-white focus:border-green-500' 
                                : 'bg-white/80 border-gray-300 text-gray-900 focus:border-green-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="col-span-1 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                          isDark 
                            ? 'bg-slate-700/50 text-slate-300' 
                            : 'bg-gray-100/80 text-gray-700'
                        }`}>
                          {draft?.startTime && draft?.endTime ? calculateDuration(draft.startTime, draft.endTime) : '0h 0m'}
                        </span>
                      </div>

                      {/* Days */}
                      <div className="col-span-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {DAYS_OF_WEEK.map(day => {
                            const isSelected = draft?.days?.has(day) || false;
                            
                            return (
                              <motion.button
                                key={day}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleDay(row.id, day)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md'
                                    : isDark 
                                      ? 'bg-slate-700/50 text-slate-400 border-2 border-slate-600 hover:border-green-500' 
                                      : 'bg-gray-100/50 text-gray-600 border-2 border-gray-300 hover:border-green-500'
                                }`}
                              >
                                {day.slice(0, 2)}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => saveTimingRow(row.id)}
                            disabled={row.saving || !draft?.name?.trim()}
                            className={`w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center font-bold text-sm shadow-lg hover:bg-green-600 transition-colors ${
                              row.saving || !draft?.name?.trim() ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {row.saving ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              '✓'
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteTimingRow(row.id)}
                            className="w-8 h-8 rounded-lg bg-red-400 text-white flex items-center justify-center font-bold text-sm shadow-lg hover:bg-red-500 transition-colors"
                          >
                            ✕
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty State */}
            {uniquePeriods.length === 0 && timingRows.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16"
              >
                <div className={`text-center ${
                  isDark ? 'bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-700' : 'bg-white/50 rounded-3xl border-2 border-dashed border-gray-300'
                }`}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className={`w-20 h-20 mx-auto mb-6 rounded-full border-4 ${
                      isDark ? 'border-blue-500 border-t-transparent' : 'border-blue-400 border-t-transparent'
                    }`}
                  />
                  <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    No periods configured yet
                  </h3>
                  <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Start by adding your first class period or break time
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addTimingRow}
                    className={`px-8 py-3 rounded-2xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                    }`}
                  >
                    Create Your First Period
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${
            isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50/80 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-semibold">{uniquePeriods.length}</span> periods configured • 
                <span className="font-semibold ml-1">{timingRows.length}</span> pending
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-sm"></div>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300 shadow-sm"></div>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Inactive</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
