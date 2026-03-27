'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Eye, EyeOff, X, Send, RefreshCw, CreditCard, AlertTriangle, AlertCircle, Calendar, Users, Target, CheckCircle, ChevronLeft, ChevronRight, Save, Sparkles, GraduationCap, Check, FileText } from 'lucide-react';
import PersonalInfoTab from './tabs/PersonalInfoTab';
import ContactInfoTab from './tabs/ContactInfoTab';
import AcademicInfoTab from './tabs/AcademicInfoTab';
import ParentsInfoTab from './tabs/ParentsInfoTab';
import DocumentsTab from './tabs/DocumentsTab';
import FeesTab from './tabs/FeesTab';
import TransportTab from './tabs/TransportTab';
import DiscountTab from './tabs/DiscountTab';
import FeeSummaryTab from './tabs/FeeSummaryTab';
import AdditionalInfoTab from './tabs/AdditionalInfoTab';
import UnifiedApplicationPreview from './components/UnifiedApplicationPreview';
import AIInsightsPanel from './components/AIInsightsPanel';
import AdmissionSummary from './components/AdmissionSummary';
import { useAIFormProcessor } from './hooks/useAIFormProcessor';
import { useFormValidation } from './hooks/useFormValidation';
import { useSubscriptionLimits } from './hooks/useSubscriptionLimits';
import { useIdCard } from './hooks/useIdCard';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { StudentFormData, StudentFormAIProps } from './types';

const StudentFormAIContainer: React.FC<StudentFormAIProps> = ({
  student,
  onSubmit,
  onCancel,
  theme,
  themeConfig,
  getCardClass,
  getInputClass,
  getBtnClass,
  getTextClass
}) => {
  const isDark = theme === 'dark';
  
  // Form State
  const [formData, setFormData] = useState<StudentFormData>({
    // Personal Information
    photo: student?.photo || '',
    name: student?.name || '',
    dateOfBirth: student?.dateOfBirth || '',
    gender: student?.gender || '',
    placeOfBirth: student?.placeOfBirth || '',
    nationality: student?.nationality || '',
    bloodGroup: student?.bloodGroup || '',
    religion: student?.religion || '',
    category: student?.category || '',
    motherTongue: student?.motherTongue || '',
    stsId: student?.stsId || '',
    aadharNumber: student?.aadharNumber || '',
    
    // Contact Information
    phone: student?.phone || '',
    email: student?.email || '',
    address: student?.address || '',
    city: student?.city || '',
    state: student?.state || '',
    pincode: student?.pincode || '',
    
    // Academic Information
    admissionNo: student?.admissionNo || '',
    admissionDate: student?.admissionDate || '',
    classId: student?.classId || '',
    sectionId: student?.sectionId || '',
    class: student?.class || '',
    section: student?.section || '',
    rollNumber: student?.rollNumber || '',
    mediumId: student?.mediumId || '',
    boardId: student?.boardId || '',
    languageMedium: student?.languageMedium || '',
    previousSchool: student?.previousSchool || '',
    previousClass: student?.previousClass || '',
    
    // Parent Information
    fatherName: student?.fatherName || '',
    fatherPhone: student?.fatherPhone || '',
    fatherEmail: student?.fatherEmail || '',
    fatherOccupation: student?.fatherOccupation || '',
    motherName: student?.motherName || '',
    motherPhone: student?.motherPhone || '',
    motherEmail: student?.motherEmail || '',
    motherOccupation: student?.motherOccupation || '',
    
    // Additional Information
    medicalConditions: student?.medicalConditions || '',
    allergies: student?.allergies || '',
    emergencyContact: student?.emergencyContact || '',
    emergencyPhone: student?.emergencyPhone || '',
    emergencyRelation: student?.emergencyRelation || '',
    gpa: student?.gpa || 0,
    status: student?.status || '',
    
    // Bank Information
    bankAccountNumber: student?.bankAccountNumber || '',
    bankAccountName: student?.bankAccountName || '',
    bankName: student?.bankName || '',
    bankIfsc: student?.bankIfsc || '',
    
    // Transport & Hostel
    transport: student?.transport || '',
    hostel: student?.hostel || '',
    
    // Documents
    documents: student?.documents || {
      birthCertificate: false,
      aadharCard: false,
      transferCertificate: false,
      medicalCertificate: false,
      passportPhoto: false,
      marksheet: false,
      casteCertificate: false,
      incomeCertificate: false,
    },
    
    // Remarks
    remarks: student?.remarks || '',
  });

  // UI State
  const [activeTab, setActiveTab] = useState('personal');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState<number | null>(null);
  const [createdStudent, setCreatedStudent] = useState<any>(null);

  // Fee & Transport State
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [selectedDiscountFeeIds, setSelectedDiscountFeeIds] = useState<string[]>([]);
  const [discountData, setDiscountData] = useState({
    hasDiscount: false,
    discountCategory: '',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'full_waiver',
    discountValue: 0,
    maxCapAmount: '',
    reason: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
  });
  const [transportInfo, setTransportInfo] = useState({
    routeId: '',
    pickupStop: '',
    dropStop: '',
    monthlyFee: 0,
    yearlyFee: 0,
    routeName: '',
    routeNumber: '',
  });
  const [transportDiscount, setTransportDiscount] = useState({
    hasDiscount: false,
    discountType: 'percentage' as 'percentage' | 'fixed' | 'full_waiver',
    discountValue: 0,
    reason: '',
  });

  // Auto-save functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const timestamp = Date.now();
      localStorage.setItem('studentFormAutoSave', JSON.stringify({ 
        ...formData, 
        _ts: timestamp,
        // Include dropdown selections that are in formData
        boardId: formData.boardId,
        classId: formData.classId,
        mediumId: formData.mediumId,
        sectionId: formData.sectionId,
        // Include discount data
        discountData,
        // Include transport data
        transportInfo,
        transportDiscount,
        selectedDiscountFeeIds,
      }));
      setLastAutoSaveAt(timestamp);
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, discountData, transportInfo, transportDiscount, selectedDiscountFeeIds]);

  // Auto-generate admission number and date on mount
  useEffect(() => {
    if (!student) {
      // Generate admission number
      const year = new Date().getFullYear();
      const sequence = Math.floor(1000 + Math.random() * 9000);
      const admissionNo = `${year}${sequence}`;
      
      // Set admission date to today
      const today = new Date().toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        admissionNo,
        admissionDate: today
      }));
    }
  }, [student]);

  // Restore auto-save on mount (new student only)
  useEffect(() => {
    if (student) return; // Don't restore for existing students
    
    try {
      const saved = localStorage.getItem('studentFormAutoSave');
      if (!saved) return;
      
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed._ts < 86400000) { // Only restore if less than 24 hours old
        setFormData((prev: any) => ({ 
          ...prev, 
          ...parsed,
          classId: '', // Clear - old AY class IDs are invalid
          mediumId: prev.mediumId || '',
          sectionId: '',
        }));
        
        // Restore additional state variables
        if (parsed.discountData) {
          setDiscountData(parsed.discountData);
        }
        if (parsed.transportInfo) {
          setTransportInfo(parsed.transportInfo);
        }
        if (parsed.transportDiscount) {
          setTransportDiscount(parsed.transportDiscount);
        }
        if (parsed.selectedDiscountFeeIds) {
          setSelectedDiscountFeeIds(parsed.selectedDiscountFeeIds);
        }
        
        setLastAutoSaveAt(parsed._ts);
      }
    } catch (error) {
      console.error('Failed to restore auto-save:', error);
    }
  }, [student]);

  // Load transport routes
  useEffect(() => {
    fetch('/api/transport/routes?isActive=true')
      .then(r => r.json())
      .then(data => setTransportRoutes(data.routes || []))
      .catch(() => {});
  }, []);

  // Custom Hooks
  const { aiInsights, isAIProcessing, processWithAI } = useAIFormProcessor();
  const { errors, setErrors, validateForm } = useFormValidation();
  const { subscriptionSummary, limitReached, planError, usagePercent, seatsRemaining, studentsUsed, maxStudents } = useSubscriptionLimits();
  const { mediums, classes, sections, dropdowns, activeAcademicYear, getSetting } = useSchoolConfig();

  // Load fee structures when class changes
  useEffect(() => {
    if (!formData.classId || !activeAcademicYear?.id) {
      setFeeStructures([]);
      return;
    }
    setFeesLoading(true);
    const params = new URLSearchParams({
      academicYearId: activeAcademicYear.id,
      isActive: 'true',
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
  }, [formData.classId, formData.mediumId, formData.boardId, activeAcademicYear?.id]);

  // Fee Calculations
  const applicableFeeStructures = useMemo(() => {
    return feeStructures.filter((fee: any) => {
      const boardMatch = !fee.boardId || fee.boardId === formData.boardId;
      const mediumMatch = !fee.mediumId || fee.mediumId === formData.mediumId;
      const classMatch = !fee.classId || fee.classId === formData.classId;
      return boardMatch && mediumMatch && classMatch;
    });
  }, [feeStructures, formData.boardId, formData.classId, formData.mediumId]);

  // Auto-select fees when discount category changes (after applicableFeeStructures is available)
  useEffect(() => {
    if (discountData.discountCategory && applicableFeeStructures.length > 0) {
      const categoryFees = applicableFeeStructures.filter((fee: any) => {
        const feeCategory = fee.category || fee.feeCategory || 'General';
        return feeCategory === discountData.discountCategory;
      });
      setSelectedDiscountFeeIds(categoryFees.map((f: any) => f.id));
    } else {
      setSelectedDiscountFeeIds([]);
    }
  }, [discountData.discountCategory, applicableFeeStructures]);

  const feeCategories = useMemo(() => {
    const categories = new Set<string>();
    applicableFeeStructures.forEach((fee: any) => {
      const category = fee.category || fee.feeCategory || 'General';
      categories.add(category);
    });
    return Array.from(categories).sort();
  }, [applicableFeeStructures]);

  const feeCalcs = useMemo(() => {
    const selectedFees = applicableFeeStructures.filter((f: any) => {
      const feeCategory = f.category || f.feeCategory || 'General';
      return selectedDiscountFeeIds.includes(f.id) && 
             (!discountData.discountCategory || discountData.discountCategory === feeCategory);
    });
    
    // Base total should be ALL applicable fees, not just selected for discount
    const baseTotal = applicableFeeStructures.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);
    
    // Calculate total of ALL applicable fees (same as baseTotal now)
    const totalApplicableFees = baseTotal;
    
    // Calculate discount only on selected fees
    const discountableTotal = selectedFees.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);
    
    if (!discountData.hasDiscount || (discountData.discountType !== 'full_waiver' && !discountData.discountValue)) {
      return { 
        baseTotal, 
        discountAmount: 0, 
        finalTotal: baseTotal, 
        savingsPercent: 0, 
        selected: selectedFees,
        totalApplicableFees,
        discountableTotal
      };
    }
    let discountAmount = 0;
    if (discountData.discountType === 'percentage') {
      discountAmount = (discountableTotal * Number(discountData.discountValue)) / 100;
      if (discountData.maxCapAmount) discountAmount = Math.min(discountAmount, Number(discountData.maxCapAmount));
    } else if (discountData.discountType === 'fixed') {
      discountAmount = Math.min(Number(discountData.discountValue), discountableTotal);
    } else if (discountData.discountType === 'full_waiver') {
      discountAmount = discountableTotal;
    }
    return { 
      baseTotal, 
      discountAmount, 
      finalTotal: baseTotal - discountAmount, 
      savingsPercent: discountableTotal > 0 ? Math.round((discountAmount / discountableTotal) * 100) : 0, 
      selected: selectedFees,
      totalApplicableFees,
      discountableTotal
    };
  }, [applicableFeeStructures, selectedDiscountFeeIds, discountData]);

  const selectedRoute = useMemo(
    () => transportRoutes.find((route: any) => route.id === transportInfo.routeId) || null,
    [transportRoutes, transportInfo.routeId]
  );

  const transportFeeCalcs = useMemo(() => {
    const baseAnnual = (() => {
      if (!transportInfo.routeId) return 0;
      if (Number(transportInfo.yearlyFee) > 0) return Number(transportInfo.yearlyFee);
      return Number(transportInfo.monthlyFee || 0) * 12;
    })();
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

  const tuitionAnnual = useMemo(() => feeCalcs.totalApplicableFees || 0, [feeCalcs.totalApplicableFees]);
  const tuitionFinalTotal = Math.max(tuitionAnnual - feeCalcs.discountAmount, 0);
  const combinedAnnual = tuitionFinalTotal + transportFeeCalcs.finalAnnual;
  
  // Academic Year Label
  const ayLabel = activeAcademicYear 
    ? `${activeAcademicYear.name || activeAcademicYear.year}`
    : 'No Active Academic Year';
    
  const { 
    showIdCard, 
    setShowIdCard, 
    showCardBack, 
    setShowCardBack, 
    idCardHtml, 
    idCardData,
    setIdCardData,
    setIdCardHtml,
    handleGenerateIdCard,
    handlePrintIdCard,
    handleToggleCardSide,
  } = useIdCard(formData, activeAcademicYear, transportInfo);

  // Multi-Step Configuration
  const steps = [
    { id: 'personal', label: 'Personal Info', icon: '👤', color: 'blue', description: 'Student\'s basic information' },
    { id: 'contact', label: 'Contact Details', icon: '📞', color: 'green', description: 'Contact and address information' },
    { id: 'academic', label: 'Academic Info', icon: '🎓', color: 'purple', description: 'Educational background' },
    { id: 'parents', label: 'Parent Info', icon: '👨‍👩‍👧‍👦', color: 'orange', description: 'Parent/guardian details' },
    { id: 'documents', label: 'Documents', icon: '📄', color: 'indigo', description: 'Required documents' },
    { id: 'transport', label: 'Transport', icon: '🚌', color: 'cyan', description: 'Transport service selection' },
    { id: 'discount', label: 'Discount', icon: '🎯', color: 'pink', description: 'Academic & transport discounts' },
    { id: 'feeSummary', label: 'Fee Summary', icon: '📊', color: 'amber', description: 'Complete fee breakdown' },
    { id: 'additional', label: 'Additional', icon: '⚙️', color: 'gray', description: 'Extra information' },
  ];

  // Step Components
  const stepComponents = {
    personal: PersonalInfoTab,
    contact: ContactInfoTab,
    academic: AcademicInfoTab,
    parents: ParentsInfoTab,
    documents: DocumentsTab,
    transport: TransportTab,
    discount: DiscountTab,
    feeSummary: FeeSummaryTab,
    additional: AdditionalInfoTab,
  };

  const ActiveStepComponent = stepComponents[activeTab as keyof typeof stepComponents];

  // Progress calculation
  const currentStepIndex = steps.findIndex(step => step.id === activeTab);
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  // Navigation functions
  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setActiveTab(steps[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setActiveTab(steps[currentStepIndex - 1].id);
    }
  };

  const goToStep = (stepId: string) => {
    setActiveTab(stepId);
  };

  // CSS Classes
  const cardClass = `rounded-2xl border shadow-lg ${
    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
  }`;

  // Auto-save label
  const autoSaveLabel = lastAutoSaveAt
    ? `Saved ${new Date(lastAutoSaveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Saving…';

  // Form Handlers
  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors, setErrors]);

  // Format currency helper
  const fmtCurrency = useCallback((amount: number) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  }, []);

  // Validation before submit
  const validateBeforeSubmit = useCallback(() => {
    if (!formData.name.trim()) { alert('Full Name is required'); return false; }
    if (!formData.dateOfBirth) { alert('Date of Birth is required'); return false; }
    if (!formData.mediumId) { alert('Please select a Language Medium'); return false; }
    
    // Discount validation
    if (discountData.hasDiscount) {
      if (!discountData.discountCategory) {
        alert('Please select a discount category'); return false;
      }
      if (selectedDiscountFeeIds.length === 0) {
        alert('Please select at least one fee type for discount'); return false;
      }
      if (discountData.discountType !== 'full_waiver' && (!discountData.discountValue || Number(discountData.discountValue) <= 0)) {
        alert('Please enter a valid discount amount'); return false;
      }
      if (!discountData.reason.trim()) { 
        alert('Please provide a reason for the discount'); return false; 
      }
      if (discountData.discountType === 'percentage' && Number(discountData.discountValue) > 100) {
        alert('Percentage discount cannot exceed 100%'); return false;
      }
    }
    
    // Transport discount validation
    if (transportDiscount.hasDiscount && transportInfo.routeId) {
      if (transportDiscount.discountType !== 'full_waiver' && Number(transportDiscount.discountValue || 0) <= 0) {
        alert('Please enter a valid transport discount amount'); return false;
      }
      if (transportDiscount.discountType === 'percentage' && Number(transportDiscount.discountValue || 0) > 100) {
        alert('Transport percentage discount cannot exceed 100%'); return false;
      }
      if (!transportDiscount.reason.trim()) {
        alert('Please provide a reason for the transport discount'); return false;
      }
    }
    return true;
  }, [discountData, formData, selectedDiscountFeeIds, transportDiscount, transportInfo]);

  // Check if current step is valid
  const isCurrentStepValid = useCallback(() => {
    // Basic validation - can be enhanced based on specific step requirements
    switch (activeTab) {
      case 'personal':
        return formData.name.trim() !== '' && formData.dateOfBirth !== '';
      case 'academic':
        return formData.mediumId !== '' && formData.classId !== '';
      default:
        return true; // Other steps are optional or have their own validation
    }
  }, [activeTab, formData]);

  // Build admission preview document HTML
  const buildAdmissionPreviewDocument = useCallback((payload: any) => {
    const schoolName = getSetting('school_details', 'name', 'Our School');
    const schoolLogo = getSetting('school_details', 'logo_url', '');
    const schoolAddress = [
      getSetting('school_details', 'address'),
      getSetting('school_details', 'city'),
      getSetting('school_details', 'state'),
      getSetting('school_details', 'pincode'),
    ].filter(Boolean).join(', ');
    const schoolPhone = getSetting('school_details', 'phone', '');
    const schoolEmail = getSetting('school_details', 'email', '');

    const tuitionRows = payload.tuitionRows.map((fee: any) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${fee.name}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${fee.category}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmtCurrency(fee.amount)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#059669;">${fee.discountAmount ? `- ${fmtCurrency(fee.discountAmount)}` : '—'}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">${fmtCurrency(fee.finalAmount)}</td>
      </tr>
    `).join('');
    
    const transportSection = payload.transport.selected ? `
      <div style="margin-top:24px;padding:20px;border-radius:16px;background:#f8fafc;border:1px solid #dbeafe;">
        <h3 style="margin:0 0 12px;font-size:18px;">Transport</h3>
        <p style="margin:0 0 8px;color:#334155;"><strong>Route:</strong> ${payload.transport.routeLabel}</p>
        <p style="margin:0 0 8px;color:#334155;"><strong>Pickup Stop:</strong> ${payload.transport.pickupStop || 'Not selected'}</p>
        <p style="margin:0 0 8px;color:#334155;"><strong>Charge:</strong> ${payload.transport.chargeLabel}</p>
        <p style="margin:0;color:#334155;"><strong>Discount:</strong> ${payload.transport.discountLabel}</p>
      </div>
    ` : '';

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Admission Preview</title>
        </head>
        <body style="margin:0;background:#f8fafc;font-family:Inter,Segoe UI,system-ui,sans-serif;color:#0f172a;padding:32px;">
          <div style="max-width:960px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,0.12);">
            <div style="padding:28px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;">
              <div style="display:flex;align-items:center;gap:16px;">
                ${schoolLogo ? `<img src="${schoolLogo}" alt="School Logo" style="width:72px;height:72px;object-fit:contain;border-radius:18px;background:rgba(255,255,255,0.12);padding:8px;" />` : ''}
                <div>
                  <h1 style="margin:0;font-size:28px;">${schoolName}</h1>
                  <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Admission Preview • ${payload.student.name}</p>
                </div>
              </div>
            </div>
            <div style="padding:28px;">
              <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">
                <div style="padding:18px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
                  <h3 style="margin:0 0 12px;font-size:18px;">Student Details</h3>
                  <p style="margin:0 0 8px;"><strong>Name:</strong> ${payload.student.name}</p>
                  <p style="margin:0 0 8px;"><strong>Admission No:</strong> ${payload.student.admissionNo}</p>
                  <p style="margin:0 0 8px;"><strong>Class:</strong> ${payload.student.className}</p>
                  <p style="margin:0 0 8px;"><strong>Section:</strong> ${payload.student.section || 'Not assigned'}</p>
                  <p style="margin:0 0 8px;"><strong>Medium:</strong> ${payload.student.medium || 'Not selected'}</p>
                  <p style="margin:0 0 8px;"><strong>Date of Birth:</strong> ${payload.student.dateOfBirth || '—'}</p>
                </div>
                <div style="padding:18px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
                  <h3 style="margin:0 0 12px;font-size:18px;">Contact Details</h3>
                  <p style="margin:0 0 8px;"><strong>Student Email:</strong> ${payload.student.email || '—'}</p>
                  <p style="margin:0 0 8px;"><strong>Phone:</strong> ${payload.student.phone || '—'}</p>
                  <p style="margin:0 0 8px;"><strong>Father:</strong> ${payload.student.fatherName || '—'} ${payload.student.fatherEmail ? `(${payload.student.fatherEmail})` : ''}</p>
                  <p style="margin:0 0 8px;"><strong>Mother:</strong> ${payload.student.motherName || '—'} ${payload.student.motherEmail ? `(${payload.student.motherEmail})` : ''}</p>
                  <p style="margin:0;"><strong>Address:</strong> ${payload.student.address || '—'}</p>
                </div>
              </div>
              <div style="margin-top:24px;">
                <h3 style="margin:0 0 12px;font-size:18px;">Fee Structure</h3>
                <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                  <thead style="background:#eff6ff;">
                    <tr>
                      <th style="padding:12px;text-align:left;">Fee</th>
                      <th style="padding:12px;text-align:left;">Category</th>
                      <th style="padding:12px;text-align:right;">Base</th>
                      <th style="padding:12px;text-align:right;">Discount</th>
                      <th style="padding:12px;text-align:right;">Final</th>
                    </tr>
                  </thead>
                  <tbody>${tuitionRows}</tbody>
                </table>
              </div>
              ${transportSection}
              <div style="margin-top:24px;padding:20px;border-radius:18px;background:#eff6ff;border:1px solid #bfdbfe;">
                <p style="margin:0 0 8px;"><strong>Tuition Total:</strong> ${fmtCurrency(payload.summary.tuitionTotal)}</p>
                <p style="margin:0 0 8px;"><strong>Tuition Discount:</strong> ${fmtCurrency(payload.summary.tuitionDiscount)}</p>
                <p style="margin:0 0 8px;"><strong>Transport Total:</strong> ${fmtCurrency(payload.summary.transportTotal)}</p>
                <p style="margin:0;font-size:20px;font-weight:800;color:#1d4ed8;"><strong>Grand Total:</strong> ${fmtCurrency(payload.summary.grandTotal)}</p>
              </div>
              <div style="margin-top:20px;color:#475569;font-size:13px;">
                <p style="margin:0 0 6px;">${schoolAddress || ''}</p>
                <p style="margin:0;">${[schoolPhone, schoolEmail].filter(Boolean).join(' • ')}</p>
              </div>
            </div>
          </div>
        </body>
      </html>`;
  }, [fmtCurrency, getSetting]);

  // Build preview payload
  const buildPreviewPayload = useCallback((studentOverride?: any) => {
    const baseTotal = applicableFeeStructures.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
    const tuitionRows = applicableFeeStructures.map((fee: any) => {
      const feeCategory = fee.category || fee.feeCategory || 'General';
      const isSelectedForDiscount = selectedDiscountFeeIds.includes(fee.id);
      const isInDiscountCategory = discountData.discountCategory === feeCategory;
      const hasDiscount = discountData.hasDiscount && isSelectedForDiscount && isInDiscountCategory && feeCalcs.baseTotal > 0;
      const discountAmount = hasDiscount ? Math.round(Number(fee.amount || 0) * (feeCalcs.discountAmount / feeCalcs.baseTotal)) : 0;
      return {
        id: fee.id,
        name: fee.name,
        category: feeCategory,
        amount: Number(fee.amount || 0),
        discountAmount,
        finalAmount: Math.max(Number(fee.amount || 0) - discountAmount, 0),
      };
    });
    
    const effectiveStudent = studentOverride || formData;
    const transportSelected = formData.transport === 'Yes' && !!transportInfo.routeId;
    
    const idCard = {
      name: effectiveStudent.name,
      admissionNo: effectiveStudent.admissionNo,
      className: [effectiveStudent.class, effectiveStudent.section].filter(Boolean).join(' - '),
      schoolName: getSetting('school_details', 'name', 'Our School'),
      schoolLogo: getSetting('school_details', 'logo_url', ''),
      photo: effectiveStudent.photo,
      dateOfBirth: effectiveStudent.dateOfBirth,
      issueDate: effectiveStudent.admissionDate || new Date().toISOString().split('T')[0],
      phone: effectiveStudent.phone,
      address: effectiveStudent.address,
      academicYear: activeAcademicYear?.name || activeAcademicYear?.year,
      bloodGroup: effectiveStudent.bloodGroup,
      fatherName: effectiveStudent.fatherName,
      motherName: effectiveStudent.motherName,
      transportRoute: transportSelected ? transportInfo.routeName || `Route ${transportInfo.routeNumber}` : undefined,
    };

    const payload = {
      student: {
        name: effectiveStudent.name,
        admissionNo: effectiveStudent.admissionNo,
        className: effectiveStudent.class,
        section: effectiveStudent.section,
        medium: effectiveStudent.languageMedium,
        dateOfBirth: effectiveStudent.dateOfBirth,
        email: effectiveStudent.email,
        phone: effectiveStudent.phone,
        fatherName: effectiveStudent.fatherName,
        fatherEmail: effectiveStudent.fatherEmail,
        motherName: effectiveStudent.motherName,
        motherEmail: effectiveStudent.motherEmail,
        address: [effectiveStudent.address, effectiveStudent.city, effectiveStudent.state, effectiveStudent.pincode].filter(Boolean).join(', '),
      },
      tuitionRows,
      tuitionCategories: feeCategories,
      transport: {
        selected: transportSelected,
        routeLabel: selectedRoute ? `${selectedRoute.routeNumber} — ${selectedRoute.routeName}` : '',
        pickupStop: transportInfo.pickupStop,
        dropStop: transportInfo.dropStop,
        chargeLabel: `${fmtCurrency(transportInfo.monthlyFee)}/month • ${fmtCurrency(transportInfo.yearlyFee)}/year`,
        annualAmount: transportFeeCalcs.baseAnnual,
        discountAmount: transportFeeCalcs.discountAmount,
        discountLabel: transportDiscount.hasDiscount
          ? transportDiscount.discountType === 'full_waiver'
            ? 'Full waiver'
            : `${transportDiscount.discountType === 'percentage' ? `${transportDiscount.discountValue}%` : fmtCurrency(transportDiscount.discountValue)} • ${transportDiscount.reason || 'Reason provided'}`
          : 'No transport discount',
      },
      summary: {
        tuitionTotal: baseTotal,
        tuitionDiscount: feeCalcs.discountAmount,
        tuitionFinal: tuitionFinalTotal,
        transportTotal: transportFeeCalcs.finalAnnual,
        grandTotal: combinedAnnual,
      },
      discountData,
      transportDiscount,
      idCardData: idCard,
    };

    return {
      ...payload,
      previewDocumentHtml: buildAdmissionPreviewDocument(payload),
      idCardHtml: '', // Will be generated dynamically by the hook
    };
  }, [applicableFeeStructures, buildAdmissionPreviewDocument, combinedAnnual, discountData, feeCalcs, feeCategories, fmtCurrency, formData, getSetting, activeAcademicYear, selectedDiscountFeeIds, selectedRoute, transportDiscount, transportFeeCalcs, transportInfo, tuitionFinalTotal]);

  // Print preview document
  const handlePrintPreview = useCallback(() => {
    const payload = buildPreviewPayload();
    if (!payload.previewDocumentHtml) return;
    
    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    if (!printWindow) return;
    printWindow.document.write(payload.previewDocumentHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  }, [buildPreviewPayload]);

  // Download preview PDF
  const handleDownloadPreviewPdf = useCallback(async () => {
    const payload = buildPreviewPayload();
    if (!payload.previewDocumentHtml) return;

    let element: HTMLElement | null = null;
    let tempWrapper: HTMLDivElement | null = null;
    
    const parsed = new DOMParser().parseFromString(payload.previewDocumentHtml, 'text/html');
    tempWrapper = document.createElement('div');
    tempWrapper.id = 'admission-preview-print';
    tempWrapper.style.position = 'fixed';
    tempWrapper.style.left = '-99999px';
    tempWrapper.style.top = '0';
    tempWrapper.style.width = '1024px';
    tempWrapper.innerHTML = parsed.body.innerHTML;
    document.body.appendChild(tempWrapper);
    element = tempWrapper;

    if (!element) return;
    
    try {
      const { PDFGenerator } = await import('@/utils/pdfGenerator');
      await PDFGenerator.generateFromElement(
        'admission-preview-print',
        `Admission_Preview_${(formData.admissionNo || 'student').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
      );
    } finally {
      if (tempWrapper) {
        document.body.removeChild(tempWrapper);
      }
    }
  }, [buildPreviewPayload, formData.admissionNo]);

  // Download ID Card PDF
  const handleDownloadIdCardPdf = useCallback(async () => {
    const element = document.getElementById('student-id-card-print');
    if (!element) return;
    
    try {
      const { PDFGenerator } = await import('@/utils/pdfGenerator');
      await PDFGenerator.generateFromElement(
        'student-id-card-print',
        `Student_ID_Card_${(createdStudent?.admissionNo || formData.admissionNo || 'student').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
      );
    } catch (error) {
      console.error('Failed to generate ID card PDF:', error);
      alert('Failed to generate ID card PDF. Please try again.');
    }
  }, [createdStudent?.admissionNo, formData.admissionNo]);

  // Open preview modal
  const openPreview = useCallback(() => {
    if (!validateBeforeSubmit()) {
      return;
    }
    const payload = buildPreviewPayload();
    setPreviewPayload(payload);
    setShowPreview(true);
  }, [buildPreviewPayload, validateBeforeSubmit]);

  // Submit admission with complete payload
  // Import the old StudentForm's submission logic
  const useOldStudentFormSubmission = useCallback(async (aiFormData: StudentFormData) => {
    // Transform AI form data to old StudentForm format - only include fields that exist in old formData
    const oldFormData = {
      photo: aiFormData.photo || '',
      name: aiFormData.name || '',
      dateOfBirth: aiFormData.dateOfBirth || '',
      gender: aiFormData.gender || 'Male',
      bloodGroup: aiFormData.bloodGroup || '',
      nationality: aiFormData.nationality || 'Indian',
      religion: aiFormData.religion || '',
      category: aiFormData.category || '',
      motherTongue: aiFormData.motherTongue || '',
      aadharNumber: aiFormData.aadharNumber || '',
      stsId: aiFormData.stsId || '',
      phone: aiFormData.phone || '',
      email: aiFormData.email || '',
      address: aiFormData.address || '',
      city: aiFormData.city || '',
      state: aiFormData.state || '',
      pinCode: aiFormData.pincode || '',
      admissionNo: aiFormData.admissionNo || `${new Date().getFullYear()}0001`,
      admissionDate: aiFormData.admissionDate || new Date().toISOString().split('T')[0],
      mediumId: aiFormData.mediumId || '',
      classId: aiFormData.classId || '',
      sectionId: aiFormData.sectionId || '',
      class: aiFormData.class || '',
      section: aiFormData.section || '',
      languageMedium: aiFormData.languageMedium || '',
      rollNo: aiFormData.rollNumber || '',
      board: '',
      boardId: aiFormData.boardId || '',
      previousSchool: aiFormData.previousSchool || '',
      previousClass: aiFormData.previousClass || '',
      fatherName: aiFormData.fatherName || '',
      fatherOccupation: aiFormData.fatherOccupation || '',
      fatherPhone: aiFormData.fatherPhone || '',
      fatherEmail: aiFormData.fatherEmail || '',
      motherName: aiFormData.motherName || '',
      motherOccupation: aiFormData.motherOccupation || '',
      motherPhone: aiFormData.motherPhone || '',
      motherEmail: aiFormData.motherEmail || '',
      emergencyContact: aiFormData.emergencyContact || '',
      emergencyRelation: aiFormData.emergencyRelation || '',
      bankName: aiFormData.bankName || '',
      bankAccountNumber: aiFormData.bankAccountNumber || '',
      bankIfsc: aiFormData.bankIfsc || '',
      medicalConditions: aiFormData.medicalConditions || '',
      allergies: aiFormData.allergies || '',
      transport: aiFormData.transport || 'No',
      hostel: aiFormData.hostel || 'No',
      remarks: aiFormData.remarks || '',
      documents: aiFormData.documents || {
        birthCertificate: false,
        aadharCard: false,
        transferCertificate: false,
        medicalCertificate: false,
        passportPhoto: false,
        marksheet: false,
        casteCertificate: false,
        incomeCertificate: false,
      },
      gpa: aiFormData.gpa || 0,
      status: aiFormData.status || 'active',
      // Note: NOT including fees-related fields here as they're handled separately in old form
    };

    // Use the exact same submission logic as old StudentForm
    const payload = buildPreviewPayload();
    const result = await onSubmit({
      ...oldFormData,
      _admissionFlowHandled: true,
      _admissionPreview: {
        previewDocumentHtml: payload.previewDocumentHtml,
        previewSummary: payload.summary,
        idCardData: payload.idCardData,
        idCardHtml: payload.idCardHtml,
      },
      ...(discountData.hasDiscount && {
        _discountInfo: { 
          ...discountData,
          ...(discountData.discountType === 'full_waiver' && {
            discountValue: 100
          }),
          feeStructureIds: selectedDiscountFeeIds 
        },
      }),
      ...(transportInfo.routeId && {
        _transportInfo: {
          ...transportInfo,
          annualFee: transportFeeCalcs.baseAnnual,
          ...(transportDiscount.hasDiscount && {
            discountInfo: {
              ...transportDiscount,
              ...(transportDiscount.discountType === 'full_waiver' && {
                discountValue: 100
              })
            },
          }),
        },
      }),
    } as any);
    
    return result;
  }, [onSubmit, buildPreviewPayload, discountData, transportInfo, transportDiscount, selectedDiscountFeeIds, transportFeeCalcs]);

  const submitAdmission = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateBeforeSubmit()) return;

    localStorage.removeItem('studentFormAutoSave');
    setLastAutoSaveAt(null);
    setIsSubmitting(true);
    try {
      // Use the old StudentForm submission logic directly
      const result = await useOldStudentFormSubmission(formData);
      
      const created = result as any;
      if (!created) {
        throw new Error('Student creation did not return a student record');
      }
      const finalPreview = buildPreviewPayload(created ? {
        ...formData,
        name: created.name || formData.name,
        admissionNo: created.admissionNo || formData.admissionNo,
        class: created.class || formData.class,
        section: created.section || formData.section,
        photo: created.photo || formData.photo,
      } : undefined);
      setCreatedStudent(created);
      setPreviewPayload(finalPreview);
      setShowPreview(false);
      setIdCardData(finalPreview.idCardData as any);
      setIdCardHtml(finalPreview.idCardHtml);
      setShowIdCard(true);
    } catch (error) {
      console.error('Error submitting student form:', error);
      alert('Failed to submit student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    useOldStudentFormSubmission,
    buildPreviewPayload,
    discountData,
    formData,
    isSubmitting,
    selectedDiscountFeeIds,
    transportInfo,
    validateBeforeSubmit,
  ]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent browser's default form submission
    
    if (!validateBeforeSubmit()) return;
    
    // Check subscription limits
    if (limitReached) {
      alert('Student limit reached. Please upgrade your subscription to add more students.');
      return;
    }
    
    if (planError) {
      alert(`Subscription error: ${planError}. Please check your subscription status.`);
      return;
    }
    
    setIsSubmitting(true);
    
    // Clear auto-save on successful submission
    localStorage.removeItem('studentFormAutoSave');
    setLastAutoSaveAt(null);
    
    try {
      await submitAdmission();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateBeforeSubmit, limitReached, planError, submitAdmission]);

  const getTabGradient = (color: string) => {
    const gradients = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      indigo: 'from-indigo-500 to-indigo-600',
      gray: 'from-gray-500 to-gray-600'
    };
    return gradients[color as keyof typeof gradients] || gradients.blue;
  };

  const tabClass = (tabId: string) => {
    const isActive = activeTab === tabId;
    return `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg'
        : isDark 
          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;
  };

  return (
    <div className="fixed inset-0 z-[99999]">
      <form onSubmit={handleSubmit} className="w-full h-screen flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`flex-1 flex flex-col overflow-hidden ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          }`}
        >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <GraduationCap className="w-6 h-6" />
              </motion.div>
              <div>
                <h1 className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Student Admission Form
                </h1>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  AI-Powered Smart Form Processing
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 shadow-lg'
              }`}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Step Progress */}
        <div className={`px-4 py-2 border-b ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <motion.div
                  className="flex flex-col items-center cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    // Allow navigation to any completed step or the next step
                    if (index <= currentStepIndex || index === currentStepIndex + 1) {
                      setActiveTab(steps[index].id);
                    }
                  }}
                >
                  <motion.div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${
                      index < currentStepIndex
                        ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 ring-2 ring-emerald-200 shadow-emerald-500/50'
                        : index === currentStepIndex
                        ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 ring-2 ring-blue-200 shadow-blue-500/50 scale-110'
                        : isDark
                        ? 'bg-gradient-to-br from-gray-600 to-gray-700 ring-1 ring-gray-500 shadow-gray-600/30'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-gray-300 shadow-gray-400/20'
                    }`}
                    whileHover={{ 
                      scale: (index <= currentStepIndex || index === currentStepIndex + 1) ? 1.05 : 1,
                      rotate: index === currentStepIndex ? [0, 5, -5, 0] : 0
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Animated background gradient */}
                    {index === currentStepIndex && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 via-transparent to-white/10"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    
                    {/* Inner circle with icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${
                      index < currentStepIndex
                        ? 'bg-white/20'
                        : index === currentStepIndex
                        ? 'bg-white/30'
                        : isDark
                        ? 'bg-gray-800/50'
                        : 'bg-white/80'
                    }`}>
                      {index < currentStepIndex ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                          <Check className="w-5 h-5 text-white font-bold" />
                        </motion.div>
                      ) : (
                        <div className="text-lg font-bold">
                          {step.icon}
                        </div>
                      )}
                    </div>
                    
                    {/* Pulse animation for active step */}
                    {index === currentStepIndex && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 opacity-30"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </motion.div>
                  
                  <motion.span 
                    className={`mt-1 text-xs font-semibold text-center max-w-[80px] px-1 py-0.5 rounded-full transition-all duration-300 ${
                      index === currentStepIndex
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : index < currentStepIndex
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                        : isDark
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {step.label}
                  </motion.span>
                </motion.div>
                
                {/* Progress line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 flex items-center justify-center px-2">
                    <motion.div
                      className={`h-1 rounded-full transition-all duration-500 ${
                        index < currentStepIndex
                          ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-600 shadow-lg shadow-emerald-500/50'
                          : isDark
                          ? 'bg-gray-600'
                          : 'bg-gray-300'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: index < currentStepIndex ? '100%' : '0%' }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          {/* Scroll indicator for content */}
          <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-blue-500/20 to-blue-600/20 pointer-events-none z-10" />
          
          <div className="h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 hover:scrollbar-thumb-blue-600">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="min-h-full py-4"
              >
                <div className="max-w-none">
                  {React.createElement(ActiveStepComponent as any, {
                    formData,
                    setFormData,
                    errors,
                    setErrors,
                    isSubmitting,
                    setIsSubmitting,
                    currentStepIndex,
                    activeTab,
                    setActiveTab,
                    goToNextStep,
                    goToPreviousStep,
                    openPreview,
                    handleGenerateIdCard,
                    showIdCard,
                    setShowIdCard,
                    showCardBack,
                    setShowCardBack,
                    idCardHtml,
                    handlePrintIdCard,
                    // AI State
                    aiInsights,
                    showAIInsights,
                    setShowAIInsights,
                    isAIProcessing,
                    processWithAI,
                    // Validation
                    validateForm,
                    isCurrentStepValid,
                    // Academic Data
                    classes,
                    sections,
                    activeAcademicYear,
                    // Helpers
                    fmtCurrency,
                    handleChange,
                    onChange: handleChange,
                    // Fee Calculations
                    feeCalcs,
                    feeStructures,
                    selectedDiscountFeeIds,
                    setSelectedDiscountFeeIds,
                    discountData,
                    setDiscountData,
                    feeCategories,
                    applicableFeeStructures,
                    feesLoading,
                    tuitionAnnual,
                    tuitionFinalTotal,
                    combinedAnnual,
                    // Transport
                    transportInfo,
                    setTransportInfo,
                    transportDiscount,
                    setTransportDiscount,
                    transportFeeCalcs,
                    transportRoutes,
                    setTransportRoutes,
                    // Theme
                    theme,
                    themeConfig,
                    getCardClass,
                    getInputClass,
                    getBtnClass,
                    getTextClass,
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* AI Insights Panel */}
        {showAIInsights && (
          <div className={`px-6 py-4 border-b ${
            isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <AIInsightsPanel 
              show={showAIInsights}
              insights={aiInsights}
              isProcessing={isAIProcessing}
              isDark={isDark}
            />
          </div>
        )}

        {/* Navigation */}
        <div className={`relative border-t ${
          isDark ? 'border-slate-700/30' : 'border-gray-200/50'
        }`} style={{ minHeight: '80px' }}>
          <div className="relative px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Left side - Previous Button */}
              <div className="flex items-center">
                <motion.button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={currentStepIndex === 0}
                  whileHover={{ scale: currentStepIndex === 0 ? 1 : 1.02, y: currentStepIndex === 0 ? 0 : -2 }}
                  whileTap={{ scale: currentStepIndex === 0 ? 1 : 0.98 }}
                  className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 overflow-hidden ${
                    currentStepIndex === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 shadow-lg border border-slate-600/50'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </motion.button>
              </div>

              {/* Center - Utility Buttons */}
              <div className="flex items-center gap-2">
                {/* AI Insights Button */}
                <motion.button
                  type="button"
                  onClick={() => setShowAIInsights(!showAIInsights)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`group relative px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                    isDark
                      ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-300 hover:from-slate-600 hover:to-slate-700 shadow-lg border border-slate-600/50'
                      : 'bg-gradient-to-r from-white to-gray-50 text-gray-700 hover:from-gray-50 hover:to-gray-100 shadow-md border border-gray-300/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>AI</span>
                  </div>
                </motion.button>
              </div>

              {/* Right side - Next/Submit Buttons */}
              <div className="flex items-center gap-2">
                {/* Next Button - Always visible except on last step */}
                {currentStepIndex < steps.length - 1 && (
                  <motion.button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!isCurrentStepValid()}
                    whileHover={{ scale: isCurrentStepValid() ? 1.05 : 1, y: isCurrentStepValid() ? -2 : 0 }}
                    whileTap={{ scale: isCurrentStepValid() ? 0.95 : 1 }}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden ${
                      !isCurrentStepValid()
                        ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed border border-gray-300/50'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-2xl border border-blue-400/30'
                    }`}
                  >
                    <span className="relative z-10">Next</span>
                    <ChevronRight className="w-3 h-3 relative z-10" />
                  </motion.button>
                )}

                {/* Preview Button - Only on last step */}
                {currentStepIndex === steps.length - 1 && (
                  <motion.button
                    type="button"
                    onClick={openPreview}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg border border-white/20`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="relative z-10">Application Resume</span>
                  </motion.button>
                )}

                {/* AI Process Button - Only on last step */}
                {currentStepIndex === steps.length - 1 && (
                  <motion.button
                    type="button"
                    onClick={() => processWithAI(formData)}
                    disabled={isAIProcessing}
                    whileHover={{ scale: isAIProcessing ? 1 : 1.05, y: isAIProcessing ? 0 : -2 }}
                    whileTap={{ scale: isAIProcessing ? 1 : 0.95 }}
                    className={`relative px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 overflow-hidden ${
                      isAIProcessing
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-300 cursor-not-allowed border border-slate-600/50'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-xl border border-white/20'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 relative z-10 ${isAIProcessing ? 'animate-spin' : ''}`} />
                    <span className="relative z-10">{isAIProcessing ? 'Processing...' : 'AI'}</span>
                  </motion.button>
                )}

                {/* Submit Admission Button - Only on last step */}
                {currentStepIndex === steps.length - 1 && (
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.05, y: isSubmitting ? 0 : -2 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 overflow-hidden ${
                      isSubmitting
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed border border-gray-400/50'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-2xl border border-green-400/30'
                    }`}
                  >
                    <Send className="w-3 h-3 relative z-10" />
                    <span className="relative z-10">{isSubmitting ? 'Submitting...' : 'Submit'}</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unified Application Preview */}
        <UnifiedApplicationPreview
          show={showPreview}
          onClose={() => setShowPreview(false)}
          formData={formData}
          aiInsights={aiInsights}
          theme={theme}
          onSubmit={(e: React.FormEvent) => handleSubmit(e)}
          isSubmitting={isSubmitting}
        />

        {/* ID Card and Admission Summary - After Successful Submission */}
        {showIdCard && idCardData && (
          <AdmissionSummary
            createdStudent={createdStudent}
            formData={formData}
            previewPayload={previewPayload}
            combinedAnnual={combinedAnnual}
            fmtCurrency={fmtCurrency}
            isDark={isDark}
            onCancel={onCancel}
            showIdCard={showIdCard}
            setShowIdCard={setShowIdCard}
            showCardBack={showCardBack}
            setShowCardBack={setShowCardBack}
            idCardHtml={idCardHtml}
            handlePrintIdCard={handlePrintIdCard}
            handleDownloadIdCardPdf={handleDownloadIdCardPdf}
            handlePrintPreview={handlePrintPreview}
            handleDownloadPreviewPdf={handleDownloadPreviewPdf}
          />
        )}
      </motion.div>
    </form>
    </div>
  );
};

export default StudentFormAIContainer;
