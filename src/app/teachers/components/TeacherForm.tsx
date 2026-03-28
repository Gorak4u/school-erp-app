'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { showToast } from '@/lib/toastUtils';

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
  { id: 'basic', label: 'Basic Information' },
  { id: 'professional', label: 'Professional Details' },
  { id: 'contact', label: 'Contact Information' },
  { id: 'bank', label: 'Bank Details' },
  { id: 'leave', label: 'Leave Balance' },
  { id: 'additional', label: 'Additional Information' },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
];

export default function TeacherForm({ 
  teacher, 
  onSubmit, 
  onCancel, 
  theme 
}: { 
  teacher: any | null; 
  onSubmit: (data: Partial<any>) => void; 
  onCancel: () => void; 
  theme: 'dark' | 'light'; 
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [customRoles, setCustomRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Leave balance state
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [leaveBalances, setLeaveBalances] = useState([]);

  // Form data state
  const [formData, setFormData] = useState({
    firstName: teacher?.firstName || '',
    lastName: teacher?.lastName || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    gender: teacher?.gender || '',
    dateOfBirth: teacher?.dateOfBirth || '',
    address: teacher?.address || '',
    city: teacher?.city || '',
    state: teacher?.state || '',
    pinCode: teacher?.pinCode || '',
    role: teacher?.role || 'teacher',
    customRoleId: teacher?.customRoleId || '',
    designation: teacher?.designation || '',
    department: teacher?.department || '',
    subject: teacher?.subject || '',
    qualification: teacher?.qualification || '',
    experience: teacher?.experience || '',
    joiningDate: teacher?.joiningDate || '',
    salary: teacher?.salary || '',
    bankName: teacher?.bankName || '',
    bankAccountNumber: teacher?.bankAccountNumber || '',
    bankIfsc: teacher?.bankIfsc || '',
    emergencyName: teacher?.emergencyName || '',
    emergencyPhone: teacher?.emergencyPhone || '',
    emergencyRelation: teacher?.emergencyRelation || '',
    aadharNumber: teacher?.aadharNumber || '',
    bloodGroup: teacher?.bloodGroup || '',
    remarks: teacher?.remarks || '',
    status: teacher?.status || 'active',
    employeeId: teacher?.employeeId || '',
    isClassTeacher: teacher?.isClassTeacher || false,
    classTeacherAssignments: teacher?.classTeacherAssignments || [],
    // Leave balance fields
    leaveBalances: teacher?.leaveBalances || [],
  });

  const set = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

  const isEditMode = !!teacher;

  // Fetch custom roles
  useEffect(() => {
    const fetchCustomRoles = async () => {
      try {
        const response = await fetch('/api/roles?cache=true');
        if (response.ok) {
          const roles = await response.json();
          setCustomRoles(roles || []);
        }
      } catch (error) {
        console.error('Failed to fetch custom roles:', error);
      }
    };
    fetchCustomRoles();
  }, []);

  // Fetch leave data
  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        const [leaveTypesRes, academicYearsRes] = await Promise.all([
          fetch('/api/leave-types?isActive=true'),
          fetch('/api/school-structure/academic-years')
        ]);
        
        if (leaveTypesRes.ok) {
          const leaveTypesData = await leaveTypesRes.json();
          setLeaveTypes(leaveTypesData.leaveTypes || []);
        }
        
        if (academicYearsRes.ok) {
          const academicYearsData = await academicYearsRes.json();
          const years = academicYearsData.academicYears || [];
          setAcademicYears(years);
          const activeYear = years.find((ay: any) => ay.isActive);
          if (activeYear) {
            setSelectedAcademicYear(activeYear.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch leave data:', error);
      }
    };
    fetchLeaveData();
  }, []);

  // Fetch existing leave balances for edit mode
  useEffect(() => {
    if (teacher?.id && selectedAcademicYear) {
      const fetchLeaveBalances = async () => {
        try {
          const response = await fetch(`/api/leave-balance?staffId=${teacher.id}&academicYearId=${selectedAcademicYear}`);
          if (response.ok) {
            const data = await response.json();
            setLeaveBalances(data.leaveBalances || []);
            set('leaveBalances', data.leaveBalances || []);
          }
        } catch (error) {
          console.error('Failed to fetch leave balances:', error);
        }
      };
      fetchLeaveBalances();
    }
  }, [teacher?.id, selectedAcademicYear]);

  // Leave balance functions
  const addLeaveBalance = () => {
    const newBalance = {
      leaveTypeId: '',
      totalAllocated: '',
      carriedForward: '',
      isNew: true
    };
    set('leaveBalances', [...formData.leaveBalances, newBalance]);
  };

  const updateLeaveBalance = (index: number, field: string, value: any) => {
    const updated = [...formData.leaveBalances];
    updated[index] = { ...updated[index], [field]: value };
    set('leaveBalances', updated);
  };

  const removeLeaveBalance = (index: number) => {
    const updated = formData.leaveBalances.filter((_: any, i: number) => i !== index);
    set('leaveBalances', updated);
  };

  // Style classes
  const sectionCls = `rounded-xl border p-4 transition-colors ${
    theme === 'dark' ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
  }`;
  const sectionTitleCls = `text-sm font-bold mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`;
  const labelCls = `block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
    theme === 'dark' 
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`;
  const helperTextCls = `text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`;
  const errorTextCls = `text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`;
  const requiredTextCls = `text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`;

  // Validations
  const validations = {
    phoneInvalid: !!formData.phone && !isPhoneValid(formData.phone),
    aadharInvalid: !!formData.aadharNumber && !isAadharValid(formData.aadharNumber),
    pinInvalid: !!formData.pinCode && !isAadharValid(formData.pinCode),
    emergencyPhoneInvalid: !!formData.emergencyPhone && !isPhoneValid(formData.emergencyPhone),
    bankIfscInvalid: !!formData.bankIfsc && !isIFSCValid(formData.bankIfsc),
  };

  const validateBeforeSubmit = useCallback(() => {
    if (!formData.firstName.trim()) { showToast('warning', 'Validation Error', 'First Name is required'); return; }
    if (!formData.lastName.trim()) { showToast('warning', 'Validation Error', 'Last Name is required'); return; }
    if (!formData.role) { showToast('warning', 'Validation Error', 'Please select a role'); return; }
    if (formData.phone && !isPhoneValid(formData.phone)) { showToast('warning', 'Validation Error', 'Please enter a valid phone number'); return; }
    if (formData.aadharNumber && !isAadharValid(formData.aadharNumber)) { showToast('warning', 'Validation Error', 'Please enter a valid 12-digit Aadhar number'); return; }
    if (formData.bankIfsc && !isIFSCValid(formData.bankIfsc)) { showToast('warning', 'Validation Error', 'Please enter a valid IFSC code'); return; }
    return true;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;

    setIsSubmitting(true);
    try {
      // Submit teacher form first
      const teacherData = await onSubmit(formData);
      
      // If teacher was created successfully and we have leave balances to allocate
      if ((teacherData as any)?.id && formData.leaveBalances.length > 0 && selectedAcademicYear) {
        const leaveBalancePromises = formData.leaveBalances
          .filter((balance: any) => balance.leaveTypeId && balance.totalAllocated)
          .map((balance: any) => 
            fetch('/api/leave-balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                staffId: (teacherData as any).id, // Use teacher ID as staffId
                leaveTypeId: balance.leaveTypeId,
                academicYearId: selectedAcademicYear,
                totalAllocated: parseFloat(balance.totalAllocated),
                carriedForward: parseFloat(balance.carriedForward) || 0,
                action: 'allocate'
              }),
            })
          );
        
        if (leaveBalancePromises.length > 0) {
          const results = await Promise.allSettled(leaveBalancePromises);
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (successful > 0) {
            console.log(`Successfully allocated leave balances for ${successful} leave type${successful > 1 ? 's' : ''}`);
          }
          if (failed > 0) {
            console.error(`Failed to allocate ${failed} leave balance${failed > 1 ? 's' : ''}`);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting teacher form:', error);
      showToast('error', 'Save Failed', 'Failed to save teacher. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabBtnCls = (id: string) =>
    `px-2 py-1.5 md:px-3 md:py-1 text-xs font-semibold rounded-lg transition-all ${
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
      <div className={`flex gap-1 pb-2 border-b flex-shrink-0 overflow-x-auto ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`${tabBtnCls(t.id)} flex-shrink-0`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSubmitting ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          <div className="flex flex-col">
            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-700'}`}>
              {isSubmitting ? 'Saving...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto py-2 pr-1">

          {/* ── TAB: BASIC INFORMATION ─────────────────────────────── */}
          {activeTab === 'basic' && (
            <div className="space-y-1 md:space-y-2">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>👤 Personal Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={e => set('firstName', e.target.value)}
                      className={inputCls}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={e => set('lastName', e.target.value)}
                      className={inputCls}
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>📱 Contact Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => set('email', e.target.value)}
                      className={inputCls}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => set('phone', e.target.value)}
                      className={`${inputCls} ${validations.phoneInvalid ? 'border-red-500' : ''}`}
                      placeholder="Phone number"
                    />
                    {validations.phoneInvalid && <p className={errorTextCls}>Please enter a valid phone number</p>}
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>🆔 Identity Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Employee ID</label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={e => set('employeeId', e.target.value)}
                      className={inputCls}
                      placeholder="Employee ID"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select value={formData.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Blood Group</label>
                    <select value={formData.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} className={inputCls}>
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={e => set('dateOfBirth', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Aadhar Number</label>
                    <input
                      type="text"
                      value={formData.aadharNumber}
                      onChange={e => set('aadharNumber', e.target.value)}
                      className={`${inputCls} ${validations.aadharInvalid ? 'border-red-500' : ''}`}
                      placeholder="12-digit Aadhar number"
                      maxLength={12}
                    />
                    {validations.aadharInvalid && <p className={errorTextCls}>Please enter a valid 12-digit Aadhar number</p>}
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>📍 Address Information</p>
                <div>
                  <label className={labelCls}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={e => set('address', e.target.value)}
                    className={inputCls}
                    placeholder="Full address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => set('city', e.target.value)}
                      className={inputCls}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <select value={formData.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>PIN Code</label>
                    <input
                      type="text"
                      value={formData.pinCode}
                      onChange={e => set('pinCode', e.target.value)}
                      className={`${inputCls} ${validations.pinInvalid ? 'border-red-500' : ''}`}
                      placeholder="PIN Code"
                      maxLength={6}
                    />
                    {validations.pinInvalid && <p className={errorTextCls}>Please enter a valid 6-digit PIN code</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: PROFESSIONAL DETAILS ─────────────────────────────── */}
          {activeTab === 'professional' && (
            <div className="space-y-1 md:space-y-2">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>💼 Role & Position</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Built-in Role *</label>
                    <select value={formData.role} onChange={e => set('role', e.target.value)} className={inputCls}>
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                      <option value="student">Student</option>
                    </select>
                    <p className={helperTextCls}>Used as fallback when no custom role is assigned</p>
                  </div>
                  <div>
                    <label className={labelCls}>Custom Role (Optional)</label>
                    <select value={formData.customRoleId} onChange={e => set('customRoleId', e.target.value)} className={inputCls}>
                      <option value="">None (use built-in role)</option>
                      {customRoles.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <p className={helperTextCls}>Custom role permissions override the built-in role</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={e => set('designation', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., Mathematics Teacher"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={e => set('department', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., Science Department"
                    />
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>🎓 Academic Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Subject Specialization</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={e => set('subject', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., Mathematics, Physics"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Qualification</label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={e => set('qualification', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., M.Sc, B.Ed"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>Experience (Years)</label>
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={e => set('experience', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Salary</label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={e => set('salary', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Joining Date</label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={e => set('joiningDate', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: CONTACT INFORMATION ─────────────────────────────── */}
          {activeTab === 'contact' && (
            <div className="space-y-1 md:space-y-2">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>🚨 Emergency Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyName}
                      onChange={e => set('emergencyName', e.target.value)}
                      className={inputCls}
                      placeholder="Emergency contact person"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Relationship</label>
                    <input
                      type="text"
                      value={formData.emergencyRelation}
                      onChange={e => set('emergencyRelation', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Emergency Phone</label>
                    <input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={e => set('emergencyPhone', e.target.value)}
                      className={`${inputCls} ${validations.emergencyPhoneInvalid ? 'border-red-500' : ''}`}
                      placeholder="Emergency contact number"
                    />
                    {validations.emergencyPhoneInvalid && <p className={errorTextCls}>Please enter a valid phone number</p>}
                  </div>
                </div>
              </div>

              <div className={sectionCls}>
                <p className={sectionTitleCls}>👨‍🏫 Class Teacher Assignment</p>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isClassTeacher"
                    checked={formData.isClassTeacher}
                    onChange={e => set('isClassTeacher', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isClassTeacher" className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assign as Class Teacher
                  </label>
                </div>
                {formData.isClassTeacher && (
                  <div className={`mt-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Class teacher assignments can be configured after creating the staff member.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: BANK DETAILS ─────────────────────────────── */}
          {activeTab === 'bank' && (
            <div className="space-y-1 md:space-y-2">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>🏦 Bank Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={e => set('bankName', e.target.value)}
                      className={inputCls}
                      placeholder="e.g., State Bank of India"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Bank Account Number</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={e => set('bankAccountNumber', e.target.value)}
                      className={inputCls}
                      placeholder="Bank account number"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>Bank IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankIfsc}
                    onChange={e => set('bankIfsc', e.target.value)}
                    className={`${inputCls} ${validations.bankIfscInvalid ? 'border-red-500' : ''}`}
                    placeholder="e.g., SBIN0001234"
                  />
                  {validations.bankIfscInvalid && <p className={errorTextCls}>Please enter a valid IFSC code (e.g., SBIN0001234)</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: LEAVE BALANCE ─────────────────────────────── */}
          {activeTab === 'leave' && (
            <div className="space-y-1 md:space-y-2">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>🏖️ Leave Balance Allocation</p>
                
                {/* Academic Year Selection */}
                <div className="mb-4">
                  <label className={labelCls}>Academic Year</label>
                  <select 
                    value={selectedAcademicYear} 
                    onChange={e => setSelectedAcademicYear(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year: any) => (
                      <option key={year.id} value={year.id}>
                        {year.name} ({year.year})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAcademicYear && (
                  <>
                    {/* Add Leave Balance Button */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={addLeaveBalance}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Leave Balance
                        </span>
                      </button>
                    </div>

                    {/* Leave Balances List */}
                    <div className="space-y-3">
                      {formData.leaveBalances.map((balance: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className={labelCls}>Leave Type *</label>
                              <select
                                value={balance.leaveTypeId}
                                onChange={e => updateLeaveBalance(index, 'leaveTypeId', e.target.value)}
                                className={inputCls}
                              >
                                <option value="">Select Leave Type</option>
                                {leaveTypes.map((leaveType: any) => (
                                  <option key={leaveType.id} value={leaveType.id}>
                                    {leaveType.name} ({leaveType.code})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Total Allocated *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={balance.totalAllocated}
                                onChange={e => updateLeaveBalance(index, 'totalAllocated', e.target.value)}
                                className={inputCls}
                                placeholder="e.g., 12"
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Carried Forward</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={balance.carriedForward}
                                onChange={e => updateLeaveBalance(index, 'carriedForward', e.target.value)}
                                className={inputCls}
                                placeholder="e.g., 2"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removeLeaveBalance(index)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  theme === 'dark'
                                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                }`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {balance.leaveTypeId && balance.totalAllocated && (
                            <div className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Total Available: <span className="font-bold text-green-600">
                                {(parseFloat(balance.totalAllocated) || 0) + (parseFloat(balance.carriedForward) || 0)} days
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {formData.leaveBalances.length === 0 && (
                        <div className={`p-4 text-center rounded-lg border border-dashed ${
                          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
                        }`}>
                          No leave balances allocated. Click "Add Leave Balance" to allocate leave.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: ADDITIONAL INFORMATION ─────────────────────────────── */}
          {activeTab === 'additional' && (
            <div className="space-y-1 md:space-y-2">
              <div className={sectionCls}>
                <p className={sectionTitleCls}>📋 Additional Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={formData.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Employee ID</label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={e => set('employeeId', e.target.value)}
                      className={inputCls}
                      placeholder="Employee ID"
                      readOnly={!!formData.employeeId}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={e => set('remarks', e.target.value)}
                    className={inputCls}
                    placeholder="Additional notes or remarks"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Form Actions */}
        <div className={`flex justify-between items-center pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2">
            {!isLastTab && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = TABS.findIndex(t => t.id === activeTab);
                  if (currentIndex < TABS.length - 1) {
                    setActiveTab(TABS[currentIndex + 1].id);
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Next Tab →
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !formData.firstName || !formData.lastName}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isSubmitting || !formData.firstName || !formData.lastName
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Saving...</span>
                </span>
              ) : (
                isEditMode ? 'Update Staff Member' : 'Save Staff Member'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
