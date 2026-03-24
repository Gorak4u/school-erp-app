'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  RefreshCw, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  User,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  Ban,
  Bell
} from 'lucide-react';

// Types
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
  sourceType: string;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    class: string;
    section: string;
    rollNo: string;
  };
  rule?: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    receiptNumber: string;
    createdAt: string;
  }>;
  waiverRequests: Array<{
    id: string;
    status: string;
    requestedBy: string;
    createdAt: string;
  }>;
}

interface FineSummary {
  [status: string]: {
    count: number;
    amount: number;
    paidAmount: number;
    waivedAmount: number;
    pendingAmount: number;
  };
}

export default function FinesPage() {
  const { theme } = useTheme();
  const [fines, setFines] = useState<Fine[]>([]);
  const [summary, setSummary] = useState<FineSummary>({});
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFines, setSelectedFines] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  
  // Student search state for create fine modal
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Create fine form state
  const [createFineForm, setCreateFineForm] = useState({
    type: '',
    category: '',
    amount: '',
    description: '',
    dueDate: ''
  });

  // CSS Variables based on theme
  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;
  const row = `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;
  const tile = `p-3 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${isDark ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'}`;
  const tileSelected = `p-3 rounded-lg border-2 transition-all cursor-pointer ring-2 ring-blue-200 border-blue-500`;

  // Debounced filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFines();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, selectedStatus, selectedType, selectedCategory]);

  const fetchFines = async () => {
    try {
      // Show loading for initial load, search, or filtering
      const isInitialLoad = !fines.length;
      const isSearchOperation = search.length > 0;
      
      if (isInitialLoad) {
        setLoading(true);
      } else if (isSearchOperation) {
        setIsSearching(true);
      } else {
        setFiltering(true);
      }
      
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });

      const response = await fetch(`/api/fines?${params}`);
      const data = await response.json();

      if (data.success) {
        setFines(data.fines);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch fines:', error);
    } finally {
      setLoading(false);
      setFiltering(false);
      setIsSearching(false);
    }
  };

  // Student search functionality
  useEffect(() => {
    if (studentSearchTerm.trim() === '') {
      setStudentSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchStudents(studentSearchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [studentSearchTerm]);

  const searchStudents = async (query: string) => {
    if (query.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }

    setIsSearchingStudent(true);
    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(query)}&pageSize=50`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        // Filter out alumni students
        const filteredStudents = (data.students || []).filter((student: any) => {
          const status = student.status?.toLowerCase();
          // Alumni statuses that should not receive fines
          const alumniStatuses = ['graduated', 'transferred', 'exit', 'exited', 'suspended', 'alumni'];
          return !alumniStatuses.includes(status);
        });
        setStudentSearchResults(filteredStudents);
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

  const handleCreateFine = async () => {
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    if (!createFineForm.type || !createFineForm.category || !createFineForm.amount || !createFineForm.description) {
      alert('Please fill all required fields: Student, Type, Category, Amount, and Description');
      return;
    }

    try {
      const response = await fetch('/api/fines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          type: createFineForm.type,
          category: createFineForm.category,
          amount: parseFloat(createFineForm.amount),
          description: createFineForm.description || 'Manual fine entry', // Ensure description is never empty
          dueDate: createFineForm.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        resetCreateFineForm();
        setShowCreateModal(false);
        
        // Refresh fines list
        fetchFines();
        
        alert('Fine created successfully!');
      } else {
        alert(data.error || 'Failed to create fine');
      }
    } catch (error) {
      console.error('Failed to create fine:', error);
      alert('Failed to create fine');
    }
  };

  const resetCreateFineForm = () => {
    setSelectedStudent(null);
    setStudentSearchTerm('');
    setStudentSearchResults([]);
    setCreateFineForm({
      type: '',
      category: '',
      amount: '',
      description: '',
      dueDate: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'partial': return 'text-blue-600 bg-blue-100';
      case 'paid': return 'text-green-600 bg-green-100';
      case 'waived': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'partial': return <AlertCircle className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'waived': return <Ban className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handlePayment = (fine: Fine) => {
    setSelectedFine(fine);
    setShowPaymentModal(true);
  };

  const handleWaiver = (fine: Fine) => {
    setSelectedFine(fine);
    setShowWaiverModal(true);
  };

  const toggleFineSelection = (fineId: string) => {
    setSelectedFines(prev => 
      prev.includes(fineId) 
        ? prev.filter(id => id !== fineId)
        : [...prev, fineId]
    );
  };

  const toggleAllFines = () => {
    if (selectedFines.length === fines.length) {
      setSelectedFines([]);
    } else {
      setSelectedFines(fines.map(fine => fine.id));
    }
  };

  const totalStats = {
    total: Object.values(summary).reduce((sum, s) => sum + s.count, 0),
    totalAmount: Object.values(summary).reduce((sum, s) => sum + s.amount, 0),
    totalPaid: Object.values(summary).reduce((sum, s) => sum + s.paidAmount, 0),
    totalPending: Object.values(summary).reduce((sum, s) => sum + s.pendingAmount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AppLayout currentPage="fines" title="Fine Management">
      <div className="space-y-6 pb-8">
        <div className={`${card} p-6 md:p-8`}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Fine Management • School operations hub
              </div>
              <h1 className={`mt-4 text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Fine Management</h1>
              <p className={`mt-3 text-sm md:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage student fines, payments, and waivers with automated fine rules and comprehensive tracking.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full xl:w-auto">
              <button className={btnPrimary} onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Fine
              </button>
              <button className={btnSecondary} onClick={() => fetchFines()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fines</span>
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalStats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ₹{totalStats.totalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</span>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.pending?.count || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ₹{summary.pending?.pendingAmount?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.paid?.count || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ₹{summary.paid?.paidAmount?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Waived</span>
                <Ban className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.waived?.count || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ₹{summary.waived?.waivedAmount?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={card}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search fines..."
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

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={btnSecondary}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>

            {selectedFines.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    {selectedFines.length} fines selected
                  </span>
                  <div className="flex gap-2">
                    <button className={btnSecondary}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                    <button className={btnDanger}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fines Table */}
      <div className={card}>
        {(filtering || isSearching) && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">
                {isSearching ? 'Searching...' : 'Updating filters...'}
              </span>
            </div>
          </div>
        )}
        <div className={`overflow-x-auto ${filtering || isSearching ? 'opacity-50' : ''}`}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFines.length === fines.length && fines.length > 0}
                    onChange={toggleAllFines}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fine Details
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Student
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {fines.map((fine) => (
                  <motion.tr
                    key={fine.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedFines.includes(fine.id)}
                        onChange={() => toggleFineSelection(fine.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {fine.fineNumber}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {fine.description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {fine.type} • {fine.category}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {fine.student.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {fine.student.admissionNo} • {fine.student.class}-{fine.student.section}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          ₹{fine.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Paid: ₹{fine.paidAmount.toLocaleString()}
                        </div>
                        {fine.waivedAmount > 0 && (
                          <div className="text-sm text-purple-600 dark:text-purple-400">
                            Waived: ₹{fine.waivedAmount.toLocaleString()}
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Pending: ₹{fine.pendingAmount.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fine.status)}`}>
                        {getStatusIcon(fine.status)}
                        {fine.status.charAt(0).toUpperCase() + fine.status.slice(1)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(fine.dueDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(fine.dueDate).toLocaleDateString('en-US', { 
                          weekday: 'short' 
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedFine(fine)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {fine.status !== 'paid' && fine.status !== 'waived' && (
                          <>
                            <button
                              onClick={() => handlePayment(fine)}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleWaiver(fine)}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                              title="Request Waiver"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
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
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={card}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Create New Fine
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className={label}>Student</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className={input} 
                          placeholder="Search student by name or admission number..."
                          value={studentSearchTerm}
                          onChange={(e) => {
                            setStudentSearchTerm(e.target.value);
                            if (e.target.value === '') {
                              setSelectedStudent(null);
                            }
                          }}
                        />
                        {isSearchingStudent && (
                          <div className="absolute right-3 top-3">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Student search results dropdown */}
                      {studentSearchResults.length > 0 && (
                        <div className={`absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          {studentSearchResults.map((student) => (
                            <div
                              key={student.id}
                              className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                              onClick={() => {
                                setSelectedStudent(student);
                                setStudentSearchTerm(`${student.name} (${student.admissionNo})`);
                                setStudentSearchResults([]);
                              }}
                            >
                              <div className="font-medium text-sm">{student.name}</div>
                              <div className="text-xs text-gray-500">{student.admissionNo} • {student.class} - {student.section}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Selected student display */}
                      {selectedStudent && (
                        <div className={`mt-2 p-2 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{selectedStudent.name}</div>
                              <div className="text-xs text-gray-500">{selectedStudent.admissionNo} • {selectedStudent.class} - {selectedStudent.section}</div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedStudent(null);
                                setStudentSearchTerm('');
                              }}
                              className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20`}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={label}>Fine Type</label>
                      <select 
                        className={input}
                        value={createFineForm.type}
                        onChange={(e) => setCreateFineForm(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="">Select type...</option>
                        <option value="late_fee">Late Fee</option>
                        <option value="library">Library</option>
                        <option value="damage">Damage</option>
                        <option value="discipline">Discipline</option>
                        <option value="uniform">Uniform</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={label}>Category</label>
                      <select 
                        className={input}
                        value={createFineForm.category}
                        onChange={(e) => setCreateFineForm(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="">Select category...</option>
                        <option value="academic">Academic</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="property">Property</option>
                        <option value="administrative">Administrative</option>
                      </select>
                    </div>
                    <div>
                      <label className={label}>Amount</label>
                      <input 
                        type="number" 
                        className={input} 
                        placeholder="0.00"
                        value={createFineForm.amount}
                        onChange={(e) => setCreateFineForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={label}>Due Date</label>
                      <input 
                        type="date" 
                        className={input}
                        value={createFineForm.dueDate}
                        onChange={(e) => setCreateFineForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={label}>Fine Rule (Optional)</label>
                      <select className={input}>
                        <option value="">Select rule...</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={label}>Description *</label>
                      <textarea 
                        className={input}
                        rows={3}
                        placeholder="Enter fine description..."
                        value={createFineForm.description}
                        onChange={(e) => setCreateFineForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        resetCreateFineForm();
                        setShowCreateModal(false);
                      }}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateFine}
                      className={btnPrimary}
                    >
                      Create Fine
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedFine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowPaymentModal(false)}
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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Record Payment
                    </h2>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fine</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedFine.fineNumber} - {selectedFine.description}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Student</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedFine.student.name}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending Amount</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{selectedFine.pendingAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={label}>Payment Amount</label>
                      <input 
                        type="number" 
                        className={input} 
                        placeholder="0.00"
                        max={selectedFine.pendingAmount}
                      />
                    </div>
                    <div>
                      <label className={label}>Payment Method</label>
                      <select className={input}>
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="cheque">Cheque</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label className={label}>Remarks (Optional)</label>
                      <textarea 
                        className={input} 
                        rows={2}
                        placeholder="Add payment notes..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      className={btnPrimary}
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiver Modal */}
      <AnimatePresence>
        {showWaiverModal && selectedFine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Request Waiver
                    </h2>
                    <button
                      onClick={() => setShowWaiverModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fine</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedFine.fineNumber} - {selectedFine.description}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Student</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedFine.student.name}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending Amount</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{selectedFine.pendingAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={label}>Waiver Amount</label>
                      <input 
                        type="number" 
                        className={input} 
                        placeholder="0.00"
                        max={selectedFine.pendingAmount}
                      />
                    </div>
                    <div>
                      <label className={label}>Reason for Waiver</label>
                      <textarea 
                        className={input} 
                        rows={3}
                        placeholder="Explain why this fine should be waived..."
                        required
                      />
                    </div>
                    <div>
                      <label className={label}>Supporting Documents (Optional)</label>
                      <input 
                        type="file" 
                        className={input}
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowWaiverModal(false)}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      className={btnPrimary}
                    >
                      Submit Request
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
