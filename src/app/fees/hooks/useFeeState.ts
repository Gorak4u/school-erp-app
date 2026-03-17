// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';
import { feeStructuresApi, feeRecordsApi, paymentsApi, discountsApi, studentsApi } from '@/lib/apiClient';

export function useFeeState() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all-students');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isClient, setIsClient] = useState(false);

  // State management
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [feeCollections, setFeeCollections] = useState<FeeCollection[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentFeeSummaries, setStudentFeeSummaries] = useState<StudentFeeSummary[]>([]);

  // Advanced filtering states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    studentName: '',
    rollNo: '',
    class: '',
    paymentStatus: '',
    feeType: '',
    amountMin: '',
    amountMax: '',
    amountRange: '',
    dueDateFrom: '',
    dueDateTo: '',
    paidDateFrom: '',
    paidDateTo: '',
    overdueDaysMin: '',
    overdueDaysMax: '',
    overdueRange: '',
    discountApplied: '',
    collectedBy: '',
    session: '',
    receiptNumber: '',
    admissionNumber: ''
  });

  // UI states
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);

  // Column settings with user-specific localStorage persistence
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const defaultColumns = [
      'select', 'studentName', 'rollNo', 'studentClass', 'totalFees', 
      'totalPaid', 'totalPending', 'totalOverdue', 'paymentStatus', 'lastPaymentDate', 'actions'
    ];
    
    if (typeof window === 'undefined') return defaultColumns;
    
    try {
      // Get current user email for user-specific storage
      const userKey = getCurrentUserKey();
      const saved = localStorage.getItem(`fees-page-selectedColumns-${userKey}`);
      return saved ? JSON.parse(saved) : defaultColumns;
    } catch {
      return defaultColumns;
    }
  });

  // Helper to get current user identifier
  const getCurrentUserKey = () => {
    if (typeof window === 'undefined') return 'anonymous';
    try {
      // Try to get user from session storage or localStorage
      const user = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        // Handle null/undefined email with multiple fallbacks
        return parsedUser.email?.trim() || 
               parsedUser.id?.toString()?.trim() || 
               parsedUser.name?.trim() || 
               parsedUser.role?.trim() || 
               'anonymous';
      }
      return 'anonymous';
    } catch {
      return 'anonymous';
    }
  };
  
  const columnSettings = {
    availableColumns: [
      { key: 'select', label: 'Select', fixed: true },
      { key: 'studentName', label: 'Student Name', fixed: true },
      { key: 'admissionNo', label: 'Admission No', fixed: false },
      { key: 'rollNo', label: 'Roll No', fixed: false },
      { key: 'studentClass', label: 'Class / Section', fixed: false },
      { key: 'medium', label: 'Medium', fixed: false },
      { key: 'parentName', label: 'Parent Name', fixed: false },
      { key: 'parentPhone', label: 'Parent Phone', fixed: false },
      { key: 'totalFees', label: 'Total Fees', fixed: false },
      { key: 'totalPaid', label: 'Paid Amount', fixed: false },
      { key: 'totalPending', label: 'Pending Amount', fixed: false },
      { key: 'totalOverdue', label: 'Overdue Amount', fixed: false },
      { key: 'discount', label: 'Discount', fixed: false },
      { key: 'fineAmount', label: 'Fine / Late Fee', fixed: false },
      { key: 'paymentStatus', label: 'Payment Status', fixed: false },
      { key: 'dueDate', label: 'Due Date', fixed: false },
      { key: 'lastPaymentDate', label: 'Last Payment Date', fixed: false },
      { key: 'paymentMode', label: 'Payment Mode', fixed: false },
      { key: 'receiptNo', label: 'Receipt No', fixed: false },
      { key: 'concession', label: 'Concession', fixed: false },
      { key: 'actions', label: 'Actions', fixed: true },
    ]
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const reorderColumns = (newOrder: string[]) => {
    setSelectedColumns(newOrder);
  };

  const moveColumn = (columnKey: string, direction: 'up' | 'down') => {
    setSelectedColumns(prev => {
      const idx = prev.indexOf(columnKey);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'up' && idx > 0) {
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      } else if (direction === 'down' && idx < next.length - 1) {
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      }
      return next;
    });
  };

  const resetColumns = () => {
    const defaultColumns = [
      'select', 'studentName', 'rollNo', 'studentClass', 'totalFees', 
      'totalPaid', 'totalPending', 'totalOverdue', 'paymentStatus', 'lastPaymentDate', 'actions'
    ];
    setSelectedColumns(defaultColumns);
    
    // Also clear user-specific storage
    if (typeof window !== 'undefined') {
      try {
        const userKey = getCurrentUserKey();
        localStorage.removeItem(`fees-page-selectedColumns-${userKey}`);
      } catch {
        // Ignore localStorage errors
      }
    }
  };
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = useState<any>(null);
  const [showBulkCollectionModal, setShowBulkCollectionModal] = useState(false);
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Pagination and view states
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileView, setMobileView] = useState<'list' | 'grid' | 'card'>('list');
  const [isMobile, setIsMobile] = useState(false);

  // Search and analytics
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchAnalytics, setSearchAnalytics] = useState({
    totalSearches: 0,
    averageResults: 0,
    recentSearches: [] as string[]
  });

  // AI Search Handler with SmartSearchEngine
  const handleAISearch = async (query: string) => {
    // Update search analytics
    setSearchAnalytics(prev => ({
      ...prev,
      totalSearches: prev.totalSearches + 1,
      recentSearches: [query, ...prev.recentSearches.slice(0, 4)]
    }));
    
    // Import FeeSearchEngine dynamically
    const { FeeSearchEngine } = await import('../search/FeeSearchEngine');
    const searchEngine = FeeSearchEngine.getInstance();
    
    // Ensure index is built
    if (searchEngine.getMetrics().totalRecords === 0) {
      searchEngine.buildIndex(studentFeeSummaries);
    }
    
    // Execute smart fee search
    const searchResult = searchEngine.searchFees({
      text: query,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    // Update search suggestions with AI insights
    setFeeSuggestions(searchResult.suggestions);
    
    // Log search performance
    console.log(`Fee search completed in ${searchResult.searchTime.toFixed(2)}ms with ${searchResult.totalCount} results`);
  };

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Persist selectedColumns to user-specific localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userKey = getCurrentUserKey();
        localStorage.setItem(`fees-page-selectedColumns-${userKey}`, JSON.stringify(selectedColumns));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [selectedColumns]);

  // Live statistics derived from studentFeeSummaries (always fresh)
  const calculateStatistics = () => {
    const totalFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalFees || 0), 0);
    const collectedFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const pendingFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalPending || 0), 0);
    const overdueFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalOverdue || 0), 0);
    return {
      totalFees,
      collectedFees,
      pendingFees,
      overdueFees,
      collectionRate: totalFees > 0 ? (collectedFees / totalFees) * 100 : 0,
    };
  };

  // Filter fee records based on current filters - memoized to prevent infinite loops
  const filteredFeeRecords = React.useMemo(() => {
    return feeRecords.filter(record => {
      if (selectedClass !== 'all' && record.student?.class !== selectedClass) return false;
      if (selectedStatus !== 'all' && record.status !== selectedStatus) return false;
      if (debouncedSearchTerm && !record.student?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) return false;
      return true;
    });
  }, [feeRecords, selectedClass, selectedStatus, debouncedSearchTerm]);

  // Enhanced filtering with AI search capabilities
  const filteredStudentSummaries = studentFeeSummaries.filter(student => {
    let matchesSearch = true;
    
    if (debouncedSearchTerm) {
      const lowerQuery = debouncedSearchTerm.toLowerCase().trim();
      const status = (student.calculatedPaymentStatus || student.paymentStatus || '').toLowerCase();
      const cls = (student.studentClass || '').toLowerCase();

      // Basic text matching — name, roll no, class, admission no, parent name
      const basicMatch =
        (student.studentName || '').toLowerCase().includes(lowerQuery) ||
        (student.rollNo || '').toLowerCase().includes(lowerQuery) ||
        cls.includes(lowerQuery) ||
        (student.admissionNo || '').toLowerCase().includes(lowerQuery) ||
        (student.parentName || student.fatherName || '').toLowerCase().includes(lowerQuery);

      // Parse amount from query like "> 50000" or "< 10000"
      const gtMatch = lowerQuery.match(/>\s*(\d+)/);
      const ltMatch = lowerQuery.match(/<\s*(\d+)/);
      const amountGt = gtMatch ? parseInt(gtMatch[1]) : null;
      const amountLt = ltMatch ? parseInt(ltMatch[1]) : null;

      // Extract class number like "class 10" or "10a"
      const classMatch = lowerQuery.match(/(?:class\s*)?(\d{1,2})\s*([a-z]?)/i);
      const classNumber = classMatch ? classMatch[1] : null;
      const classSection = classMatch ? classMatch[2] : '';

      // AI-powered semantic matching
      const aiMatch =
        // Status queries
        (lowerQuery.includes('pending') && student.totalPending > 0) ||
        (lowerQuery.includes('overdue') && status.includes('overdue')) ||
        (lowerQuery.includes('fully paid') && status.includes('fully_paid')) ||
        (lowerQuery.includes('paid') && status.includes('paid')) ||
        (lowerQuery.includes('partial') && status.includes('partial')) ||
        (lowerQuery.includes('unpaid') && student.totalPaid === 0) ||
        (lowerQuery.includes('no payment') && student.totalPaid === 0) ||

        // Amount-based
        (amountGt !== null && student.totalFees > amountGt) ||
        (amountLt !== null && student.totalFees < amountLt) ||
        (lowerQuery.includes('high fee') && student.totalFees > 75000) ||
        (lowerQuery.includes('low fee') && student.totalFees < 30000) ||

        // Class matching
        (classNumber !== null && cls.includes(classNumber) && (!classSection || cls.includes(classSection))) ||

        // Fee situation
        (lowerQuery.includes('defaulter') && (student.totalPending > 0 || status.includes('overdue'))) ||
        (lowerQuery.includes('discount') && (student.totalDiscount || 0) > 0) ||
        (lowerQuery.includes('scholarship') && (student.totalDiscount || 0) > 0) ||

        // Time-based
        ((lowerQuery.includes('this month') || lowerQuery.includes('recent')) && student.lastPaymentDate &&
          new Date(student.lastPaymentDate).getMonth() === new Date().getMonth() &&
          new Date(student.lastPaymentDate).getFullYear() === new Date().getFullYear()) ||

        // Risk / performance
        (lowerQuery.includes('risk') && (status.includes('overdue') || student.totalPending > 0)) ||
        (lowerQuery.includes('good standing') && status.includes('fully_paid')) ||
        (lowerQuery.includes('top') && student.totalPaid > 0 && status.includes('fully_paid'));

      matchesSearch = basicMatch || aiMatch;
    }
    
    const matchesClass = selectedClass === 'all' || (student.studentClass || '').toLowerCase() === selectedClass.toLowerCase();
    const matchesStatus = selectedStatus === 'all' ||
      (student.calculatedPaymentStatus || student.paymentStatus || '') === selectedStatus;
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Bulk operations
  const [bulkOperationType, setBulkOperationType] = useState<'collect' | 'discount' | 'reminder' | 'export' | 'delete'>('collect');
  const [bulkOperationData, setBulkOperationData] = useState({
    amount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    message: '',
    paymentMethod: 'cash' as 'cash' | 'online' | 'cheque' | 'bank_transfer'
  });
  const [bulkOperationProgress, setBulkOperationProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle' as 'idle' | 'processing' | 'completed' | 'error',
    errors: [] as string[]
  });

  // Dashboard widgets state
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [recentActivities, setRecentActivities] = useState<{ id: number; type: string; message: string; time: string; icon: string }[]>([]);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tab-specific API loaders with DB aggregation
  const loadAllStudentsData = async (page = 1, limit = 100) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await fetch(`/api/fees/students?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStudentFeeSummaries(data.data.students);
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading students data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollectionsData = async (page = 1, limit = 50) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await fetch(`/api/fees/collections/summary?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFeeCollections(data.data.groupedCollections);
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading collections data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportsData = async (filters?: { fromDate?: string; toDate?: string; academicYear?: string; studentClass?: string; limit?: number; cache?: boolean }) => {
    try {
      setIsLoading(true);
      
      // Build API parameters for optimized filtering
      const params = new URLSearchParams();
      
      if (filters?.academicYear && filters.academicYear !== 'all') {
        params.append('academicYear', filters.academicYear);
      }
      
      if (filters?.studentClass && filters.studentClass !== 'all') {
        params.append('class', filters.studentClass);
      }
      
      if (filters?.fromDate) {
        params.append('fromDate', filters.fromDate);
      }
      
      if (filters?.toDate) {
        params.append('toDate', filters.toDate);
      }
      
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      } else {
        params.append('limit', '1000'); // Default limit for reports
      }
      
      if (filters?.cache !== false) {
        params.append('cache', 'true');
      }
      
      const response = await fetch(`/api/fees/statistics?${params}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading reports data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeeRecordsData = async (page = 1, limit = 50) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: limit.toString()
      });
      
      const response = await fetch(`/api/fees/records?${params}`);
      const data = await response.json();
      
      if (data.success !== false) {
        // Handle both old and new API response structures
        const records = data.data?.records || data.records || [];
        setFeeRecords(records);
        return data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading fee records data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Tab-based data loading
  useEffect(() => {
    const loadTabData = async () => {
      try {
        setIsLoading(true);
        
        // Load common data (structures, discounts)
        const [feeStructuresResponse, discountsResponse] = await Promise.all([
          feeStructuresApi.list(),
          discountsApi.list()
        ]);
        
        setFeeStructures(feeStructuresResponse?.feeStructures || feeStructuresResponse?.structures || []);
        setDiscounts(discountsResponse?.discounts || discountsResponse || []);
        
        // Load tab-specific data
        switch (activeTab) {
          case 'all-students':
            await loadAllStudentsData();
            break;
          case 'collections':
            await loadCollectionsData();
            break;
          case 'reports':
            await loadReportsData();
            break;
          case 'fee-records':
            await loadFeeRecordsData();
            break;
          default:
            // Default to loading students data for other tabs
            await loadAllStudentsData();
        }
        
        setIsClient(true);
      } catch (error) {
        console.error('Error loading tab data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTabData();
  }, [activeTab]); // Reload data when tab changes

  // Legacy data loading (DISABLED - using new tab-specific loaders)
  // useEffect(() => {
  //   const loadFeeData = async () => {
  //     // Legacy code disabled to avoid conflicts with new tab-specific loaders
  //   };
  //   loadFeeData();
  // }, []);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ... (rest of the code remains the same)
  // Form states
  const [feeStructureForm, setFeeStructureForm] = useState<Partial<FeeStructure>>({
    name: '',
    category: 'tuition',
    amount: 0,
    frequency: 'monthly',
    dueDate: 1,
    lateFee: 0,
    description: '',
    applicableClasses: [],
    applicableCategories: [],
    isActive: true
  });

  return {
    router,
    activeTab, setActiveTab,
    theme, setTheme,
    isClient, setIsClient,
    feeStructures, setFeeStructures,
    feeRecords, setFeeRecords,
    feeCollections, setFeeCollections,
    discounts, setDiscounts,
    selectedStudents, setSelectedStudents,
    studentFeeSummaries, setStudentFeeSummaries,
    filteredStudentSummaries,
    filteredFeeRecords,
    calculateStatistics,
    showAdvancedFilters, setShowAdvancedFilters,
    advancedFilters, setAdvancedFilters,
    showColumnSettings, setShowColumnSettings,
    showBulkOperations, setShowBulkOperations,
    showFeeStructureModal, setShowFeeStructureModal,
        showDiscountModal, setShowDiscountModal,
    showReceiptModal, setShowReceiptModal,
    selectedFeeRecord, setSelectedFeeRecord,
    showBulkCollectionModal, setShowBulkCollectionModal,
    showBulkDiscountModal, setShowBulkDiscountModal,
    showImportModal, setShowImportModal,
    showExportModal, setShowExportModal,
    pageSize, setPageSize,
    currentPage, setCurrentPage,
    mobileView, setMobileView,
    isMobile, setIsMobile,
    selectedColumns, setSelectedColumns,
    columnSettings, toggleColumn, resetColumns, moveColumn, reorderColumns,
    searchTerm, setSearchTerm,
    debouncedSearchTerm,
    selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus,
    showAISuggestions, setShowAISuggestions,
    handleAISearch,
    searchAnalytics, setSearchAnalytics,
    isLoading, setIsLoading,
    bulkOperationType, setBulkOperationType,
    bulkOperationData, setBulkOperationData,
    bulkOperationProgress, setBulkOperationProgress,
    dashboardCollapsed, setDashboardCollapsed,
    showDashboard, setShowDashboard,
    recentActivities, setRecentActivities,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    feeStructureForm, setFeeStructureForm,
    // New tab-specific loaders
    loadAllStudentsData,
    loadCollectionsData,
    loadReportsData,
    loadFeeRecordsData,
      };
}
