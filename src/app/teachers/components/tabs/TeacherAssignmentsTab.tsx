// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';

const EMPTY = { title: '', description: '', subject: '', classId: '', sectionId: '', type: 'homework', dueDate: '', totalMarks: 100, instructions: '', status: 'active', academicYearId: '' };
const TYPE_COLORS: Record<string, string> = { homework: 'bg-blue-500/20 text-blue-400', project: 'bg-purple-500/20 text-purple-400', test: 'bg-red-500/20 text-red-400', quiz: 'bg-orange-500/20 text-orange-400' };
const STATUS_COLORS: Record<string, string> = { active: 'bg-green-500/20 text-green-400', closed: 'bg-gray-500/20 text-gray-400', graded: 'bg-blue-500/20 text-blue-400' };

interface Props { teacherId: string; schoolConfig: any; isDark: boolean; txt: string; sub: string; card: string; }

export default function TeacherAssignmentsTab({ teacherId, schoolConfig, isDark, txt, sub, card }: Props) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('');
  const [viewSubmissions, setViewSubmissions] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionStats, setSubmissionStats] = useState<any>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', grade: '', feedback: '' });

  const classes = schoolConfig?.classes || [];
  const sections = (schoolConfig?.sections || []).filter((s: any) => !form.classId || s.classId === form.classId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '30' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/teachers/${teacherId}/assignments?${params}`);
      if (res.ok) { const d = await res.json(); setAssignments(d.assignments || []); setTotal(d.total || 0); }
    } finally { setLoading(false); }
  }, [teacherId, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const loadSubmissions = useCallback(async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/assignments/${assignmentId}/submissions`);
      if (res.ok) {
        const d = await res.json();
        setSubmissions(d.submissions || []);
        setSubmissionStats(d.stats);
        setViewSubmissions(d.assignment);
      }
    } finally { setLoadingSubmissions(false); }
  }, [teacherId]);

  const handleSave = async () => {
    if (!form.title || !form.subject || !form.classId || !form.dueDate) return;
    setSaving(true);
    try {
      const url = editItem ? `/api/teachers/${teacherId}/assignments/${editItem.id}` : `/api/teachers/${teacherId}/assignments`;
      const res = await fetch(url, { method: editItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setShowForm(false); setEditItem(null); setForm({ ...EMPTY }); load(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    await fetch(`/api/teachers/${teacherId}/assignments/${id}`, { method: 'DELETE' });
    load();
  };

  const handleGrade = async (submissionId: string) => {
    const res = await fetch(`/api/teachers/${teacherId}/assignments/${viewSubmissions?.id}/submissions`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, ...gradeForm, marks: parseFloat(gradeForm.marks) || 0 }),
    });
    if (res.ok) { setGradingId(null); setGradeForm({ marks: '', grade: '', feedback: '' }); loadSubmissions(viewSubmissions?.id); }
  };

  const className = (id: string) => classes.find((c: any) => c.id === id)?.name || id;

  const openNew = () => { setEditItem(null); setForm({ ...EMPTY, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] }); setShowForm(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ ...EMPTY, ...item }); setShowForm(true); };

  if (viewSubmissions) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewSubmissions(null)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>← Back</button>
          <div>
            <h3 className={`text-base font-semibold ${txt}`}>{viewSubmissions.title}</h3>
            <p className={`text-xs ${sub}`}>{viewSubmissions.subject} · Due: {viewSubmissions.dueDate} · {viewSubmissions.totalMarks} marks</p>
          </div>
        </div>
        {submissionStats && (
          <div className={`p-3 rounded-xl border ${card} grid grid-cols-4 gap-3 text-center`}>
            {[{ l: 'Total', v: submissionStats.total, c: 'text-blue-400' }, { l: 'Submitted', v: submissionStats.submitted, c: 'text-green-400' }, { l: 'Graded', v: submissionStats.graded, c: 'text-purple-400' }, { l: 'Avg Marks', v: submissionStats.avgMarks?.toFixed(1) || '—', c: 'text-orange-400' }].map(s => (
              <div key={s.l}><p className={`text-xl font-bold ${s.c}`}>{s.v}</p><p className={`text-xs ${sub}`}>{s.l}</p></div>
            ))}
          </div>
        )}
        {loadingSubmissions ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
          <div className="space-y-2">
            {submissions.length === 0 ? <div className={`text-center py-12 ${sub}`}><p className="text-3xl mb-2">📋</p><p>No submissions yet</p></div> :
              submissions.map(s => (
                <div key={s.id} className={`p-3 rounded-xl border ${card}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{s.student?.name?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${txt}`}>{s.student?.name}</p>
                      <p className={`text-xs ${sub}`}>Roll: {s.student?.rollNo} · {s.status} {s.submittedAt ? `· Submitted: ${s.submittedAt}` : ''}</p>
                    </div>
                    {s.marks != null && <div className="text-center"><p className="text-sm font-bold text-green-400">{s.marks}/{viewSubmissions.totalMarks}</p>{s.grade && <p className={`text-xs ${sub}`}>{s.grade}</p>}</div>}
                    {gradingId === s.id ? (
                      <div className="flex items-center gap-2">
                        <input value={gradeForm.marks} onChange={e => setGradeForm(f => ({ ...f, marks: e.target.value }))} placeholder="Marks" className={`w-16 px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                        <input value={gradeForm.grade} onChange={e => setGradeForm(f => ({ ...f, grade: e.target.value }))} placeholder="Grade" className={`w-12 px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                        <button onClick={() => handleGrade(s.id)} className="px-2 py-1 rounded bg-green-600 text-white text-xs">✓</button>
                        <button onClick={() => setGradingId(null)} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setGradingId(s.id); setGradeForm({ marks: s.marks?.toString() || '', grade: s.grade || '', feedback: s.feedback || '' }); }} className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-colors">Grade</button>
                    )}
                  </div>
                  {s.feedback && <p className={`text-xs mt-1.5 pl-11 ${sub}`}>💬 {s.feedback}</p>}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className={`text-base font-semibold ${txt}`}>Assignments <span className={`text-sm font-normal ${sub}`}>({total})</span></h3>
        <button onClick={openNew} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">+ New Assignment</button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['', 'active', 'closed', 'graded'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}`}>{s || 'All'}</button>
        ))}
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={`px-2 py-1 rounded-lg border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="">All Types</option>
          {['homework', 'project', 'test', 'quiz'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {showForm && (
        <div className={`p-4 rounded-xl border ${card} space-y-3`}>
          <div className="flex items-center justify-between"><h4 className={`text-sm font-semibold ${txt}`}>{editItem ? 'Edit Assignment' : 'New Assignment'}</h4><button onClick={() => { setShowForm(false); setEditItem(null); }} className={`text-xs ${sub} hover:text-red-400`}>✕</button></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[{ key: 'title', label: 'Title *', type: 'text' }, { key: 'subject', label: 'Subject *', type: 'text' }, { key: 'dueDate', label: 'Due Date *', type: 'date' }, { key: 'totalMarks', label: 'Total Marks', type: 'number' }].map(f => (
              <div key={f.key}><label className={`text-xs ${sub}`}>{f.label}</label><input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /></div>
            ))}
            <div><label className={`text-xs ${sub}`}>Class *</label><select value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, sectionId: '' }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}><option value="">Select Class</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className={`text-xs ${sub}`}>Section</label><select value={form.sectionId} onChange={e => setForm(p => ({ ...p, sectionId: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}><option value="">All</option>{sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className={`text-xs ${sub}`}>Type</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>{['homework', 'project', 'test', 'quiz'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          <div><label className={`text-xs ${sub}`}>Instructions</label><textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} rows={2} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} /></div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : editItem ? 'Update' : 'Create Assignment'}</button>
            <button onClick={() => { setShowForm(false); setEditItem(null); }} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className={`text-center py-16 ${sub}`}><p className="text-4xl mb-3">📝</p><p className="font-medium">No assignments found</p><p className="text-xs mt-1">Create your first assignment to get started</p></div>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => {
            const dueDate = new Date(a.dueDate);
            const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
            const isOverdue = diffDays < 0 && a.status === 'active';
            return (
              <div key={a.id} className={`p-4 rounded-xl border ${card} hover:border-blue-500/30 transition-colors ${isOverdue ? isDark ? 'border-red-500/30' : 'border-red-200' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-semibold ${txt}`}>{a.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[a.type] || 'bg-gray-500/20 text-gray-400'}`}>{a.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || 'bg-gray-500/20 text-gray-400'}`}>{a.status}</span>
                      {isOverdue && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Overdue</span>}
                    </div>
                    <p className={`text-xs mt-0.5 ${sub}`}>📖 {a.subject} · 🏫 {className(a.classId)} · 📅 Due: {a.dueDate} · ⭐ {a.totalMarks} marks</p>
                    <div className={`flex items-center gap-3 mt-2 text-xs ${sub}`}>
                      <span className="text-green-400">✅ {a.stats?.submitted || 0} submitted</span>
                      <span className="text-blue-400">📊 {a.stats?.graded || 0} graded</span>
                      <span className="text-orange-400">⏳ {a.stats?.pending || 0} pending</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => loadSubmissions(a.id)} className="px-2.5 py-1 rounded-lg text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors">Submissions</button>
                    <button onClick={() => openEdit(a)} className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>✏️</button>
                    <button onClick={() => handleDelete(a.id)} className="px-2.5 py-1 rounded-lg text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
