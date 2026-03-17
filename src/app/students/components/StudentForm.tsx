// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student } from '../types';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { StudentIdCardData, buildStudentIdCardSnippet, buildStudentIdCardDocument } from '@/lib/idCard';

const digitsOnly = (value: string | undefined | null) => (value || '').replace(/\D/g, '');
const isPhoneValid = (value: string | undefined | null) => {
  if (!value) return false;
  const digits = digitsOnly(value);
  return digits.length >= 10 && digits.length <= 15;
};
const isAadharValid = (value: string | undefined | null) => {
  if (!value) return true;
  return digitsOnly(value).length === 12;
};
const isPinValid = (value: string | undefined | null) => {
  if (!value) return true;
  return digitsOnly(value).length === 6;
};
const isIFSCValid = (value: string | undefined | null) => {
  if (!value) return true;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(value.trim());
};

function CollapsibleSection({
  title,
  subtitle,
  theme,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  theme: 'dark' | 'light';
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const wrapperCls = `rounded-xl border p-4 transition-colors ${
    theme === 'dark' ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
  }`;

  return (
    <div className={wrapperCls}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-start justify-between text-left"
      >
        <div>
          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{title}</p>
          {subtitle && (
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
          )}
        </div>
        <span className={`text-lg transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>⌄</span>
      </button>
      {isOpen && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

const TABS = [
  { id: 'admission', label: 'Admission' },
  { id: 'personal', label: 'Personal' },
  { id: 'contact', label: 'Contact' },
  { id: 'parents', label: 'Father Mother Name' },
  { id: 'additional', label: 'Additional' },
  { id: 'fees', label: 'Fee Information' },
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
  const { mediums, classes, sections, dropdowns, activeAcademicYear, loading, getSetting } = useSchoolConfig();
  const [activeTab, setActiveTab] = useState('admission');
  const [subscriptionSummary, setSubscriptionSummary] = useState<{ maxStudents: number | null; studentsUsed: number | null; status: 'loading' | 'ready' | 'error'; }>({
    maxStudents: null,
    studentsUsed: null,
    status: 'loading',
  });
  const [planError, setPlanError] = useState<string | null>(null);
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<null | {
    feeStructures: any[];
    feeCalcs: ReturnType<typeof feeCalcs>;
    transportInfo: typeof transportInfo;
    transportFeeCalcs: ReturnType<typeof transportFeeCalcs>;
    discountData: typeof discountData;
    selectedDiscountFeeIds: string[];
  }>(null);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [idCardHtml, setIdCardHtml] = useState('');
  const [idCardData, setIdCardData] = useState<StudentIdCardData | null>(null);
  
  // Initialize mediumId if only one medium exists
  const initialMediumId = !student && mediums.length === 1 ? mediums[0].id : (student?._mediumId || '');
  const initialLanguageMedium = !student && mediums.length === 1 ? mediums[0].name : (student?.languageMedium || '');

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
  const helperTextCls = `text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`;
  const errorTextCls = `text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`;
  const inputWithValidation = (hasError?: boolean) =>
    hasError
      ? `${inputCls} border-red-500 focus:border-red-500 focus:ring-red-500/30`
      : inputCls;
  const fmtCurrency = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

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
    mediumId: initialMediumId,
    classId: student?._classId || '',
    sectionId: student?._sectionId || '',
    class: student?.class || '',
    section: student?.section || '',
    languageMedium: initialLanguageMedium,
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
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [transportInfo, setTransportInfo] = useState({
    routeId: '',
    pickupStop: '',
    dropStop: '',
    monthlyFee: 0,
  });
  const [discountData, setDiscountData] = useState({
    hasDiscount: false,
    discountCategory: '',
    discountType: 'percentage',
    discountValue: 0,
    maxCapAmount: '',
    reason: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
  });
  const [selectedDiscountFeeIds, setSelectedDiscountFeeIds] = useState<string[]>([]);
  const transportDiscountInitial = {
    hasDiscount: false,
    discountType: 'percentage' as 'percentage' | 'fixed' | 'full_waiver',
    discountValue: 0,
    reason: '',
  };
  const [transportDiscount, setTransportDiscount] = useState(transportDiscountInitial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentTabIndex = TABS.findIndex(t => t.id === activeTab);
  const progressPercent = Math.round(((currentTabIndex + 1) / TABS.length) * 100);
  const studentsUsed = subscriptionSummary.studentsUsed ?? 0;
  const maxStudents = subscriptionSummary.maxStudents ?? 0;
  const usagePercent = maxStudents > 0 ? Math.min(Math.round((studentsUsed / maxStudents) * 100), 100) : 0;
  const seatsRemaining = maxStudents > 0 ? Math.max(maxStudents - studentsUsed, 0) : null;
  const limitReached = seatsRemaining !== null && seatsRemaining <= 0;
  const ayLabel = activeAcademicYear ? `${activeAcademicYear.name || activeAcademicYear.year}` : 'No Active Academic Year';
  const autoSaveLabel = lastAutoSaveAt
    ? `Saved ${new Date(lastAutoSaveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Saving…';
  const validations = {
    studentPhoneInvalid: !!formData.phone && !isPhoneValid(formData.phone),
    aadharInvalid: !!formData.aadharNumber && !isAadharValid(formData.aadharNumber),
    pinInvalid: !!formData.pinCode && !isPinValid(formData.pinCode),
    fatherPhoneInvalid: !!formData.fatherPhone && !isPhoneValid(formData.fatherPhone),
    motherPhoneInvalid: !!formData.motherPhone && !isPhoneValid(formData.motherPhone),
    emergencyPhoneInvalid: !!formData.emergencyContact && !isPhoneValid(formData.emergencyContact),
    bankIfscInvalid: !!formData.bankIfsc && !isIFSCValid(formData.bankIfsc),
  };
  const submissionDisabled = isSubmitting || limitReached;

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

  // Load transport routes once
  useEffect(() => {
    fetch('/api/transport/routes?isActive=true')
      .then(r => r.json())
      .then(data => setTransportRoutes(data.routes || []))
      .catch(() => {});
  }, []);

  // Load fee structures when class changes
  useEffect(() => {
    if (!formData.classId || !activeAcademicYear?.id) { setFeeStructures([]); return; }
    setFeesLoading(true);
    
    // MUST pass academicYearId to only get current year's fee structures
    const params = new URLSearchParams({
      classId: formData.classId,
      academicYearId: activeAcademicYear.id,
      isActive: 'true',
      ...(formData.mediumId && { mediumId: formData.mediumId }),
    });
    
    fetch(`/api/fees/structures?${params}`)
      .then(r => r.json())
      .then(data => {
        setFeeStructures(data.feeStructures || []);
        setSelectedDiscountFeeIds([]);
      })
      .catch(err => {
        console.error('Failed to load fee structures:', err);
        setFeeStructures([]);
      })
      .finally(() => setFeesLoading(false));
  }, [formData.classId, formData.mediumId, activeAcademicYear]);

  // Auto-save
  useEffect(() => {
    const t = setTimeout(() => {
      const timestamp = Date.now();
      localStorage.setItem('studentFormAutoSave', JSON.stringify({ ...formData, _ts: timestamp }));
      setLastAutoSaveAt(timestamp);
    }, 2000);
    return () => clearTimeout(t);
  }, [formData]);

  // Restore auto-save on mount (new student only)
  // Clear AY-specific IDs - they belong to old academic year records
  useEffect(() => {
    if (student) return;
    try {
      const saved = localStorage.getItem('studentFormAutoSave');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed._ts < 86400000) {
        setFormData(prev => ({
          ...prev,
          ...parsed,
          classId: '',    // Clear - old AY class IDs are invalid
          mediumId: prev.mediumId || '', // Keep if already set by context init
          sectionId: '',  // Clear - old AY section IDs are invalid
        }));
      }
    } catch {}
  }, []);

  // Fetch subscription usage
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/subscription?cache=true');
        if (!res.ok) throw new Error('Failed to load subscription');
        const data = await res.json();
        if (mounted) {
          setSubscriptionSummary({
            maxStudents: data?.subscription?.maxStudents ?? null,
            studentsUsed: data?.subscription?.studentsUsed ?? null,
            status: 'ready',
          });
        }
      } catch (err: any) {
        if (mounted) {
          setPlanError(err.message || 'Unable to load subscription details');
          setSubscriptionSummary(prev => ({ ...prev, status: 'error' }));
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-select fees when discount category is selected
  useEffect(() => {
    if (discountData.discountCategory && feeStructures.length > 0) {
      const categoryFees = feeStructures.filter(fee => {
        const feeCategory = fee.category || fee.feeCategory || 'General';
        return feeCategory === discountData.discountCategory;
      });
      setSelectedDiscountFeeIds(categoryFees.map(f => f.id));
    } else {
      setSelectedDiscountFeeIds([]);
    }
  }, [discountData.discountCategory, feeStructures]);

  // Get unique categories from fee structures
  const feeCategories = useMemo(() => {
    const categories = new Set<string>();
    feeStructures.forEach(fee => {
      const category = fee.category || fee.feeCategory || 'General';
      categories.add(category);
    });
    return Array.from(categories).sort();
  }, [feeStructures]);

  const feeCalcs = useMemo(() => {
    const selectedFees = feeStructures.filter(f => {
      const feeCategory = f.category || f.feeCategory || 'General';
      return selectedDiscountFeeIds.includes(f.id) && 
             (!discountData.discountCategory || discountData.discountCategory === feeCategory);
    });
    const baseTotal = selectedFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    if (!discountData.hasDiscount || !discountData.discountValue) {
      return { baseTotal, discountAmount: 0, finalTotal: baseTotal, savingsPercent: 0, selected: selectedFees };
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
    return { baseTotal, discountAmount, finalTotal: baseTotal - discountAmount, savingsPercent: baseTotal > 0 ? Math.round((discountAmount / baseTotal) * 100) : 0, selected: selectedFees };
  }, [feeStructures, selectedDiscountFeeIds, discountData]);

  const transportFeeCalcs = useMemo(() => {
    const baseAnnual = transportInfo.routeId ? Number(transportInfo.monthlyFee || 0) * 12 : 0;
    if (!transportDiscount.hasDiscount || !transportInfo.routeId) {
      return { baseAnnual, discountAmount: 0, finalAnnual: baseAnnual };
    }
    if (transportDiscount.discountType === 'full_waiver') {
      return { baseAnnual, discountAmount: baseAnnual, finalAnnual: 0 };
    }
    let discountAmount = 0;
    if (transportDiscount.discountType === 'percentage') {
      discountAmount = Math.min(baseAnnual, (baseAnnual * Number(transportDiscount.discountValue || 0)) / 100);
    } else {
      discountAmount = Math.min(baseAnnual, Number(transportDiscount.discountValue || 0));
    }
    return { baseAnnual, discountAmount, finalAnnual: baseAnnual - discountAmount };
  }, [transportInfo, transportDiscount]);

  const tuitionAnnual = useMemo(() => feeStructures.reduce((sum, f) => sum + (Number(f.amount) || 0), 0), [feeStructures]);
  const tuitionFinalTotal = Math.max(tuitionAnnual - feeCalcs.discountAmount, 0);
  const combinedAnnual = tuitionFinalTotal + transportFeeCalcs.finalAnnual;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    
    if (!formData.name.trim()) { alert('Full Name is required'); return; }
    if (!formData.dateOfBirth) { alert('Date of Birth is required'); return; }
    if (!formData.mediumId) { alert('Please select a Language Medium'); return; }
    if (!formData.classId) { alert('Please select a Class'); return; }
    if (discountData.hasDiscount) {
      if (!discountData.discountCategory) {
        alert('Please select a discount category'); return;
      }
      if (selectedDiscountFeeIds.length === 0) {
        alert('Please select at least one fee type for discount'); return;
      }
      if (discountData.discountType !== 'full_waiver' && (!discountData.discountValue || Number(discountData.discountValue) <= 0)) {
        alert('Please enter a valid discount amount'); return;
      }
      if (!discountData.reason.trim()) { alert('Please provide a reason for the discount'); return; }
      if (discountData.discountType === 'percentage' && Number(discountData.discountValue) > 100) {
        alert('Percentage discount cannot exceed 100%'); return;
      }
    }
    localStorage.removeItem('studentFormAutoSave');
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        ...(discountData.hasDiscount && {
          _discountInfo: { 
            ...discountData, 
            feeStructureIds: selectedDiscountFeeIds 
          },
        }),
        ...(transportInfo.routeId && {
          _transportInfo: transportInfo,
        }),
      } as any);
    } catch (error) {
      console.error('Error submitting student form:', error);
      alert('Failed to submit student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className={`mb-4 rounded-2xl border p-4 ${
        theme === 'dark' ? 'border-blue-900/50 bg-blue-900/10 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-900'
      }`}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">Active Academic Year</p>
            <p className="text-lg font-semibold">{ayLabel}</p>
          </div>
          <div>
            {subscriptionSummary.status === 'ready' && maxStudents > 0 ? (
              <p className="text-sm font-medium">
                {studentsUsed}/{maxStudents} student seats used {seatsRemaining !== null && seatsRemaining >= 0 && `• ${seatsRemaining} remaining`}
              </p>
            ) : subscriptionSummary.status === 'error' ? (
              <p className={errorTextCls}>{planError || 'Unable to load plan limits'}</p>
            ) : (
              <p className={helperTextCls}>Checking subscription limits…</p>
            )}
          </div>
          {limitReached && (
            <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
              ⚠️ Student limit reached. Please upgrade your plan to admit new students.
            </div>
          )}
        </div>
        {subscriptionSummary.status === 'ready' && maxStudents > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs opacity-80">
              <span>{usagePercent}% used</span>
              {!limitReached && seatsRemaining !== null && <span>{seatsRemaining} seats left</span>}
            </div>
            <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {/* Tab Bar */}
      <div className={`flex gap-1 pb-3 border-b flex-shrink-0 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={tabBtnCls(t.id)}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${limitReached ? 'bg-red-500' : 'bg-green-500'}`} />
          <div className="flex flex-col">
            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-700'}`}>{autoSaveLabel}</span>
            {limitReached && <span className={errorTextCls}>Upgrade plan to continue</span>}
          </div>
          <button
            type="button"
            onClick={() => { localStorage.removeItem('studentFormAutoSave'); }}
            className={`text-xs px-2 py-1 rounded border ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:text-white' : 'border-gray-300 text-gray-400 hover:text-gray-700'}`}
          >
            Clear
          </button>
        </div>
      </div>
      <div className={`h-1 rounded-full mb-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div
          className="h-1 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
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
                    {feeStructures.map(fee => (
                      <div key={fee.id} className={`flex justify-between items-center p-3 rounded-lg border ${
                        theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div>
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{fee.name}</p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {fee.category || fee.feeCategory || 'General'}
                            {' · '}
                            {fee.classId ? (fee.class?.name || 'Specific Class') : 'All Classes'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                            ₹{Number(fee.amount || 0).toLocaleString('en-IN')}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>per year</p>
                        </div>
                      </div>
                    ))}
                    <div className={`flex justify-between items-center p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Total Fees:</span>
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

                    {/* Category */}
                    <div>
                      <label className={labelCls}>Discount Category</label>
                      <select
                        value={discountData.discountCategory}
                        onChange={e => setDiscountData(prev => ({ ...prev, discountCategory: e.target.value }))}
                        className={`${inputCls} capitalize`}
                      >
                        <option value="">Select category...</option>
                        {feeCategories.map(category => (
                          <option key={category} value={category} className="capitalize">
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fee Types for Selected Category */}
                    {discountData.discountCategory && (
                      <div>
                        <label className={labelCls}>Fee Types for {discountData.discountCategory}</label>
                        <div className={`space-y-2 max-h-32 overflow-y-auto p-2 rounded-lg border ${theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                          {feeStructures
                            .filter(fee => {
                              const feeCategory = fee.category || fee.feeCategory || 'General';
                              return feeCategory === discountData.discountCategory;
                            })
                            .map(fee => (
                              <label key={fee.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedDiscountFeeIds.includes(fee.id)}
                                  onChange={e => setSelectedDiscountFeeIds(prev => 
                                    e.target.checked 
                                      ? [...prev, fee.id] 
                                      : prev.filter(id => id !== fee.id)
                                  )}
                                  className="w-4 h-4 accent-blue-600"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{fee.name}</p>
                                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>₹{Number(fee.amount || 0).toLocaleString('en-IN')}/year</p>
                                </div>
                              </label>
                            ))}
                          {feeStructures.filter(fee => {
                            const feeCategory = fee.category || fee.feeCategory || 'General';
                            return feeCategory === discountData.discountCategory;
                          }).length === 0 && (
                            <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              No fees found for this category
                            </p>
                          )}
                        </div>
                      </div>
                    )}

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
                    {feeStructures.map((fee: any) => {
                      const feeCategory = fee.category || fee.feeCategory || 'General';
                      const isSelectedForDiscount = selectedDiscountFeeIds.includes(fee.id);
                      const isInDiscountCategory = discountData.discountCategory === feeCategory;
                      const hasDiscount = discountData.hasDiscount && isSelectedForDiscount && isInDiscountCategory;
                      const perFeeDiscount = hasDiscount && feeCalcs.discountAmount > 0 ? Math.round(Number(fee.amount) * (feeCalcs.discountAmount / feeCalcs.baseTotal)) : 0;
                      const finalFeeAmount = Number(fee.amount) - perFeeDiscount;
                      
                      return (
                        <div key={fee.id} className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{fee.name}</span>
                            {hasDiscount && <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">DISCOUNT</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${hasDiscount ? 'line-through text-gray-400' : theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                              ₹{Number(fee.amount).toLocaleString('en-IN')}
                            </span>
                            {hasDiscount && (
                              <>
                                <span className="text-xs text-green-500">(-₹{perFeeDiscount.toLocaleString('en-IN')})</span>
                                <span className={`text-sm font-bold text-green-600 dark:text-green-400`}>
                                  ₹{finalFeeAmount.toLocaleString('en-IN')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <hr className={theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} />
                    <div className="flex justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Fees:</span>
                      <span className={`text-sm font-semibold ${discountData.hasDiscount && feeCalcs.discountAmount > 0 ? 'line-through text-gray-400' : theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                        ₹{feeStructures.reduce((sum, f) => sum + (Number(f.amount) || 0), 0).toLocaleString('en-IN')}/year
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
                          <span className="text-base font-bold text-blue-500">
                            ₹{(feeStructures.reduce((sum, f) => sum + (Number(f.amount) || 0), 0) - feeCalcs.discountAmount).toLocaleString('en-IN')}/year
                          </span>
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
                              ₹{Math.round((feeStructures.reduce((sum, f) => sum + (Number(f.amount) || 0), 0) - feeCalcs.discountAmount) / opt.divisor).toLocaleString('en-IN')}
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
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={e => set('phone', e.target.value)}
                    className={inputWithValidation(validations.studentPhoneInvalid)}
                  />
                  <p className={validations.studentPhoneInvalid ? errorTextCls : helperTextCls}>
                    {validations.studentPhoneInvalid ? 'Phone must be 10-15 digits.' : 'Include country code if international (e.g., +91)'}
                  </p>
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
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pinCode}
                    onChange={e => set('pinCode', e.target.value)}
                    className={inputWithValidation(validations.pinInvalid)}
                  />
                  {validations.pinInvalid && <p className={errorTextCls}>PIN must be exactly 6 digits.</p>}
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
                  <div className="col-span-2">
                    <label className={labelCls}>Assign Transport Route</label>
                    <select
                      value={transportInfo.routeId}
                      onChange={e => {
                        const r = transportRoutes.find((x: any) => x.id === e.target.value);
                        setTransportInfo({ routeId: e.target.value, pickupStop: '', dropStop: '', monthlyFee: r?.monthlyFee || 0 });
                        set('transport', e.target.value ? 'Yes' : 'No');
                        set('transportRoute', r?.routeName || '');
                      }}
                      className={inputCls}
                    >
                      <option value="">No transport</option>
                      {transportRoutes.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.routeNumber} — {r.routeName} (₹{r.monthlyFee}/mo)</option>
                      ))}
                    </select>
                  </div>
                  {transportInfo.routeId && (() => {
                    const selRoute = transportRoutes.find((r: any) => r.id === transportInfo.routeId);
                    const stops = (() => { try { return JSON.parse(selRoute?.stops || '[]'); } catch { return []; } })();
                    return (<>
                      <div>
                        <label className={labelCls}>Pickup Stop *</label>
                        {stops.length > 0 ? (
                          <select value={transportInfo.pickupStop} onChange={e => setTransportInfo(p => ({ ...p, pickupStop: e.target.value }))} className={inputCls}>
                            <option value="">Select stop...</option>
                            {stops.map((s: string) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <input className={inputCls} value={transportInfo.pickupStop} onChange={e => setTransportInfo(p => ({ ...p, pickupStop: e.target.value }))} placeholder="Enter stop name" />
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Monthly Fee (₹)</label>
                        <input type="number" className={inputCls} value={transportInfo.monthlyFee} onChange={e => setTransportInfo(p => ({ ...p, monthlyFee: Number(e.target.value) }))} />
                      </div>
                    </>);
                  })()}
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
                disabled={isSubmitting}
                className={`px-6 py-2 text-sm rounded-lg font-semibold shadow transition-all ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {student ? 'Updating...' : 'Adding...'}
                  </span>
                ) : (
                  student ? 'Update Student' : 'Add Student'
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
