'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { useSchoolDetails } from '@/contexts/SchoolConfigContext';
import { generateTcNumber } from '@/lib/tcNumber';

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
  const [tcNumberMode, setTcNumberMode] = useState<'auto' | 'manual'>('auto');
  const [exitRemarks, setExitRemarks] = useState('');
  const [feeAction, setFeeAction] = useState('carry_forward');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const schoolDetails = useSchoolDetails();

  const isDark = theme === 'dark';
  const card = isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`;

  const formatValue = (value?: string | null) => {
    const trimmed = value?.toString().trim();
    return trimmed ? trimmed : '—';
  };

  const formatDateValue = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatStudentAddress = (student: any) => {
    const parts = [student.address, student.city, student.state, student.pinCode || student.pincode]
      .map((part) => formatValue(part))
      .filter((part) => part !== '—');
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const getStudentContact = (student: any) => {
    return student.parentPhone || student.fatherPhone || student.motherPhone || student.phone || '—';
  };

  const getStudentEmail = (student: any) => {
    return student.parentEmail || student.fatherEmail || student.motherEmail || student.email || '—';
  };

  const getSchoolAddress = () => {
    const parts = [schoolDetails.address, schoolDetails.city, schoolDetails.state, schoolDetails.pincode]
      .map((part) => formatValue(part))
      .filter((part) => part !== '—');
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  useEffect(() => {
    if (isOpen && studentIds.length > 0) {
      loadPreview();
    }
  }, [isOpen, studentIds]);

  useEffect(() => {
    if (!isOpen || previewStudents.length === 0 || tcNumberMode !== 'auto') {
      return;
    }

    const primaryStudent = previewStudents[0];
    setTcNumber(generateTcNumber({
      schoolName: schoolDetails.name || 'School',
      admissionNo: primaryStudent.admissionNo,
      studentName: primaryStudent.name,
      studentId: primaryStudent.id,
      exitDate,
    }));
  }, [isOpen, previewStudents, exitDate, tcNumberMode, schoolDetails.name]);

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
    setTcNumberMode('auto');
    setExitRemarks('');
    setFeeAction('carry_forward');
    setResult(null);
    onClose();
  };

  const totalDues = previewStudents.reduce((sum, s) => sum + s.pendingDues, 0);
  const studentsWithDues = previewStudents.filter(s => s.pendingDues > 0).length;

  const handleDownloadCertificate = async (student: any) => {
    const certificateId = `tc-certificate-${student.studentId}`;
    const filename = `TC_${(student.tcNumber || student.studentId || student.studentName || 'student').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    await PDFGenerator.generateFromElement(certificateId, filename);
  };

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
                    <input
                      type="text"
                      placeholder="Transfer Certificate Number"
                      value={tcNumber}
                      onChange={e => {
                        setTcNumber(e.target.value);
                        setTcNumberMode('manual');
                      }}
                      className={inputClass}
                    />
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                      <span className={subText}>
                        Leave it blank to auto-generate, or type your own TC number.
                      </span>
                      <button
                        type="button"
                        onClick={() => setTcNumberMode('auto')}
                        className={`px-3 py-1 rounded-full border transition-colors ${
                          isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Use Auto Number
                      </button>
                    </div>
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

                {result.success && Array.isArray(result.data?.processedStudents) && result.data.processedStudents.length > 0 && (
                  <div className={`text-left p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mb-4`}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className={`font-semibold ${text}`}>Transfer Certificate</h4>
                        <p className={`text-xs ${subText}`}>Download a formal, school-branded certificate for each exited student.</p>
                      </div>
                      {result.data.processedStudents.length > 1 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          {result.data.processedStudents.length} certificates ready
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {result.data.processedStudents.map((student: any) => {
                        const certificateId = `tc-certificate-${student.studentId}`;
                        return (
                          <div key={student.studentId} className={`rounded-2xl border overflow-hidden ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                            <div className="p-4 flex items-center justify-between gap-3 border-b border-gray-200/60 dark:border-gray-700/60">
                              <div>
                                <div className={`font-semibold ${text}`}>{student.studentName}</div>
                                <div className={`text-xs ${subText}`}>TC Number: {student.tcNumber}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDownloadCertificate(student)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                              >
                                ⬇ Download Certificate
                              </button>
                            </div>

                            <div className="p-4">
                              <div
                                id={certificateId}
                                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8"
                                style={{ minHeight: '1320px', width: '100%' }}
                              >
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06]">
                                  {schoolDetails.logo_url ? (
                                    <img src={schoolDetails.logo_url} alt="Watermark" className="w-96 h-96 object-contain" />
                                  ) : (
                                    <div className="text-[10rem] font-black text-gray-400">{(schoolDetails.name || 'School').charAt(0)}</div>
                                  )}
                                </div>

                                <div className="relative z-10 flex h-full flex-col">
                                  <div className="flex items-start justify-between gap-4 pb-5 border-b-4 border-blue-600">
                                    <div className="flex items-start gap-4">
                                      {schoolDetails.logo_url && (
                                        <img src={schoolDetails.logo_url} alt={schoolDetails.name || 'School'} className="w-20 h-20 object-contain rounded-2xl border border-gray-200 bg-white p-2" crossOrigin="anonymous" />
                                      )}
                                      <div>
                                        <div className="text-xs uppercase tracking-[0.35em] text-blue-700 font-bold">Transfer / Leaving Certificate</div>
                                        <h2 className="text-2xl font-black text-gray-900 mt-1">{schoolDetails.name || 'School Name'}</h2>
                                        <p className="text-sm text-gray-600 max-w-2xl">{getSchoolAddress()}</p>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                                          {schoolDetails.phone && <span>Phone: {schoolDetails.phone}</span>}
                                          {schoolDetails.email && <span>Email: {schoolDetails.email}</span>}
                                          {schoolDetails.website && <span>Website: {schoolDetails.website}</span>}
                                          {schoolDetails.principal && <span>Principal: {schoolDetails.principal}</span>}
                                          {schoolDetails.affiliation_no && <span>Affiliation No: {schoolDetails.affiliation_no}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right min-w-[180px]">
                                      <div className="text-sm font-semibold text-gray-700">Certificate No.</div>
                                      <div className="text-xl font-black text-blue-700 break-words">{student.tcNumber}</div>
                                      <div className="text-xs text-gray-500 mt-2">Issue Date: {formatDateValue(student.tcIssueDate || exitDate)}</div>
                                      <div className="text-xs text-gray-500 mt-1">Academic Year: {formatValue(student.academicYear)}</div>
                                    </div>
                                  </div>

                                  <div className="mt-6 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-[0.2em] uppercase">
                                      Student Record Summary
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-gray-700 max-w-4xl mx-auto">
                                      This is to certify that the particulars shown below are recorded in the school register and that the student has been formally relieved from the institution as per the selected exit process.
                                    </p>
                                  </div>

                                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500 mb-4">Student Details</h3>
                                      <div className="space-y-3">
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Name</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.studentName)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Admission No.</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.admissionNo)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Roll No.</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.rollNo)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Class / Section</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.class)} {student.section ? `/ ${student.section}` : ''}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Gender</span><span className="font-semibold text-gray-900 text-right capitalize">{formatValue(student.gender)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Date of Birth</span><span className="font-semibold text-gray-900 text-right">{formatDateValue(student.dateOfBirth)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Date of Admission</span><span className="font-semibold text-gray-900 text-right">{formatDateValue(student.admissionDate)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Category / Blood Group</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.category)}{student.bloodGroup ? ` / ${student.bloodGroup}` : ''}</span></div>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500 mb-4">Parent / Contact Details</h3>
                                      <div className="space-y-3">
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Father's Name</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.fatherName || student.parentName)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Mother's Name</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.motherName)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Contact No.</span><span className="font-semibold text-gray-900 text-right">{formatValue(getStudentContact(student))}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Email</span><span className="font-semibold text-gray-900 text-right break-words">{formatValue(getStudentEmail(student))}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Residential Address</span><span className="font-semibold text-gray-900 text-right">{formatStudentAddress(student)}</span></div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-50 via-white to-indigo-50 border border-blue-100 p-5">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700 mb-3">Certificate Narrative</h3>
                                    <p className="text-sm leading-7 text-gray-700">
                                      This is to certify that <span className="font-bold text-gray-900">{formatValue(student.studentName)}</span>, admission number <span className="font-bold text-gray-900">{formatValue(student.admissionNo)}</span>, was enrolled in <span className="font-bold text-gray-900">{formatValue(student.class)}{student.section ? `-${student.section}` : ''}</span> during the academic year <span className="font-bold text-gray-900">{formatValue(student.academicYear)}</span>.
                                      The student has been relieved from the school records on <span className="font-bold text-gray-900">{formatDateValue(student.exitDate || exitDate)}</span> with exit reason <span className="font-bold capitalize text-gray-900">{formatValue(student.exitReason || exitReason)}</span>.
                                    </p>
                                    {student.exitRemarks && (
                                      <div className="mt-4 rounded-xl border border-blue-100 bg-white/80 p-4">
                                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Remarks</div>
                                        <p className="text-sm text-gray-700 leading-6">{student.exitRemarks}</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500 mb-3">Official Record</h3>
                                      <div className="space-y-2">
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Status</span><span className="font-semibold text-gray-900 capitalize">{formatValue(student.status)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">TC Number</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.tcNumber)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Issue Date</span><span className="font-semibold text-gray-900 text-right">{formatDateValue(student.tcIssueDate || exitDate)}</span></div>
                                      </div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500 mb-3">Reference Details</h3>
                                      <div className="space-y-2">
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Academic Year</span><span className="font-semibold text-gray-900 text-right">{formatValue(student.academicYear)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">School Principal</span><span className="font-semibold text-gray-900 text-right">{formatValue(schoolDetails.principal)}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-gray-500">Generated On</span><span className="font-semibold text-gray-900 text-right">{formatDateValue(new Date().toISOString())}</span></div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-auto pt-8 grid grid-cols-3 gap-6 text-sm text-gray-700">
                                    <div className="text-center">
                                      <div className="h-16 border-b border-gray-400"></div>
                                      <div className="mt-2 font-semibold">Class Teacher</div>
                                      <div className="text-xs text-gray-500 mt-1">Record Verification</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="h-16 border-b border-gray-400"></div>
                                      <div className="mt-2 font-semibold">Principal</div>
                                      <div className="text-xs text-gray-500 mt-1">Approved by School</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="h-16 border-b border-gray-400"></div>
                                      <div className="mt-2 font-semibold">Office Seal</div>
                                      <div className="text-xs text-gray-500 mt-1">Official Use Only</div>
                                    </div>
                                  </div>

                                  <div className="mt-6 text-center text-xs text-gray-500">
                                    Generated automatically by the school ERP. This certificate contains only academic and identity details and excludes fee information.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
