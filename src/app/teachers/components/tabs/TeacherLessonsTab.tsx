// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';

const EMPTY = { title: '', subject: '', classId: '', sectionId: '', date: '', objectives: '', content: '', resources: '', activities: '', homework: '', notes: '', status: 'draft', academicYearId: '' };
const STATUS_COLORS: Record<string, string> = { draft: 'bg-gray-500/20 text-gray-400', published: 'bg-blue-500/20 text-blue-400', completed: 'bg-green-500/20 text-green-400' };

interface Props { teacherId: string; schoolConfig: any; isDark: boolean; txt: string; sub: string; card: string; }

export default function TeacherLessonsTab({ teacherId, schoolConfig, isDark, txt, sub, card }: Props) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editLesson, setEditLesson] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const classes = schoolConfig?.classes || [];
  const sections = (schoolConfig?.sections || []).filter((s: any) => !form.classId || s.classId === form.classId);
  const academicYears = schoolConfig?.academicYears || [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '30' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterClass) params.set('classId', filterClass);
      const res = await fetch(`/api/teachers/${teacherId}/lessons?${params}`);
      if (res.ok) { const d = await res.json(); setLessons(d.lessons || []); setTotal(d.total || 0); }
    } finally { setLoading(false); }
  }, [teacherId, filterStatus, filterClass]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.title || !form.subject || !form.classId || !form.date) return;
    setSaving(true);
    try {
      const url = editLesson ? `/api/teachers/${teacherId}/lessons/${editLesson.id}` : `/api/teachers/${teacherId}/lessons`;
      const res = await fetch(url, { method: editLesson ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setShowForm(false); setEditLesson(null); setForm({ ...EMPTY }); load(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson plan?')) return;
    await fetch(`/api/teachers/${teacherId}/lessons/${id}`, { method: 'DELETE' });
    load();
  };

  const openEdit = (lesson: any) => { setEditLesson(lesson); setForm({ ...EMPTY, ...lesson }); setShowForm(true); };
  const openNew = () => { setEditLesson(null); setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] }); setShowForm(true); };

  const className = (id: string) => classes.find((c: any) => c.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className={`text-base font-semibold ${txt}`}>Lesson Plans <span className={`text-sm font-normal ${sub}`}>({total})</span></h3>
        <button onClick={openNew} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">+ New Lesson Plan</button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`px-2 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="">All Status</option>
          {['draft', 'published', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className={`px-2 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="">All Classes</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={load} className={`px-2 py-1.5 rounded-lg border text-xs transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:text-white' : 'border-gray-300 text-gray-500 hover:text-gray-900'}`}>🔄 Refresh</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className={`p-4 rounded-xl border ${card} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-semibold ${txt}`}>{editLesson ? 'Edit Lesson Plan' : 'New Lesson Plan'}</h4>
            <button onClick={() => { setShowForm(false); setEditLesson(null); }} className={`text-xs ${sub} hover:text-red-400`}>✕ Cancel</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'title', label: 'Title *', type: 'text', placeholder: 'e.g. Introduction to Fractions' },
              { key: 'subject', label: 'Subject *', type: 'text', placeholder: 'e.g. Mathematics' },
              { key: 'date', label: 'Date *', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className={`text-xs ${sub}`}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
            ))}
            <div>
              <label className={`text-xs ${sub}`}>Class *</label>
              <select value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, sectionId: '' }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <option value="">Select Class</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Section</label>
              <select value={form.sectionId} onChange={e => setForm(p => ({ ...p, sectionId: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <option value="">All Sections</option>
                {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                {['draft', 'published', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* Text areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'objectives', label: 'Learning Objectives', placeholder: 'What students will learn...' },
              { key: 'content', label: 'Lesson Content', placeholder: 'Main content and topics...' },
              { key: 'activities', label: 'Activities', placeholder: 'Classroom activities...' },
              { key: 'resources', label: 'Resources', placeholder: 'Books, videos, materials...' },
              { key: 'homework', label: 'Homework', placeholder: 'Assignment for students...' },
              { key: 'notes', label: 'Teacher Notes', placeholder: 'Personal notes...' },
            ].map(f => (
              <div key={f.key}>
                <label className={`text-xs ${sub}`}>{f.label}</label>
                <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={2} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : editLesson ? 'Update' : 'Create Lesson Plan'}</button>
            <button onClick={() => { setShowForm(false); setEditLesson(null); }} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
          </div>
        </div>
      )}

      {/* Lessons List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : lessons.length === 0 ? (
        <div className={`text-center py-16 ${sub}`}><p className="text-4xl mb-3">📚</p><p className="font-medium">No lesson plans yet</p><p className="text-xs mt-1">Create your first lesson plan to get started</p></div>
      ) : (
        <div className="space-y-2">
          {lessons.map(l => (
            <div key={l.id} className={`p-4 rounded-xl border ${card} hover:border-blue-500/30 transition-colors`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-semibold ${txt}`}>{l.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status] || STATUS_COLORS.draft}`}>{l.status}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${sub}`}>📖 {l.subject} · 🏫 {className(l.classId)} · 📅 {l.date}</p>
                  {l.objectives && <p className={`text-xs mt-1.5 ${sub} line-clamp-2`}>🎯 {l.objectives}</p>}
                  {l.homework && <p className={`text-xs mt-0.5 ${sub}`}>📝 Homework: {l.homework}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(l)} className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>✏️ Edit</button>
                  <button onClick={() => handleDelete(l.id)} className="px-2.5 py-1 rounded-lg text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
