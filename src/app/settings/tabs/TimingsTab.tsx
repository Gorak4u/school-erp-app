'use client';

import React, { useState, useMemo } from 'react';
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

// Days of week
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TimingsTab: React.FC<TimingsTabProps> = ({
  isDark,
  canManageSettings,
  timings,
  timingsApi,
  openCreate,
  openEdit,
  handleDelete,
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

  // Add state for editing days
  const [editingDays, setEditingDays] = useState<Set<string>>(new Set());

  // Toggle editing day selection
  const toggleEditingDay = (day: string) => {
    setEditingDays(prev => {
      const newDays = new Set(prev);
      if (newDays.has(day)) {
        newDays.delete(day);
      } else {
        newDays.add(day);
      }
      return newDays;
    });
  };

  // Get unique period names
  const uniquePeriods = useMemo(() => {
    const periods = new Set(timings.map((t: any) => t.name));
    return Array.from(periods).sort();
  }, [timings]);

  // Add new timing row
  const addTimingRow = () => {
    const id = Date.now().toString();
    setTimingRows(prev => [...prev, { id }]);
    setTimingDrafts(prev => ({ 
      ...prev, 
      [id]: { 
        name: '', 
        type: 'period', 
        startTime: '09:00', 
        endTime: '10:00', 
        breakTime: '', 
        days: new Set() 
      } 
    }));
  };

  // Toggle day selection for a timing
  const toggleDay = (rowId: string, day: string) => {
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
  };

  // Update draft field
  const updateDraft = (rowId: string, field: string, value: any) => {
    setTimingDrafts(prev => ({ ...prev, [rowId]: { ...prev[rowId], [field]: value } }));
  };

  // Save timing row
  const saveTimingRow = async (rowId: string) => {
    const draft = timingDrafts[rowId];
    if (!draft?.name?.trim()) return;
    setTimingRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: true } : r));
    try {
      const days = Array.from(draft.days || new Set());
      if (days.length === 0) {
        showToast({ type: 'error', title: 'Error', message: 'Please select at least one day' });
        return;
      }

      // Create timing for each selected day
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
      showToast({ type: 'success', title: 'Timing saved successfully' });
    } catch {
      setTimingRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: false } : r));
      showToast({ type: 'error', title: 'Failed to save timing' });
    }
  };

  // Delete entire period (all days)
  const deleteEntirePeriod = async (periodName: string) => {
    if (!confirm(`Delete "${periodName}" for all days? This cannot be undone.`)) return;
    try {
      // Get all timings for this period name
      const periodTimings = timings.filter((t: any) => t.name === periodName);
      
      // Delete all timing records for this period
      const deletePromises = periodTimings.map((t: any) => timingsApi.delete(t.id));
      await Promise.all(deletePromises);
      
      await fetchAll();
      showToast({ type: 'success', title: 'Period deleted', message: `${periodName} has been deleted for all days` });
    } catch (error: any) {
      console.error('Error deleting period:', error);
      showToast({ type: 'error', title: 'Failed to delete period', message: error.message });
    }
  };

  // Delete timing row (for draft rows)
  const deleteTimingRow = (rowId: string) => {
    setTimingRows(prev => prev.filter((r: any) => r.id !== rowId));
    setTimingDrafts(prev => {
      const { [rowId]: _, ...rest } = prev;
      return rest;
    });
  };

  // Update existing timing
  const saveTimingEdit = async (timing: any) => {
    if (!editingTiming?.name?.trim()) return;
    setSaving(true);
    try {
      // Get current timings for this period
      const currentTimings = timings.filter((t: any) => t.name === timing.name);
      const currentDays = new Set(currentTimings.map((t: any) => t.dayOfWeek));
      
      // Determine days to add and remove
      const daysToAdd = Array.from(editingDays).filter(day => !currentDays.has(day));
      const daysToRemove = Array.from(currentDays).filter(day => !editingDays.has(day));
      
      // Remove timings for deselected days
      if (daysToRemove.length > 0) {
        const deletePromises = daysToRemove.map(day => {
          const timingToDelete = currentTimings.find(t => t.dayOfWeek === day);
          return timingToDelete ? timingsApi.delete(timingToDelete.id) : Promise.resolve();
        });
        await Promise.all(deletePromises);
      }
      
      // Update existing timings and add new ones
      const updatePromises = Array.from(editingDays).map((day, index) => {
        const existingTiming = currentTimings.find(t => t.dayOfWeek === day);
        if (existingTiming) {
          // Update existing timing
          return timingsApi.update(existingTiming.id, { 
            ...existingTiming, 
            name: editingTiming.name.trim(), 
            type: editingTiming.type || 'period',
            startTime: editingTiming.startTime, 
            endTime: editingTiming.endTime,
            sortOrder: index
          });
        } else {
          // Create new timing for this day
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
      showToast({ type: 'success', title: 'Timing updated successfully' });
    } catch (error: any) {
      console.error('Error updating timing:', error);
      showToast({ type: 'error', title: 'Failed to update timing', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={card}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={heading}>School Timings</h3>
        <button 
          className={btnPrimary}
          disabled={!canManageSettings}
          onClick={addTimingRow}
        >
          + Add Period
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full text-xs border-collapse ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <thead>
            <tr>
              <th className={`px-3 py-2 text-left font-semibold border min-w-[120px] ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>
                Type
              </th>
              <th className={`px-3 py-2 text-left font-semibold border min-w-[150px] ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>
                Period
              </th>
              <th className={`px-3 py-2 text-center font-semibold border min-w-[100px] ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>
                Start Time
              </th>
              <th className={`px-3 py-2 text-center font-semibold border min-w-[100px] ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>
                End Time
              </th>
              {DAYS_OF_WEEK.map(day => (
                <th key={day} className={`px-2 py-2 text-center font-semibold border w-20 ${isDark ? 'border-gray-500 bg-blue-900/30 text-blue-300' : 'border-gray-400 bg-blue-50 text-blue-700'}`}>
                  {day.slice(0, 3)}
                </th>
              ))}
              <th className={`px-2 py-2 text-center font-semibold border w-20 ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Existing Period Rows */}
            {uniquePeriods.map((periodName: string) => {
              const periodTimings = timings.filter((t: any) => t.name === periodName);
              const firstTiming = periodTimings[0];
              const isEditing = editingTiming?.id === firstTiming?.id;
              
              return (
                <tr key={periodName} className={`${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50'}`}>
                  <td className={`px-3 py-2 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {isEditing ? (
                      <select
                        value={editingTiming?.type || 'period'}
                        onChange={e => setEditingTiming({ ...editingTiming, type: e.target.value })}
                        className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="period">Period</option>
                        <option value="break">Break</option>
                        <option value="lunch">Lunch</option>
                        <option value="assembly">Assembly</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {firstTiming?.type || 'period'}
                      </span>
                    )}
                  </td>
                  <td className={`px-3 py-2 border font-medium ${isDark ? 'border-gray-600 bg-gray-800/40 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-800'}`}>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingTiming?.name || ''}
                        onChange={e => setEditingTiming({ ...editingTiming, name: e.target.value })}
                        className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    ) : (
                      periodName
                    )}
                  </td>
                  <td className={`px-3 py-2 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editingTiming?.startTime || ''}
                        onChange={e => setEditingTiming({ ...editingTiming, startTime: e.target.value })}
                        className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    ) : (
                      firstTiming?.startTime || '-'
                    )}
                  </td>
                  <td className={`px-3 py-2 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editingTiming?.endTime || ''}
                        onChange={e => setEditingTiming({ ...editingTiming, endTime: e.target.value })}
                        className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    ) : (
                      firstTiming?.endTime || '-'
                    )}
                  </td>
                  {DAYS_OF_WEEK.map(day => (
                    <td key={day} className={`px-2 py-2 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editingDays.has(day)}
                          onChange={() => toggleEditingDay(day)}
                          className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                        />
                      ) : (
                        <div className={`w-2 h-2 rounded-full mx-auto ${periodTimings.some(t => t.dayOfWeek === day) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      )}
                    </td>
                  ))}
                  <td className={`px-2 py-2 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => saveTimingEdit(firstTiming)} disabled={saving} className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-40">✓</button>
                        <button onClick={() => {
                          setEditingTiming(null);
                          setEditingDays(new Set());
                        }} className="w-5 h-5 flex items-center justify-center rounded bg-gray-400 hover:bg-gray-500 text-white text-xs font-bold">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => {
                          const periodTimings = timings.filter((t: any) => t.name === periodName);
                          const currentDays = new Set(periodTimings.map((t: any) => t.dayOfWeek));
                          setEditingDays(currentDays);
                          setEditingTiming(firstTiming);
                        }} title="Edit period" className={`text-xs px-0.5 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>✎</button>
                        <button onClick={() => deleteEntirePeriod(periodName)} title="Delete period" className={`text-xs px-0.5 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}>✕</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* New Draft Rows */}
            {timingRows.map((row: any) => {
              const draft = timingDrafts[row.id];
              return (
                <tr key={row.id} className={isDark ? 'bg-blue-900/10' : 'bg-blue-50'}>
                  <td className={`px-3 py-2 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <select
                      value={draft?.type || 'period'}
                      onChange={e => updateDraft(row.id, 'type', e.target.value)}
                      className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="period">Period</option>
                      <option value="break">Break</option>
                      <option value="lunch">Lunch</option>
                      <option value="assembly">Assembly</option>
                    </select>
                  </td>
                  <td className={`px-3 py-2 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      value={draft?.name || ''}
                      onChange={e => updateDraft(row.id, 'name', e.target.value)}
                      placeholder="Period name"
                      className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </td>
                  <td className={`px-3 py-2 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="time"
                      value={draft?.startTime || ''}
                      onChange={e => updateDraft(row.id, 'startTime', e.target.value)}
                      className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </td>
                  <td className={`px-3 py-2 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="time"
                      value={draft?.endTime || ''}
                      onChange={e => updateDraft(row.id, 'endTime', e.target.value)}
                      className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </td>
                  {DAYS_OF_WEEK.map(day => (
                    <td key={day} className={`px-2 py-2 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={draft?.days?.has(day) || false}
                        onChange={() => toggleDay(row.id, day)}
                        className="w-4 h-4 rounded accent-green-500 cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className={`px-2 py-2 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <div className="flex items-center justify-center gap-0.5">
                      <button 
                        onClick={() => saveTimingRow(row.id)} 
                        disabled={row.saving || !draft?.name?.trim()}
                        className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-40"
                      >✓</button>
                      <button onClick={() => deleteTimingRow(row.id)} className="w-5 h-5 flex items-center justify-center rounded bg-red-400 hover:bg-red-500 text-white text-xs font-bold">✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {timings.length === 0 && timingRows.length === 0 && (
          <div className={`text-center py-8 rounded-lg border border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No periods configured</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Click "Add Period" to create your first period</p>
          </div>
        )}
      </div>
    </div>
  );
};
