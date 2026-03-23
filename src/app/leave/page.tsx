'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from 'next-auth/react';

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
  const { hasPermission, permissions } = usePermissions();
  const { data: session } = useSession();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);
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
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

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
  }, [activeTab, selectedAcademicYear, historyFilters]);

  const fetchDashboardData = async () => {
    setLoading(true);
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
      setLoading(false);
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
      
      // For admins, show all applications; for staff, show only their own
      if (!canApproveLeave) {
        // Staff can only see their own history
        const teacher = await fetch('/api/debug/leave-data').then(res => res.json());
        const currentTeacher = teacher.allStaff.find((staff: any) => staff.userId === session?.user?.id);
        if (currentTeacher) {
          params.append('staffId', currentTeacher.id);
        }
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

  if (loading) {
    return (
      <AppLayout currentPage="leave" title="Leave Management" theme={theme}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading leave data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="leave" title="Leave Management" theme={theme}>
      <div className="min-h-screen p-4 md:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className={card}>
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Leave Management
                  </h1>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Manage your leave applications and track your leave balance
                  </p>
                </div>
                <div className="flex gap-3">
                  {canApplyLeave && (
                    <button
                      onClick={() => setShowApplicationForm(true)}
                      className={btnPrimary}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Apply for Leave
                      </span>
                    </button>
                  )}
                  {canViewHistory && (
                    <button
                      onClick={() => setActiveTab('history')}
                      className={btnSecondary}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Leave History
                      </span>
                    </button>
                  )}
                  {canApproveLeave && (
                    <button
                      onClick={() => setActiveTab('management')}
                      className={btnSecondary}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Staff Management
                      </span>
                    </button>
                  )}
                  {canApproveLeave && (
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className={btnSecondary}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending Approvals
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Year Selector */}
          <div className={card}>
            <div className="p-4">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={card}>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Allocated</p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {calculateTotalAllocated()}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={card}>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Used</p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {calculateTotalUsed()}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={card}>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Available</p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {calculateTotalBalance()}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={card}>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Carried Forward</p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {leaveBalances.reduce((total, balance) => total + balance.carriedForward, 0)}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Balance Details */}
              {canViewBalance && leaveBalances.length > 0 && (
                <div className={card}>
                  <div className="p-6">
                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Leave Balance Details
                    </h3>
                    <div className="space-y-3">
                      {leaveBalances.map((balance) => (
                        <div key={balance.id} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
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
                            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div
                                className={`h-2 rounded-full ${
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
              {canViewHistory && recentApplications.length > 0 && (
                <div className={card}>
                  <div className="p-6">
                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Recent Applications
                    </h3>
                    <div className="space-y-3">
                      {recentApplications.map((application) => (
                        <div key={application.id} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
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
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Staff Leave Management
                  </h3>
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
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    All Staff Leave Balances
                  </h3>
                  <div className="space-y-4">
                    {allStaffLeaveBalances
                      .filter(balance => !selectedStaff || balance.staffId === selectedStaff)
                      .map((balance) => (
                        <div key={balance.id} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
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
                            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div
                                className={`h-2 rounded-full ${
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
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Pending Leave Approvals
                  </h3>
                  <div className="space-y-4">
                    {allLeaveApplications
                      .filter(app => app.status === 'pending')
                      .map((application) => (
                        <div key={application.id} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
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
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                                Applied: {new Date(application.appliedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
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
