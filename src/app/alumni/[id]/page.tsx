'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import DiscountRequestForm from '@/app/fees/components/discount/DiscountRequestForm';

interface AlumniDetail {
  id: string;
  name: string;
  admissionNo: string;
  email?: string;
  phone?: string;
  photo?: string;
  class: string;
  section: string;
  gender: string;
  dateOfBirth?: string;
  status: string;
  academicYear: string;
  exitDate?: string;
  exitReason?: string;
  tcNumber?: string;
  exitRemarks?: string;
  higherEducation?: { institution?: string; degree?: string; field?: string; year?: string } | null;
  employment?: { company?: string; position?: string; industry?: string; location?: string } | null;
  contactPreference?: string;
  socialLinks?: { linkedin?: string; twitter?: string; email?: string; phone?: string };
  mentorshipAreas?: string[];
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  city?: string;
  state?: string;
  pendingDues: number;
  feeRecords?: any[];
  arrears?: any[];
  promotions?: any[];
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Engineering',
  'Arts & Design', 'Business', 'Law', 'Government', 'Other',
];

const MENTORSHIP_OPTIONS = [
  'Mathematics', 'Science', 'Arts', 'Commerce', 'Technology',
  'Sports', 'Career Guidance', 'Entrepreneurship',
];

const STATUS_LABELS: Record<string, string> = {
  graduated: '🎓 Graduated',
  transferred: '🔄 Transferred',
  exit: '🚪 Exited',
  exited: '🚪 Exited',
  suspended: '⚠️ Suspended',
};

export default function AlumniProfilePage() {
  const { theme } = useTheme();
  const { isAdmin, hasPermission } = usePermissions();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isDark = theme === 'dark';
  const canEditAlumni = isAdmin || hasPermission('edit_students');
  const canViewAlumniDues = isAdmin || hasPermission('view_fees') || hasPermission('manage_fees');
  const canManageFees = isAdmin || hasPermission('manage_fees');

  const [alumni, setAlumni] = useState<AlumniDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const [editForm, setEditForm] = useState<any>({
    higherEducation: {},
    employment: {},
    socialLinks: {},
    mentorshipAreas: [],
    contactPreference: 'private',
  });

  const card = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const sectionClass = `p-5 rounded-xl ${card}`;

  const loadAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alumni/${id}`);
      const data = await res.json();
      if (data.success) {
        setAlumni(data.data);
        setEditForm({
          higherEducation: data.data.higherEducation || {},
          employment: data.data.employment || {},
          socialLinks: data.data.socialLinks || {},
          mentorshipAreas: data.data.mentorshipAreas || [],
          contactPreference: data.data.contactPreference || 'private',
        });
      }
    } catch (err) {
      console.error('Failed to load alumni:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAlumni(); }, [loadAlumni]);

  useEffect(() => {
    if (!canViewAlumniDues && activeTab === 'dues') {
      setActiveTab('profile');
    }
  }, [activeTab, canViewAlumniDues]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/alumni/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg('✅ Profile updated');
        setIsEditing(false);
        loadAlumni();
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setSaveMsg('❌ Failed to save');
      }
    } catch (err) {
      setSaveMsg('❌ Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMentorship = (area: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      mentorshipAreas: prev.mentorshipAreas.includes(area)
        ? prev.mentorshipAreas.filter((m: string) => m !== area)
        : [...prev.mentorshipAreas, area],
    }));
  };

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    ...(canViewAlumniDues ? [{ id: 'dues', label: '💸 Dues & Fees' }] : []),
    { id: 'career', label: '💼 Career' },
    { id: 'history', label: '📚 History' },
  ];

  if (loading) {
    return (
      <AppLayout currentPage="alumni" title="Alumni Profile">
        <div className={`text-center py-16 ${subText}`}>
          <div className="text-4xl mb-3 animate-pulse">👤</div>
          <p>Loading alumni profile...</p>
        </div>
      </AppLayout>
    );
  }

  if (!alumni) {
    return (
      <AppLayout currentPage="alumni" title="Alumni Profile">
        <div className={`text-center py-16 rounded-xl ${card}`}>
          <div className="text-5xl mb-3">❓</div>
          <h3 className={`text-lg font-semibold ${text}`}>Alumni Not Found</h3>
          <Link href="/alumni" className="mt-4 inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">
            ← Back to Alumni
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="alumni" title={`${alumni.name} — Alumni`}>
      <div className="space-y-5 pb-8">
        {/* Back nav */}
        <div className="flex items-center gap-3">
          <Link href="/alumni" className={`text-sm ${subText} hover:${text} transition-colors`}>
            ← Alumni Portal
          </Link>
          <span className={subText}>/</span>
          <span className={`text-sm font-medium ${text}`}>{alumni.name}</span>
        </div>

        {/* Hero card */}
        <div className={`p-6 rounded-2xl ${card}`}>
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {alumni.photo ? (
                <img src={alumni.photo} alt={alumni.name} className="w-20 h-20 rounded-2xl object-cover" />
              ) : alumni.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className={`text-2xl font-bold ${text}`}>{alumni.name}</h1>
                  <p className={`text-sm ${subText}`}>{alumni.admissionNo} · Class {alumni.class} {alumni.section}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                    {STATUS_LABELS[alumni.status] || alumni.status}
                  </span>
                  {canViewAlumniDues && alumni.pendingDues > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                      ₹{alumni.pendingDues.toLocaleString()} dues
                    </span>
                  )}
                </div>
              </div>

              {/* Quick facts */}
              <div className={`mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm ${subText}`}>
                <div><span className="block text-xs">Academic Year</span><span className={`font-medium ${text}`}>{alumni.academicYear}</span></div>
                <div><span className="block text-xs">Exit Date</span><span className={`font-medium ${text}`}>{alumni.exitDate || '—'}</span></div>
                <div><span className="block text-xs">Exit Reason</span><span className={`font-medium ${text} capitalize`}>{alumni.exitReason || '—'}</span></div>
                <div><span className="block text-xs">TC Number</span><span className={`font-medium ${text}`}>{alumni.tcNumber || '—'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-blue-500 text-white'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {saveMsg && (
          <div className={`px-4 py-2 rounded-lg text-sm ${saveMsg.includes('✅') ? isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700' : isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {saveMsg}
          </div>
        )}

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Basic info */}
            <div className={sectionClass}>
              <h3 className={`font-semibold mb-4 ${text}`}>Personal Information</h3>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 text-sm ${subText}`}>
                <div><span className="block text-xs mb-0.5">Gender</span><span className={`font-medium ${text}`}>{alumni.gender || '—'}</span></div>
                <div><span className="block text-xs mb-0.5">Date of Birth</span><span className={`font-medium ${text}`}>{alumni.dateOfBirth || '—'}</span></div>
                <div><span className="block text-xs mb-0.5">Email</span><span className={`font-medium ${text}`}>{alumni.email || '—'}</span></div>
                <div><span className="block text-xs mb-0.5">Phone</span><span className={`font-medium ${text}`}>{alumni.phone || '—'}</span></div>
                <div><span className="block text-xs mb-0.5">City</span><span className={`font-medium ${text}`}>{alumni.city || '—'}</span></div>
                <div><span className="block text-xs mb-0.5">State</span><span className={`font-medium ${text}`}>{alumni.state || '—'}</span></div>
              </div>
            </div>

            {/* Parent info */}
            <div className={sectionClass}>
              <h3 className={`font-semibold mb-4 ${text}`}>Parent / Guardian</h3>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 text-sm ${subText}`}>
                <div><span className="block text-xs mb-0.5">Name</span><span className={`font-medium ${text}`}>{alumni.parentName || '—'}</span></div>
                <div><span className="block text-xs mb-0.5">Phone</span><span className={`font-medium ${text}`}>{alumni.parentPhone || '—'}</span></div>
                <div><span className="block text-xs mb-0.5">Email</span><span className={`font-medium ${text}`}>{alumni.parentEmail || '—'}</span></div>
              </div>
            </div>

            {/* Privacy */}
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${text}`}>Privacy & Mentorship</h3>
                {!isEditing && canEditAlumni ? (
                  <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white">
                    ✏️ Edit
                  </button>
                ) : isEditing && canEditAlumni ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white">
                      {isSaving ? 'Saving...' : '✓ Save'}
                    </button>
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${text}`}>Contact Preference</label>
                    <select value={editForm.contactPreference} onChange={e => setEditForm((p: any) => ({ ...p, contactPreference: e.target.value }))} className={inputClass}>
                      <option value="public">Public — Anyone can see</option>
                      <option value="alumni_only">Alumni Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${text}`}>Mentorship Areas</label>
                    <div className="flex flex-wrap gap-2">
                      {MENTORSHIP_OPTIONS.map(area => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleMentorship(area)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            editForm.mentorshipAreas.includes(area)
                              ? 'bg-blue-500 text-white'
                              : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-2 gap-4 text-sm ${subText}`}>
                  <div><span className="block text-xs mb-0.5">Privacy</span><span className={`font-medium ${text} capitalize`}>{alumni.contactPreference?.replace('_', ' ') || 'Private'}</span></div>
                  <div><span className="block text-xs mb-0.5">Mentorship Areas</span><span className={`font-medium ${text}`}>{alumni.mentorshipAreas?.join(', ') || '—'}</span></div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            {canManageFees && (
              <div className={sectionClass}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className={`font-semibold ${text}`}>Quick Actions</h3>
                    <p className={`text-sm ${subText}`}>Manage this alumnus financial records</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowDiscountModal(true)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    >
                      🎁 Apply Discount
                    </button>
                    <Link href={`/fee-collection?studentId=${alumni.id}`} className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors">
                      💰 Collect Fee
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Exit details */}
            {alumni.exitRemarks && (
              <div className={sectionClass}>
                <h3 className={`font-semibold mb-2 ${text}`}>Exit Remarks</h3>
                <p className={`text-sm ${subText}`}>{alumni.exitRemarks}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Dues & Fees */}
        {activeTab === 'dues' && canViewAlumniDues && (
          <div className="space-y-4">
            {/* Dues summary */}
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${text}`}>Fee & Dues Summary</h3>
                {canManageFees && (
                  <Link href={`/fee-collection?studentId=${alumni.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white">
                    💰 Collect Fee
                  </Link>
                )}
              </div>
              {alumni.pendingDues > 0 ? (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/10 border border-red-800/20' : 'bg-red-50 border border-red-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-red-500 font-semibold">Total Outstanding Dues</span>
                    <span className="text-red-500 text-xl font-bold">₹{alumni.pendingDues.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-green-900/10 border border-green-800/20' : 'bg-green-50 border border-green-100'}`}>
                  <span className="text-green-500 font-medium">✅ All fees cleared</span>
                </div>
              )}
            </div>

            {/* Arrears */}
            {alumni.arrears && alumni.arrears.filter(a => a.status !== 'paid' && a.status !== 'waived').length > 0 && (
              <div className={sectionClass}>
                <h3 className={`font-semibold mb-3 ${text}`}>Arrears</h3>
                <div className="space-y-2">
                  {alumni.arrears.filter(a => a.status !== 'paid' && a.status !== 'waived').map((arrear: any) => (
                    <div key={arrear.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div>
                        <div className={`text-sm font-medium ${text}`}>{arrear.description || `Arrear from ${arrear.fromAcademicYear}`}</div>
                        <div className={`text-xs ${subText}`}>Due: {arrear.dueDate || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-500 font-semibold text-sm">₹{Math.max(0, (arrear.amount || 0) - (arrear.paidAmount || 0)).toLocaleString()}</div>
                        <div className={`text-xs capitalize ${subText}`}>{arrear.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fee records */}
            {alumni.feeRecords && alumni.feeRecords.length > 0 && (
              <div className={sectionClass}>
                <h3 className={`font-semibold mb-3 ${text}`}>Fee Records</h3>
                <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <table className="w-full text-sm">
                    <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-4 py-2 text-left ${subText}`}>Description</th>
                        <th className={`px-4 py-2 text-right ${subText}`}>Amount</th>
                        <th className={`px-4 py-2 text-right ${subText}`}>Paid</th>
                        <th className={`px-4 py-2 text-right ${subText}`}>Pending</th>
                        <th className={`px-4 py-2 text-center ${subText}`}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumni.feeRecords.map((fee: any) => (
                        <tr key={fee.id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                          <td className={`px-4 py-2 ${text}`}>{fee.description || '—'}</td>
                          <td className={`px-4 py-2 text-right ${text}`}>₹{(fee.amount || 0).toLocaleString()}</td>
                          <td className={`px-4 py-2 text-right text-green-500`}>₹{(fee.paidAmount || 0).toLocaleString()}</td>
                          <td className={`px-4 py-2 text-right ${(fee.amount || 0) - (fee.paidAmount || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ₹{Math.max(0, (fee.amount || 0) - (fee.paidAmount || 0) - (fee.discount || 0)).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${fee.status === 'paid' ? 'bg-green-500/10 text-green-500' : fee.status === 'waived' ? 'bg-gray-500/10 text-gray-400' : 'bg-amber-500/10 text-amber-500'}`}>
                              {fee.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Career */}
        {activeTab === 'career' && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${text}`}>Higher Education</h3>
                {!isEditing && canEditAlumni && <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white">✏️ Edit</button>}
              </div>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Institution</label>
                    <input value={editForm.higherEducation?.institution || ''} onChange={e => setEditForm((p: any) => ({ ...p, higherEducation: { ...p.higherEducation, institution: e.target.value } }))} placeholder="University name" className={inputClass} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Degree</label>
                    <input value={editForm.higherEducation?.degree || ''} onChange={e => setEditForm((p: any) => ({ ...p, higherEducation: { ...p.higherEducation, degree: e.target.value } }))} placeholder="B.Tech, M.B.A..." className={inputClass} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Field of Study</label>
                    <input value={editForm.higherEducation?.field || ''} onChange={e => setEditForm((p: any) => ({ ...p, higherEducation: { ...p.higherEducation, field: e.target.value } }))} placeholder="Computer Science..." className={inputClass} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Year of Completion</label>
                    <input value={editForm.higherEducation?.year || ''} onChange={e => setEditForm((p: any) => ({ ...p, higherEducation: { ...p.higherEducation, year: e.target.value } }))} placeholder="2026" className={inputClass} />
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-2 gap-4 text-sm ${subText}`}>
                  <div><span className="block text-xs mb-0.5">Institution</span><span className={`font-medium ${text}`}>{alumni.higherEducation?.institution || '—'}</span></div>
                  <div><span className="block text-xs mb-0.5">Degree</span><span className={`font-medium ${text}`}>{alumni.higherEducation?.degree || '—'}</span></div>
                  <div><span className="block text-xs mb-0.5">Field</span><span className={`font-medium ${text}`}>{alumni.higherEducation?.field || '—'}</span></div>
                  <div><span className="block text-xs mb-0.5">Year</span><span className={`font-medium ${text}`}>{alumni.higherEducation?.year || '—'}</span></div>
                </div>
              )}
            </div>

            <div className={sectionClass}>
              <h3 className={`font-semibold mb-4 ${text}`}>Employment</h3>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Company</label>
                    <input value={editForm.employment?.company || ''} onChange={e => setEditForm((p: any) => ({ ...p, employment: { ...p.employment, company: e.target.value } }))} placeholder="Company name" className={inputClass} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Position</label>
                    <input value={editForm.employment?.position || ''} onChange={e => setEditForm((p: any) => ({ ...p, employment: { ...p.employment, position: e.target.value } }))} placeholder="Software Engineer..." className={inputClass} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Industry</label>
                    <select value={editForm.employment?.industry || ''} onChange={e => setEditForm((p: any) => ({ ...p, employment: { ...p.employment, industry: e.target.value } }))} className={inputClass}>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Location</label>
                    <input value={editForm.employment?.location || ''} onChange={e => setEditForm((p: any) => ({ ...p, employment: { ...p.employment, location: e.target.value } }))} placeholder="Bangalore, India" className={inputClass} />
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-2 gap-4 text-sm ${subText}`}>
                  <div><span className="block text-xs mb-0.5">Company</span><span className={`font-medium ${text}`}>{alumni.employment?.company || '—'}</span></div>
                  <div><span className="block text-xs mb-0.5">Position</span><span className={`font-medium ${text}`}>{alumni.employment?.position || '—'}</span></div>
                  <div><span className="block text-xs mb-0.5">Industry</span><span className={`font-medium ${text}`}>{alumni.employment?.industry || '—'}</span></div>
                  <div><span className="block text-xs mb-0.5">Location</span><span className={`font-medium ${text}`}>{alumni.employment?.location || '—'}</span></div>
                </div>
              )}

              {isEditing && canEditAlumni && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setIsEditing(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white">
                    {isSaving ? 'Saving...' : '✓ Save Profile'}
                  </button>
                </div>
              )}
            </div>

            {/* Social links */}
            <div className={sectionClass}>
              <h3 className={`font-semibold mb-4 ${text}`}>Social Links</h3>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>LinkedIn</label>
                    <input value={editForm.socialLinks?.linkedin || ''} onChange={e => setEditForm((p: any) => ({ ...p, socialLinks: { ...p.socialLinks, linkedin: e.target.value } }))} placeholder="linkedin.com/in/..." className={inputClass} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${text} mb-1 block`}>Twitter / X</label>
                    <input value={editForm.socialLinks?.twitter || ''} onChange={e => setEditForm((p: any) => ({ ...p, socialLinks: { ...p.socialLinks, twitter: e.target.value } }))} placeholder="@handle" className={inputClass} />
                  </div>
                </div>
              ) : (
                <div className={`flex gap-4 text-sm ${subText}`}>
                  {alumni.socialLinks?.linkedin ? (
                    <a href={alumni.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">🔗 LinkedIn</a>
                  ) : <span>No social links added</span>}
                  {alumni.socialLinks?.twitter && (
                    <a href={`https://twitter.com/${alumni.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">🐦 Twitter</a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <h3 className={`font-semibold mb-4 ${text}`}>Promotion History</h3>
              {alumni.promotions && alumni.promotions.length > 0 ? (
                <div className="space-y-2">
                  {alumni.promotions.map((p: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <span className="text-blue-500">🎓</span>
                      <div className={`text-sm ${text}`}>
                        Class {p.fromClass} → Class {p.toClass}
                        <span className={`ml-2 text-xs ${subText}`}>{p.fromAcademicYear} → {p.toAcademicYear}</span>
                      </div>
                      <span className={`ml-auto text-xs ${subText}`}>{p.promotedAt ? new Date(p.promotedAt).toLocaleDateString() : ''}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${subText}`}>No promotion history recorded.</p>
              )}
            </div>
          </div>
        )}

        {showDiscountModal && canManageFees && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${card}`}>
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>🎁 Apply Discount to {alumni.name}</h2>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className={`p-3 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <DiscountRequestForm
                  theme={theme}
                  initialScope="student"
                  initialStudent={{
                    id: alumni.id,
                    name: alumni.name,
                    admissionNo: alumni.admissionNo,
                    class: `${alumni.class}${alumni.section ? ` ${alumni.section}` : ''}`,
                    status: alumni.status,
                  }}
                  onClose={() => setShowDiscountModal(false)}
                  onSuccess={() => {
                    setShowDiscountModal(false);
                    loadAlumni();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
