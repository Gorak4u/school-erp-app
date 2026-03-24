'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from 'next-auth/react';
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Ban,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { canManageFinesAccess, canApproveFineRequestsAccess } from '@/lib/permissions';

interface Fine {
  id: string;
  fineNumber: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  paidAmount: number;
  waivedAmount: number;
  pendingAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'waived';
  issuedAt: string;
  dueDate: string;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    class: string;
    section: string;
  };
}

export default function FinesPage() {
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFines, setSelectedFines] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'fines' | 'waiver-requests'>('fines');
  const [pendingWaiverCount, setPendingWaiverCount] = useState(0);
  
  // Permission checks
  const canManageFines = canManageFinesAccess({
    role: session?.user?.role,
    isSuperAdmin: session?.user?.isSuperAdmin,
    permissions: session?.user?.permissions
  });
  
  const canApproveWaivers = canApproveFineRequestsAccess({
    role: session?.user?.role,
    isSuperAdmin: session?.user?.isSuperAdmin,
    permissions: session?.user?.permissions
  });
  
  // Create fine form state
  const [createFineForm, setCreateFineForm] = useState({
    type: '',
    category: '',
    amount: '',
    description: '',
    dueDate: '',
    studentId: '',
    studentSearch: ''
  });
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [submittingFine, setSubmittingFine] = useState(false);
  
  // Bulk operations state
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [processingBulk, setProcessingBulk] = useState(false);
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Waiver requests state
  const [waiverRequests, setWaiverRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Request waiver state
  const [showRequestWaiverModal, setShowRequestWaiverModal] = useState(false);
  const [selectedFineForWaiver, setSelectedFineForWaiver] = useState<any>(null);
  const [waiverRequestForm, setWaiverRequestForm] = useState({
    reason: '',
    remarks: '',
    waiveAmount: '',
    waiverType: 'full' as 'full' | 'partial',
    documents: [] as File[]
  });
  const [submittingWaiverRequest, setSubmittingWaiverRequest] = useState(false);

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const isDark = theme === 'dark';
  
  // Modern color scheme
  const colors = {
    primary: isDark ? '#3b82f6' : '#2563eb',
    secondary: isDark ? '#6b7280' : '#6b7280',
    success: isDark ? '#10b981' : '#059669',
    warning: isDark ? '#f59e0b' : '#d97706',
    danger: isDark ? '#ef4444' : '#dc2626',
    purple: isDark ? '#8b5cf6' : '#7c3aed',
    background: isDark ? '#1f2937' : '#ffffff',
    surface: isDark ? '#374151' : '#f9fafb',
    border: isDark ? '#4b5563' : '#e5e7eb',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#d1d5db' : '#6b7280'
  };

  const card = `rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm`;
  const input = `px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`;
  const btnPrimary = `px-4 py-2 rounded-lg font-medium transition-all ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const btnSecondary = `px-4 py-2 rounded-lg font-medium border transition-all ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-4 py-2 rounded-lg font-medium transition-all ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`;

  // Better contrast colors for light mode - much darker
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-700';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-800';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';

  useEffect(() => {
    if (activeTab === 'fines') {
      fetchFines();
    } else if (activeTab === 'waiver-requests') {
      fetchWaiverRequests();
    }
    fetchPendingWaiverCount();
  }, [activeTab, search, selectedStatus, selectedType, selectedCategory, pagination.page]);

  // Fetch waiver requests
  const fetchWaiverRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(search && { search })
      });

      const response = await fetch(`/api/fines/waiver-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setWaiverRequests(data.waiverRequests || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Failed to fetch waiver requests:', error);
      showToast('Failed to load waiver requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle approve waiver request
  const handleApprove = async (requestId: string) => {
    if (!canApproveWaivers) {
      showToast('You do not have permission to approve waiver requests', 'error');
      return;
    }

    if (!confirm('Are you sure you want to approve this waiver request?')) {
      return;
    }

    setProcessing(requestId);
    try {
      const response = await fetch(`/api/fines/waiver-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          remarks: 'Approved by admin'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }

      showToast('Waiver request approved successfully!', 'success');
      fetchWaiverRequests();
      fetchPendingWaiverCount();
    } catch (err: any) {
      showToast(`Error approving request: ${err.message}`, 'error');
    } finally {
      setProcessing(null);
    }
  };

  // Handle reject waiver request
  const handleReject = async (requestId: string) => {
    if (!canApproveWaivers) {
      showToast('You do not have permission to reject waiver requests', 'error');
      return;
    }

    const remarks = prompt('Reason for rejection (optional):');
    if (remarks === null) return; // User cancelled

    setProcessing(requestId);
    try {
      const response = await fetch(`/api/fines/waiver-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          remarks: remarks || 'Rejected by admin'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject request');
      }

      showToast('Waiver request rejected successfully!', 'success');
      fetchWaiverRequests();
      fetchPendingWaiverCount();
    } catch (err: any) {
      showToast(`Error rejecting request: ${err.message}`, 'error');
    } finally {
      setProcessing(null);
    }
  };

  // Handle request waiver
  const handleRequestWaiver = (fine: any) => {
    setSelectedFineForWaiver(fine);
    setShowRequestWaiverModal(true);
  };

  // Handle submit waiver request
  const handleSubmitWaiverRequest = async () => {
    if (!selectedFineForWaiver || !waiverRequestForm.reason.trim()) {
      showToast('Please provide a reason for the waiver request', 'error');
      return;
    }

    // Validate waive amount for partial waivers
    let waiveAmount = selectedFineForWaiver.pendingAmount;
    if (waiverRequestForm.waiverType === 'partial') {
      const amount = parseFloat(waiverRequestForm.waiveAmount);
      if (isNaN(amount) || amount <= 0 || amount > selectedFineForWaiver.pendingAmount) {
        showToast(`Please enter a valid amount between ₹1 and ₹${selectedFineForWaiver.pendingAmount}`, 'error');
        return;
      }
      waiveAmount = amount;
    }

    setSubmittingWaiverRequest(true);
    try {
      const response = await fetch('/api/fines/waiver-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fineId: selectedFineForWaiver.id,
          reason: waiverRequestForm.reason,
          remarks: waiverRequestForm.remarks,
          documents: waiverRequestForm.documents.map(f => f.name),
          waiveAmount: waiveAmount
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit waiver request');
      }

      const waiverTypeText = waiverRequestForm.waiverType === 'partial' 
        ? `partial waiver of ₹${waiveAmount.toLocaleString()}` 
        : 'full waiver';
      
      showToast(`Waiver request for ${waiverTypeText} submitted successfully!`, 'success');
      setShowRequestWaiverModal(false);
      setWaiverRequestForm({ 
        reason: '', 
        remarks: '', 
        waiveAmount: '', 
        waiverType: 'full', 
        documents: [] 
      });
      
      // Refresh fines data
      fetchFines();
    } catch (err: any) {
      showToast(`Error submitting waiver request: ${err.message}`, 'error');
    } finally {
      setSubmittingWaiverRequest(false);
    }
  };

  const fetchFines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(search && { search })
      });

      const response = await fetch(`/api/fines?${params}`);
      const data = await response.json();

      if (data.success) {
        setFines(data.fines || []);
        setPagination(data.pagination || {
          page: 1,
          pageSize: 25,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        throw new Error(data.error || 'Failed to fetch fines');
      }
    } catch (error) {
      console.error('Failed to fetch fines:', error);
      setFines([]);
      showToast('Failed to load fines. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingWaiverCount = async () => {
    try {
      const response = await fetch('/api/fines/waiver-requests?status=pending&pageSize=1');
      const data = await response.json();
      if (data.success) {
        setPendingWaiverCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch pending waiver count:', error);
    }
  };

  const handleCreateFine = async () => {
    if (!selectedStudent || !createFineForm.type || !createFineForm.amount || !createFineForm.description) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    setSubmittingFine(true);
    try {
      const response = await fetch('/api/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          type: createFineForm.type,
          category: createFineForm.category,
          amount: parseFloat(createFineForm.amount),
          description: createFineForm.description,
          dueDate: createFineForm.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create fine');
      }

      const result = await response.json();
      showToast('Fine created successfully!', 'success');
      setShowCreateModal(false);
      setCreateFineForm({
        type: '',
        category: '',
        amount: '',
        description: '',
        dueDate: '',
        studentId: '',
        studentSearch: ''
      });
      setSelectedStudent(null);
      fetchFines();
    } catch (err: any) {
      showToast(`Error creating fine: ${err.message}`, 'error');
    } finally {
      setSubmittingFine(false);
    }
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setStudentSearchResults([]);
      return;
    }

    setIsSearchingStudent(true);
    try {
      const response = await fetch(`/api/students?search=${query}&limit=10&pageSize=10`);
      const data = await response.json();
      console.log('Student search response:', data); // Debug log
      
      if (data.students && Array.isArray(data.students)) {
        setStudentSearchResults(data.students);
      } else {
        setStudentSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search students:', error);
      setStudentSearchResults([]);
    } finally {
      setIsSearchingStudent(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (createFineForm.studentSearch) {
        searchStudents(createFineForm.studentSearch);
      } else {
        setStudentSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [createFineForm.studentSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: Create new fine
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowCreateModal(true);
      }
      // Ctrl/Cmd + E: Export fines
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExportFines();
      }
      // Escape: Close modals
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setShowBulkActions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createFineForm.studentSearch]);

  // Bulk operations functions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedFines.length === 0) {
      showToast('Please select fines and an action', 'warning');
      return;
    }

    setProcessingBulk(true);
    try {
      let response;
      
      switch (bulkAction) {
        case 'delete':
          response = await fetch('/api/fines/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fineIds: selectedFines })
          });
          break;
        case 'waive':
          response = await fetch('/api/fines/bulk-waive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fineIds: selectedFines, 
              remarks: bulkRemarks 
            })
          });
          break;
        default:
          throw new Error('Invalid action');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform bulk action');
      }

      const result = await response.json();
      showToast(`Bulk ${bulkAction} completed successfully!`, 'success');
      setShowBulkActions(false);
      setBulkAction('');
      setBulkRemarks('');
      setSelectedFines([]);
      fetchFines();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleExportFines = async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(search && { search }),
        export: 'true'
      });

      const response = await fetch(`/api/fines/export?${params}`);
      if (!response.ok) throw new Error('Failed to export fines');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fines-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showToast('Failed to export fines', 'error');
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'partial': return <AlertCircle className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'waived': return <Ban className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const totalStats = fines.reduce(
    (acc, fine) => ({
      total: acc.total + fine.amount,
      paid: acc.paid + fine.paidAmount,
      waived: acc.waived + fine.waivedAmount,
      pending: acc.pending + fine.pendingAmount,
    }),
    { total: 0, paid: 0, waived: 0, pending: 0 }
  );

  return (
    <AppLayout currentPage="fines" title="Fines Management">
      <div className="space-y-6">
        {/* Header */}
        <div className={card}>
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  Fines Management
                </h1>
                <p className="text-gray-700 dark:text-gray-400">
                  Manage student fines, payments, and waiver requests
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {canManageFines && (
                  <button className={btnPrimary} onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Fine
                  </button>
                )}
                <button className={btnSecondary} onClick={() => fetchFines()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                <button 
                  onClick={() => setActiveTab('waiver-requests')}
                  className="px-4 py-2 rounded-lg font-medium transition-all bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center relative"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Waiver Requests
                  {pendingWaiverCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingWaiverCount > 99 ? '99+' : pendingWaiverCount}
                    </span>
                  )}
                </button>
                {selectedFines.length > 0 && canManageFines && (
                  <button 
                    onClick={() => setShowBulkActions(true)}
                    className="px-4 py-2 rounded-lg font-medium transition-all bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Bulk Actions ({selectedFines.length})
                  </button>
                )}
                <button className={btnSecondary} onClick={handleExportFines}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className={`text-sm ${textSecondary}`}>Total</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {fines.length}
                </div>
                <div className={`text-sm ${textSecondary}`}>
                  ₹{totalStats.total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <span className={`text-sm ${textSecondary}`}>Paid</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {fines.filter(f => f.status === 'paid').length}
                </div>
                <div className={`text-sm ${textSecondary}`}>
                  ₹{totalStats.paid.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className={`text-sm ${textSecondary}`}>Pending</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {fines.filter(f => f.status === 'pending' || f.status === 'partial').length}
                </div>
                <div className={`text-sm ${textSecondary}`}>
                  ₹{totalStats.pending.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Ban className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className={`text-sm ${textSecondary}`}>Waived</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {fines.filter(f => f.status === 'waived').length}
                </div>
                <div className={`text-sm ${textSecondary}`}>
                  ₹{totalStats.waived.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={card}>
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-700'} w-5 h-5`} />
                  <input
                    type="text"
                    placeholder="Search fines by student name, admission number, or fine number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`${input} pl-10`}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={input}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="waived">Waived</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className={input}
                >
                  <option value="all">All Types</option>
                  <option value="late_fee">Late Fee</option>
                  <option value="library">Library</option>
                  <option value="damage">Damage</option>
                  <option value="discipline">Discipline</option>
                  <option value="uniform">Uniform</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={input}
                >
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="property">Property</option>
                  <option value="administrative">Administrative</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={card}>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('fines')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'fines'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : `border-transparent ${textMuted} hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300`
                }`}
              >
                All Fines
              </button>
              <button
                onClick={() => setActiveTab('waiver-requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm relative transition-colors ${
                  activeTab === 'waiver-requests'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : `border-transparent ${textMuted} hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300`
                }`}
              >
                Waiver Requests
                {pendingWaiverCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingWaiverCount > 99 ? '99+' : pendingWaiverCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'fines' && (
          <div className="space-y-6">
            {/* Fines Table */}
            <div className={card}>
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span className={`text-lg ${textSecondary}`}>Loading fines...</span>
                  <span className={`text-sm ${textMuted} mt-2`}>
                    Please wait while we fetch the latest data
                  </span>
                </div>
              ) : fines.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">No fines found</h3>
                  <p className={`${textSecondary} mb-6`}>
                    {search ? 'Try adjusting your search criteria' : 'Create your first fine to get started'}
                  </p>
                  {!search && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className={btnPrimary + ' px-6 py-3'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Fine
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFines(fines.map(f => f.id));
                              } else {
                                setSelectedFines([]);
                              }
                            }}
                            checked={selectedFines.length === fines.length && fines.length > 0}
                          />
                        </th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Student</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Fine Details</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fines.map((fine: any) => (
                        <tr key={fine.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={selectedFines.includes(fine.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFines([...selectedFines, fine.id]);
                                } else {
                                  setSelectedFines(selectedFines.filter(id => id !== fine.id));
                                }
                              }}
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white">
                                {fine.student.name}
                              </div>
                              <div className={`text-sm ${textMuted}`}>
                                {fine.student.admissionNo} • {fine.student.class} - {fine.student.section}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white">
                                {fine.fineNumber}
                              </div>
                              <div className={`text-sm ${textMuted}`}>
                                {fine.type} • {fine.category}
                              </div>
                              <div className={`text-xs ${textSecondary} truncate max-w-xs`}>
                                {fine.description}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-800 dark:text-white">
                              ₹{fine.amount.toLocaleString()}
                            </div>
                            <div className={`text-sm ${textMuted}`}>
                              Paid: ₹{fine.paidAmount.toLocaleString()}
                            </div>
                            {fine.waivedAmount > 0 && (
                              <div className="text-sm text-purple-600">
                                Waived: ₹{fine.waivedAmount.toLocaleString()}
                              </div>
                            )}
                            <div className="text-sm font-medium text-yellow-600">
                              Pending: ₹{fine.pendingAmount.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fine.status)}`}>
                              {fine.status === 'pending' && <Clock className="w-3 h-3" />}
                              {fine.status === 'partial' && <AlertCircle className="w-3 h-3" />}
                              {fine.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                              {fine.status === 'waived' && <Ban className="w-3 h-3" />}
                              {fine.status.charAt(0).toUpperCase() + fine.status.slice(1)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-800 dark:text-white">
                              {new Date(fine.dueDate).toLocaleDateString()}
                            </div>
                            <div className={`text-xs ${textMuted}`}>
                              {fine.dueDate && new Date(fine.dueDate) < new Date() && (
                                <span className="text-red-600">Overdue</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <button
                                className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {fine.status === 'pending' && fine.pendingAmount > 0 && (
                                <button
                                  onClick={() => handleRequestWaiver(fine)}
                                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                  title="Request Waiver"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={card}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                      Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                      {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                      {pagination.total.toLocaleString()} fines
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={pagination.pageSize}
                      onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
                      className={`px-3 py-1 text-sm border rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                        disabled={!pagination.hasPrev}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          pagination.hasPrev
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        First
                      </button>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={!pagination.hasPrev}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          pagination.hasPrev
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <span className="px-3 py-1 text-sm">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={!pagination.hasNext}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          pagination.hasNext
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Next
                      </button>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                        disabled={!pagination.hasNext}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          pagination.hasNext
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Waiver Requests Tab */}
        {activeTab === 'waiver-requests' && (
          <div className="space-y-6">
            {/* Waiver Requests Table */}
            <div className={card}>
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span className={`text-lg ${textSecondary}`}>Loading waiver requests...</span>
                  <span className={`text-sm ${textMuted} mt-2`}>
                    Please wait while we fetch the latest data
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Student</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Fine Details</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Waiver Amount</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Reason</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Requested</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waiverRequests.map((request: any) => (
                        <tr key={request.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white">
                                {request.fine?.student?.name || 'Unknown Student'}
                              </div>
                              <div className={`text-sm ${textMuted}`}>
                                {request.fine?.student?.admissionNo || request.fine?.student?.rollNo || 'N/A'} • {request.fine?.student?.class || 'N/A'} - {request.fine?.student?.section || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white">
                                {request.fine?.fineNumber || 'N/A'}
                              </div>
                              <div className={`text-sm ${textMuted}`}>
                                {request.fine?.type || 'N/A'} • {request.fine?.category || 'N/A'}
                              </div>
                              <div className={`text-xs ${textSecondary} truncate max-w-xs`}>
                                {request.fine?.description || 'No description'}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-800 dark:text-white">
                              ₹{request.waiveAmount ? request.waiveAmount.toLocaleString() : '0'}
                            </div>
                            <div className={`text-sm ${textMuted}`}>
                              of ₹{request.fine?.amount ? request.fine.amount.toLocaleString() : '0'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-800 dark:text-white max-w-xs truncate" title={request.reason}>
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
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-800 dark:text-white">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDetailsModal(true);
                                }}
                                className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {request.status === 'pending' && canApproveWaivers && (
                                <>
                                  <button
                                    onClick={() => handleApprove(request.id)}
                                    disabled={processing === request.id}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    {processing === request.id ? (
                                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleReject(request.id)}
                                    disabled={processing === request.id}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    {processing === request.id ? (
                                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={card}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${textSecondary}`}>
                      Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                      {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                      {pagination.total.toLocaleString()} waiver requests
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={pagination.pageSize}
                      onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
                      className={`px-3 py-1 text-sm border rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                        disabled={!pagination.hasPrev}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          pagination.hasPrev
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        First
                      </button>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={!pagination.hasPrev}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          pagination.hasPrev
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <span className="px-3 py-1 text-sm">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={!pagination.hasNext}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          pagination.hasNext
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Next
                      </button>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                        disabled={!pagination.hasNext}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          pagination.hasNext
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}  
      </div>

      {/* Create Fine Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
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
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      Create Fine
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Student Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Student *
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search student by name or admission number..."
                        value={createFineForm.studentSearch}
                        onChange={(e) => setCreateFineForm(prev => ({ ...prev, studentSearch: e.target.value }))}
                        className={`pl-10 pr-4 py-2 w-full rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    
                    {/* Student Search Results */}
                    {studentSearchResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                        {studentSearchResults.map((student: any) => (
                          <button
                            key={student.id}
                            onClick={() => {
                              setSelectedStudent(student);
                              setCreateFineForm(prev => ({ 
                                ...prev, 
                                studentId: student.id,
                                studentSearch: `${student.name} (${student.admissionNo || student.rollNo || 'N/A'})`
                              }));
                              setStudentSearchResults([]);
                            }}
                            className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                          >
                            <div className="font-medium text-gray-800 dark:text-white">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.admissionNo || student.rollNo || 'N/A'} • {student.class || 'N/A'} - {student.section || 'N/A'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fine Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fine Type *
                    </label>
                    <select
                      value={createFineForm.type}
                      onChange={(e) => setCreateFineForm(prev => ({ ...prev, type: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select type</option>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={createFineForm.category}
                      onChange={(e) => setCreateFineForm(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select category</option>
                      <option value="academic">Academic</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="property">Property</option>
                      <option value="administrative">Administrative</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={createFineForm.amount}
                      onChange={(e) => setCreateFineForm(prev => ({ ...prev, amount: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      min="1"
                      step="0.01"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <textarea
                      placeholder="Describe the reason for this fine..."
                      value={createFineForm.description}
                      onChange={(e) => setCreateFineForm(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      rows={3}
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={createFineForm.dueDate}
                      onChange={(e) => setCreateFineForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={btnSecondary}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFine}
                    disabled={submittingFine || !selectedStudent || !createFineForm.type || !createFineForm.amount || !createFineForm.description}
                    className={btnPrimary}
                  >
                    {submittingFine ? 'Creating...' : 'Create Fine'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Modal */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowBulkActions(false)}
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
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      Bulk Actions ({selectedFines.length} fines)
                    </h2>
                    <button
                      onClick={() => setShowBulkActions(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Action *
                    </label>
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select action</option>
                      <option value="waive">Waive All</option>
                      <option value="delete">Delete All</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Remarks (Optional)
                    </label>
                    <textarea
                      placeholder="Add remarks for this bulk action..."
                      value={bulkRemarks}
                      onChange={(e) => setBulkRemarks(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      rows={3}
                    />
                  </div>

                  {bulkAction && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <div className="font-medium mb-1">Warning:</div>
                        <div>
                          {bulkAction === 'delete' 
                            ? 'This will permanently delete all selected fines. This action cannot be undone.'
                            : 'This will waive all selected fines. The pending amounts will be set to zero.'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setShowBulkActions(false)}
                    className={btnSecondary}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAction}
                    disabled={processingBulk || !bulkAction}
                    className={btnDanger}
                  >
                    {processingBulk ? 'Processing...' : `Confirm ${bulkAction}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiver Request Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={card}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      Waiver Request Details
                    </h2>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Student Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Student Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.student?.name || 'Unknown Student'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Admission No:</span>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.student?.admissionNo || selectedRequest.student?.rollNo || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Class:</span>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.student?.class || 'N/A'} - {selectedRequest.student?.section || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Requested By:</span>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.requesterName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Fine Details */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Fine Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Fine Number:</span>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.fine.fineNumber}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.fine.type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.fine.category}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Amount:</span>
                        <p className="font-medium text-gray-800 dark:text-white">₹{selectedRequest.fine.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Waiver Amount:</span>
                        <p className="font-medium text-gray-800 dark:text-white">₹{selectedRequest.waiveAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                        <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.fine.status}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                      <p className="font-medium text-gray-800 dark:text-white mt-1">{selectedRequest.fine.description}</p>
                    </div>
                  </div>

                  {/* Waiver Request Details */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Waiver Request</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Reason for Waiver:</span>
                        <p className="font-medium text-gray-800 dark:text-white mt-1">{selectedRequest.reason}</p>
                      </div>
                      {selectedRequest.remarks && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Additional Remarks:</span>
                          <p className="font-medium text-gray-800 dark:text-white mt-1">{selectedRequest.remarks}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Request Status:</span>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {selectedRequest.status === 'pending' && <Clock className="w-3 h-3" />}
                          {selectedRequest.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                          {selectedRequest.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Requested On:</span>
                        <p className="font-medium text-gray-800 dark:text-white mt-1">
                          {new Date(selectedRequest.createdAt).toLocaleDateString()} at {new Date(selectedRequest.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {selectedRequest.reviewedAt && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Reviewed On:</span>
                          <p className="font-medium text-gray-800 dark:text-white mt-1">
                            {new Date(selectedRequest.reviewedAt).toLocaleDateString()} at {new Date(selectedRequest.reviewedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className={btnSecondary}
                  >
                    Close
                  </button>
                  {selectedRequest.status === 'pending' && canApproveWaivers && (
                    <>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleApprove(selectedRequest.id);
                        }}
                        disabled={processing === selectedRequest.id}
                        className="px-4 py-2 rounded-lg font-medium transition-all bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processing === selectedRequest.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleReject(selectedRequest.id);
                        }}
                        disabled={processing === selectedRequest.id}
                        className={btnDanger}
                      >
                        {processing === selectedRequest.id ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Waiver Modal */}
      <AnimatePresence>
        {showRequestWaiverModal && selectedFineForWaiver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowRequestWaiverModal(false)}
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
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      Request Waiver
                    </h2>
                    <button
                      onClick={() => setShowRequestWaiverModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fine Details
                    </label>
                    <div className="text-sm text-gray-700 dark:text-gray-400">
                      <p>#{selectedFineForWaiver.fineNumber} - {selectedFineForWaiver.type}</p>
                      <p>Total Amount: ₹{selectedFineForWaiver.amount.toLocaleString()}</p>
                      <p>Pending Amount: ₹{selectedFineForWaiver.pendingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Waiver Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="waiverType"
                          value="full"
                          checked={waiverRequestForm.waiverType === 'full'}
                          onChange={(e) => setWaiverRequestForm(prev => ({ ...prev, waiverType: 'full' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Full Waiver - ₹{selectedFineForWaiver.pendingAmount.toLocaleString()}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="waiverType"
                          value="partial"
                          checked={waiverRequestForm.waiverType === 'partial'}
                          onChange={(e) => setWaiverRequestForm(prev => ({ ...prev, waiverType: 'partial' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Partial Waiver
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  {waiverRequestForm.waiverType === 'partial' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Waiver Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={waiverRequestForm.waiveAmount}
                          onChange={(e) => setWaiverRequestForm(prev => ({ ...prev, waiveAmount: e.target.value }))}
                          className={`w-full pl-8 pr-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter amount to waive"
                          min="1"
                          max={selectedFineForWaiver.pendingAmount}
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum: ₹{selectedFineForWaiver.pendingAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason for Waiver <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={waiverRequestForm.reason}
                      onChange={(e) => setWaiverRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      rows={3}
                      placeholder="Please explain why you need this fine to be waived..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Additional Remarks
                    </label>
                    <textarea
                      value={waiverRequestForm.remarks}
                      onChange={(e) => setWaiverRequestForm(prev => ({ ...prev, remarks: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      rows={2}
                      placeholder="Any additional information..."
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setShowRequestWaiverModal(false)}
                    className={btnSecondary}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitWaiverRequest}
                    disabled={submittingWaiverRequest || !waiverRequestForm.reason.trim() || (waiverRequestForm.waiverType === 'partial' && !waiverRequestForm.waiveAmount)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      submittingWaiverRequest || !waiverRequestForm.reason.trim() || (waiverRequestForm.waiverType === 'partial' && !waiverRequestForm.waiveAmount)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {submittingWaiverRequest ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-yellow-500 text-white'
            }`}>
              {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
