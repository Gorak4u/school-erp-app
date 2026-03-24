'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useFinesWebSocket } from '@/hooks/useWebSocket';
import { useNotifications } from '@/components/RealTimeNotifications';
import RealTimeNotifications from '@/components/RealTimeNotifications';
import { ALL_PERMISSIONS } from '@/lib/permissions';
import { showSuccess, showError, showWarning, showInfo } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Plus, Search, Filter, Eye, Edit, Ban, Trash2, 
  Clock, AlertCircle, CheckCircle, XCircle, CreditCard,
  Download, ChevronDown, CheckSquare, Square
} from 'lucide-react';

export default function FinesPage() {
  const { theme } = useTheme();
  const { activeAcademicYear } = useSchoolConfig();
  const { hasPermission } = usePermissions();
  const isDark = theme === 'dark';

  // WebSocket and notifications
  const { isConnected, notifications: wsNotifications, sendMessage } = useFinesWebSocket('school-1'); // TODO: Get actual school ID
  const { 
    notifications, 
    addNotification, 
    markAsRead, 
    removeNotification, 
    clearNotifications 
  } = useNotifications();

  // CSS Variables following design system
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  // State
  const [activeTab, setActiveTab] = useState<'fines' | 'waiver-requests'>('fines');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [fines, setFines] = useState<any[]>([]);
  const [waiverRequests, setWaiverRequests] = useState<any[]>([]);
  const [pendingWaiverCount, setPendingWaiverCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [waiverLoading, setWaiverLoading] = useState(false);
  const [selectedFineForWaiver, setSelectedFineForWaiver] = useState<any>(null);
  
  // Bulk operations state
  const [selectedFines, setSelectedFines] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'export' | 'approve' | 'reject' | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRemarks, setBulkRemarks] = useState('');
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Form states
  const [createForm, setCreateForm] = useState({
    studentId: '',
    studentSearch: '',
    type: 'late_fee',
    category: 'academic',
    amount: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0]
  });
  const [waiverForm, setWaiverForm] = useState({
    waiveAmount: '',
    reason: '',
    remarks: ''
  });
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);

  // Permissions - temporarily allow all users to see all buttons for testing
  const canManageFines = true; // Temporarily set to true for testing
  const canApproveWaivers = true; // Temporarily set to true for testing

  // Debug: Log waiver requests data
  useEffect(() => {
    if (waiverRequests.length > 0) {
      console.log('Waiver requests:', waiverRequests.map(r => ({ id: r.id, status: r.status, fine: r.fine?.fineNumber })));
    }
  }, [waiverRequests]);

  // API Functions
  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(search && { search }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedType !== 'all' && { type: selectedType }),
      });

      const response = await fetch(`/api/fines?${params.toString()}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch fines');
      }

      setFines(data.fines || []);
      const paginationData = data.pagination || {};
      console.log('Fines pagination data:', paginationData);
      setPagination(prev => ({
        ...prev,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false,
      }));
    } catch (error) {
      console.error('Error fetching fines:', error);
      showError('Data Load Failed', 'Failed to fetch fines');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search, selectedStatus, selectedType]);

  const fetchWaiverRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(search && { search }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/fines/waiver-requests?${params.toString()}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch waiver requests');
      }

      setWaiverRequests(data.waiverRequests || []);
      setPendingWaiverCount(data.pendingCount || 0);
      const paginationData = data.pagination || {};
      console.log('Waiver requests pagination data:', paginationData);
      setPagination(prev => ({
        ...prev,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false,
      }));
    } catch (error) {
      console.error('Error fetching waiver requests:', error);
      showError('Data Load Failed', 'Failed to fetch waiver requests');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search, selectedStatus]);

  // Load data when tab, search, or filters change
  useEffect(() => {
    if (activeTab === 'fines') {
      fetchFines();
    } else if (activeTab === 'waiver-requests') {
      fetchWaiverRequests();
    }
  }, [activeTab, fetchFines, fetchWaiverRequests]);

  // Reset page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [search, selectedStatus, selectedType]);

  // Student search
  const searchStudents = async (query: string) => {
    if (!query || query.length < 2) {
      setStudentSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(query)}&pageSize=10`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStudentSearchResults(data.students || []);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setStudentSearchResults([]);
    }
  };

  // Debounced student search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStudents(createForm.studentSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [createForm.studentSearch]);

  // Action Handlers
  const handleCreateFine = () => {
    setShowCreateModal(true);
  };

  const handleCreateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.studentId || !createForm.amount || !createForm.description) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreateLoading(true);
      
      const response = await fetch('/api/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: createForm.studentId,
          type: createForm.type,
          category: createForm.category,
          amount: parseFloat(createForm.amount),
          description: createForm.description,
          dueDate: createForm.dueDate,
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create fine');
      }

      // Reset form and close modal
      setCreateForm({
        studentId: '',
        studentSearch: '',
        type: 'late_fee',
        category: 'academic',
        amount: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0]
      });
      setStudentSearchResults([]);
      setShowCreateModal(false);
      
      // Refresh fines list
      fetchFines();
      
      showSuccess('Fine Created', 'Fine has been created successfully');
      
      // Send real-time notification
      addNotification({
        type: 'fine_created',
        title: 'New Fine Created',
        message: `Fine ${data.fineNumber} created for ${data.student?.name || 'Student'}`,
        data: {
          fineNumber: data.fineNumber,
          studentName: data.student?.name,
          amount: data.amount
        }
      });
    } catch (error: any) {
      console.error('Error creating fine:', error);
      showError('Creation Failed', error.message || 'Failed to create fine');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStudentSelect = (student: any) => {
    setCreateForm(prev => ({
      ...prev,
      studentId: student.id,
      studentSearch: `${student.name} (${student.admissionNo || student.rollNo || 'N/A'})`
    }));
    setStudentSearchResults([]);
  };

  const handleRequestWaiver = (fine: any) => {
    setSelectedFineForWaiver(fine);
    setWaiverForm({
      waiveAmount: fine.pendingAmount.toString(),
      reason: '',
      remarks: ''
    });
    setShowWaiverModal(true);
  };

  const handleWaiverFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!waiverForm.waiveAmount || !waiverForm.reason) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    const waiveAmount = parseFloat(waiverForm.waiveAmount);
    if (waiveAmount <= 0 || waiveAmount > selectedFineForWaiver.pendingAmount) {
      showError('Invalid Amount', `Waiver amount must be between ₹1 and ₹${selectedFineForWaiver.pendingAmount}`);
      return;
    }

    try {
      setWaiverLoading(true);
      
      const response = await fetch('/api/fines/waiver-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fineId: selectedFineForWaiver.id,
          waiveAmount,
          reason: waiverForm.reason,
          remarks: waiverForm.remarks,
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit waiver request');
      }

      // Reset form and close modal
      setWaiverForm({
        waiveAmount: '',
        reason: '',
        remarks: ''
      });
      setSelectedFineForWaiver(null);
      setShowWaiverModal(false);
      
      // Refresh fines list
      fetchFines();
      
      showSuccess('Waiver Request Submitted', 'Your waiver request has been submitted successfully');
      
      // Send real-time notification
      addNotification({
        type: 'waiver_requested',
        title: 'Waiver Request Submitted',
        message: `Waiver request submitted for fine ${selectedFineForWaiver.fineNumber}`,
        data: {
          fineNumber: selectedFineForWaiver.fineNumber,
          studentName: selectedFineForWaiver.student?.name,
          amount: waiveAmount
        }
      });
    } catch (error: any) {
      console.error('Error submitting waiver request:', error);
      showError('Submission Failed', error.message || 'Failed to submit waiver request');
    } finally {
      setWaiverLoading(false);
    }
  };

  const handleDeleteFine = async (fineId: string) => {
    if (!confirm('Are you sure you want to delete this fine?')) return;
    
    try {
      const response = await fetch(`/api/fines/${fineId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete fine');
      }
      
      fetchFines();
      showSuccess('Fine Deleted', 'Fine has been deleted successfully');
    } catch (error) {
      console.error('Error deleting fine:', error);
      showError('Deletion Failed', 'Failed to delete fine');
    }
  };

  const handleApproveWaiver = async (requestId: string) => {
    try {
      const response = await fetch(`/api/fines/waiver-requests?id=${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve waiver request');
      }
      
      fetchWaiverRequests();
      showSuccess('Waiver Approved', 'Waiver request has been approved successfully');
      
      // Send real-time notification
      addNotification({
        type: 'waiver_approved',
        title: 'Waiver Approved',
        message: `Waiver request for fine has been approved`,
        data: {
          fineNumber: requestId, // This would be the fine number in real implementation
          amount: 0 // This would be the approved amount
        }
      });
    } catch (error) {
      console.error('Error approving waiver:', error);
      showError('Approval Failed', 'Failed to approve waiver request');
    }
  };

  const handleRejectWaiver = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      const response = await fetch(`/api/fines/waiver-requests?id=${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', remarks: reason }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject waiver request');
      }
      
      fetchWaiverRequests();
      showSuccess('Waiver Rejected', 'Waiver request has been rejected successfully');
      
      // Send real-time notification
      addNotification({
        type: 'waiver_rejected',
        title: 'Waiver Rejected',
        message: `Waiver request for fine has been rejected`,
        data: {
          fineNumber: requestId, // This would be the fine number in real implementation
          reason: reason
        }
      });
    } catch (error) {
      console.error('Error rejecting waiver:', error);
      showError('Rejection Failed', 'Failed to reject waiver request');
    }
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedFines.length === fines.length) {
      setSelectedFines([]);
    } else {
      setSelectedFines(fines.map(fine => fine.id));
    }
  };

  const handleSelectFine = (fineId: string) => {
    setSelectedFines(prev => 
      prev.includes(fineId) 
        ? prev.filter(id => id !== fineId)
        : [...prev, fineId]
    );
  };

  const handleBulkAction = (action: 'delete' | 'export' | 'approve' | 'reject') => {
    if (selectedFines.length === 0) {
      showError('No Selection', 'Please select at least one fine to perform bulk action');
      return;
    }
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const handleBulkExecute = async () => {
    if (!bulkAction || selectedFines.length === 0) return;

    setBulkLoading(true);
    try {
      let results = { success: 0, failed: 0, errors: [] as string[] };

      for (const fineId of selectedFines) {
        try {
          let response;
          
          switch (bulkAction) {
            case 'delete':
              response = await fetch(`/api/fines/${fineId}`, {
                method: 'DELETE',
                credentials: 'include',
              });
              break;
            
            case 'export':
              // Export is handled differently
              break;
            
            case 'approve':
              // Find waiver request for this fine and approve it
              const waiver = waiverRequests.find(wr => wr.fineId === fineId);
              if (waiver) {
                response = await fetch(`/api/fines/waiver-requests?id=${waiver.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'approved' }),
                  credentials: 'include',
                });
              }
              break;
            
            case 'reject':
              // Find waiver request for this fine and reject it
              const waiverToReject = waiverRequests.find(wr => wr.fineId === fineId);
              if (waiverToReject) {
                response = await fetch(`/api/fines/waiver-requests?id=${waiverToReject.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'rejected', remarks: bulkRemarks }),
                  credentials: 'include',
                });
              }
              break;
          }

          if (response && !response.ok) {
            const error = await response.json();
            results.errors.push(`Fine ${fineId}: ${error.error || 'Unknown error'}`);
            results.failed++;
          } else {
            results.success++;
          }
        } catch (error) {
          results.errors.push(`Fine ${fineId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.failed++;
        }
      }

      // Refresh data
      if (activeTab === 'fines') {
        fetchFines();
      } else {
        fetchWaiverRequests();
      }

      // Show results
      if (results.success > 0) {
        showSuccess(
          'Bulk Action Completed', 
          `Successfully processed ${results.success} item${results.success > 1 ? 's' : ''}`
        );
      }
      
      if (results.failed > 0) {
        showError(
          'Some Actions Failed',
          `${results.failed} action${results.failed > 1 ? 's' : ''} failed. Check console for details.`
        );
        console.error('Bulk action errors:', results.errors);
      }

      // Reset state
      setSelectedFines([]);
      setShowBulkModal(false);
      setBulkAction(null);
      setBulkRemarks('');
      setShowBulkActions(false);
      
    } catch (error) {
      console.error('Bulk action error:', error);
      showError('Bulk Action Failed', 'An unexpected error occurred during bulk operation');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv' = 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(search && { search }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedFines.length > 0 && { fineIds: selectedFines.join(',') }),
      });

      const response = await fetch(`/api/fines/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export fines');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fines-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess('Export Successful', `Fines exported as ${format.toUpperCase()} file`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Export Failed', 'Failed to export fines');
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // Calculate statistics
  const stats = {
    total: fines.length,
    pending: fines.filter(f => f.status === 'pending').length,
    paid: fines.filter(f => f.status === 'paid').length,
    totalAmount: fines.reduce((sum, f) => sum + (f.amount || 0), 0),
    collectedAmount: fines.reduce((sum, f) => sum + (f.paidAmount || 0), 0),
    pendingAmount: fines.reduce((sum, f) => sum + (f.pendingAmount || 0), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'partial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'waived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <AppLayout currentPage="fines" title="Fines Management">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className={`${card} p-6 md:p-8`}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Fines Management • {activeAcademicYear?.name || 'School operations hub'}
                </div>
                
                {/* WebSocket Status Indicator */}
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                  isConnected 
                    ? isDark ? 'border-green-500/20 bg-green-500/10 text-green-300' : 'border-green-100 bg-green-50 text-green-700'
                    : isDark ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-red-100 bg-red-50 text-red-700'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  {isConnected ? 'Live Updates' : 'Offline'}
                </div>
              </div>
              <h1 className={`mt-4 text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Fines Management</h1>
              <p className={`mt-3 text-sm md:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage student fines, payments, and waiver requests with automated tracking.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full xl:w-auto">
              {canManageFines && (
                <button className={btnPrimary} onClick={handleCreateFine}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Fine
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Fines', value: stats.total, tone: 'text-blue-400', hint: 'All fine records' },
            { label: 'Pending', value: stats.pending, tone: 'text-yellow-400', hint: 'Awaiting payment' },
            { label: 'Collected', value: `₹${stats.collectedAmount.toLocaleString()}`, tone: 'text-emerald-400', hint: 'Total collected' },
            { label: 'Pending Amount', value: `₹${stats.pendingAmount.toLocaleString()}`, tone: 'text-rose-400', hint: 'Outstanding amount' },
          ].map((item) => (
            <div key={item.label} className={`${card} p-5`}>
              <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</div>
              <div className={`mt-3 text-3xl font-bold ${item.tone}`}>{item.value}</div>
              <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.hint}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab('fines')} 
            className={activeTab === 'fines' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 px-4 py-2.5 rounded-xl text-sm font-medium' : btnSecondary}
          >
            <FileText className="w-4 h-4 mr-2" />
            Fines ({stats.total})
          </button>
          <button 
            onClick={() => setActiveTab('waiver-requests')} 
            className={activeTab === 'waiver-requests' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 px-4 py-2.5 rounded-xl text-sm font-medium' : btnSecondary}
          >
            <Ban className="w-4 h-4 mr-2" />
            Waiver Requests ({pendingWaiverCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                {pendingWaiverCount > 99 ? '99+' : pendingWaiverCount}
              </span>
            )})
          </button>
        </div>

        {/* Search and Filters */}
        <div className={`${card} p-6`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder={activeTab === 'fines' ? "Search fines by student name, admission number, or fine number..." : "Search waiver requests..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${input} pl-10`}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={input}>
                <option value="all">All Status</option>
                {activeTab === 'fines' ? (
                  <>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="waived">Waived</option>
                  </>
                ) : (
                  <>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </>
                )}
              </select>
              
              {activeTab === 'fines' && (
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={input}>
                  <option value="all">All Types</option>
                  <option value="late_fee">Late Fee</option>
                  <option value="library">Library</option>
                  <option value="uniform">Uniform</option>
                  <option value="discipline">Discipline</option>
                  <option value="damage">Damage</option>
                  <option value="other">Other</option>
                </select>
              )}
              
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className={`${btnSecondary} flex items-center gap-2`}
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showBulkActions && (
                  <div className={`absolute right-0 top-full mt-1 ${card} p-2 min-w-[150px] z-10`}>
                    <button
                      onClick={() => {
                        handleExport('excel');
                        setShowBulkActions(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={() => {
                        handleExport('csv');
                        setShowBulkActions(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        handleExport('pdf');
                        setShowBulkActions(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
                    >
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar - Always visible when there are fines */}
        {fines.length > 0 && (
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedFines.length > 0 
                    ? `${selectedFines.length} fine${selectedFines.length > 1 ? 's' : ''} selected`
                    : 'Select fines to perform bulk actions'
                  }
                </span>
                <button
                  onClick={handleSelectAll}
                  className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {selectedFines.length === fines.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedFines.length > 0 ? (
                  <>
                    {activeTab === 'fines' && (
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className={`${btnDanger} text-xs`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete Selected ({selectedFines.length})
                      </button>
                    )}
                    
                    {activeTab === 'waiver-requests' && (
                      <>
                        <button
                          onClick={() => handleBulkAction('approve')}
                          className={`${btnPrimary} text-xs`}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve Selected ({selectedFines.length})
                        </button>
                        <button
                          onClick={() => handleBulkAction('reject')}
                          className={`${btnDanger} text-xs`}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject Selected ({selectedFines.length})
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handleExport('excel')}
                      className={`${btnSecondary} text-xs`}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export Selected ({selectedFines.length})
                    </button>
                  </>
                ) : (
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} italic`}>
                    Select fines using checkboxes to enable bulk actions
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fines Tab */}
        {activeTab === 'fines' && (
          <div className={`${card} overflow-hidden`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading fines...</span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Please wait while we fetch the latest data</span>
              </div>
            ) : fines.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>No fines found</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                  {search ? 'Try adjusting your search criteria' : 'Create your first fine to get started'}
                </p>
                {!search && canManageFines && (
                  <div className="flex gap-3 justify-center">
                    <button className={btnPrimary + ' px-6 py-3'} onClick={handleCreateFine}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Fine
                    </button>
                    <button 
                      className={`${btnSecondary} px-6 py-3`}
                      onClick={() => {
                        // Create sample fines for demo
                        const sampleFines = [
                          { studentId: '1', type: 'late_fee', amount: 500, description: 'Late submission of assignment' },
                          { studentId: '2', type: 'library', amount: 200, description: 'Library book return delay' },
                          { studentId: '3', type: 'uniform', amount: 1000, description: 'Uniform violation' }
                        ];
                        console.log('Sample fines created for demo:', sampleFines);
                        showInfo('Demo Mode', 'Sample fines would be created here. Use "Create Fine" to add real fines.');
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Create Sample Fines (Demo)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSelectAll}
                            className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                              selectedFines.length === fines.length && fines.length > 0
                                ? isDark 
                                  ? 'bg-blue-600 border-blue-500 text-white' 
                                  : 'bg-blue-100 border-blue-500 text-blue-700'
                                : isDark 
                                  ? 'border-gray-600 hover:border-blue-500 text-gray-400' 
                                  : 'border-gray-300 hover:border-blue-500 text-gray-600'
                            }`}
                          >
                            {selectedFines.length === fines.length && fines.length > 0 ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <span className="text-xs font-medium">Select All</span>
                        </div>
                      </th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Student</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fine Details</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Amount</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Due Date</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fines.map((fine) => (
                      <tr key={fine.id} className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} hover:${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} transition-colors`}>
                        <td className="p-4">
                          <button
                            onClick={() => handleSelectFine(fine.id)}
                            className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                              selectedFines.includes(fine.id)
                                ? isDark 
                                  ? 'bg-blue-600 border-blue-500 text-white' 
                                  : 'bg-blue-100 border-blue-500 text-blue-700'
                                : isDark 
                                  ? 'border-gray-600 hover:border-blue-500 text-gray-400' 
                                  : 'border-gray-300 hover:border-blue-500 text-gray-600'
                            }`}
                          >
                            {selectedFines.includes(fine.id) ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {fine.student?.name || 'Unknown Student'}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {fine.student?.admissionNo || 'N/A'} • {fine.student?.class || 'N/A'} - {fine.student?.section || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {fine.fineNumber}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {fine.type} • {fine.category}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} truncate max-w-xs`}>
                              {fine.description}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            ₹{fine.amount?.toLocaleString() || 0}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Paid: ₹{fine.paidAmount?.toLocaleString() || 0}
                          </div>
                          {fine.waivedAmount > 0 && (
                            <div className="text-sm text-purple-600">
                              Waived: ₹{fine.waivedAmount?.toLocaleString() || 0}
                            </div>
                          )}
                          <div className="text-sm font-medium text-yellow-600">
                            Pending: ₹{fine.pendingAmount?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fine.status)}`}>
                            {fine.status === 'pending' && <Clock className="w-3 h-3" />}
                            {fine.status === 'partial' && <AlertCircle className="w-3 h-3" />}
                            {fine.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                            {fine.status === 'waived' && <Ban className="w-3 h-3" />}
                            {fine.status?.charAt(0)?.toUpperCase() + fine.status?.slice(1)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {fine.dueDate ? new Date(fine.dueDate).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {fine.dueDate && new Date(fine.dueDate) < new Date() && (
                              <span className="text-red-600">Overdue</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <button 
                              className={`p-2 ${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} hover:${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg transition-colors`} 
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className={`p-2 ${isDark ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-600'} hover:${isDark ? 'bg-green-900/20' : 'bg-green-50'} rounded-lg transition-colors`} 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {(fine.status === 'pending' || fine.status === 'partial') && fine.pendingAmount > 0 && (
                              <button 
                                className={`p-2 ${isDark ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'} hover:${isDark ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg transition-colors`} 
                                title="Request Waiver"
                                onClick={() => handleRequestWaiver(fine)}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              className={`p-2 ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'} hover:${isDark ? 'bg-red-900/20' : 'bg-red-50'} rounded-lg transition-colors`} 
                              title="Delete"
                              onClick={() => handleDeleteFine(fine.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'waiver-requests' && (
          <div className={`${card} overflow-hidden`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading waiver requests...</span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Please wait while we fetch the latest data</span>
              </div>
            ) : waiverRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ban className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>No waiver requests found</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {search ? 'Try adjusting your search criteria' : 'No waiver requests have been submitted yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Student</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fine Details</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Waiver Amount</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reason</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Requested</th>
                      <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waiverRequests.map((request) => (
                      <tr key={request.id} className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} hover:${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} transition-colors`}>
                        <td className="p-4">
                          <div>
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {request.fine?.student?.name || 'Unknown Student'}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {request.fine?.student?.admissionNo || 'N/A'} • {request.fine?.student?.class || 'N/A'} - {request.fine?.student?.section || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {request.fine?.fineNumber || 'N/A'}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {request.fine?.type || 'N/A'} • {request.fine?.category || 'N/A'}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} truncate max-w-xs`}>
                              {request.fine?.description || 'No description'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            ₹{request.waiveAmount ? request.waiveAmount.toLocaleString() : '0'}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            of ₹{request.fine?.amount ? request.fine.amount.toLocaleString() : '0'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'} max-w-xs truncate`} title={request.reason}>
                            {request.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {request.status === 'pending' && <Clock className="w-3 h-3" />}
                            {request.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                            {request.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {request.status?.charAt(0)?.toUpperCase() + request.status?.slice(1)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {request.createdAt ? new Date(request.createdAt).toLocaleTimeString() : 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              className={`p-2 ${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} hover:${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg transition-colors`} 
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {request.status === 'pending' && canApproveWaivers && (
                              <>
                                <button 
                                  className={`p-2 ${isDark ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-600'} hover:${isDark ? 'bg-green-900/20' : 'bg-green-50'} rounded-lg transition-colors`} 
                                  title="Approve"
                                  onClick={() => handleApproveWaiver(request.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button 
                                  className={`p-2 ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'} hover:${isDark ? 'bg-red-900/20' : 'bg-red-50'} rounded-lg transition-colors`} 
                                  title="Reject"
                                  onClick={() => handleRejectWaiver(request.id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pagination - Always show page info and size selector */}
        <div className={`${card} p-4 mt-4`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                {pagination.total.toLocaleString()} {activeTab === 'fines' ? 'fines' : 'requests'}
              </span>
              {pagination.totalPages <= 1 && (
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  (Page {pagination.page} of {pagination.totalPages})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className={`${input} w-auto`}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      pagination.hasPrev
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className={`px-3 py-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      pagination.hasNext
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Fine Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={card}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Create Fine
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className={`p-2 hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg transition-colors`}
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleCreateFormSubmit} className="p-6 space-y-4">
                  {/* Student Search */}
                  <div>
                    <label className={label}>Student *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search student by name or admission number..."
                        value={createForm.studentSearch}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, studentSearch: e.target.value }))}
                        className={input}
                        required
                      />
                      {studentSearchResults.length > 0 && (
                        <div className={`absolute top-full left-0 right-0 mt-1 ${card} border max-h-48 overflow-y-auto z-10`}>
                          {studentSearchResults.map((student) => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => handleStudentSelect(student)}
                              className={`w-full text-left p-3 hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'} last:border-b-0 transition-colors`}
                            >
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {student.name}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {student.admissionNo || student.rollNo || 'N/A'} • {student.class || 'N/A'} - {student.section || 'N/A'}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fine Type */}
                  <div>
                    <label className={label}>Fine Type *</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                      className={input}
                      required
                    >
                      <option value="late_fee">Late Fee</option>
                      <option value="library">Library</option>
                      <option value="damage">Damage</option>
                      <option value="discipline">Discipline</option>
                      <option value="uniform">Uniform</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className={label}>Category *</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                      className={input}
                      required
                    >
                      <option value="academic">Academic</option>
                      <option value="property">Property</option>
                      <option value="behavior">Behavior</option>
                      <option value="uniform">Uniform</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className={label}>Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={createForm.amount}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, amount: e.target.value }))}
                      className={input}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className={label}>Due Date *</label>
                    <input
                      type="date"
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className={input}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={label}>Description *</label>
                    <textarea
                      placeholder="Enter fine description..."
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      className={`${input} resize-none`}
                      rows={3}
                      required
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className={btnPrimary}
                    >
                      {createLoading ? 'Creating...' : 'Create Fine'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiver Request Modal */}
      <AnimatePresence>
        {showWaiverModal && selectedFineForWaiver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWaiverModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={card}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Request Waiver
                    </h2>
                    <button
                      onClick={() => setShowWaiverModal(false)}
                      className={`p-2 hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg transition-colors`}
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleWaiverFormSubmit} className="p-6 space-y-4">
                  {/* Fine Details */}
                  <div>
                    <label className={label}>Fine Details</label>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Fine Number:</strong> {selectedFineForWaiver.fineNumber}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Student:</strong> {selectedFineForWaiver.student?.name}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Total Amount:</strong> ₹{selectedFineForWaiver.amount?.toLocaleString() || 0}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Pending Amount:</strong> ₹{selectedFineForWaiver.pendingAmount?.toLocaleString() || 0}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Description:</strong> {selectedFineForWaiver.description}
                      </p>
                    </div>
                  </div>

                  {/* Waiver Amount */}
                  <div>
                    <label className={label}>Waiver Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="Enter waiver amount"
                      value={waiverForm.waiveAmount}
                      onChange={(e) => setWaiverForm(prev => ({ ...prev, waiveAmount: e.target.value }))}
                      className={input}
                      min="1"
                      max={selectedFineForWaiver.pendingAmount}
                      step="0.01"
                      required
                    />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      Maximum: ₹{selectedFineForWaiver.pendingAmount?.toLocaleString() || 0}
                    </p>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className={label}>Reason for Waiver *</label>
                    <textarea
                      placeholder="Explain why you're requesting this waiver..."
                      value={waiverForm.reason}
                      onChange={(e) => setWaiverForm(prev => ({ ...prev, reason: e.target.value }))}
                      className={`${input} resize-none`}
                      rows={3}
                      required
                    />
                  </div>

                  {/* Additional Remarks */}
                  <div>
                    <label className={label}>Additional Remarks</label>
                    <textarea
                      placeholder="Any additional information (optional)"
                      value={waiverForm.remarks}
                      onChange={(e) => setWaiverForm(prev => ({ ...prev, remarks: e.target.value }))}
                      className={`${input} resize-none`}
                      rows={2}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowWaiverModal(false)}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={waiverLoading}
                      className={btnPrimary}
                    >
                      {waiverLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`${card} w-full max-w-md`}
            >
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Confirm Bulk Action
                </h3>
              </div>
              
              <div className="p-6">
                <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    You are about to perform the following action on <strong>{selectedFines.length}</strong> fine{selectedFines.length > 1 ? 's' : ''}:
                  </p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {bulkAction === 'delete' && 'Delete selected fines'}
                    {bulkAction === 'approve' && 'Approve selected waiver requests'}
                    {bulkAction === 'reject' && 'Reject selected waiver requests'}
                    {bulkAction === 'export' && 'Export selected fines'}
                  </p>
                </div>

                {bulkAction === 'reject' && (
                  <div className="mb-4">
                    <label className={label}>Rejection Reason</label>
                    <textarea
                      placeholder="Provide reason for rejection..."
                      value={bulkRemarks}
                      onChange={(e) => setBulkRemarks(e.target.value)}
                      className={`${input} resize-none`}
                      rows={3}
                    />
                  </div>
                )}

                {bulkAction === 'delete' && (
                  <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-red-900/20 border-red-600/30' : 'bg-red-50 border-red-200'} border`}>
                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      <strong>Warning:</strong> This action cannot be undone. All selected fines will be permanently deleted.
                    </p>
                  </div>
                )}
              </div>
              
              <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex gap-3`}>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className={btnSecondary}
                  disabled={bulkLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkExecute}
                  disabled={bulkLoading}
                  className={btnPrimary}
                >
                  {bulkLoading ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Real-time Notifications */}
      <RealTimeNotifications
        notifications={notifications}
        onClear={clearNotifications}
        onMarkAsRead={markAsRead}
        onRemove={removeNotification}
        theme={theme}
      />
    </AppLayout>
  );
}
