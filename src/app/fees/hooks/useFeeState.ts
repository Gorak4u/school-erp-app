// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';
import { feeStructuresApi, feeRecordsApi, paymentsApi, discountsApi, studentsApi } from '@/lib/apiClient';
import { isArchivedStudentStatus } from '@/lib/studentStatus';

export function useFeeState() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isClient, setIsClient] = useState(false);

  // State management
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [feeCollections, setFeeCollections] = useState<FeeCollection[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentFeeSummaries, setStudentFeeSummaries] = useState<StudentFeeSummary[]>([]);
  const [studentFeeTotal, setStudentFeeTotal] = useState(0);
  const [studentFeeTotalPages, setStudentFeeTotalPages] = useState(1);
  const [feeStatistics, setFeeStatistics] = useState<any>(null);
  const [includeArchivedStudents, setIncludeArchivedStudents] = useState(false);

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
  const [feeSuggestions, setFeeSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchAnalytics, setSearchAnalytics] = useState({
    totalSearches: 0,
    averageResults: 0,
    recentSearches: [] as string[]
  });

  const visibleStudentFeeSummaries = useMemo(() => {
    if (includeArchivedStudents) return studentFeeSummaries;
    return studentFeeSummaries.filter(student => !isArchivedStudentStatus(student.studentStatus || student.status));
  }, [studentFeeSummaries, includeArchivedStudents]);

  // Initialize search engine when data loads
  useEffect(() => {
    const initializeSearchEngine = async () => {
      if (visibleStudentFeeSummaries.length > 0) {
        const { FeeSearchEngine } = await import('../search/FeeSearchEngine');
        const searchEngine = FeeSearchEngine.getInstance();
        
        // Build index using the visible student list so archived students stay hidden by default
        searchEngine.buildIndex(visibleStudentFeeSummaries);
      }
    };
    
    initializeSearchEngine();
  }, [visibleStudentFeeSummaries, includeArchivedStudents]);

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
      searchEngine.buildIndex(visibleStudentFeeSummaries);
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

  // Live statistics derived from visibleStudentFeeSummaries (always fresh)
  const calculateStatistics = () => {
    if (feeStatistics) {
      const overdueBreakdown = feeStatistics.paymentStatusBreakdown?.find((item: any) => item.status === 'overdue');
      return {
        totalFees: feeStatistics.totalFees || 0,
        collectedFees: feeStatistics.totalCollected || 0,
        pendingFees: feeStatistics.totalPending || 0,
        overdueFees: overdueBreakdown?.totalPending || 0,
        collectionRate: feeStatistics.collectionRate || 0,
      };
    }

    const totalFees = visibleStudentFeeSummaries.reduce((sum, s) => sum + (s.totalFees || 0), 0);
    const collectedFees = visibleStudentFeeSummaries.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const pendingFees = visibleStudentFeeSummaries.reduce((sum, s) => sum + (s.totalPending || 0), 0);
    const overdueFees = visibleStudentFeeSummaries.reduce((sum, s) => sum + (s.totalOverdue || 0), 0);
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
      if (selectedClass !== 'all') {
        // Parse composite key: className|mediumName
        const [className, mediumName] = selectedClass.split('|');
        const studentClass = record.student?.class;
        const studentMedium = record.student?.languageMedium;
        
        // If composite key has medium, match both class and medium
        if (mediumName) {
          if (studentClass !== className || studentMedium !== mediumName) return false;
        } else {
          // Otherwise just match class name
          if (studentClass !== selectedClass) return false;
        }
      }
      if (selectedStatus !== 'all' && record.status !== selectedStatus) return false;
      if (debouncedSearchTerm && !record.student?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) return false;
      return true;
    });
  }, [feeRecords, selectedClass, selectedStatus, debouncedSearchTerm]);

  // The list is now server-filtered/paginated; keep this as a lightweight alias.
  const filteredStudentSummaries = React.useMemo(() => visibleStudentFeeSummaries, [visibleStudentFeeSummaries]);

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
  const [showDashboard, setShowDashboard] = useState(false);
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
  const loadAllStudentsData = async (
    page = 1,
    limit = 100,
    includeArchived = includeArchivedStudents,
    filters?: { search?: string; studentClass?: string; paymentStatus?: string }
  ) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeArchived: includeArchived ? 'true' : 'false'
      });
      if (filters?.search) params.append('search', filters.search);
      if (filters?.studentClass && filters.studentClass !== 'all') {
        // Parse composite key: className|mediumName
        const [className, mediumName] = filters.studentClass.split('|');
        params.append('class', className);
        if (mediumName) params.append('medium', mediumName);
      }
      if (filters?.paymentStatus && filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
      
      const response = await fetch(`/api/fees/students?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStudentFeeSummaries(data.data.students);
        setStudentFeeTotal(data.data.pagination?.total || data.data.total || data.data.students?.length || 0);
        setStudentFeeTotalPages(data.data.pagination?.totalPages || 1);
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

  const loadFeeStatistics = async (filters?: { academicYear?: string; studentClass?: string; includeArchived?: boolean }) => {
    try {
      const params = new URLSearchParams();

      if (filters?.academicYear && filters.academicYear !== 'all') {
        params.append('academicYear', filters.academicYear);
      }
      if (filters?.studentClass && filters.studentClass !== 'all') {
        // Parse composite key: className|mediumName
        const [className, mediumName] = filters.studentClass.split('|');
        params.append('class', className);
        if (mediumName) params.append('medium', mediumName);
      }
      if (filters?.includeArchived) {
        params.append('includeArchived', 'true');
      }

      const response = await fetch(`/api/fees/statistics${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await response.json();

      if (data.success) {
        setFeeStatistics(data.data);
        return data.data;
      }

      throw new Error(data.error || 'Failed to load fee statistics');
    } catch (error) {
      console.error('Error loading fee statistics:', error);
      throw error;
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
        // Load common data (structures, discounts)
        const [feeStructuresResponse, discountsResponse] = await Promise.all([
          feeStructuresApi.list(),
          discountsApi.list()
        ]);
        
        setFeeStructures(feeStructuresResponse?.feeStructures || feeStructuresResponse?.structures || []);
        setDiscounts(discountsResponse?.discounts || discountsResponse || []);
        
        // Load tab-specific data
        switch (activeTab) {
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
            break;
        }
      } catch (error) {
        console.error('Error loading tab data:', error);
      } finally {
        setIsClient(true);
      }
    };
    
    loadTabData();
  }, [activeTab]); // Reload data when tab changes

  // Keep the fee student cache in sync with the archived-student toggle and server-side filters
  useEffect(() => {
    if (activeTab !== 'all-students') return;

    const loadAllStudents = async () => {
      try {
        await Promise.all([
          loadAllStudentsData(currentPage, pageSize, includeArchivedStudents, {
            search: debouncedSearchTerm,
            studentClass: selectedClass,
            paymentStatus: selectedStatus,
          }),
          loadFeeStatistics({
            studentClass: selectedClass,
            includeArchived: includeArchivedStudents,
          }),
        ]);
      } catch (error) {
        console.error('Error loading fee tab data:', error);
      }
    };

    loadAllStudents();
  }, [activeTab, currentPage, pageSize, debouncedSearchTerm, selectedClass, selectedStatus, includeArchivedStudents]);

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
    studentFeeTotal, setStudentFeeTotal,
    studentFeeTotalPages, setStudentFeeTotalPages,
    visibleStudentFeeSummaries,
    includeArchivedStudents, setIncludeArchivedStudents,
    feeStatistics, setFeeStatistics,
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
    feeSuggestions, setFeeSuggestions,
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
    loadFeeStatistics,
    loadCollectionsData,
    loadReportsData,
    loadFeeRecordsData,
      };
}
