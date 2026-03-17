// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';

interface Props { teacherId: string; schoolConfig: any; isDark: boolean; txt: string; sub: string; card: string; }

export default function TeacherAttendanceTab({ teacherId, schoolConfig, isDark, txt, sub, card }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [existingRecords, setExistingRecords] = useState<Record<string, string>>({});
  const [markings, setMarkings] = useState<Record<string, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'mark' | 'history'>('mark');
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const classes = schoolConfig?.classes || [];
  const sections = (schoolConfig?.sections || []).filter((s: any) => !selectedClass || s.classId === selectedClass);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams({ class: selectedClass, status: 'active', pageSize: '200' });
      if (selectedSection) params.set('section', selectedSection);
      const res = await fetch(`/api/students?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        // Load existing attendance for the selected date
        const attRes = await fetch(`/api/teachers/${teacherId}/attendance?date=${selectedDate}&classId=${selectedClass}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          const map: Record<string, string> = {};
          for (const r of attData.records || []) map[r.studentId] = r.status;
          setExistingRecords(map);
          setMarkings({ ...map });
        }
      }
    } finally { setLoadingStudents(false); }
  }, [selectedClass, selectedSection, selectedDate, teacherId]);

  const loadMonthlyStats = useCallback(async () => {
    const res = await fetch(`/api/teachers/${teacherId}/attendance?month=${thisMonth}`);
    if (res.ok) {
      const data = await res.json();
      setMonthlyStats(data.monthlyStats);
    }
  }, [teacherId, thisMonth]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/attendance?month=${thisMonth}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data.records || []);
      }
    } finally { setLoadingHistory(false); }
  }, [teacherId, thisMonth]);

  useEffect(() => { loadMonthlyStats(); }, [loadMonthlyStats]);
  useEffect(() => { if (selectedClass) loadStudents(); }, [selectedClass, selectedSection, selectedDate, loadStudents]);
  useEffect(() => { if (viewMode === 'history') loadHistory(); }, [viewMode, loadHistory]);

  const markAll = (status: string) => {
    const m: Record<string, string> = {};
    students.forEach(s => { m[s.id] = status; });
    setMarkings(m);
  };

  const handleSave = async () => {
    if (!selectedClass || students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map(s => ({ studentId: s.id, status: markings[s.id] || 'present', remarks: '' }));
      const res = await fetch(`/api/teachers/${teacherId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, classRef: selectedClass, section: selectedSection, subject: selectedSubject || 'General', records }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); loadMonthlyStats(); }
    } finally { setSaving(false); }
  };

  const statusColor = (s: string) => s === 'present' ? 'bg-green-500/20 text-green-400 border-green-500/30' : s === 'absent' ? 'bg-red-500/20 text-red-400 border-red-500/30' : s === 'late' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : `${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} border-transparent`;

  const presentCount = Object.values(markings).filter(v => v === 'present').length;
  const absentCount = Object.values(markings).filter(v => v === 'absent').length;
  const lateCount = Object.values(markings).filter(v => v === 'late').length;
  const totalMarked = Object.values(markings).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-semibold ${txt}`}>Attendance Management</h3>
        <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
          {(['mark', 'history'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === m ? 'bg-blue-600 text-white' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              {m === 'mark' ? '✅ Mark' : '📋 History'}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Stats Bar */}
      {monthlyStats && (
        <div className={`p-3 rounded-xl border ${card} grid grid-cols-4 gap-3 text-center`}>
          {[
            { label: 'Total', value: monthlyStats.total, color: 'text-blue-400' },
            { label: 'Present', value: monthlyStats.present, color: 'text-green-400' },
            { label: 'Absent', value: monthlyStats.absent, color: 'text-red-400' },
            { label: 'Rate', value: `${monthlyStats.rate}%`, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className={`text-xs ${sub}`}>{s.label} (This Month)</p>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'mark' ? (
        <>
          {/* Filters */}
          <div className={`p-4 rounded-xl border ${card} space-y-3`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={`text-xs ${sub}`}>Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={today} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`text-xs ${sub}`}>Class *</label>
                <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="">Select Class</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs ${sub}`}>Section</label>
                <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="">All Sections</option>
                  {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs ${sub}`}>Subject</label>
                <input value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} placeholder="e.g. Mathematics" className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
            </div>
          </div>

          {selectedClass && (
            <>
              {/* Bulk Actions & Summary */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${sub}`}>Mark all:</span>
                  {['present', 'absent', 'late'].map(s => (
                    <button key={s} onClick={() => markAll(s)} className={`px-3 py-1 rounded-lg text-xs font-medium border ${s === 'present' ? 'border-green-500/30 text-green-400 hover:bg-green-500/20' : s === 'absent' ? 'border-red-500/30 text-red-400 hover:bg-red-500/20' : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                {totalMarked > 0 && (
                  <div className={`flex items-center gap-3 text-xs ${sub}`}>
                    <span className="text-green-400 font-bold">{presentCount} P</span>
                    <span className="text-red-400 font-bold">{absentCount} A</span>
                    <span className="text-yellow-400 font-bold">{lateCount} L</span>
                    <span>/ {students.length} total</span>
                  </div>
                )}
              </div>

              {/* Student List */}
              {loadingStudents ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : students.length === 0 ? (
                <div className={`text-center py-12 ${sub}`}><p className="text-3xl mb-2">👥</p><p>No students found for this class</p></div>
              ) : (
                <div className="space-y-1.5">
                  {students.map(student => (
                    <div key={student.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${card} ${existingRecords[student.id] ? isDark ? 'border-blue-500/30' : 'border-blue-200' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {student.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${txt}`}>{student.name}</p>
                        <p className={`text-xs ${sub}`}>Roll: {student.rollNo} · {student.admissionNo}</p>
                      </div>
                      {existingRecords[student.id] && <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>Saved</span>}
                      <div className="flex gap-1.5 shrink-0">
                        {['present', 'absent', 'late'].map(s => (
                          <button key={s} onClick={() => setMarkings(m => ({ ...m, [student.id]: s }))} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${markings[student.id] === s ? statusColor(s) + ' border-current' : isDark ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {s === 'present' ? 'P' : s === 'absent' ? 'A' : 'L'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {students.length > 0 && (
                <div className="flex items-center gap-3 sticky bottom-0 pt-2">
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : saved ? '✅ Saved!' : `💾 Save Attendance (${totalMarked}/${students.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* History View */
        <div>
          {loadingHistory ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-1.5">
              {historyRecords.length === 0 ? (
                <div className={`text-center py-12 ${sub}`}><p className="text-3xl mb-2">📋</p><p>No attendance records this month</p></div>
              ) : Object.entries(
                historyRecords.reduce((acc: any, r: any) => { if (!acc[r.date]) acc[r.date] = []; acc[r.date].push(r); return acc; }, {})
              ).sort(([a], [b]) => b.localeCompare(a)).map(([date, records]: [string, any[]]) => {
                const p = records.filter(r => r.status === 'present').length;
                const tot = records.length;
                return (
                  <div key={date} className={`p-3 rounded-xl border ${card}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${txt}`}>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400 font-bold">{p}/{tot}</span>
                        <div className={`h-1.5 w-16 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${tot > 0 ? (p / tot) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
