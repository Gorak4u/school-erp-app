'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExitStudent {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  section: string;
  academicYear: string;
  pendingDues: number;
}

interface ExitStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentIds: string[];
  theme: 'dark' | 'light';
  onSuccess: () => void;
}

const EXIT_REASONS = [
  { value: 'graduated', label: '🎓 Graduated', description: 'Student completed their course' },
  { value: 'transferred', label: '🔄 Transferred', description: 'Student moved to another school' },
  { value: 'withdrawn', label: '🚪 Withdrawn', description: 'Student voluntarily left' },
  { value: 'expelled', label: '⛔ Expelled', description: 'Student was expelled' },
  { value: 'suspended', label: '⚠️ Suspended', description: 'Student is suspended' },
];

const FEE_ACTIONS = [
  { value: 'carry_forward', label: 'Carry Forward as Arrears', description: 'Pending dues become arrears for future collection' },
  { value: 'create_arrears', label: 'Create Arrear Record', description: 'Create a dedicated arrear record for pending dues' },
  { value: 'write_off', label: 'Write Off Dues', description: 'Mark all pending dues as waived' },
];

export default function ExitStudentModal({ isOpen, onClose, studentIds, theme, onSuccess }: ExitStudentModalProps) {
  const [step, setStep] = useState(1);
  const [previewStudents, setPreviewStudents] = useState<ExitStudent[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exitReason, setExitReason] = useState('graduated');
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [tcNumber, setTcNumber] = useState('');
  const [exitRemarks, setExitRemarks] = useState('');
  const [feeAction, setFeeAction] = useState('carry_forward');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isDark = theme === 'dark';
  const card = isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`;

  useEffect(() => {
    if (isOpen && studentIds.length > 0) {
      loadPreview();
    }
  }, [isOpen, studentIds]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const params = new URLSearchParams({ studentIds: studentIds.join(',') });
      const res = await fetch(`/api/students/exit?${params}`);
      const data = await res.json();
      if (data.success) {
        setPreviewStudents(data.data);
      }
    } catch (err) {
      console.error('Failed to load exit preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setExitReason('graduated');
    setExitDate(new Date().toISOString().split('T')[0]);
    setTcNumber('');
    setExitRemarks('');
    setFeeAction('carry_forward');
    setResult(null);
    onClose();
  };

  const totalDues = previewStudents.reduce((sum, s) => sum + s.pendingDues, 0);
  const studentsWithDues = previewStudents.filter(s => s.pendingDues > 0).length;

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/students/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds,
          exitReason,
          exitDate,
          tcNumber: tcNumber || undefined,
          exitRemarks: exitRemarks || undefined,
          feeAction,
        }),
      });
      const data = await res.json();
      setResult(data);
      setStep(5);
      if (data.success) {
        onSuccess();
      }
    } catch (err) {
      console.error('Exit process failed:', err);
      setResult({ success: false, message: 'Network error — please try again.' });
      setStep(5);
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { label: 'Students', number: 1 },
    { label: 'Reason', number: 2 },
    { label: 'Fees', number: 3 },
    { label: 'Details', number: 4 },
    { label: 'Done', number: 5 },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${card}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-xl font-bold ${text}`}>🚪 Exit Students</h2>
                <p className={`text-sm ${subText}`}>{studentIds.length} student{studentIds.length !== 1 ? 's' : ''} selected</p>
              </div>
              <button onClick={handleClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>✕</button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1">
              {steps.map((s, i) => (
                <React.Fragment key={s.number}>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    step === s.number
                      ? 'bg-blue-500 text-white'
                      : step > s.number
                        ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                        : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {step > s.number ? '✓' : s.number} {s.label}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 ${step > s.number ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Preview students */}
            {step === 1 && (
              <div>
                <h3 className={`font-semibold mb-3 ${text}`}>Students to be Exited</h3>
                {loadingPreview ? (
                  <div className={`text-center py-8 ${subText}`}>Loading preview...</div>
                ) : (
                  <>
                    <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-4`}>
                      <div className={`max-h-64 overflow-y-auto`}>
                        <table className="w-full text-sm">
                          <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                            <tr>
                              <th className={`px-4 py-2 text-left font-medium ${subText}`}>Name</th>
                              <th className={`px-4 py-2 text-left font-medium ${subText}`}>Class</th>
                              <th className={`px-4 py-2 text-right font-medium ${subText}`}>Pending Dues</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewStudents.map(s => (
                              <tr key={s.id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                                <td className={`px-4 py-2 font-medium ${text}`}>{s.name}</td>
                                <td className={`px-4 py-2 ${subText}`}>{s.class} {s.section}</td>
                                <td className={`px-4 py-2 text-right font-medium ${s.pendingDues > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                  {s.pendingDues > 0 ? `₹${s.pendingDues.toLocaleString()}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {totalDues > 0 && (
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-amber-900/20 border border-amber-800/30 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                        ⚠️ <strong>{studentsWithDues} student{studentsWithDues !== 1 ? 's' : ''}</strong> have pending dues totalling <strong>₹{totalDues.toLocaleString()}</strong>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-end mt-6">
                  <button onClick={() => setStep(2)} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Exit Reason */}
            {step === 2 && (
              <div>
                <h3 className={`font-semibold mb-3 ${text}`}>Select Exit Reason</h3>
                <div className="space-y-2">
                  {EXIT_REASONS.map(r => (
                    <label key={r.value} className={`flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-colors ${
                      exitReason === r.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="exitReason"
                        value={r.value}
                        checked={exitReason === r.value}
                        onChange={e => setExitReason(e.target.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className={`font-medium text-sm ${text}`}>{r.label}</div>
                        <div className={`text-xs ${subText}`}>{r.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(1)} className={`px-5 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>← Back</button>
                  <button onClick={() => setStep(3)} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">Next →</button>
                </div>
              </div>
            )}

            {/* Step 3: Fee Handling */}
            {step === 3 && (
              <div>
                <h3 className={`font-semibold mb-1 ${text}`}>Handle Pending Fees</h3>
                <p className={`text-sm mb-4 ${subText}`}>
                  {totalDues > 0
                    ? `${studentsWithDues} student${studentsWithDues !== 1 ? 's have' : ' has'} ₹${totalDues.toLocaleString()} in pending dues.`
                    : 'No pending dues — all students have cleared fees.'}
                </p>
                <div className="space-y-2">
                  {FEE_ACTIONS.map(a => (
                    <label key={a.value} className={`flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-colors ${
                      feeAction === a.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="feeAction"
                        value={a.value}
                        checked={feeAction === a.value}
                        onChange={e => setFeeAction(e.target.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className={`font-medium text-sm ${text}`}>{a.label}</div>
                        <div className={`text-xs ${subText}`}>{a.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(2)} className={`px-5 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>← Back</button>
                  <button onClick={() => setStep(4)} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">Next →</button>
                </div>
              </div>
            )}

            {/* Step 4: Exit Details */}
            {step === 4 && (
              <div>
                <h3 className={`font-semibold mb-4 ${text}`}>Exit Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${text}`}>Exit Date *</label>
                    <input type="date" value={exitDate} onChange={e => setExitDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${text}`}>TC Number <span className={subText}>(optional)</span></label>
                    <input type="text" placeholder="Transfer Certificate Number" value={tcNumber} onChange={e => setTcNumber(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${text}`}>Remarks <span className={subText}>(optional)</span></label>
                    <textarea rows={3} placeholder="Any additional remarks..." value={exitRemarks} onChange={e => setExitRemarks(e.target.value)} className={inputClass} />
                  </div>

                  {/* Summary */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <h4 className={`text-sm font-semibold mb-2 ${text}`}>Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className={subText}>Students</span>
                        <span className={`font-medium ${text}`}>{studentIds.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={subText}>Exit Reason</span>
                        <span className={`font-medium ${text}`}>{EXIT_REASONS.find(r => r.value === exitReason)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={subText}>Fee Action</span>
                        <span className={`font-medium ${text}`}>{FEE_ACTIONS.find(a => a.value === feeAction)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={subText}>Total Dues</span>
                        <span className={`font-medium ${totalDues > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {totalDues > 0 ? `₹${totalDues.toLocaleString()}` : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(3)} className={`px-5 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>← Back</button>
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || !exitDate}
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                  >
                    {isProcessing ? '⏳ Processing...' : `🚪 Exit ${studentIds.length} Student${studentIds.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Result */}
            {step === 5 && result && (
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${result.success ? isDark ? 'bg-green-900/50' : 'bg-green-100' : isDark ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <span className="text-3xl">{result.success ? '✅' : '❌'}</span>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${text}`}>
                  {result.success ? 'Exit Processed Successfully' : 'Exit Failed'}
                </h3>
                <p className={`text-sm mb-4 ${subText}`}>{result.message}</p>

                {result.data && (
                  <div className={`text-left p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} mb-4`}>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-500">{result.data.processed}</div>
                        <div className={`text-xs ${subText}`}>Processed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-500">{result.data.failed}</div>
                        <div className={`text-xs ${subText}`}>Failed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-500">{result.data.totalRequested}</div>
                        <div className={`text-xs ${subText}`}>Total</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  {result.success && (
                    <a href="/alumni" className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                      👥 View Alumni Portal
                    </a>
                  )}
                  <button onClick={handleClose} className={`px-5 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
