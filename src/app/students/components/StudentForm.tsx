// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

const TABS = [
  { id: 'admission', label: 'Admission' },
  { id: 'personal', label: 'Personal' },
  { id: 'contact', label: 'Contact' },
  { id: 'parents', label: 'Parents' },
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

  // Cascaded dropdown data - computed after useState
  const filteredClasses = formData.mediumId
    ? classes.filter(c => c.mediumId === formData.mediumId)
    : classes;
  const filteredSections = formData.classId
    ? sections.filter(s => s.classId === formData.classId)
    : [];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('Full Name is required'); return; }
    if (!formData.dateOfBirth) { alert('Date of Birth is required'); return; }
    if (!formData.mediumId) { alert('Please select a Language Medium'); return; }
    if (!formData.classId) { alert('Please select a Class'); return; }
    localStorage.removeItem('studentFormAutoSave');
    onSubmit(formData);
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
                        <option value="">Select Medium</option>
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
                    <select value={formData.board} onChange={e => set('board', e.target.value)} className={inputCls}>
                      <option value="">Select Board</option>
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
