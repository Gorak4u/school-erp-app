'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';

interface LeaveBalance {
  id: string;
  staffId: string;
  leaveTypeId: string;
  academicYearId: string;
  totalAllocated: number;
  used: number;
  balance: number;
  carriedForward: number;
  staff: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string;
  };
  leaveType: {
    id: string;
    name: string;
    code: string;
    maxDaysPerYear: number | null;
    isPaid: boolean;
    canCarryForward: boolean;
  };
  academicYear: {
    id: string;
    name: string;
    year: string;
    isActive: boolean;
  };
}

interface LeaveApplication {
  id: string;
  staffId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  attachmentPath: string | null;
  status: string;
  appliedAt: string;
  approverId: string | null;
  approvedAt: string | null;
  approvalComments: string | null;
  rejectionReason: string | null;
  academicYearId: string;
  staff: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string;
  };
  leaveType: {
    id: string;
    name: string;
    code: string;
    isPaid: boolean;
  };
  approver: {
    id: string;
    name: string;
    email: string;
  } | null;
  academicYear: {
    id: string;
    name: string;
    year: string;
  };
  _count: {
    approvalHistory: number;
  };
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  requiresDocument: boolean;
  description: string | null;
  isActive: boolean;
}

interface AcademicYear {
  id: string;
  name: string;
  year: string;
  isActive: boolean;
}

export default function LeavePage() {
  const { theme } = useTheme();
  const { hasPermission } = usePermissions();
  const isDark = theme === 'dark';
  
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard State
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [recentApplications, setRecentApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  
  // Admin State
  const [allStaffLeaveBalances, setAllStaffLeaveBalances] = useState<LeaveBalance[]>([]);
  const [allLeaveApplications, setAllLeaveApplications] = useState<LeaveApplication[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  
  // Leave History State
  const [leaveHistory, setLeaveHistory] = useState<LeaveApplication[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyFilters, setHistoryFilters] = useState({
    status: '',
    leaveType: '',
    dateRange: 'all' // all, thisMonth, lastMonth, thisYear, custom
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Application Form State
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    attachmentPath: '',
  });

  // CSS Variables
  const card = `rounded-3xl border shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl ${isDark ? 'bg-gradient-to-br from-gray-800/90 via-gray-900 to-gray-950 border-gray-700/80' : 'bg-gradient-to-br from-white/90 via-gray-50 to-white border-gray-200/80'}`;
  const input = `w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 ${isDark ? 'bg-gray-700/60 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-400'}`;
  const label = `block text-[11px] font-semibold uppercase tracking-[0.18em] mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const btnPrimary = `px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(37,99,235,0.28)] ${isDark ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-950/30' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'}`;
  const btnSecondary = `px-4 py-3 rounded-2xl text-sm font-semibold border backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 ${isDark ? 'border-gray-600/80 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-gray-500' : 'border-gray-200 bg-white/70 text-gray-700 hover:bg-white hover:border-gray-300'}`;
  const tabButtonClass = (active: boolean) => `px-4 py-3 rounded-full text-sm font-semibold transition-all border backdrop-blur-sm whitespace-nowrap ${active
    ? isDark
      ? 'bg-blue-500/15 text-blue-200 border-blue-400/30 shadow-lg shadow-blue-950/20'
      : 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
    : isDark
      ? 'border-gray-700/80 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-gray-600'
      : 'border-gray-200 bg-white/70 text-gray-700 hover:bg-white hover:border-gray-300'
  }`;

  const canApplyLeave = hasPermission('apply_leave');
  const canViewBalance = hasPermission('view_leave_balance');
  const canViewHistory = hasPermission('view_own_leave_history');
  const canApproveLeave = hasPermission('approve_department_leave') || hasPermission('approve_all_leave');

  useEffect(() => {
    fetchDashboardData();
    
    // Fetch admin data if user can approve leave
    if (canApproveLeave) {
      fetchAllStaff();
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (activeTab === 'management' && canApproveLeave) {
      fetchAllStaffLeaveBalances();
      fetchAllLeaveApplications();
    } else if (activeTab === 'approvals' && canApproveLeave) {
      fetchAllLeaveApplications();
    } else if (activeTab === 'history') {
      fetchLeaveHistory(1);
    }
  }, [activeTab, selectedAcademicYear]);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      await Promise.all([
        fetchAcademicYears(),
        fetchLeaveTypes(),
        fetchLeaveBalances(),
        fetchRecentApplications(),
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/school-structure/academic-years');
      if (response.ok) {
        const data = await response.json();
        const years = data.academicYears || [];
        setAcademicYears(years);
        const activeYear = years.find((ay: AcademicYear) => ay.isActive);
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
      const response = await fetch('/api/leave-types?isActive=true');
      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data.leaveTypes || []);
      }
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
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

  const fetchRecentApplications = async () => {
    if (!selectedAcademicYear) return;
    
    try {
      const response = await fetch(`/api/leave-applications?academicYearId=${selectedAcademicYear}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setRecentApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent applications:', error);
    }
  };

  // Admin functions
  const fetchAllStaff = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setStaffList(data.teachers || []);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchAllStaffLeaveBalances = async () => {
    if (!selectedAcademicYear) return;
    
    try {
      const response = await fetch(`/api/leave-balance?academicYearId=${selectedAcademicYear}`);
      if (response.ok) {
        const data = await response.json();
        setAllStaffLeaveBalances(data.leaveBalances || []);
      }
    } catch (error) {
      console.error('Failed to fetch all staff leave balances:', error);
    }
  };

  const fetchAllLeaveApplications = async () => {
    if (!selectedAcademicYear) return;
    
    try {
      const response = await fetch(`/api/leave-applications?academicYearId=${selectedAcademicYear}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setAllLeaveApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch all leave applications:', error);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      const response = await fetch(`/api/leave-applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comments }),
      });
      
      if (response.ok) {
        showSuccessToast('Success', `Leave application ${status} successfully`);
        fetchAllLeaveApplications(); // Refresh the list
      } else {
        const error = await response.json();
        showErrorToast('Error', error.error || `Failed to ${status} application`);
      }
    } catch (error) {
      showErrorToast('Error', `Failed to ${status} application`);
    }
  };

  const cancelApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to cancel this leave application?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leave-applications/${applicationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showSuccessToast('Success', 'Leave application cancelled successfully');
        fetchAllLeaveApplications(); // Refresh the list
        fetchRecentApplications(); // Refresh user's applications
      } else {
        const error = await response.json();
        showErrorToast('Error', error.error || 'Failed to cancel application');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to cancel application');
    }
  };

  const fetchLeaveHistory = async (page: number = 1) => {
    if (!selectedAcademicYear) return;
    
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        academicYearId: selectedAcademicYear,
        page: page.toString(),
        limit: '20',
      });
      
      // Add filters
      if (historyFilters.status) params.append('status', historyFilters.status);
      if (historyFilters.leaveType) params.append('leaveTypeId', historyFilters.leaveType);

      const range = getHistoryDateRange(historyFilters.dateRange);
      if (range) {
        params.append('startDate', range.startDate.toISOString());
        params.append('endDate', range.endDate.toISOString());
      }
      
      const response = await fetch(`/api/leave-applications?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setLeaveHistory(data.applications || []);
        setHistoryTotal(data.pagination?.total || 0);
        setHistoryPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch leave history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const submitLeaveApplication = async () => {
    if (!applicationForm.leaveTypeId || !applicationForm.startDate || !applicationForm.endDate) {
      showMsg('Please fill in all required fields', 'error');
      return;
    }

    try {
      const response = await fetch('/api/leave-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...applicationForm,
          academicYearId: selectedAcademicYear,
        }),
      });

      if (response.ok) {
        showMsg('Leave application submitted successfully', 'success');
        setShowApplicationForm(false);
        setApplicationForm({
          leaveTypeId: '',
          startDate: '',
          endDate: '',
          reason: '',
          attachmentPath: '',
        });
        fetchRecentApplications();
        fetchLeaveBalances();
      } else {
        const error = await response.json();
        showMsg(error.error || 'Failed to submit application', 'error');
      }
    } catch (error) {
      showMsg('Failed to submit application', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return isDark ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return isDark ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-red-100 text-red-700 border-red-200';
      case 'pending':
        return isDark ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return isDark ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return isDark ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const calculateTotalBalance = () => {
    return leaveBalances.reduce((total, balance) => total + balance.balance, 0);
  };

  const calculateTotalUsed = () => {
    return leaveBalances.reduce((total, balance) => total + balance.used, 0);
  };

  const calculateTotalAllocated = () => {
    return leaveBalances.reduce((total, balance) => total + balance.totalAllocated, 0);
  };

  const getHistoryDateRange = (range: string) => {
    const now = new Date();

    if (range === 'thisMonth') {
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    }

    if (range === 'lastMonth') {
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    }

    if (range === 'thisYear') {
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now,
      };
    }

    return null;
  };

  const selectedAcademicYearInfo = academicYears.find((year) => year.id === selectedAcademicYear);
  const recentPendingCount = recentApplications.filter((application) => application.status === 'pending').length;
  const recentApprovedCount = recentApplications.filter((application) => application.status === 'approved').length;
  const recentRejectedCount = recentApplications.filter((application) => application.status === 'rejected').length;
  const recentCancelledCount = recentApplications.filter((application) => application.status === 'cancelled').length;
  const visibleStaffLeaveBalances = allStaffLeaveBalances.filter((balance) => !selectedStaff || balance.staffId === selectedStaff);
  const pendingApprovalCount = allLeaveApplications.filter((application) => application.status === 'pending').length;
  const historyPendingCount = leaveHistory.filter((application) => application.status === 'pending').length;
  const historyApprovedCount = leaveHistory.filter((application) => application.status === 'approved').length;
  const historyRejectedCount = leaveHistory.filter((application) => application.status === 'rejected').length;

  return (
    <AppLayout currentPage="leave" title="Leave Management" theme={theme}>
      <div className="relative min-h-screen overflow-hidden p-4 md:p-6">
        <div className={`pointer-events-none absolute -top-24 right-[-8rem] h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/40'}`} />
        <div className={`pointer-events-none absolute top-72 left-[-6rem] h-64 w-64 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/40'}`} />
        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          {/* Hero */}
          <div className={`${card} overflow-hidden relative`}>
            <div className={`absolute inset-0 opacity-60 ${isDark ? 'bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.14),_transparent_35%)]' : 'bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.08),_transparent_35%)]'}`} />
            <div className={`p-6 md:p-8 ${isDark ? 'bg-gradient-to-br from-blue-950/40 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'}`}>
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${isDark ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-white/80 text-blue-700'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Leave Hub
                    {selectedAcademicYearInfo ? ` • ${selectedAcademicYearInfo.name}` : ' • Select academic year'}
                  </div>
                  <div>
                    <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Leave Management
                    </h1>
                    <p className={`mt-2 text-sm md:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Apply for leave, review approvals, and track balances in one polished workspace.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full border px-3 py-1 ${isDark ? 'border-gray-700 bg-white/5 text-gray-300' : 'border-gray-200 bg-white/80 text-gray-600'}`}>
                      Smart approvals
                    </span>
                    <span className={`rounded-full border px-3 py-1 ${isDark ? 'border-gray-700 bg-white/5 text-gray-300' : 'border-gray-200 bg-white/80 text-gray-600'}`}>
                      Balance-aware workflow
                    </span>
                    <span className={`rounded-full border px-3 py-1 ${isDark ? 'border-gray-700 bg-white/5 text-gray-300' : 'border-gray-200 bg-white/80 text-gray-600'}`}>
                      History & audit trail
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setActiveTab('dashboard')} className={tabButtonClass(activeTab === 'dashboard')}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0h4" />
                        </svg>
                        Dashboard
                      </span>
                    </button>
                    {canApplyLeave && (
                      <button onClick={() => setShowApplicationForm(true)} className={btnPrimary}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Apply for Leave
                        </span>
                      </button>
                    )}
                    {(canViewHistory || canApproveLeave) && (
                      <button onClick={() => setActiveTab('history')} className={tabButtonClass(activeTab === 'history')}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Leave History
                        </span>
                      </button>
                    )}
                    {canApproveLeave && (
                      <button onClick={() => setActiveTab('approvals')} className={tabButtonClass(activeTab === 'approvals')}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending Approvals
                        </span>
                      </button>
                    )}
                    {canApproveLeave && (
                      <button onClick={() => setActiveTab('management')} className={tabButtonClass(activeTab === 'management')}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Staff Management
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-[360px] space-y-4">
                  <div className={`rounded-3xl border p-4 shadow-lg backdrop-blur-xl ${isDark ? 'bg-gray-900/70 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-3xl border p-4 shadow-sm ${isDark ? 'bg-blue-600/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                      <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Available</div>
                      <div className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{calculateTotalBalance()}</div>
                    </div>
                    <div className={`rounded-3xl border p-4 shadow-sm ${isDark ? 'bg-amber-600/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                      <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Pending</div>
                      <div className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{recentPendingCount}</div>
                    </div>
                    <div className={`rounded-3xl border p-4 shadow-sm ${isDark ? 'bg-emerald-600/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Approved</div>
                      <div className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{recentApprovedCount}</div>
                    </div>
                    <div className={`rounded-3xl border p-4 shadow-sm ${isDark ? 'bg-rose-600/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                      <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>Rejected</div>
                      <div className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{recentRejectedCount + recentCancelledCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-4 rounded-xl border ${
              message.type === 'success' 
                ? isDark ? 'bg-green-600/20 border-green-600/30 text-green-400' : 'bg-green-100 border-green-200 text-green-700'
                : isDark ? 'bg-red-600/20 border-red-600/30 text-red-400' : 'bg-red-100 border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Leave Balance Summary */}
              {canViewBalance && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {dashboardLoading ? (
                    // Skeleton cards
                    [1,2,3,4].map((i) => (
                      <div key={i} className={`group relative overflow-hidden ${card} animate-pulse`}>
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400" />
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className={`h-3 w-24 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                              <div className={`mt-3 h-8 w-16 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                              <div className={`mt-2 h-3 w-32 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Actual cards
                    <>
                    <div className={`group relative overflow-hidden ${card} transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Total Allocated</p>
                          <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {calculateTotalAllocated()}
                          </p>
                          <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Across all leave types this year</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`group relative overflow-hidden ${card} transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400" />
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>Used</p>
                          <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {calculateTotalUsed()}
                          </p>
                          <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Days already consumed</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`group relative overflow-hidden ${card} transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400" />
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Available</p>
                          <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {calculateTotalBalance()}
                          </p>
                          <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Remaining for the current year</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`group relative overflow-hidden ${card} transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-400" />
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>Carried Forward</p>
                          <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {leaveBalances.reduce((total, balance) => total + balance.carriedForward, 0)}
                          </p>
                          <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Transferred from the previous cycle</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  </>
                  )}
                </div>
              )}

              {/* Leave Balance Details */}
              {canViewBalance && leaveBalances.length > 0 && (
                <div className={card}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Balances</p>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Leave Balance Details
                        </h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {leaveBalances.length} balance types
                      </span>
                    </div>
                    <div className="space-y-3">
                      {leaveBalances.map((balance) => (
                        <div key={balance.id} className={`group relative overflow-hidden p-5 rounded-3xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${isDark ? 'border-gray-700/80 bg-gray-800/55' : 'border-gray-200 bg-white/80'}`}>
                          <div className={`absolute inset-y-0 left-0 w-1.5 ${balance.balance > 5 ? 'bg-gradient-to-b from-emerald-500 to-green-400' : balance.balance > 2 ? 'bg-gradient-to-b from-amber-500 to-yellow-400' : 'bg-gradient-to-b from-rose-500 to-red-400'}`} />
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {balance.leaveType.name}
                              </h4>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {balance.leaveType.isPaid ? 'Paid' : 'Unpaid'} • {balance.leaveType.code}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {balance.balance}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                of {balance.totalAllocated} days
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div
                                className={`h-2 rounded-full shadow-sm ${
                                  balance.balance > 5 ? 'bg-green-500' : balance.balance > 2 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(balance.balance / balance.totalAllocated) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Applications */}
              {(canViewHistory || canApproveLeave) && recentApplications.length > 0 && (
                <div className={card}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Activity</p>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Recent Applications
                        </h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {recentApplications.length} recent items
                      </span>
                    </div>
                    <div className="space-y-3">
                      {recentApplications.map((application) => (
                        <div key={application.id} className={`group relative overflow-hidden p-5 rounded-3xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${isDark ? 'border-gray-700/80 bg-gray-800/55' : 'border-gray-200 bg-white/80'}`}>
                          <div className={`absolute inset-y-0 left-0 w-1.5 ${application.status === 'approved' ? 'bg-gradient-to-b from-emerald-500 to-green-400' : application.status === 'pending' ? 'bg-gradient-to-b from-amber-500 to-yellow-400' : application.status === 'rejected' ? 'bg-gradient-to-b from-rose-500 to-red-400' : 'bg-gradient-to-b from-gray-400 to-gray-500'}`} />
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {application.leaveType.name}
                              </h4>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()} ({application.totalDays} days)
                              </p>
                              {application.reason && (
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                  {application.reason}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                Applied {new Date(application.appliedAt).toLocaleDateString()}
                              </div>
                              {application.status === 'pending' && (
                                <button
                                  onClick={() => cancelApplication(application.id)}
                                  className={`mt-2 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    isDark ? 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 border border-gray-600/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                  }`}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Leave History Tab */}
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Filters */}
              <div className={card}>
                <div className="p-6">
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Leave History
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className={`rounded-xl border p-3 ${isDark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'}`}>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total on page</div>
                      <div className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{leaveHistory.length}</div>
                    </div>
                    <div className={`rounded-xl border p-3 ${isDark ? 'border-yellow-500/20 bg-yellow-500/10' : 'border-yellow-200 bg-yellow-50'}`}>
                      <div className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>Pending</div>
                      <div className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{historyPendingCount}</div>
                    </div>
                    <div className={`rounded-xl border p-3 ${isDark ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'}`}>
                      <div className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Approved</div>
                      <div className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{historyApprovedCount}</div>
                    </div>
                    <div className={`rounded-xl border p-3 ${isDark ? 'border-rose-500/20 bg-rose-500/10' : 'border-rose-200 bg-rose-50'}`}>
                      <div className={`text-xs ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>Rejected</div>
                      <div className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{historyRejectedCount}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className={label}>Status</label>
                      <select
                        value={historyFilters.status}
                        onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
                        className={input}
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className={label}>Leave Type</label>
                      <select
                        value={historyFilters.leaveType}
                        onChange={(e) => setHistoryFilters({ ...historyFilters, leaveType: e.target.value })}
                        className={input}
                      >
                        <option value="">All Types</option>
                        {leaveTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Date Range</label>
                      <select
                        value={historyFilters.dateRange}
                        onChange={(e) => setHistoryFilters({ ...historyFilters, dateRange: e.target.value })}
                        className={input}
                      >
                        <option value="all">All Time</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="thisYear">This Year</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => fetchLeaveHistory(1)}
                        className={btnPrimary}
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className={card}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-md font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {canApproveLeave ? 'All Leave Applications' : 'Your Leave History'}
                    </h4>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {historyTotal} records
                    </div>
                  </div>
                  
                  {historyLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaveHistory.map((application) => (
                        <div key={application.id} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {application.leaveType.name}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </span>
                              </div>
                              
                              {canApproveLeave && application.staff && (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                  <strong>Staff:</strong> {application.staff.name} ({application.staff.employeeId})
                                </p>
                              )}
                              
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Duration:</strong> {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()}
                              </p>
                              
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Total Days:</strong> {application.totalDays}
                              </p>
                              
                              {application.reason && (
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                                  <strong>Reason:</strong> {application.reason}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 mt-2">
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  <strong>Applied:</strong> {new Date(application.appliedAt).toLocaleDateString()}
                                </div>
                                
                                {application.approver && (
                                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    <strong>Reviewed by:</strong> {application.approver.name}
                                  </div>
                                )}
                                
                                {application.approvedAt && (
                                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    <strong>Approved:</strong> {new Date(application.approvedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              
                              {application.approvalComments && (
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                                  <strong>Comments:</strong> {application.approvalComments}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              {application.status === 'pending' && canApproveLeave && (
                                <>
                                  <button
                                    onClick={() => updateApplicationStatus(application.id, 'approved')}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                      isDark ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30' : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                    }`}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                      isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                    }`}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {application.status === 'pending' && !canApproveLeave && (
                                <button
                                  onClick={() => cancelApplication(application.id)}
                                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    isDark ? 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 border border-gray-600/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                  }`}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {leaveHistory.length === 0 && (
                        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No leave history found
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {historyTotal > 20 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Showing {((historyPage - 1) * 20) + 1} to {Math.min(historyPage * 20, historyTotal)} of {historyTotal} records
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchLeaveHistory(historyPage - 1)}
                          disabled={historyPage <= 1}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            historyPage <= 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          Previous
                        </button>
                        <span className={`px-3 py-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Page {historyPage}
                        </span>
                        <button
                          onClick={() => fetchLeaveHistory(historyPage + 1)}
                          disabled={historyPage * 20 >= historyTotal}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            historyPage * 20 >= historyTotal
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Staff Management Tab - Admin Only */}
          {activeTab === 'management' && canApproveLeave && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Staff Filter */}
              <div className={card}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Operations</p>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Staff Leave Management
                      </h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                      Live overview
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                    <div className={`rounded-3xl border p-4 shadow-sm ${isDark ? 'border-gray-700/80 bg-gray-800/60' : 'border-gray-200 bg-white/80'}`}>
                      <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Staff shown</div>
                      <div className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{visibleStaffLeaveBalances.length}</div>
                    </div>
                    <div className={`rounded-3xl border p-4 shadow-sm ${isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-100 bg-blue-50'}`}>
                      <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Pending approvals</div>
                      <div className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pendingApprovalCount}</div>
                    </div>
                    <div className={`rounded-3xl border p-4 shadow-sm ${isDark ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-emerald-100 bg-emerald-50'}`}>
                      <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Academic year</div>
                      <div className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedAcademicYearInfo?.year || '—'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Filter by Staff</label>
                      <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        className={input}
                      >
                        <option value="">All Staff</option>
                        {staffList.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} ({staff.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Staff Leave Balances */}
              <div className={card}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Balances</p>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        All Staff Leave Balances
                      </h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {visibleStaffLeaveBalances.length} visible
                    </span>
                  </div>
                  <div className="space-y-4">
                    {allStaffLeaveBalances
                      .filter(balance => !selectedStaff || balance.staffId === selectedStaff)
                      .map((balance) => (
                        <div key={balance.id} className={`group relative overflow-hidden p-5 rounded-3xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${isDark ? 'border-gray-700/80 bg-gray-800/55' : 'border-gray-200 bg-white/80'}`}>
                          <div className={`absolute inset-y-0 left-0 w-1.5 ${balance.balance > 5 ? 'bg-gradient-to-b from-emerald-500 to-green-400' : balance.balance > 2 ? 'bg-gradient-to-b from-amber-500 to-yellow-400' : 'bg-gradient-to-b from-rose-500 to-red-400'}`} />
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {balance.staff.name} ({balance.staff.employeeId})
                              </h4>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {balance.leaveType.name} - {balance.academicYear.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {balance.balance}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                of {balance.totalAllocated} days
                              </div>
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Used: {balance.used} | Carried: {balance.carriedForward}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div
                                className={`h-2 rounded-full shadow-sm ${
                                  balance.balance > 5 ? 'bg-green-500' : balance.balance > 2 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(balance.balance / balance.totalAllocated) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {allStaffLeaveBalances.filter(balance => !selectedStaff || balance.staffId === selectedStaff).length === 0 && (
                      <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        No leave balances found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Approvals Tab - Admin Only */}
          {activeTab === 'approvals' && canApproveLeave && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className={card}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Approvals</p>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Pending Leave Approvals
                      </h3>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                      {pendingApprovalCount} pending
                    </div>
                  </div>
                  <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Review, approve, or reject leave requests in one place.
                  </p>
                  <div className="space-y-4">
                    {allLeaveApplications
                      .filter(app => app.status === 'pending')
                      .map((application) => (
                        <div key={application.id} className={`group relative overflow-hidden p-5 rounded-3xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${isDark ? 'border-gray-700/80 bg-gray-800/55' : 'border-gray-200 bg-white/80'}`}>
                          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-500 to-yellow-400" />
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {application.staff.name} ({application.staff.employeeId})
                              </h4>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                {application.leaveType.name} - {new Date(application.startDate).toLocaleDateString()} to {new Date(application.endDate).toLocaleDateString()}
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                Total Days: {application.totalDays}
                              </p>
                              {application.reason && (
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                                  Reason: {application.reason}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                <span className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                  Applied: {new Date(application.appliedAt).toLocaleDateString()}
                                </span>
                                <span className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                  Days: {application.totalDays}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4 flex-wrap justify-end">
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'approved')}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                  isDark ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30' : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                  isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {allLeaveApplications.filter(app => app.status === 'pending').length === 0 && (
                      <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        No pending applications
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Leave Application Form Modal */}
          {showApplicationForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl ${card} max-h-[90vh] overflow-y-auto`}
              >
                <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Apply for Leave
                    </h3>
                    <button
                      onClick={() => setShowApplicationForm(false)}
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
                  <div className="space-y-4">
                    <div>
                      <label className={label}>Leave Type *</label>
                      <select
                        value={applicationForm.leaveTypeId}
                        onChange={(e) => setApplicationForm({ ...applicationForm, leaveTypeId: e.target.value })}
                        className={input}
                      >
                        <option value="">Select Leave Type</option>
                        {leaveTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({type.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={label}>Start Date *</label>
                        <input
                          type="date"
                          value={applicationForm.startDate}
                          onChange={(e) => setApplicationForm({ ...applicationForm, startDate: e.target.value })}
                          className={input}
                        />
                      </div>
                      <div>
                        <label className={label}>End Date *</label>
                        <input
                          type="date"
                          value={applicationForm.endDate}
                          onChange={(e) => setApplicationForm({ ...applicationForm, endDate: e.target.value })}
                          className={input}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={label}>Reason</label>
                      <textarea
                        value={applicationForm.reason}
                        onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
                        className={`${input} resize-none`}
                        rows={3}
                        placeholder="Please provide a reason for your leave application"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowApplicationForm(false)}
                        className={btnSecondary}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitLeaveApplication}
                        className={btnPrimary}
                      >
                        Submit Application
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
