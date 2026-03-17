'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { showMsg, showErrorToast } from '@/lib/toastUtils';

interface LeaveManagementSettingsProps {
  theme: string;
  isDark: boolean;
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  requiresDocument: boolean;
  accrualRate: number | null;
  canCarryForward: boolean;
  maxCarryForwardDays: number | null;
  description: string | null;
  isActive: boolean;
  _count: {
    leaveApplications: number;
  };
}

interface LeaveSettings {
  id: string;
  schoolId: string;
  academicYearId: string;
  autoApproveDays: number;
  requireDocumentDays: number;
  minStaffCoverage: number | null;
  examPeriodRestriction: boolean;
  notificationEmails: string | null;
  workingDays: string | null;
  halfDayRules: string | null;
}

interface AcademicYear {
  id: string;
  name: string;
  year: string;
  isActive: boolean;
}

interface CustomRole {
  id: string;
  name: string;
}

interface LeaveWorkflow {
  id?: string;
  leaveTypeId: string | null;
  roleId: string;
  requiredPermission: string;
  sequence: number;
  isActive: boolean;
}

export default function LeaveManagementSettings({ theme, isDark }: LeaveManagementSettingsProps) {
  const [activeTab, setActiveTab] = useState('types');
  const [loading, setLoading] = useState(false);
  
  // Leave Types State
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showLeaveTypeForm, setShowLeaveTypeForm] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    name: '',
    code: '',
    maxDaysPerYear: '',
    isPaid: true,
    requiresDocument: false,
    accrualRate: '',
    canCarryForward: true,
    maxCarryForwardDays: '',
    description: '',
  });
  
  // Settings State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [leaveSettings, setLeaveSettings] = useState<LeaveSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    autoApproveDays: 1,
    requireDocumentDays: 3,
    minStaffCoverage: null as number | null,
    examPeriodRestriction: true,
    notificationEmails: '',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
  });

  // Roles & Workflows State
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [workflows, setWorkflows] = useState<LeaveWorkflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);

  // CSS Variables
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  useEffect(() => {
    fetchAcademicYears();
    fetchLeaveTypes();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchLeaveSettings();
      fetchWorkflows();
    }
  }, [selectedAcademicYear]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchWorkflows = async () => {
    if (!selectedAcademicYear) return;
    setWorkflowsLoading(true);
    try {
      const response = await fetch(`/api/leave-workflows?academicYearId=${selectedAcademicYear}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setWorkflowsLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/school-structure/academic-years');
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data.academicYears || []);
        const activeYear = data.academicYears?.find((ay: AcademicYear) => ay.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch('/api/leave-types');
      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data.leaveTypes || []);
      }
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
    }
  };

  const fetchLeaveSettings = async () => {
    try {
      const response = await fetch(`/api/leave-settings?academicYearId=${selectedAcademicYear}`);
      if (response.ok) {
        const data = await response.json();
        setLeaveSettings(data.settings);
        if (data.settings) {
          setSettingsForm({
            autoApproveDays: data.settings.autoApproveDays,
            requireDocumentDays: data.settings.requireDocumentDays,
            minStaffCoverage: data.settings.minStaffCoverage || '',
            examPeriodRestriction: data.settings.examPeriodRestriction,
            notificationEmails: data.settings.notificationEmails ? JSON.parse(data.settings.notificationEmails).join(', ') : '',
            workingDays: data.settings.workingDays ? JSON.parse(data.settings.workingDays) : [1, 2, 3, 4, 5],
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch leave settings:', error);
    }
  };

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const saveLeaveType = async () => {
    if (!leaveTypeForm.name || !leaveTypeForm.code) {
      showErrorToast('Validation', 'Name and code are required');
      return;
    }

    setLoading(true);
    try {
      const url = editingLeaveType ? `/api/leave-types/${editingLeaveType.id}` : '/api/leave-types';
      const method = editingLeaveType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leaveTypeForm,
          maxDaysPerYear: leaveTypeForm.maxDaysPerYear ? parseFloat(leaveTypeForm.maxDaysPerYear) : null,
          accrualRate: leaveTypeForm.accrualRate ? parseFloat(leaveTypeForm.accrualRate) : null,
          maxCarryForwardDays: leaveTypeForm.maxCarryForwardDays ? parseFloat(leaveTypeForm.maxCarryForwardDays) : null,
        }),
      });

      if (response.ok) {
        showSuccessToast('Success', `Leave type ${editingLeaveType ? 'updated' : 'created'} successfully`);
        setShowLeaveTypeForm(false);
        setEditingLeaveType(null);
        setLeaveTypeForm({
          name: '',
          code: '',
          maxDaysPerYear: '',
          isPaid: true,
          requiresDocument: false,
          accrualRate: '',
          canCarryForward: true,
          maxCarryForwardDays: '',
          description: '',
        });
        fetchLeaveTypes();
      } else {
        const error = await response.json();
        showErrorToast('Error', error.error || 'Failed to save leave type');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to save leave type');
    } finally {
      setLoading(false);
    }
  };

  const saveLeaveSettings = async () => {
    if (!selectedAcademicYear) {
      showErrorToast('Validation', 'Please select an academic year');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/leave-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: selectedAcademicYear,
          ...settingsForm,
          notificationEmails: settingsForm.notificationEmails ? settingsForm.notificationEmails.split(',').map((e: string) => e.trim()).filter((e: string) => e) : null,
        }),
      });

      if (response.ok) {
        showSuccessToast('Success', 'Leave settings saved successfully');
        fetchLeaveSettings();
      } else {
        const error = await response.json();
        showErrorToast('Error', error.error || 'Failed to save leave settings');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to save leave settings');
    } finally {
      setLoading(false);
    }
  };

  const saveWorkflows = async () => {
    if (!selectedAcademicYear) return;

    // Validate
    for (let i = 0; i < workflows.length; i++) {
      if (!workflows[i].roleId) {
        showErrorToast('Validation', `Please select a role for step ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/leave-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: selectedAcademicYear,
          workflows: workflows.map((wf, index) => ({
            ...wf,
            sequence: index + 1
          }))
        }),
      });

      if (response.ok) {
        showSuccessToast('Success', 'Leave workflow saved successfully');
        fetchWorkflows();
      } else {
        const error = await response.json();
        showErrorToast('Error', error.error || 'Failed to save workflows');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to save workflows');
    } finally {
      setLoading(false);
    }
  };

  const editLeaveType = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    setLeaveTypeForm({
      name: leaveType.name,
      code: leaveType.code,
      maxDaysPerYear: leaveType.maxDaysPerYear?.toString() || '',
      isPaid: leaveType.isPaid,
      requiresDocument: leaveType.requiresDocument,
      accrualRate: leaveType.accrualRate?.toString() || '',
      canCarryForward: leaveType.canCarryForward,
      maxCarryForwardDays: leaveType.maxCarryForwardDays?.toString() || '',
      description: leaveType.description || '',
    });
    setShowLeaveTypeForm(true);
  };

  const deleteLeaveType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave type? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/leave-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccessToast('Success', 'Leave type deleted successfully');
        fetchLeaveTypes();
      } else {
        const error = await response.json();
        showErrorToast('Error', error.error || 'Failed to delete leave type');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to delete leave type');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'types', label: 'Leave Types' },
          { id: 'settings', label: 'Settings' },
          { id: 'workflow', label: 'Approval Workflow' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leave Types Tab */}
      {activeTab === 'types' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Leave Types
            </h3>
            <button
              onClick={() => {
                setEditingLeaveType(null);
                setLeaveTypeForm({
                  name: '',
                  code: '',
                  maxDaysPerYear: '',
                  isPaid: true,
                  requiresDocument: false,
                  accrualRate: '',
                  canCarryForward: true,
                  maxCarryForwardDays: '',
                  description: '',
                });
                setShowLeaveTypeForm(true);
              }}
              className={btnPrimary}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Leave Type
              </span>
            </button>
          </div>

          {/* Leave Types List */}
          <div className="grid gap-4">
            {leaveTypes.map((leaveType) => (
              <div key={leaveType.id} className={card}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {leaveType.name}
                        </h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          leaveType.isActive
                            ? isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                            : isDark ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {leaveType.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                        Code: {leaveType.code}
                        {leaveType.maxDaysPerYear && ` • Max: ${leaveType.maxDaysPerYear} days/year`}
                        {leaveType.isPaid && ` • Paid`}
                        {leaveType.requiresDocument && ` • Document required`}
                      </p>
                      {leaveType.description && (
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-3`}>
                          {leaveType.description}
                        </p>
                      )}
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {leaveType._count.leaveApplications} application{leaveType._count.leaveApplications !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editLeaveType(leaveType)}
                        className={btnSecondary}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLeaveType(leaveType.id)}
                        className={btnDanger}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={card}>
            <div className="p-6">
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Leave Settings
              </h3>
              
              {/* Academic Year Selection */}
              <div className="mb-6">
                <label className={label}>Academic Year</label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className={input}
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} ({year.year})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAcademicYear && (
                <div className="space-y-4">
                  {/* Auto-Approval Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Auto-approve leaves ≤ (days)</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsForm.autoApproveDays}
                        onChange={(e) => setSettingsForm({ ...settingsForm, autoApproveDays: parseInt(e.target.value) || 0 })}
                        className={input}
                      />
                    </div>
                    <div>
                      <label className={label}>Require document for leaves {'>'} (days)</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsForm.requireDocumentDays}
                        onChange={(e) => setSettingsForm({ ...settingsForm, requireDocumentDays: parseInt(e.target.value) || 0 })}
                        className={input}
                      />
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Minimum Staff Coverage</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Optional"
                        value={settingsForm.minStaffCoverage || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, minStaffCoverage: e.target.value ? parseInt(e.target.value) : null })}
                        className={input}
                      />
                    </div>
                    <div>
                      <label className={label}>Notification Emails</label>
                      <input
                        type="text"
                        placeholder="email1@school.com, email2@school.com"
                        value={settingsForm.notificationEmails}
                        onChange={(e) => setSettingsForm({ ...settingsForm, notificationEmails: e.target.value })}
                        className={input}
                      />
                    </div>
                  </div>

                  {/* Working Days */}
                  <div>
                    <label className={label}>Working Days</label>
                    <div className="flex gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                        <label key={day} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settingsForm.workingDays.includes(index + 1)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettingsForm({ ...settingsForm, workingDays: [...settingsForm.workingDays, index + 1] });
                              } else {
                                setSettingsForm({ ...settingsForm, workingDays: settingsForm.workingDays.filter(d => d !== index + 1) });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Exam Period Restriction */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="examPeriodRestriction"
                      checked={settingsForm.examPeriodRestriction}
                      onChange={(e) => setSettingsForm({ ...settingsForm, examPeriodRestriction: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="examPeriodRestriction" className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Restrict leave during exam periods
                    </label>
                  </div>

                  <button
                    onClick={saveLeaveSettings}
                    disabled={loading}
                    className={btnPrimary}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Workflow Tab */}
      {activeTab === 'workflow' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={card}>
            <div className="p-6">
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Approval Workflow Configuration
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Configure the sequence of approvals required for leave applications.
              </p>

              {/* Academic Year Selection */}
              <div className="mb-6 max-w-md">
                <label className={label}>Academic Year</label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className={input}
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} ({year.year})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAcademicYear && (
                <div className="space-y-4">
                  {workflowsLoading ? (
                    <div className="text-sm text-gray-500">Loading workflows...</div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {workflows.map((wf, index) => (
                          <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                            <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                              {index + 1}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                              <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-500">Leave Type</label>
                                <select
                                  value={wf.leaveTypeId || ''}
                                  onChange={(e) => {
                                    const newWf = [...workflows];
                                    newWf[index].leaveTypeId = e.target.value || null;
                                    setWorkflows(newWf);
                                  }}
                                  className={input}
                                >
                                  <option value="">All Leave Types</option>
                                  {leaveTypes.map(lt => (
                                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-500">Approver Role</label>
                                <select
                                  value={wf.roleId}
                                  onChange={(e) => {
                                    const newWf = [...workflows];
                                    newWf[index].roleId = e.target.value;
                                    setWorkflows(newWf);
                                  }}
                                  className={input}
                                >
                                  <option value="">Select Role</option>
                                  {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-500">Required Permission</label>
                                <select
                                  value={wf.requiredPermission}
                                  onChange={(e) => {
                                    const newWf = [...workflows];
                                    newWf[index].requiredPermission = e.target.value;
                                    setWorkflows(newWf);
                                  }}
                                  className={input}
                                >
                                  <option value="approve_department_leave">Approve Department Leave</option>
                                  <option value="approve_all_leave">Approve All Leave</option>
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const newWf = workflows.filter((_, i) => i !== index);
                                setWorkflows(newWf);
                              }}
                              className={btnDanger}
                              title="Remove step"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        
                        {workflows.length === 0 && (
                          <div className={`p-8 text-center rounded-xl border border-dashed ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                            No workflow steps defined. Add a step to get started.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                        <button
                          onClick={() => {
                            setWorkflows([
                              ...workflows,
                              { leaveTypeId: null, roleId: '', requiredPermission: 'approve_department_leave', sequence: workflows.length + 1, isActive: true }
                            ]);
                          }}
                          className={btnSecondary}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-bold text-blue-500">+</span> Add Step
                          </span>
                        </button>

                        <button
                          onClick={saveWorkflows}
                          disabled={loading}
                          className={btnPrimary}
                        >
                          {loading ? 'Saving...' : 'Save Workflow'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Leave Type Form Modal */}
      {showLeaveTypeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl ${card} max-h-[90vh] overflow-y-auto`}
          >
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingLeaveType ? 'Edit Leave Type' : 'Add Leave Type'}
                </h3>
                <button
                  onClick={() => setShowLeaveTypeForm(false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Name *</label>
                  <input
                    value={leaveTypeForm.name}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, name: e.target.value })}
                    className={input}
                    placeholder="e.g., Sick Leave"
                  />
                </div>
                <div>
                  <label className={label}>Code *</label>
                  <input
                    value={leaveTypeForm.code}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, code: e.target.value.toUpperCase() })}
                    className={input}
                    placeholder="e.g., SL"
                  />
                </div>
                <div>
                  <label className={label}>Max Days Per Year</label>
                  <input
                    type="number"
                    value={leaveTypeForm.maxDaysPerYear}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, maxDaysPerYear: e.target.value })}
                    className={input}
                    placeholder="e.g., 12"
                  />
                </div>
                <div>
                  <label className={label}>Accrual Rate (days/month)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={leaveTypeForm.accrualRate}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, accrualRate: e.target.value })}
                    className={input}
                    placeholder="e.g., 1.5"
                  />
                </div>
                <div>
                  <label className={label}>Max Carry Forward Days</label>
                  <input
                    type="number"
                    value={leaveTypeForm.maxCarryForwardDays}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, maxCarryForwardDays: e.target.value })}
                    className={input}
                    placeholder="e.g., 6"
                  />
                </div>
                <div>
                  <label className={label}>Description</label>
                  <textarea
                    value={leaveTypeForm.description}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, description: e.target.value })}
                    className={`${input} resize-none`}
                    rows={1}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={leaveTypeForm.isPaid}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, isPaid: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Paid Leave</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={leaveTypeForm.requiresDocument}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, requiresDocument: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Requires Document</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={leaveTypeForm.canCarryForward}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, canCarryForward: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Can Carry Forward</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLeaveTypeForm(false)}
                  className={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  onClick={saveLeaveType}
                  disabled={loading}
                  className={btnPrimary}
                >
                  {loading ? 'Saving...' : (editingLeaveType ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
