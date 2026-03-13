// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';

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
    paymentMethod: '',
    amountMin: '',
    amountMax: '',
    dueDateFrom: '',
    dueDateTo: '',
    paidDateFrom: '',
    paidDateTo: '',
    overdueDaysMin: '',
    overdueDaysMax: '',
    discountApplied: '',
    collectedBy: ''
  });

  // UI states
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showBulkCollectionModal, setShowBulkCollectionModal] = useState(false);
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Pagination and view states
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileView, setMobileView] = useState<'list' | 'grid' | 'card'>('list');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'studentName', 'rollNo', 'class', 'totalFees', 'paid', 'pending', 'overdue', 'status', 'lastPayment', 'actions'
  ]);

  // Search and analytics
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAnalytics, setSearchAnalytics] = useState({
    totalSearches: 0,
    averageResults: 0,
    recentSearches: [] as string[]
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
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'payment', message: 'Rahul Kumar paid tuition fee', time: '2 mins ago', icon: '💰' },
    { id: 2, type: 'overdue', message: '5 students have overdue fees', time: '15 mins ago', icon: '⚠️' },
    { id: 3, type: 'discount', message: 'Sibling discount applied to 2 students', time: '1 hour ago', icon: '🎁' },
    { id: 4, type: 'collection', message: 'Daily collection target achieved', time: '2 hours ago', icon: '✅' }
  ]);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  // Filter states
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  const [collectionForm, setCollectionForm] = useState({
    studentId: '',
    feeStructureId: '',
    amount: 0,
    paymentMethod: 'cash' as const,
    transactionId: '',
    remarks: ''
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
    showAdvancedFilters, setShowAdvancedFilters,
    advancedFilters, setAdvancedFilters,
    showColumnSettings, setShowColumnSettings,
    showBulkOperations, setShowBulkOperations,
    showFeeStructureModal, setShowFeeStructureModal,
    showCollectionModal, setShowCollectionModal,
    showDiscountModal, setShowDiscountModal,
    showReceiptModal, setShowReceiptModal,
    showBulkCollectionModal, setShowBulkCollectionModal,
    showBulkDiscountModal, setShowBulkDiscountModal,
    showImportModal, setShowImportModal,
    showExportModal, setShowExportModal,
    pageSize, setPageSize,
    currentPage, setCurrentPage,
    mobileView, setMobileView,
    isMobile, setIsMobile,
    selectedColumns, setSelectedColumns,
    searchTerm, setSearchTerm,
    searchAnalytics, setSearchAnalytics,
    bulkOperationType, setBulkOperationType,
    bulkOperationData, setBulkOperationData,
    bulkOperationProgress, setBulkOperationProgress,
    dashboardCollapsed, setDashboardCollapsed,
    showDashboard, setShowDashboard,
    recentActivities, setRecentActivities,
    selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    feeStructureForm, setFeeStructureForm,
    collectionForm, setCollectionForm,
  };
}
