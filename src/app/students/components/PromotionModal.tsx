// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromotionModalProps {
  show: boolean;
  onClose: () => void;
  mode: 'single' | 'bulk' | 'class';
  selectedStudents: string[];
  students: any[];
  singleStudentId?: string;
  fromClass?: string;
  fromSection?: string;
  theme: string;
  onSuccess?: () => void;
}

export default function PromotionModal({
  show, onClose, mode, selectedStudents, students, singleStudentId, fromClass, fromSection, theme, onSuccess
}: PromotionModalProps) {
  const isDark = theme === 'dark';

  const [step, setStep] = useState<'config' | 'preview' | 'progress' | 'result'>('config');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [form, setForm] = useState({
    toClass: '',
    toSection: '',
    toAcademicYear: '',
    promotionType: 'regular',
    remarks: ''
  });

  // ── Fetch dropdowns ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!show) return;
    Promise.all([
      fetch('/api/school-structure/academic-years').then(r => r.json()),
      fetch('/api/school-structure/classes').then(r => r.json())
    ]).then(([ayData, clsData]) => {
      setAcademicYears(ayData.academicYears || []);
      setClasses(clsData.classes || []);
    }).catch(console.error);
  }, [show]);

  // ── Fetch sections when class changes ───────────────────────────────────────
  useEffect(() => {
    if (!form.toClass) { setSections([]); return; }
    const cls = classes.find(c => c.name === form.toClass);
    if (cls?.sections) setSections(cls.sections);
    else setSections([]);
  }, [form.toClass, classes]);

  // ── Reset on close ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!show) {
      setStep('config');
      setPreview([]);
      setResult(null);
      setProgress(0);
      setForm({ toClass: '', toSection: '', toAcademicYear: '', promotionType: 'regular', remarks: '' });
    }
  }, [show]);

  // ── Resolve preview ─────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!form.toClass || !form.toSection || !form.toAcademicYear) return;
    setLoading(true);
    try {
      let url = '/api/students/promote?';
      if (mode === 'class') {
        url += `fromClass=${encodeURIComponent(fromClass || '')}&fromSection=${encodeURIComponent(fromSection || '')}`;
      } else {
        const ids = mode === 'single' ? [singleStudentId] : selectedStudents;
        const previewItems = students.filter(s => ids.includes(s.id)).map(s => ({
          id: s.id, name: s.name, admissionNo: s.admissionNo,
          currentClass: s.class, currentSection: s.section, currentAcademicYear: s.academicYear,
          arrearsAmount: Math.max(0, (s.fees?.total || 0) - (s.fees?.paid || 0))
        }));
        setPreview(previewItems);
        setStep('preview');
        setLoading(false);
        return;
      }
      const data = await fetch(url).then(r => r.json());
      setPreview(data.data || []);
      setStep('preview');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Execute promotion ───────────────────────────────────────────────────────
  const handlePromote = async () => {
    setStep('progress');
    setProgress(10);

    const body: any = {
      mode,
      toClass: form.toClass,
      toSection: form.toSection,
      toAcademicYear: form.toAcademicYear,
      promotionType: form.promotionType,
      remarks: form.remarks
    };

    if (mode === 'single') body.studentId = singleStudentId;
    else if (mode === 'bulk') body.studentIds = selectedStudents;
    else { body.fromClass = fromClass; body.fromSection = fromSection; }

    try {
      setProgress(40);
      const res = await fetch('/api/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      setProgress(90);
      const data = await res.json();
      setResult(data);
      setStep('result');
      setProgress(100);
      if (data.success && onSuccess) onSuccess();
    } catch (e: any) {
      setResult({ success: false, error: e.message });
      setStep('result');
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const labelCls = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const cardCls = `rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;

  const modeTitle = mode === 'single' ? 'Promote Student' : mode === 'bulk' ? `Promote ${selectedStudents.length} Students` : `Promote Class: ${fromClass}${fromSection ? ` - ${fromSection}` : ''}`;
  const modeIcon = mode === 'single' ? '🎓' : mode === 'bulk' ? '👥' : '🏫';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full max-w-2xl rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} flex flex-col max-h-[90vh]`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {modeIcon} {modeTitle}
                </h3>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Promote to next academic year with arrears tracking
                </p>
              </div>
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>✕</button>
            </div>

            {/* Steps indicator */}
            <div className={`flex gap-1 px-6 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              {(['config', 'preview', 'progress', 'result'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`h-1.5 rounded-full transition-all ${step === s ? 'w-8 bg-blue-500' : i < ['config','preview','progress','result'].indexOf(step) ? 'w-4 bg-green-500' : 'w-4 bg-gray-300'}`} />
                </div>
              ))}
              <span className={`ml-2 text-xs font-medium capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {step === 'config' ? '1. Configure' : step === 'preview' ? '2. Preview' : step === 'progress' ? '3. Processing' : '4. Complete'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* ── Step 1: Config ── */}
              {step === 'config' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Target Academic Year *</label>
                      <select className={inputCls} value={form.toAcademicYear} onChange={e => setForm(f => ({ ...f, toAcademicYear: e.target.value }))}>
                        <option value="">Select Year</option>
                        {academicYears.map(ay => <option key={ay.id} value={ay.year}>{ay.name || ay.year}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Promotion Type</label>
                      <select className={inputCls} value={form.promotionType} onChange={e => setForm(f => ({ ...f, promotionType: e.target.value }))}>
                        <option value="regular">Regular Promotion</option>
                        <option value="detained">Detained (Same Class)</option>
                        <option value="promoted_with_grace">Promoted with Grace</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Promote to Class *</label>
                      <select className={inputCls} value={form.toClass} onChange={e => setForm(f => ({ ...f, toClass: e.target.value, toSection: '' }))}>
                        <option value="">Select Class</option>
                        {classes.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Promote to Section *</label>
                      <select className={inputCls} value={form.toSection} onChange={e => setForm(f => ({ ...f, toSection: e.target.value }))}>
                        <option value="">Select Section</option>
                        {sections.filter(s => s.isActive).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        {sections.length === 0 && form.toClass && <option value="A">A</option>}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Remarks (Optional)</label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={2}
                      placeholder="Any notes about this promotion..."
                      value={form.remarks}
                      onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                    />
                  </div>

                  <div className={`rounded-lg p-3 ${isDark ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      ℹ️ Outstanding fees will be tracked as <strong>Arrears</strong> and remain visible in the student's fee history.
                      New fee records for the target class will be created automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 2: Preview ── */}
              {step === 'preview' && (
                <div className="space-y-4">
                  <div className={`flex justify-between items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="font-medium">{preview.length} students to promote → <strong>{form.toClass} ({form.toAcademicYear})</strong></span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                      Total Arrears: ₹{preview.reduce((s, p) => s + (p.arrearsAmount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {preview.map(p => (
                      <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {p.admissionNo} · {p.currentClass} {p.currentSection} → {form.toClass} {form.toSection}
                          </p>
                        </div>
                        <div className="text-right">
                          {(p.arrearsAmount || 0) > 0 ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'}`}>
                              Arrears ₹{(p.arrearsAmount || 0).toLocaleString()}
                            </span>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'}`}>
                              Fees Clear
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {preview.length === 0 && (
                    <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No students to preview</div>
                  )}
                </div>
              )}

              {/* ── Step 3: Progress ── */}
              {step === 'progress' && (
                <div className="text-center py-8 space-y-4">
                  <div className="text-4xl animate-spin">⚙️</div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Promoting students...</p>
                  <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="h-2 bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{progress}% complete</p>
                </div>
              )}

              {/* ── Step 4: Result ── */}
              {step === 'result' && result && (
                <div className="space-y-4">
                  {result.success ? (
                    <>
                      <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                        <div className="text-3xl mb-2">🎉</div>
                        <p className={`font-bold text-lg ${isDark ? 'text-green-300' : 'text-green-700'}`}>Promotion Complete!</p>
                        <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{result.message}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Promoted', value: result.data?.promoted, color: 'green' },
                          { label: 'Failed', value: result.data?.failed, color: 'red' },
                          { label: 'Arrears Created', value: `₹${(result.data?.totalArrears || 0).toLocaleString()}`, color: 'orange' }
                        ].map(item => (
                          <div key={item.label} className={`text-center p-3 rounded-lg ${isDark ? `bg-${item.color}-900/30` : `bg-${item.color}-50`}`}>
                            <p className={`text-xl font-bold ${isDark ? `text-${item.color}-300` : `text-${item.color}-700`}`}>{item.value}</p>
                            <p className={`text-xs ${isDark ? `text-${item.color}-400` : `text-${item.color}-600`}`}>{item.label}</p>
                          </div>
                        ))}
                      </div>
                      {result.data?.failedStudents?.length > 0 && (
                        <div>
                          <p className={`text-sm font-medium mb-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>Failed Students:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {result.data.failedStudents.map((f: any, i: number) => (
                              <div key={i} className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                {f.studentName || f.studentId}: {f.reason}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                      <div className="text-3xl mb-2">❌</div>
                      <p className={`font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>Promotion Failed</p>
                      <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{result.error || 'Something went wrong'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className={`flex justify-between items-center p-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  if (step === 'preview') setStep('config');
                  else if (step === 'result') onClose();
                  else onClose();
                }}
                className={`px-4 py-2 text-sm rounded-lg border font-medium ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {step === 'preview' ? '← Back' : 'Cancel'}
              </button>

              <div className="flex gap-2">
                {step === 'config' && (
                  <button
                    onClick={handlePreview}
                    disabled={!form.toClass || !form.toSection || !form.toAcademicYear || loading}
                    className="px-5 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Preview →'}
                  </button>
                )}
                {step === 'preview' && (
                  <button
                    onClick={handlePromote}
                    disabled={preview.length === 0}
                    className="px-5 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                  >
                    Confirm Promotion ({preview.length})
                  </button>
                )}
                {step === 'result' && (
                  <button onClick={onClose} className="px-5 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
