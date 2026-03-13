// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMotionValue, useSpring } from 'framer-motion';
import { Student } from '../types';
import { useDomainState } from './useDomainState';
import { mockStudents, CLASSES } from '../data';

export function useStudentState() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  
  // Advanced Search State
  const [advancedSearch, setAdvancedSearch] = useState({
    enabled: false,
    query: '',
    fuzzyThreshold: 0.7,
    searchFields: ['name', 'fatherName', 'motherName', 'rollNo', 'city', 'state', 'pinCode'],
    recommendations: [] as Student[],
    searchHistory: [] as string[],
    isSearching: false,
    searchAnalytics: {
      totalSearches: 0,
      averageResults: 0,
      popularQueries: [] as { query: string; count: number }[]
    }
  });

  // Bulk Operations State
  const [bulkOperations, setBulkOperations] = useState({
    showImportModal: false,
    showExportModal: false,
    importFile: null as File | null,
    importProgress: 0,
    importStatus: 'idle' as 'idle' | 'processing' | 'success' | 'error',
    importErrors: [] as string[],
    importResults: {
      total: 0,
      successful: 0,
      failed: 0,
      duplicates: 0
    },
    exportFormat: 'csv' as 'csv' | 'excel',
    exportFields: [
      'id', 'name', 'email', 'class', 'rollNo', 'phone', 'grade', 'status',
      'admissionNo', 'dateOfBirth', 'gender', 'address', 'parentName', 'parentPhone',
      'enrollmentDate', 'board', 'section', 'bloodGroup', 'attendance', 'academics'
    ],
    bulkAction: '' as 'delete' | 'update' | 'export',
    bulkActionProgress: 0,
    bulkActionStatus: 'idle' as 'idle' | 'processing' | 'success' | 'error'
  });

  // Domain-specific state (document, communication, attendance, academic, fee, parent)
  const domainState = useDomainState();
  const { setIsClient, setMousePosition } = domainState;

  // Motion values for mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Client-side initialization and mouse tracking
  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Dashboard State
  const [showDashboard, setShowDashboard] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    graduatedStudents: 0,
    averageAttendance: 0,
    totalFeesCollected: 0,
    pendingFees: 0,
    recentAdmissions: 0,
    lowAttendanceStudents: 0,
    classDistribution: {} as Record<string, number>,
    genderDistribution: { male: 0, female: 0, other: 0 },
    recentActivities: [] as Array<{
      id: string;
      type: 'admission' | 'fee_payment' | 'status_change' | 'document_upload';
      description: string;
      timestamp: string;
      studentName: string;
    }>
  });
  
  // Bulk Operations State
  const [showBulkOperationModal, setShowBulkOperationModal] = useState(false);
  const [bulkOperationType, setBulkOperationType] = useState<'promote' | 'update_status' | 'assign_fees' | 'send_message' | 'delete' | 'export'>('promote');
  const [bulkOperationData, setBulkOperationData] = useState({
    targetClass: '',
    targetSection: '',
    targetStatus: '',
    feeAmount: '',
    message: '',
    exportFields: [] as string[]
  });
  const [bulkOperationProgress, setBulkOperationProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle' as 'idle' | 'processing' | 'completed' | 'error',
    errors: [] as string[]
  });
  
  // Pagination & Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Column Customization State
  const [visibleColumns, setVisibleColumns] = useState([
    'select', 'photo', 'admissionNo', 'rollNo', 'name', 'parents', 
    'class', 'address', 'attendance', 'grade', 'status', 'actions'
  ]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnSettings, setColumnSettings] = useState({
    availableColumns: [
      { key: 'select', label: 'Select', fixed: true },
      { key: 'photo', label: 'Photo', fixed: false },
      { key: 'admissionNo', label: 'Admission No', fixed: false },
      { key: 'rollNo', label: 'Roll No', fixed: false },
      { key: 'name', label: 'Name', fixed: true },
      { key: 'parents', label: 'Parents Details', fixed: false },
      { key: 'class', label: 'Class', fixed: false },
      { key: 'address', label: 'Address', fixed: false },
      { key: 'attendance', label: 'Attendance', fixed: false },
      { key: 'grade', label: 'Grade', fixed: false },
      { key: 'status', label: 'Status', fixed: false },
      { key: 'actions', label: 'Actions', fixed: true }
    ]
  });
  
  // Mobile Responsiveness State
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'grid' | 'card'>('list');

  // Mobile responsiveness detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate dashboard statistics
  useEffect(() => {
    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === 'active').length,
      inactiveStudents: students.filter(s => s.status === 'inactive').length,
      graduatedStudents: students.filter(s => s.status === 'graduated').length,
      averageAttendance: students.reduce((acc, s) => acc + s.attendance.percentage, 0) / students.length || 0,
      totalFeesCollected: students.reduce((acc, s) => acc + s.fees.paid, 0),
      pendingFees: students.reduce((acc, s) => acc + s.fees.pending, 0),
      recentAdmissions: students.filter(s => {
        const admissionDate = new Date(s.admissionDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return admissionDate > thirtyDaysAgo;
      }).length,
      lowAttendanceStudents: students.filter(s => s.attendance.percentage < 75).length,
      classDistribution: {} as Record<string, number>,
      genderDistribution: { male: 0, female: 0, other: 0 },
      recentActivities: [
        {
          id: '1',
          type: 'admission' as const,
          description: 'New student admitted',
          timestamp: new Date().toISOString(),
          studentName: 'Rahul Kumar'
        },
        {
          id: '2',
          type: 'fee_payment' as const,
          description: 'Fee payment received',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          studentName: 'Priya Sharma'
        },
        {
          id: '3',
          type: 'status_change' as const,
          description: 'Student status updated',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          studentName: 'Amit Patel'
        }
      ]
    };

    // Calculate class distribution
    students.forEach(student => {
      stats.classDistribution[student.class] = (stats.classDistribution[student.class] || 0) + 1;
    });

    // Calculate gender distribution
    students.forEach(student => {
      if (student.gender === 'Male') stats.genderDistribution.male++;
      else if (student.gender === 'Female') stats.genderDistribution.female++;
      else stats.genderDistribution.other++;
    });

    setDashboardStats(stats);
  }, [students]);

  useEffect(() => {
    setStudents(mockStudents);
  }, []);


  return {
    ...domainState,
    router,
    students, setStudents,
    searchTerm, setSearchTerm,
    selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus,
    selectedGender, setSelectedGender,
    advancedSearch, setAdvancedSearch,
    bulkOperations, setBulkOperations,
    showDashboard, setShowDashboard,
    dashboardStats, setDashboardStats,
    showBulkOperationModal, setShowBulkOperationModal,
    bulkOperationType, setBulkOperationType,
    bulkOperationData, setBulkOperationData,
    bulkOperationProgress, setBulkOperationProgress,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    totalPages, setTotalPages,
    sortConfig, setSortConfig,
    visibleColumns, setVisibleColumns,
    showColumnSettings, setShowColumnSettings,
    columnSettings, setColumnSettings,
    isMobile, setIsMobile,
    sidebarOpen, setSidebarOpen,
    mobileView, setMobileView,
    mouseX, mouseY,
  };
}
