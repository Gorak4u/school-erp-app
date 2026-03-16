// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Student } from '../types';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

const TABS = [
  { id: 'admission', label: 'Admission' },
  { id: 'fees', label: 'Fee Information' },
  { id: 'personal', label: 'Personal' },
  { id: 'contact', label: 'Contact' },
  { id: 'parents', label: 'Father Mother Name' },
  { id: 'additional', label: 'Additional' },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
];

export default function StudentForm({ 
  student, 
  onSubmit, 
  onCancel, 
  theme 
}: { 
  student: Student | null; 
  onSubmit: (data: Partial<Student>) => void; 
  onCancel: () => void; 
  theme: 'dark' | 'light'; 
}) {
  const { mediums, classes, sections, dropdowns, loading } = useSchoolConfig();
  const [activeTab, setActiveTab] = useState('admission');

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  }`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1 ${
    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
  }`;
  const sectionCls = `rounded-xl border p-4 mb-4 ${
    theme === 'dark' ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-gray-50'
  }`;
  const sectionTitleCls = `text-sm font-bold mb-3 flex items-center gap-2 ${
    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
  }`;

  const [formData, setFormData] = useState({
    photo: student?.photo || '',
    name: student?.name || '',
    dateOfBirth: student?.dateOfBirth || '',
    gender: student?.gender || 'Male',
    bloodGroup: student?.bloodGroup || '',
    nationality: student?.nationality || 'Indian',
    religion: student?.religion || '',
    category: student?.category || '',
    motherTongue: student?.motherTongue || '',
    aadharNumber: student?.aadharNumber || '',
    stsId: student?.stsId || '',
    phone: student?.phone || '',
    email: student?.email || '',
    address: student?.address || '',
    city: student?.city || '',
    state: student?.state || '',
    pinCode: student?.pinCode || '',
    admissionNo: student?.admissionNo || `${new Date().getFullYear()}0001`,
    admissionDate: student?.admissionDate || new Date().toISOString().split('T')[0],
    mediumId: student?._mediumId || '',
    classId: student?._classId || '',
    sectionId: student?._sectionId || '',
    class: student?.class || '',
    section: student?.section || '',
    languageMedium: student?.languageMedium || '',
    rollNo: student?.rollNo || '',
    board: student?.board || '',
    previousSchool: student?.previousSchool || '',
    previousClass: student?.previousClass || '',
    fatherName: student?.fatherName || '',
    fatherOccupation: student?.fatherOccupation || '',
    fatherPhone: student?.fatherPhone || '',
    fatherEmail: student?.fatherEmail || '',
    motherName: student?.motherName || '',
    motherOccupation: student?.motherOccupation || '',
    motherPhone: student?.motherPhone || '',
    motherEmail: student?.motherEmail || '',
    emergencyContact: student?.emergencyContact || '',
    emergencyRelation: student?.emergencyRelation || '',
    bankName: student?.bankName || '',
    bankAccountNumber: student?.bankAccountNumber || '',
    bankIfsc: student?.bankIfsc || '',
    medicalConditions: student?.medicalConditions || '',
    allergies: student?.allergies || '',
    transport: student?.transport || 'No',
    hostel: student?.hostel || 'No',
    remarks: student?.remarks || '',
    documents: {
      birthCertificate: student?.documents?.birthCertificate || false,
      aadharCard: student?.documents?.aadharCard || false,
      transferCertificate: student?.documents?.transferCertificate || false,
      medicalCertificate: student?.documents?.medicalCertificate || false,
      passportPhoto: student?.documents?.passportPhoto || false,
      marksheet: student?.documents?.marksheet || false,
      casteCertificate: student?.documents?.casteCertificate || false,
      incomeCertificate: student?.documents?.incomeCertificate || false,
    },
    gpa: student?.gpa || 0,
    status: student?.status || 'active',
  });

  const set = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [discountData, setDiscountData] = useState({
    hasDiscount: false,
    discountType: 'percentage',
    discountValue: 0,
    maxCapAmount: '',
    reason: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
  });

  // Cascaded dropdown data
  const filteredClasses = useMemo(() => {
    const filtered = formData.mediumId
      ? classes.filter(c => c.mediumId === formData.mediumId)
      : classes;
    console.log('Filtered classes:', { mediumId: formData.mediumId, totalClasses: classes.length, filteredCount: filtered.length, filtered: filtered.map(c => ({ id: c.id, name: c.name, mediumId: c.mediumId })) });
    return filtered;
  }, [classes, formData.mediumId]);
  const filteredSections = useMemo(() => 
    formData.classId
      ? sections.filter(s => s.classId === formData.classId)
      : [],
    [sections, formData.classId]
  );

  // Auto-select medium when only one exists
  useEffect(() => {
    console.log('Medium auto-selection check:', { mediums: mediums.length, loading, currentMediumId: formData.mediumId });
    if (!loading && mediums.length === 1 && !formData.mediumId) {
      const medium = mediums[0];
      console.log('Auto-selecting medium:', medium);
      setFormData(prev => ({ 
        ...prev, 
        mediumId: medium.id, 
        languageMedium: medium.name || ''
      }));
    }
  }, [mediums, loading, formData.mediumId]);

  // Load fee structures when class changes
  useEffect(() => {
    if (!formData.classId) { setFeeStructures([]); setSelectedFeeIds([]); return; }
    setFeesLoading(true);
    fetch(`/api/fees/structures?classId=${formData.classId}`)
      .then(r => r.json())
      .then(data => {
        const structs = data.feeStructures || [];
        setFeeStructures(structs);
        setSelectedFeeIds(structs.map((f: any) => f.id));
      })
      .catch(() => setFeeStructures([]))
      .finally(() => setFeesLoading(false));
  }, [formData.classId]);

  // Auto-save
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem('studentFormAutoSave', JSON.stringify({ ...formData, _ts: Date.now() }));
    }, 2000);
    return () => clearTimeout(t);
  }, [formData]);

  // Restore auto-save on mount (new student only)
  useEffect(() => {
    if (student) return;
    try {
      const saved = localStorage.getItem('studentFormAutoSave');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed._ts < 86400000) setFormData(parsed);
    } catch {}
  }, []);

  const feeCalcs = useMemo(() => {
    const selected = feeStructures.filter(f => selectedFeeIds.includes(f.id));
    const baseTotal = selected.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);
    if (!discountData.hasDiscount || !discountData.discountValue) {
      return { baseTotal, discountAmount: 0, finalTotal: baseTotal, savingsPercent: 0, selected };
    }
    let discountAmount = 0;
    if (discountData.discountType === 'percentage') {
      discountAmount = (baseTotal * Number(discountData.discountValue)) / 100;
      if (discountData.maxCapAmount) discountAmount = Math.min(discountAmount, Number(discountData.maxCapAmount));
    } else if (discountData.discountType === 'fixed') {
      discountAmount = Math.min(Number(discountData.discountValue), baseTotal);
    } else if (discountData.discountType === 'full_waiver') {
      discountAmount = baseTotal;
    }
    return { baseTotal, discountAmount, finalTotal: baseTotal - discountAmount, savingsPercent: baseTotal > 0 ? Math.round((discountAmount / baseTotal) * 100) : 0, selected };
  }, [feeStructures, selectedFeeIds, discountData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('Full Name is required'); return; }
    if (!formData.dateOfBirth) { alert('Date of Birth is required'); return; }
    if (!formData.mediumId) { alert('Please select a Language Medium'); return; }
    if (!formData.classId) { alert('Please select a Class'); return; }
    if (discountData.hasDiscount) {
      if (discountData.discountType !== 'full_waiver' && (!discountData.discountValue || Number(discountData.discountValue) <= 0)) {
        alert('Please enter a valid discount amount'); return;
      }
      if (!discountData.reason.trim()) { alert('Please provide a reason for the discount'); return; }
      if (discountData.discountType === 'percentage' && Number(discountData.discountValue) > 100) {
        alert('Percentage discount cannot exceed 100%'); return;
      }
    }
    localStorage.removeItem('studentFormAutoSave');
    onSubmit({
      ...formData,
      ...(discountData.hasDiscount && {
        _discountInfo: { ...discountData, feeStructureIds: selectedFeeIds },
      }),
    } as any);
  };

  const tabBtnCls = (id: string) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
      activeTab === id
        ? 'bg-blue-600 text-white shadow'
        : theme === 'dark'
        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const isLastTab = activeTab === TABS[TABS.length - 1].id;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className={`flex gap-1 pb-3 border-b flex-shrink-0 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={tabBtnCls(t.id)}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Auto-saving</span>
          <button
            type="button"
            onClick={() => { localStorage.removeItem('studentFormAutoSave'); }}
            className={`text-xs px-2 py-1 rounded border ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:text-white' : 'border-gray-300 text-gray-400 hover:text-gray-700'}`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto py-4 pr-1">

          {/* ── TAB: ADMISSION ─────────────────────────────── */}
          {activeTab === 'admission' && (
            <div className="space-y-4">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>📚 Admission Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Admission No</label>
                    <input readOnly value={formData.admissionNo} className={`${inputCls} opacity-60 cursor-not-allowed`} />
                  </div>
                  <div>
                    <label className={labelCls}>Admission Date *</label>
                    <input type="date" value={formData.admissionDate} onChange={e => set('admissionDate', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>🎓 Class Assignment</p>
                {loading ? (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading school structure…</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Medium */}
                    <div>
                      <label className={labelCls}>Medium *</label>
                      <select
                        value={formData.mediumId}
                        onChange={e => {
                          const mid = e.target.value;
                          const med = mediums.find(m => m.id === mid);
                          setFormData(prev => ({ ...prev, mediumId: mid, languageMedium: med?.name || '', classId: '', class: '', sectionId: '', section: '' }));
                        }}
                        className={inputCls}
                      >
                        {/* Don't show "Select Medium" when only one medium exists */}
                        {mediums.length > 1 && <option value="">Select Medium</option>}
                        {mediums.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      {mediums.length === 0 && <p className="text-xs text-yellow-500 mt-1">No mediums configured yet</p>}
                    </div>
                    {/* Class */}
                    <div>
                      <label className={labelCls}>Class *</label>
                      <select
                        value={formData.classId}
                        disabled={!formData.mediumId}
                        onChange={e => {
                          const cid = e.target.value;
                          const cls = classes.find(c => c.id === cid);
                          setFormData(prev => ({ ...prev, classId: cid, class: cls?.name || '', sectionId: '', section: '' }));
                        }}
                        className={`${inputCls} disabled:opacity-50`}
                      >
                        <option value="">{formData.mediumId ? 'Select Class' : 'Select Medium first'}</option>
                        {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {formData.mediumId && filteredClasses.length === 0 && (
                        <p className="text-xs text-yellow-500 mt-1">No classes for this medium</p>
                      )}
                    </div>
                    {/* Section */}
                    <div>
                      <label className={labelCls}>Section</label>
                      <select
                        value={formData.sectionId}
                        disabled={!formData.classId}
                        onChange={e => {
                          const sid = e.target.value;
                          const sec = sections.find(s => s.id === sid);
                          setFormData(prev => ({ ...prev, sectionId: sid, section: sec?.name || '' }));
                        }}
                        className={`${inputCls} disabled:opacity-50`}
                      >
                        <option value="">{formData.classId ? 'Select Section (optional)' : 'Select Class first'}</option>
                        {filteredSections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                      </select>
                      {formData.classId && filteredSections.length === 0 && (
                        <p className="text-xs text-gray-400 mt-1">No sections for this class</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>📋 Academic Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Board</label>
                    <select 
                      value={formData.board} 
                      onChange={e => {
                        set('board', e.target.value);
                      }} 
                      className={inputCls}
                    >
                      {/* Don't show "Select Board" when only one board exists */}
                      {dropdowns.boards.length > 1 && <option value="">Select Board</option>}
                      {dropdowns.boards.map(b => <option key={b.value} value={b.label}>{b.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Roll Number</label>
                    <input type="text" placeholder="Optional" value={formData.rollNo} onChange={e => set('rollNo', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Previous School</label>
                    <input type="text" value={formData.previousSchool} onChange={e => set('previousSchool', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Previous Class</label>
                    <input type="text" value={formData.previousClass} onChange={e => set('previousClass', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: FEE INFORMATION ─────────────────────── */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              {/* Fee Structure List */}
              <div className={sectionCls}>
                <p className={sectionTitleCls}>💰 Fee Structure{formData.class ? ` — ${formData.class}` : ''}</p>
                {!formData.classId ? (
                  <div className={`text-sm p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
                    ⚠️ Please select a Class in the Admission tab first to load fee structures
                  </div>
                ) : feesLoading ? (
                  <div className="text-center py-6 text-gray-400 text-sm">Loading fee structures…</div>
                ) : feeStructures.length === 0 ? (
                  <div className={`text-sm p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    No fee structures configured for this class.{' '}
                    <a href="/settings" className="text-blue-500 underline">Configure in Settings</a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {feeStructures.map((fee: any) => (
                      <label key={fee.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFeeIds.includes(fee.id)
                          ? theme === 'dark' ? 'border-blue-500 bg-blue-900/20' : 'border-blue-400 bg-blue-50'
                          : theme === 'dark' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedFeeIds.includes(fee.id)}
                            onChange={e => setSelectedFeeIds(prev => e.target.checked ? [...prev, fee.id] : prev.filter((id: string) => id !== fee.id))}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <div>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{fee.name}</p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{fee.category || fee.feeCategory || 'General'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                            ₹{Number(fee.amount || 0).toLocaleString('en-IN')}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>per year</p>
                        </div>
                      </label>
                    ))}
                    <div className={`flex justify-between items-center p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Selected Total:</span>
                      <span className="text-blue-500 text-lg font-bold">₹{feeCalcs.baseTotal.toLocaleString('en-IN')}/year</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Discount Toggle */}
              <div className={sectionCls}>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={discountData.hasDiscount}
                      onChange={e => setDiscountData(prev => ({ ...prev, hasDiscount: e.target.checked }))}
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${discountData.hasDiscount ? 'bg-green-500' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${discountData.hasDiscount ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <div>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Apply Discount / Scholarship</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Creates a discount request pending admin approval • Email will be sent to approvers</p>
                  </div>
                </label>
              </div>

              {/* Discount Details Form */}
              {discountData.hasDiscount && (
                <div className={sectionCls}>
                  <p className={sectionTitleCls}>🎫 Discount Details</p>
                  <div className="space-y-3">
                    {/* Type */}
                    <div>
                      <label className={labelCls}>Discount Type</label>
                      <div className="flex gap-4 mt-1 flex-wrap">
                        {[
                          { value: 'percentage', label: '% Percentage' },
                          { value: 'fixed', label: '₹ Fixed Amount' },
                          { value: 'full_waiver', label: '🎓 Full Waiver' },
                        ].map(opt => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="discountType"
                              value={opt.value}
                              checked={discountData.discountType === opt.value}
                              onChange={() => setDiscountData(prev => ({ ...prev, discountType: opt.value, discountValue: 0 }))}
                              className="accent-blue-600"
                            />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Amount */}
                    {discountData.discountType !== 'full_waiver' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>{discountData.discountType === 'percentage' ? 'Discount (%)' : 'Discount Amount (₹)'}</label>
                          <input
                            type="number"
                            min="0"
                            max={discountData.discountType === 'percentage' ? 100 : undefined}
                            placeholder={discountData.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5000'}
                            value={discountData.discountValue || ''}
                            onChange={e => setDiscountData(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                            className={inputCls}
                          />
                        </div>
                        {discountData.discountType === 'percentage' && (
                          <div>
                            <label className={labelCls}>Max Cap (₹) <span className={`normal-case font-normal ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>optional</span></label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 10000"
                              value={discountData.maxCapAmount || ''}
                              onChange={e => setDiscountData(prev => ({ ...prev, maxCapAmount: e.target.value }))}
                              className={inputCls}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reason */}
                    <div>
                      <label className={labelCls}>Reason / Scholarship Type *</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Merit scholarship, Financial aid, Sibling discount, Sports quota…"
                        value={discountData.reason}
                        onChange={e => setDiscountData(prev => ({ ...prev, reason: e.target.value }))}
                        className={inputCls}
                      />
                    </div>

                    {/* Validity dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Valid From *</label>
                        <input type="date" value={discountData.validFrom} onChange={e => setDiscountData(prev => ({ ...prev, validFrom: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Valid To <span className={`normal-case font-normal ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>optional</span></label>
                        <input type="date" value={discountData.validTo} onChange={e => setDiscountData(prev => ({ ...prev, validTo: e.target.value }))} className={inputCls} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Fee Breakdown */}
              {feeCalcs.selected.length > 0 && (
                <div className={`${sectionCls} ${discountData.hasDiscount && feeCalcs.discountAmount > 0 ? theme === 'dark' ? 'border-green-700' : 'border-green-300' : ''}`}>
                  <p className={sectionTitleCls}>📊 Fee Summary</p>
                  <div className="space-y-2">
                    {feeCalcs.selected.map((fee: any) => {
                      const perFeeDiscount = feeCalcs.discountAmount > 0 ? Math.round(Number(fee.amount) * (feeCalcs.discountAmount / feeCalcs.baseTotal)) : 0;
                      return (
                        <div key={fee.id} className="flex justify-between items-center py-1">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{fee.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>₹{Number(fee.amount).toLocaleString('en-IN')}</span>
                            {perFeeDiscount > 0 && <span className="text-xs text-green-500">(-₹{perFeeDiscount.toLocaleString('en-IN')})</span>}
                          </div>
                        </div>
                      );
                    })}
                    <hr className={theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} />
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Fees:</span>
                      <span className={`text-sm font-semibold ${discountData.hasDiscount && feeCalcs.discountAmount > 0 ? 'line-through text-gray-400' : theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                        ₹{feeCalcs.baseTotal.toLocaleString('en-IN')}/year
                      </span>
                    </div>
                    {discountData.hasDiscount && feeCalcs.discountAmount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-600 dark:text-green-400">Discount Applied:</span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">-₹{feeCalcs.discountAmount.toLocaleString('en-IN')}/year</span>
                        </div>
                        <hr className={theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} />
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Final Annual Fees:</span>
                          <span className="text-base font-bold text-blue-500">₹{feeCalcs.finalTotal.toLocaleString('en-IN')}/year</span>
                        </div>
                        <div className={`flex items-center justify-center gap-2 p-2 rounded-lg mt-1 ${theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'}`}>
                          <span className="text-sm font-semibold">🎉 Savings: ₹{feeCalcs.discountAmount.toLocaleString('en-IN')} ({feeCalcs.savingsPercent}% off)</span>
                        </div>
                      </>
                    )}
                    {/* Payment breakdowns */}
                    <div className={`mt-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>PAYMENT OPTIONS</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'Annual', divisor: 1 },
                          { label: 'Quarterly', divisor: 4 },
                          { label: 'Monthly', divisor: 12 },
                        ].map(opt => (
                          <div key={opt.label} className={`p-2 rounded border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{opt.label}</p>
                            <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                              ₹{Math.round(feeCalcs.finalTotal / opt.divisor).toLocaleString('en-IN')}
                            </p>
                            {opt.divisor > 1 && <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>× {opt.divisor}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {discountData.hasDiscount && (
                    <p className={`text-xs mt-3 flex items-center gap-1 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      ⚠️ Discount request will be submitted for admin approval. An email notification will be sent to all approvers.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: PERSONAL ─────────────────────────────── */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              {/* Photo */}
              <div className={sectionCls}>
                <p className={sectionTitleCls}>📷 Student Photo</p>
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 ${theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}>
                    {formData.photo
                      ? <img src={formData.photo} alt="Student" className="w-full h-full object-cover" />
                      : <span className="text-2xl">📷</span>}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" className={inputCls}
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) { const r = new FileReader(); r.onloadend = () => set('photo', r.result); r.readAsDataURL(f); }
                      }}
                    />
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>JPG, PNG – max 2MB</p>
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>👤 Basic Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Full Name *</label>
                    <input type="text" required placeholder="Student's full name" value={formData.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth *</label>
                    <input type="date" required value={formData.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Gender *</label>
                    <select value={formData.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Blood Group</label>
                    <select value={formData.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Category</label>
                    <select value={formData.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      {['General','OBC','SC','ST','EWS'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Religion</label>
                    <select value={formData.religion} onChange={e => set('religion', e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      {['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Other'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Mother Tongue</label>
                    <input type="text" value={formData.motherTongue} onChange={e => set('motherTongue', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nationality</label>
                    <input type="text" value={formData.nationality} onChange={e => set('nationality', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Aadhar Number</label>
                    <input type="text" maxLength={12} placeholder="12-digit Aadhar" value={formData.aadharNumber} onChange={e => set('aadharNumber', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>STS ID</label>
                    <input type="text" placeholder="Optional" value={formData.stsId} onChange={e => set('stsId', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: CONTACT ─────────────────────────────── */}
          {activeTab === 'contact' && (
            <div className={sectionCls}>
              <p className={sectionTitleCls}>📞 Contact Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone Number *</label>
                  <input type="tel" required placeholder="10-digit mobile" value={formData.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input type="email" placeholder="Optional" value={formData.email} onChange={e => set('email', e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Address *</label>
                  <textarea rows={2} required value={formData.address} onChange={e => set('address', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>City *</label>
                  <input type="text" required value={formData.city} onChange={e => set('city', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State *</label>
                  <select value={formData.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>PIN Code *</label>
                  <input type="text" required maxLength={6} value={formData.pinCode} onChange={e => set('pinCode', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: PARENTS ─────────────────────────────── */}
          {activeTab === 'parents' && (
            <div className="space-y-4">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>👨 Father's Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Father's Name *</label>
                    <input type="text" required value={formData.fatherName} onChange={e => set('fatherName', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Occupation</label>
                    <input type="text" value={formData.fatherOccupation} onChange={e => set('fatherOccupation', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone *</label>
                    <input type="tel" required value={formData.fatherPhone} onChange={e => set('fatherPhone', e.target.value)} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Email</label>
                    <input type="email" value={formData.fatherEmail} onChange={e => set('fatherEmail', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>👩 Mother's Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Mother's Name *</label>
                    <input type="text" required value={formData.motherName} onChange={e => set('motherName', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Occupation</label>
                    <input type="text" value={formData.motherOccupation} onChange={e => set('motherOccupation', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <div className="flex gap-2">
                      <input type="tel" value={formData.motherPhone} onChange={e => set('motherPhone', e.target.value)} className={inputCls} />
                      <button type="button" onClick={() => set('motherPhone', formData.fatherPhone)}
                        className="flex-shrink-0 px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">Copy</button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Email</label>
                    <input type="email" value={formData.motherEmail} onChange={e => set('motherEmail', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>🚨 Emergency Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Contact Number *</label>
                    <div className="flex gap-2">
                      <input type="tel" required value={formData.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} className={inputCls} />
                      <button type="button" onClick={() => setFormData(p => ({ ...p, emergencyContact: p.fatherPhone, emergencyRelation: 'Father' }))}
                        className="flex-shrink-0 px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700">Father</button>
                      <button type="button" onClick={() => setFormData(p => ({ ...p, emergencyContact: p.motherPhone || p.fatherPhone, emergencyRelation: 'Mother' }))}
                        className="flex-shrink-0 px-2 py-1 text-xs rounded bg-purple-600 text-white hover:bg-purple-700">Mother</button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Relation</label>
                    <select value={formData.emergencyRelation} onChange={e => set('emergencyRelation', e.target.value)} className={inputCls}>
                      <option value="">Select Relation</option>
                      {['Father','Mother','Guardian','Grandparent','Sibling','Other'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: ADDITIONAL ─────────────────────────────── */}
          {activeTab === 'additional' && (
            <div className="space-y-4">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>🏦 Bank Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Bank Name</label><input type="text" value={formData.bankName} onChange={e => set('bankName', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Account Number</label><input type="text" value={formData.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>IFSC Code</label><input type="text" value={formData.bankIfsc} onChange={e => set('bankIfsc', e.target.value)} className={inputCls} /></div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>🏥 Medical Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className={labelCls}>Medical Conditions</label><input type="text" placeholder="e.g. Asthma, Diabetes" value={formData.medicalConditions} onChange={e => set('medicalConditions', e.target.value)} className={inputCls} /></div>
                  <div className="col-span-2"><label className={labelCls}>Allergies</label><input type="text" placeholder="e.g. Peanuts, Dust" value={formData.allergies} onChange={e => set('allergies', e.target.value)} className={inputCls} /></div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>🚌 Transport & Hostel</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Transport</label>
                    <select value={formData.transport} onChange={e => set('transport', e.target.value)} className={inputCls}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Hostel</label>
                    <select value={formData.hostel} onChange={e => set('hostel', e.target.value)} className={inputCls}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>📄 Documents Submitted</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(formData.documents).map(key => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.documents[key]} onChange={e => setFormData(p => ({ ...p, documents: { ...p.documents, [key]: e.target.checked } }))}
                        className="w-4 h-4 rounded accent-blue-600" />
                      <span className={`text-sm capitalize ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>📝 Remarks</p>
                <textarea rows={3} placeholder="Any additional notes..." value={formData.remarks} onChange={e => set('remarks', e.target.value)} className={inputCls} />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between pt-3 mt-2 border-t flex-shrink-0 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-2">
            {TABS.findIndex(t => t.id === activeTab) > 0 && (
              <button type="button" onClick={() => setActiveTab(TABS[TABS.findIndex(t => t.id === activeTab) - 1].id)}
                className={`px-4 py-2 text-sm rounded-lg border font-medium ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                ← Back
              </button>
            )}
            {!isLastTab && (
              <button type="button" onClick={() => setActiveTab(TABS[TABS.findIndex(t => t.id === activeTab) + 1].id)}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Next →
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel}
              className={`px-4 py-2 text-sm rounded-lg border font-medium ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
              Cancel
            </button>
            {isLastTab && (
              <button type="submit"
                className="px-6 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow">
                {student ? 'Update Student' : 'Add Student'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
