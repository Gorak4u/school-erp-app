'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';

interface LeaveTabProps {
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

export const LeaveTab: React.FC<LeaveTabProps> = ({ isDark }) => {
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

  // Leave Balances State
  const [teachers, setTeachers] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [showBulkBalanceForm, setShowBulkBalanceForm] = useState(false);
  const [balanceForm, setBalanceForm] = useState({
    staffId: '',
    leaveTypeId: '',
    totalAllocated: '',
    carriedForward: '',
  });
  const [bulkBalanceForm, setBulkBalanceForm] = useState({
    leaveTypeId: '',
    totalAllocated: '',
    carriedForward: '',
    selectedStaff: [] as string[],
  });

  // Theme classes
  const theme = useMemo(() => ({
    background: isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
    card: `rounded-2xl border shadow-lg ${isDark ? 'bg-slate-800/90 backdrop-blur-xl border-slate-700' : 'bg-white/90 backdrop-blur-xl border-gray-200'}`,
    header: isDark ? 'text-white' : 'text-gray-900',
    subheader: isDark ? 'text-gray-400' : 'text-gray-600',
    input: `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`,
    label: `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    btnPrimary: `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`,
    btnSecondary: `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`,
    btnDanger: `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`,
    tab: `px-4 py-2.5 rounded-xl text-sm font-medium transition-all`,
    tile: `p-3 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${isDark ? 'border-slate-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'}`,
    tileSelected: `p-3 rounded-lg border-2 transition-all cursor-pointer ring-2 ring-blue-200 border-blue-500`,
  }), [isDark]);

  useEffect(() => {
    fetchAcademicYears();
    fetchLeaveTypes();
    fetchRoles();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchLeaveSettings();
      fetchWorkflows();
      fetchLeaveBalances();
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

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const fetchLeaveBalances = async () => {
    if (!selectedAcademicYear) return;
    try {
      const response = await fetch(`/api/leave-balance?academicYearId=${selectedAcademicYear}`);
      if (response.ok) {
        const data = await response.json();
        setLeaveBalances(data.leaveBalances || []);
      }
    } catch (error) {
      console.error('Failed to fetch leave balances:', error);
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

  const saveLeaveBalance = async () => {
    if (!selectedAcademicYear || !balanceForm.staffId || !balanceForm.leaveTypeId || !balanceForm.totalAllocated) {
      showErrorToast('Validation', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/leave-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: balanceForm.staffId,
          leaveTypeId: balanceForm.leaveTypeId,
          academicYearId: selectedAcademicYear,
          totalAllocated: parseFloat(balanceForm.totalAllocated),
          carriedForward: parseFloat(balanceForm.carriedForward) || 0,
          action: 'allocate'
        }),
      });

      if (response.ok) {
        showSuccessToast('Success', 'Leave balance allocated successfully');
        setShowBalanceForm(false);
        setBalanceForm({
          staffId: '',
          leaveTypeId: '',
          totalAllocated: '',
          carriedForward: '',
        });
        fetchLeaveBalances();
      } else {
        const error = await response.json();
        showErrorToast('Error', error.error || 'Failed to allocate leave balance');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to allocate leave balance');
    } finally {
      setLoading(false);
    }
  };

  const saveBulkLeaveBalance = async () => {
    if (!selectedAcademicYear || !bulkBalanceForm.leaveTypeId || !bulkBalanceForm.totalAllocated || bulkBalanceForm.selectedStaff.length === 0) {
      showErrorToast('Validation', 'Please fill in all required fields and select at least one staff member');
      return;
    }

    setLoading(true);
    try {
      const promises = bulkBalanceForm.selectedStaff.map(staffId => 
        fetch('/api/leave-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId,
            leaveTypeId: bulkBalanceForm.leaveTypeId,
            academicYearId: selectedAcademicYear,
            totalAllocated: parseFloat(bulkBalanceForm.totalAllocated),
            carriedForward: parseFloat(bulkBalanceForm.carriedForward) || 0,
            action: 'allocate'
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        showSuccessToast('Success', `Leave balance allocated to ${successful} staff member${successful > 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`);
        setShowBulkBalanceForm(false);
        setBulkBalanceForm({
          leaveTypeId: '',
          totalAllocated: '',
          carriedForward: '',
          selectedStaff: [],
        });
        fetchLeaveBalances();
      } else {
        showErrorToast('Error', 'Failed to allocate leave balance to any staff member');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to allocate leave balances');
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
    <div className={`min-h-screen ${theme.background} p-6`}>
      {/* Beautiful Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-gradient-to-br from-rose-600 to-pink-600 shadow-2xl shadow-rose-500/25' : 'bg-gradient-to-br from-rose-500 to-red-500 shadow-2xl shadow-rose-500/25'
              }`}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M9 12l3-3m0 0l3 3m-3-3v12" />
              </svg>
            </motion.div>
            <div>
              <h1 className={`text-4xl font-bold bg-gradient-to-r ${
                isDark ? 'from-rose-400 via-pink-400 to-red-400' : 'from-rose-600 via-red-600 to-pink-600'
              } bg-clip-text text-transparent`}>
                Leave Management
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Configure leave policies and manage staff leave balances
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Beautiful Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${theme.card} overflow-hidden`}
        >
          {/* Tab Navigation */}
          <div className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex space-x-1 p-4">
              {[
                { id: 'types', label: 'Leave Types', icon: '📋' },
                { id: 'balances', label: 'Leave Balances', icon: '⚖️' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
                { id: 'workflow', label: 'Workflow', icon: '🔄' },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? isDark 
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg transform scale-105' 
                        : 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg transform scale-105'
                      : isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-slate-700/50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Leave Types Tab */}
            {activeTab === 'types' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-bold ${theme.header}`}>Leave Types</h2>
                    <p className={`${theme.subheader}`}>Manage different categories of leave</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
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
                    className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' 
                        : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Type
                    </span>
                  </motion.button>
                </div>

                {/* Leave Types Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {leaveTypes.map((leaveType, index) => (
                      <motion.div
                        key={leaveType.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${theme.card} p-6 hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                              leaveType.isActive
                                ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white'
                                : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {leaveType.isPaid ? '💰' : '📝'}
                            </div>
                            <div>
                              <h3 className={`text-lg font-bold ${theme.header}`}>{leaveType.name}</h3>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                leaveType.isActive
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                  : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {leaveType.code}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {leaveType.maxDaysPerYear && (
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span className="font-semibold">Max Days:</span> {leaveType.maxDaysPerYear}/year
                            </div>
                          )}
                          {leaveType.accrualRate && (
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span className="font-semibold">Accrual Rate:</span> {leaveType.accrualRate}x
                            </div>
                          )}
                          {leaveType.maxCarryForwardDays && (
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span className="font-semibold">Max Carry Forward:</span> {leaveType.maxCarryForwardDays} days
                            </div>
                          )}
                          {leaveType.description && (
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {leaveType.description}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {leaveType.isPaid && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white`}>
                              Paid
                            </span>
                          )}
                          {leaveType.requiresDocument && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white`}>
                              Document Required
                            </span>
                          )}
                          {leaveType.canCarryForward && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white`}>
                              Can Carry Forward
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}">
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {leaveType._count.leaveApplications} applications
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => editLeaveType(leaveType)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isDark ? 'bg-slate-700 hover:bg-slate-600 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteLeaveType(leaveType.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isDark ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {leaveTypes.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-center py-16 rounded-3xl border-2 border-dashed ${
                      isDark ? 'border-slate-700' : 'border-gray-300'
                    }`}
                  >
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full border-4 ${
                      isDark ? 'border-rose-500 border-t-transparent' : 'border-rose-400 border-t-transparent'
                    }`} />
                    <h3 className={`text-2xl font-bold mb-3 ${theme.header}`}>
                      No leave types configured
                    </h3>
                    <p className={`mb-8 ${theme.subheader}`}>
                      Start by adding your first leave type
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowLeaveTypeForm(true)}
                      className={`px-8 py-3 rounded-2xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                        isDark 
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600'
                      }`}
                    >
                      Create Your First Leave Type
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Leave Balances Tab */}
            {activeTab === 'balances' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-bold ${theme.header}`}>Leave Balances</h2>
                    <p className={`${theme.subheader}`}>Manage staff leave allocations</p>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setBulkBalanceForm({
                          leaveTypeId: '',
                          totalAllocated: '',
                          carriedForward: '',
                          selectedStaff: [],
                        });
                        setShowBulkBalanceForm(true);
                      }}
                      className={theme.btnSecondary}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                        </svg>
                        Bulk Allocate
                      </span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setBalanceForm({
                          staffId: '',
                          leaveTypeId: '',
                          totalAllocated: '',
                          carriedForward: '',
                        });
                        setShowBalanceForm(true);
                      }}
                      className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                        isDark 
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Allocate Balance
                      </span>
                    </motion.button>
                  </div>
                </div>

                {/* Academic Year Selection */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <label className={theme.label}>Academic Year</label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className={theme.input}
                  >
                    <option value="">Select Year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leave Balances List */}
                {selectedAcademicYear && (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {leaveBalances.map((balance, index) => (
                        <motion.div
                          key={balance.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`${theme.card} p-6`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                                balance.balance > 5 
                                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                                  : balance.balance > 2 
                                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white'
                                    : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                              }`}>
                                {balance.balance}
                              </div>
                              <div>
                                <h3 className={`text-lg font-bold ${theme.header}`}>{balance.staff?.name}</h3>
                                <p className={`${theme.subheader}`}>{balance.staff?.employeeId} • {balance.leaveType?.name}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Allocated: <b>{balance.totalAllocated}d</b>
                                  </span>
                                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Used: <b>{balance.used}d</b>
                                  </span>
                                  {balance.carriedForward > 0 && (
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      CF: <b>{balance.carriedForward}d</b>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              balance.leaveType?.isPaid
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {balance.leaveType?.isPaid ? 'Paid' : 'Unpaid'}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {leaveBalances.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-center py-16 rounded-3xl border-2 border-dashed ${
                          isDark ? 'border-slate-700' : 'border-gray-300'
                        }`}
                      >
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full border-4 ${
                          isDark ? 'border-blue-500 border-t-transparent' : 'border-blue-400 border-t-transparent'
                        }`} />
                        <h3 className={`text-2xl font-bold mb-3 ${theme.header}`}>
                          No leave balances allocated
                        </h3>
                        <p className={`mb-8 ${theme.subheader}`}>
                          Start by allocating leave balances to staff members
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className={`text-2xl font-bold ${theme.header}`}>Leave Settings</h2>
                  <p className={`${theme.subheader}`}>Configure leave policies and rules</p>
                </div>

                {/* Academic Year Selection */}
                <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <label className={theme.label}>Academic Year</label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className={theme.input}
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
                  <div className={`${theme.card} p-8`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={theme.label}>Auto-approve leaves ≤ (days)</label>
                        <input
                          type="number"
                          min="0"
                          value={settingsForm.autoApproveDays}
                          onChange={(e) => setSettingsForm({ ...settingsForm, autoApproveDays: parseInt(e.target.value) || 0 })}
                          className={theme.input}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className={theme.label}>Require document for leaves {'>'} (days)</label>
                        <input
                          type="number"
                          min="0"
                          value={settingsForm.requireDocumentDays}
                          onChange={(e) => setSettingsForm({ ...settingsForm, requireDocumentDays: parseInt(e.target.value) || 0 })}
                          className={theme.input}
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <label className={theme.label}>Minimum Staff Coverage</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Optional"
                          value={settingsForm.minStaffCoverage || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, minStaffCoverage: e.target.value ? parseInt(e.target.value) : null })}
                          className={theme.input}
                        />
                      </div>
                      <div>
                        <label className={theme.label}>Notification Emails</label>
                        <input
                          type="text"
                          placeholder="email1@school.com, email2@school.com"
                          value={settingsForm.notificationEmails}
                          onChange={(e) => setSettingsForm({ ...settingsForm, notificationEmails: e.target.value })}
                          className={theme.input}
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className={theme.label}>Working Days</label>
                      <div className="flex flex-wrap gap-3">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                          <motion.button
                            key={day}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (settingsForm.workingDays.includes(index + 1)) {
                                setSettingsForm({ ...settingsForm, workingDays: settingsForm.workingDays.filter(d => d !== index + 1) });
                              } else {
                                setSettingsForm({ ...settingsForm, workingDays: [...settingsForm.workingDays, index + 1] });
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              settingsForm.workingDays.includes(index + 1)
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                : isDark 
                                  ? 'bg-slate-700 text-slate-400 border border-slate-600' 
                                  : 'bg-gray-200 text-gray-600 border border-gray-300'
                            }`}
                          >
                            {day}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.examPeriodRestriction}
                          onChange={(e) => setSettingsForm({ ...settingsForm, examPeriodRestriction: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm font-medium ${theme.header}`}>
                          Restrict leave during exam periods
                        </span>
                      </label>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={saveLeaveSettings}
                      disabled={loading}
                      className={`mt-8 px-8 py-3 rounded-2xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                        isDark 
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loading ? 'Saving...' : 'Save Settings'}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Workflow Tab */}
            {activeTab === 'workflow' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className={`text-2xl font-bold ${theme.header}`}>Approval Workflow</h2>
                  <p className={`${theme.subheader}`}>Configure the sequence of approvals required for leave applications</p>
                </div>

                {/* Academic Year Selection */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <label className={theme.label}>Academic Year</label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className={theme.input}
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
                  <div className={`${theme.card} p-8`}>
                    {workflowsLoading ? (
                      <div className="text-center py-8">
                        <div className={`w-8 h-8 mx-auto border-4 border-rose-500 border-t-transparent rounded-full animate-spin`} />
                        <p className={`mt-4 ${theme.subheader}`}>Loading workflows...</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <AnimatePresence>
                            {workflows.map((wf, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-6 rounded-xl border-2 ${
                                  isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg`}>
                                    {index + 1}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                    <div>
                                      <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Leave Type
                                      </label>
                                      <select
                                        value={wf.leaveTypeId || ''}
                                        onChange={(e) => {
                                          const newWf = [...workflows];
                                          newWf[index].leaveTypeId = e.target.value || null;
                                          setWorkflows(newWf);
                                        }}
                                        className={theme.input}
                                      >
                                        <option value="">All Leave Types</option>
                                        {leaveTypes.map(lt => (
                                          <option key={lt.id} value={lt.id}>{lt.name}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Approver Role
                                      </label>
                                      <select
                                        value={wf.roleId}
                                        onChange={(e) => {
                                          const newWf = [...workflows];
                                          newWf[index].roleId = e.target.value;
                                          setWorkflows(newWf);
                                        }}
                                        className={theme.input}
                                      >
                                        <option value="">Select Role</option>
                                        {roles.map(r => (
                                          <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Required Permission
                                      </label>
                                      <select
                                        value={wf.requiredPermission}
                                        onChange={(e) => {
                                          const newWf = [...workflows];
                                          newWf[index].requiredPermission = e.target.value;
                                          setWorkflows(newWf);
                                        }}
                                        className={theme.input}
                                      >
                                        <option value="approve_department_leave">Approve Department Leave</option>
                                        <option value="approve_all_leave">Approve All Leave</option>
                                      </select>
                                    </div>
                                  </div>

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                      const newWf = workflows.filter((_, i) => i !== index);
                                      setWorkflows(newWf);
                                    }}
                                    className={theme.btnDanger}
                                    title="Remove step"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          
                          {workflows.length === 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`text-center py-16 rounded-3xl border-2 border-dashed ${
                                isDark ? 'border-slate-700' : 'border-gray-300'
                              }`}
                            >
                              <div className={`w-20 h-20 mx-auto mb-6 rounded-full border-4 ${
                                isDark ? 'border-purple-500 border-t-transparent' : 'border-purple-400 border-t-transparent'
                              }`} />
                              <h3 className={`text-xl font-bold mb-3 ${theme.header}`}>
                                No workflow steps defined
                              </h3>
                              <p className={`${theme.subheader}`}>
                                Add a step to configure the approval workflow
                              </p>
                            </motion.div>
                          )}
                        </div>

                        <div className="flex gap-4 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setWorkflows([
                                ...workflows,
                                { leaveTypeId: null, roleId: '', requiredPermission: 'approve_department_leave', sequence: workflows.length + 1, isActive: true }
                              ]);
                            }}
                            className={theme.btnSecondary}
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-bold text-rose-500">+</span> Add Step
                            </span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={saveWorkflows}
                            disabled={loading}
                            className={`px-8 py-3 rounded-2xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                              isDark 
                                ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' 
                                : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {loading ? 'Saving...' : 'Save Workflow'}
                          </motion.button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Leave Type Form Modal */}
      <AnimatePresence>
        {showLeaveTypeForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl ${theme.card} max-h-[90vh] overflow-y-auto`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${theme.header}`}>
                    {editingLeaveType ? 'Edit Leave Type' : 'Add Leave Type'}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowLeaveTypeForm(false)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDark ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={theme.label}>Name *</label>
                    <input
                      value={leaveTypeForm.name}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, name: e.target.value })}
                      className={theme.input}
                      placeholder="Sick Leave"
                    />
                  </div>
                  <div>
                    <label className={theme.label}>Code *</label>
                    <input
                      value={leaveTypeForm.code}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, code: e.target.value.toUpperCase() })}
                      className={theme.input}
                      placeholder="SL"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={theme.label}>Max Days/Year</label>
                    <input
                      type="number"
                      value={leaveTypeForm.maxDaysPerYear}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, maxDaysPerYear: e.target.value })}
                      className={theme.input}
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className={theme.label}>Accrual Rate</label>
                    <input
                      type="number"
                      step="0.1"
                      value={leaveTypeForm.accrualRate}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, accrualRate: e.target.value })}
                      className={theme.input}
                      placeholder="1.0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={theme.label}>Max Carry Forward</label>
                    <input
                      type="number"
                      value={leaveTypeForm.maxCarryForwardDays}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, maxCarryForwardDays: e.target.value })}
                      className={theme.input}
                      placeholder="5"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-8">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={leaveTypeForm.isPaid}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, isPaid: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isPaid" className={`text-sm font-medium ${theme.header}`}>
                      Paid Leave
                    </label>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className={theme.label}>Description</label>
                  <textarea
                    value={leaveTypeForm.description}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, description: e.target.value })}
                    className={theme.input}
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
                
                <div className="flex items-center gap-4 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="requiresDocument"
                      checked={leaveTypeForm.requiresDocument}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, requiresDocument: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm font-medium ${theme.header}`}>
                      Requires Document
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="canCarryForward"
                      checked={leaveTypeForm.canCarryForward}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, canCarryForward: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm font-medium ${theme.header}`}>
                      Can Carry Forward
                    </span>
                  </label>
                </div>
              </div>
              
              <div className={`px-6 py-4 border-t ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={saveLeaveType}
                    disabled={loading}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 ${
                      isDark 
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' 
                        : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600'
                    }`}
                  >
                    {loading ? 'Saving...' : (editingLeaveType ? 'Update' : 'Create')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLeaveTypeForm(false)}
                    className={theme.btnSecondary}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Balance Form Modal */}
      <AnimatePresence>
        {showBalanceForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl ${theme.card} max-h-[90vh] overflow-y-auto`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${theme.header}`}>
                    Allocate Leave Balance
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowBalanceForm(false)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDark ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className={theme.label}>Select Staff *</label>
                    <select
                      value={balanceForm.staffId}
                      onChange={(e) => setBalanceForm({ ...balanceForm, staffId: e.target.value })}
                      className={theme.input}
                    >
                      <option value="">Select Teacher/Staff</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={theme.label}>Leave Type *</label>
                    <select
                      value={balanceForm.leaveTypeId}
                      onChange={(e) => setBalanceForm({ ...balanceForm, leaveTypeId: e.target.value })}
                      className={theme.input}
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map((leaveType) => (
                        <option key={leaveType.id} value={leaveType.id}>
                          {leaveType.name} ({leaveType.code}) - {leaveType.maxDaysPerYear} days/year
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={theme.label}>Total Allocated Days *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={balanceForm.totalAllocated}
                        onChange={(e) => setBalanceForm({ ...balanceForm, totalAllocated: e.target.value })}
                        className={theme.input}
                        placeholder="e.g., 12"
                      />
                    </div>
                    <div>
                      <label className={theme.label}>Carried Forward Days</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={balanceForm.carriedForward}
                        onChange={(e) => setBalanceForm({ ...balanceForm, carriedForward: e.target.value })}
                        className={theme.input}
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                    <p className={`text-sm font-semibold mb-3 ${theme.header}`}>
                      Preview:
                    </p>
                    <div className="space-y-2">
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Total Available: <span className="font-bold">{(parseFloat(balanceForm.totalAllocated) || 0) + (parseFloat(balanceForm.carriedForward) || 0)} days</span>
                      </div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Used: <span className="font-bold">0 days</span>
                      </div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Balance: <span className="font-bold text-green-600">{(parseFloat(balanceForm.totalAllocated) || 0) + (parseFloat(balanceForm.carriedForward) || 0)} days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBalanceForm(false)}
                      className={theme.btnSecondary}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={saveLeaveBalance}
                      disabled={loading}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 ${
                        isDark 
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600'
                      }`}
                    >
                      {loading ? 'Allocating...' : 'Allocate Balance'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Leave Balance Form Modal */}
      <AnimatePresence>
        {showBulkBalanceForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl ${theme.card} max-h-[90vh] overflow-y-auto`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${theme.header}`}>
                    Bulk Allocate Leave Balance
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowBulkBalanceForm(false)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDark ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className={theme.label}>Leave Type *</label>
                    <select
                      value={bulkBalanceForm.leaveTypeId}
                      onChange={(e) => setBulkBalanceForm({ ...bulkBalanceForm, leaveTypeId: e.target.value })}
                      className={theme.input}
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map((leaveType) => (
                        <option key={leaveType.id} value={leaveType.id}>
                          {leaveType.name} ({leaveType.code}) - {leaveType.maxDaysPerYear} days/year
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={theme.label}>Total Allocated Days *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={bulkBalanceForm.totalAllocated}
                        onChange={(e) => setBulkBalanceForm({ ...bulkBalanceForm, totalAllocated: e.target.value })}
                        className={theme.input}
                        placeholder="e.g., 12"
                      />
                    </div>
                    <div>
                      <label className={theme.label}>Carried Forward Days</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={bulkBalanceForm.carriedForward}
                        onChange={(e) => setBulkBalanceForm({ ...bulkBalanceForm, carriedForward: e.target.value })}
                        className={theme.input}
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={theme.label}>Select Staff Members *</label>
                    <div className={`border rounded-xl p-4 max-h-60 overflow-y-auto ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                      <div className="space-y-2">
                        {teachers.map((teacher) => {
                          const isSelected = bulkBalanceForm.selectedStaff.includes(teacher.id);
                          return (
                            <label key={teacher.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBulkBalanceForm({
                                      ...bulkBalanceForm,
                                      selectedStaff: [...bulkBalanceForm.selectedStaff, teacher.id]
                                    });
                                  } else {
                                    setBulkBalanceForm({
                                      ...bulkBalanceForm,
                                      selectedStaff: bulkBalanceForm.selectedStaff.filter(id => id !== teacher.id)
                                    });
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className={`font-medium ${theme.header}`}>
                                  {teacher.name}
                                </div>
                                <div className={`text-sm ${theme.subheader}`}>
                                  {teacher.employeeId} • {teacher.department || 'No Department'}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className={`text-sm mt-2 ${theme.subheader}`}>
                      {bulkBalanceForm.selectedStaff.length} staff member{bulkBalanceForm.selectedStaff.length !== 1 ? 's' : ''} selected
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                    <p className={`text-sm font-semibold mb-3 ${theme.header}`}>
                      Bulk Allocation Summary:
                    </p>
                    <div className="space-y-2">
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Staff Members: <span className="font-bold">{bulkBalanceForm.selectedStaff.length}</span>
                      </div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Leave Type: <span className="font-bold">{leaveTypes.find(lt => lt.id === bulkBalanceForm.leaveTypeId)?.name || 'Not selected'}</span>
                      </div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Days Per Staff: <span className="font-bold">{(parseFloat(bulkBalanceForm.totalAllocated) || 0) + (parseFloat(bulkBalanceForm.carriedForward) || 0)} days</span>
                      </div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Total Days to Allocate: <span className="font-bold text-green-600">{((parseFloat(bulkBalanceForm.totalAllocated) || 0) + (parseFloat(bulkBalanceForm.carriedForward) || 0)) * bulkBalanceForm.selectedStaff.length} days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBulkBalanceForm(false)}
                      className={theme.btnSecondary}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={saveBulkLeaveBalance}
                      disabled={loading || bulkBalanceForm.selectedStaff.length === 0}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 ${
                        isDark 
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600'
                      }`}
                    >
                      {loading ? 'Allocating...' : `Allocate to ${bulkBalanceForm.selectedStaff.length} Staff${bulkBalanceForm.selectedStaff.length !== 1 ? 's' : ''}`}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
