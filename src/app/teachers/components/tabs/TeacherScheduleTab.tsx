// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const EMPTY_ENTRY = { classId: '', sectionId: '', subject: '', dayOfWeek: '', periodNumber: 1, startTime: '', endTime: '', roomNumber: '', academicYearId: '' };

interface Props { teacherId: string; schoolConfig: any; isDark: boolean; txt: string; sub: string; card: string; }

export default function TeacherScheduleTab({ teacherId, schoolConfig, isDark, txt, sub, card }: Props) {
  const [timetable, setTimetable] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_ENTRY });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/schedule`);
      if (res.ok) {
        const data = await res.json();
        setTimetable(data.timetable || {});
      }
    } finally { setLoading(false); }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  const classes = schoolConfig?.classes || [];
  const sections = schoolConfig?.sections || [];
  const academicYears = schoolConfig?.academicYears || [];
  const timings = schoolConfig?.timings || [];

  const filteredSections = form.classId ? sections.filter((s: any) => s.classId === form.classId) : sections;

  const handleSave = async () => {
    if (!form.classId || !form.subject || !form.dayOfWeek || !form.startTime || !form.endTime) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowForm(false); setForm({ ...EMPTY_ENTRY }); load(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (scheduleId: string) => {
    await fetch(`/api/teachers/${teacherId}/schedule?scheduleId=${scheduleId}`, { method: 'DELETE' });
    load();
  };

  const subjectColors = ['bg-blue-500/20 text-blue-400', 'bg-green-500/20 text-green-400', 'bg-purple-500/20 text-purple-400', 'bg-orange-500/20 text-orange-400', 'bg-pink-500/20 text-pink-400', 'bg-cyan-500/20 text-cyan-400'];
  const subjectColorMap: Record<string, string> = {};
  let colorIdx = 0;
  Object.values(timetable).flat().forEach((s: any) => {
    if (!subjectColorMap[s.subject]) subjectColorMap[s.subject] = subjectColors[colorIdx++ % subjectColors.length];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-semibold ${txt}`}>Weekly Timetable</h3>
        <div className="flex items-center gap-2">
          <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-blue-600 text-white' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>{v === 'grid' ? '⊞ Grid' : '≡ List'}</button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">+ Add Period</button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className={`p-4 rounded-xl border ${card} space-y-3`}>
          <h4 className={`text-sm font-semibold ${txt}`}>Add Schedule Entry</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={`text-xs ${sub}`}>Day *</label>
              <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <option value="">Select Day</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Period *</label>
              <select value={form.periodNumber} onChange={e => setForm(f => ({ ...f, periodNumber: +e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Class *</label>
              <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value, sectionId: '' }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <option value="">Select Class</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Section</label>
              <select value={form.sectionId} onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <option value="">All Sections</option>
                {filteredSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Subject *</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Room</label>
              <input value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. A101" className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Start Time *</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            <div>
              <label className={`text-xs ${sub}`}>End Time *</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Academic Year</label>
              <select value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <option value="">Select Year</option>
                {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.name || y.year}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ ...EMPTY_ENTRY }); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'grid' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className={`px-3 py-2 text-left ${sub} w-20`}>Period</th>
                {DAYS.map(d => <th key={d} className={`px-2 py-2 text-center ${sub} min-w-[100px]`}>{d.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => (
                <tr key={period} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className={`px-3 py-2 font-medium ${sub}`}>P{period}</td>
                  {DAYS.map(day => {
                    const slot = (timetable[day] || []).find((s: any) => s.periodNumber === period);
                    return (
                      <td key={day} className="px-2 py-1">
                        {slot ? (
                          <div className={`p-1.5 rounded-lg ${subjectColorMap[slot.subject] || 'bg-gray-500/20 text-gray-400'} group relative`}>
                            <p className="font-semibold text-xs truncate">{slot.subject}</p>
                            <p className="text-xs opacity-75">{slot.startTime}–{slot.endTime}</p>
                            {slot.roomNumber && <p className="text-xs opacity-60">Rm {slot.roomNumber}</p>}
                            <button onClick={() => handleDelete(slot.id)} className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity text-xs">✕</button>
                          </div>
                        ) : (
                          <div className={`h-12 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {DAYS.map(day => (
            <div key={day} className={`p-3 rounded-xl border ${card}`}>
              <h4 className={`text-sm font-semibold mb-2 ${txt}`}>{day}</h4>
              {(timetable[day] || []).length > 0 ? (
                <div className="space-y-1">
                  {(timetable[day] || []).sort((a: any, b: any) => a.periodNumber - b.periodNumber).map((s: any) => (
                    <div key={s.id} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${subjectColorMap[s.subject] || 'bg-gray-500/20 text-gray-400'}`}>P{s.periodNumber}</span>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${txt}`}>{s.subject}</span>
                        <span className={`text-xs ml-2 ${sub}`}>{s.startTime}–{s.endTime}{s.roomNumber ? ` · Rm ${s.roomNumber}` : ''}</span>
                      </div>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                    </div>
                  ))}
                </div>
              ) : <p className={`text-xs ${sub}`}>No classes</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
