// @ts-nocheck
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FeeItem, FinesStats, FeeStats, TabType } from './types';

export function useFeeCollection(
  studentId: string | undefined,
  studentData: any,
  theme: 'dark' | 'light'
) {
  const isDark = theme === 'dark';
  
  // Enhanced color scheme
  const colors = useMemo(() => ({
    primary: isDark ? '#3b82f6' : '#2563eb',
    success: isDark ? '#10b981' : '#059669',
    warning: isDark ? '#f59e0b' : '#d97706',
    danger: isDark ? '#ef4444' : '#dc2626',
    purple: isDark ? '#8b5cf6' : '#7c3aed',
    cyan: isDark ? '#06b6d4' : '#0891b2',
    pink: isDark ? '#ec4899' : '#db2777',
  }), [isDark]);

  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filter states
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year: string; name: string}>>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [feeCategories, setFeeCategories] = useState<Array<string>>([]);
  const [customAmounts, setCustomAmounts] = useState<{[key: string]: number}>({});

  // Discount filter states
  const [discountSearch, setDiscountSearch] = useState('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [discountStatusFilter, setDiscountStatusFilter] = useState('all');

  // Fines states
  const [fines, setFines] = useState<any[]>([]);
  const [loadingFines, setLoadingFines] = useState(false);

  // Payment history states
  const [paymentHistoryData, setPaymentHistoryData] = useState<any>(null);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  // Discount history states
  const [discountHistoryData, setDiscountHistoryData] = useState<any>(null);
  const [loadingDiscountHistory, setLoadingDiscountHistory] = useState(false);

  // Receipt and modal states
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDetailedReceipt, setShowDetailedReceipt] = useState(false);
  const [showHistoryReceipt, setShowHistoryReceipt] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Payment processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [installmentPlan, setInstallmentPlan] = useState(false);

  // UPI QR states
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [upiQrCode, setUpiQrCode] = useState('');
  const [upiPaymentStatus, setUpiPaymentStatus] = useState<'pending' | 'checking' | 'confirmed'>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [sharingQr, setSharingQr] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<any>(null);

  const normalizeCategory = (value?: string) => {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  };

  // Fetch academic years and fee categories
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await fetch('/api/school-structure/academic-years');
        if (response.ok) {
          const data = await response.json();
          setAcademicYears(data.academicYears || []);
        }
      } catch (error) {
        console.error('Failed to fetch academic years:', error);
      }
    };

    const fetchFeeCategories = async () => {
      try {
        const response = await fetch('/api/fees/structures');
        if (response.ok) {
          const data = await response.json();
          const structures = data.feeStructures || [];
          const dbCategories = [...new Set(structures
            .map((fs: any) => normalizeCategory(fs.category))
            .filter(Boolean))];
          const fallbackCategories = ['academic', 'transport', 'extracurricular', 'fines', 'other'];
          const allCategories = [...new Set([...dbCategories, ...fallbackCategories])];
          setFeeCategories(allCategories);
        }
      } catch (error) {
        console.error('Failed to fetch fee categories:', error);
        setFeeCategories(['academic', 'transport', 'extracurricular', 'fines', 'other']);
      }
    };

    fetchAcademicYears();
    fetchFeeCategories();
  }, []);

  // Fetch payment history when history tab is activated
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (activeTab !== 'history' || !studentId) return;
      
      setLoadingPaymentHistory(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: '1000',
        });
        
        const response = await fetch(`/api/fees/students/${studentId}/payment-history?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setPaymentHistoryData(data.data);
        }
      } catch (e) {
        console.error('Failed to load payment history', e);
      } finally {
        setLoadingPaymentHistory(false);
      }
    };
    
    fetchPaymentHistory();
  }, [activeTab, studentId]);

  // Fetch discount history when discounts tab is activated
  useEffect(() => {
    const fetchDiscountHistory = async () => {
      if (activeTab !== 'discounts' || !studentId) return;
      
      setLoadingDiscountHistory(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: '1000',
        });
        
        const response = await fetch(`/api/fees/students/${studentId}/discount-history?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setDiscountHistoryData(data.data);
        }
      } catch (e) {
        console.error('Failed to load discount history', e);
      } finally {
        setLoadingDiscountHistory(false);
      }
    };
    
    fetchDiscountHistory();
  }, [activeTab, studentId]);

  // Fetch fines data
  const fetchFines = useCallback(async () => {
    if (!studentId) return;
    
    setLoadingFines(true);
    try {
      const response = await fetch(`/api/fees/students/${studentId}/fines`);
      const data = await response.json();
      
      if (response.ok) {
        setFines(data.fines || []);
      }
    } catch (error) {
      console.error('Failed to fetch fines:', error);
    } finally {
      setLoadingFines(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchFines();
    }
  }, [studentId, fetchFines]);

  // Calculate fines statistics
  const finesStats = useMemo<FinesStats | null>(() => {
    if (!fines.length) return null;
    
    const totalFines = fines.reduce((sum, fine) => sum + fine.amount, 0);
    const totalFinesPaid = fines.reduce((sum, fine) => sum + fine.paidAmount, 0);
    const totalFinesPending = fines.reduce((sum, fine) => sum + fine.pendingAmount, 0);
    const totalFinesWaived = fines.reduce((sum, fine) => sum + fine.waivedAmount, 0);
    const pendingFinesCount = fines.filter(fine => fine.pendingAmount > 0).length;
    
    return {
      totalFines,
      totalFinesPaid,
      totalFinesPending,
      totalFinesWaived,
      pendingFinesCount,
    };
  }, [fines]);

  // Get real fee data from studentData prop
  const allFeeData: FeeItem[] = useMemo(() => {
    let feeItems: FeeItem[] = [];
    
    if (studentData?.feeRecords && studentData.feeRecords.length > 0) {
      feeItems = feeItems.concat(studentData.feeRecords.map((record: any) => {
        const category = normalizeCategory(record.category || record.feeStructure?.category || (record as any).feeStructureName) || 'academic';
        
        return {
          id: record.id,
          name: record.feeStructure?.name || record.name || (record as any).feeStructureName || 'Fee',
          category: category,
          amount: record.amount || 0,
          dueDate: record.dueDate || '',
          status: record.status || 'pending',
          paidAmount: record.paidAmount || 0,
          discount: record.discount || 0,
          waivedAmount: record.waivedAmount || 0,
          frequency: record.feeStructure?.frequency || 'one-time',
          academicYear: record.academicYear || '2025-26',
          description: record.feeStructure?.description || '',
          priority: record.status === 'overdue' ? 'high' : 'medium',
          lateFee: record.feeStructure?.lateFee || 0,
          discountAvailable: false,
        };
      }));
    }
    
    if (fines.length > 0) {
      const fineItems = fines.map((fine: any) => ({
        id: `fine-${fine.id}`,
        name: `Fine: ${fine.description}`,
        category: 'fines',
        amount: fine.amount,
        dueDate: fine.dueDate,
        status: fine.pendingAmount > 0 ? 'pending' : 'paid',
        paidAmount: fine.paidAmount,
        discount: 0,
        waivedAmount: fine.waivedAmount || 0,
        frequency: 'one-time' as const,
        academicYear: '2025-26',
        description: fine.description,
        priority: 'high' as const,
        lateFee: 0,
        discountAvailable: false,
        isFine: true,
        fineId: fine.id,
        fineNumber: fine.fineNumber,
        pendingAmount: fine.pendingAmount,
      }));
      
      feeItems = feeItems.concat(fineItems);
    }
    
    return feeItems;
  }, [studentData, fines]);

  // Computed values
  const filteredFees = useMemo(() => {
    const filtered = allFeeData.filter(fee => {
      const yearMatch = selectedYear === 'all' || fee.academicYear === selectedYear;
      const categoryMatch = selectedCategory === 'all' || fee.category === selectedCategory;
      
      return yearMatch && categoryMatch;
    });
    
    return filtered;
  }, [allFeeData, selectedYear, selectedCategory]);

  const totalAmount = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + fee.amount, 0);
  }, [filteredFees]);

  const totalPaid = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
  }, [filteredFees]);

  const totalPending = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount - (fee.discount || 0) - (fee.waivedAmount || 0)), 0);
  }, [filteredFees]);

  const selectedFeesTotal = useMemo(() => {
    return filteredFees
      .filter(fee => selectedFees.includes(fee.id))
      .reduce((sum, fee) => sum + (customAmounts[fee.id] || (fee.amount - fee.paidAmount - (fee.discount || 0) - (fee.waivedAmount || 0))), 0);
  }, [filteredFees, selectedFees, customAmounts]);

  const overdueFees = useMemo(() => {
    return filteredFees.filter(fee => fee.status === 'overdue');
  }, [filteredFees]);

  const totalDiscount = useMemo(() => {
    return filteredFees.reduce((sum, fee) => {
      // Check if this is a transport waiver
      if (fee.feeStructure?.category === 'transport' && fee.status === 'cancelled' && fee.discount > 0) {
        return sum; // Don't count transport waivers as discounts
      }
      return sum + (fee.discount || 0);
    }, 0);
  }, [filteredFees]);

  const totalWaived = useMemo(() => {
    return filteredFees.reduce((sum, fee) => {
      // Check if this is a transport waiver
      if (fee.feeStructure?.category === 'transport' && fee.status === 'cancelled' && fee.discount > 0) {
        return sum + (fee.discount || 0);
      }
      return sum;
    }, 0);
  }, [filteredFees]);

  const stats = useMemo<FeeStats>(() => ({
    totalFees: filteredFees.length,
    pendingFees: filteredFees.filter(f => f.status === 'pending').length,
    paidFees: filteredFees.filter(f => f.status === 'paid').length,
    overdueFees: overdueFees.length,
    totalAmount,
    totalPaid,
    totalPending,
    totalDiscount,
    totalWaived,
    selectedFeesTotal
  }), [filteredFees, overdueFees, totalAmount, totalPaid, totalPending, totalDiscount, totalWaived, selectedFeesTotal]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'partial': return colors.primary;
      case 'overdue': return colors.danger;
      default: return colors.primary;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.primary;
    }
  };

  return {
    // State
    activeTab,
    setActiveTab,
    selectedFees,
    setSelectedFees,
    selectedYear,
    setSelectedYear,
    academicYears,
    historySearch,
    setHistorySearch,
    selectedCategory,
    setSelectedCategory,
    feeCategories,
    customAmounts,
    setCustomAmounts,
    discountSearch,
    setDiscountSearch,
    discountTypeFilter,
    setDiscountTypeFilter,
    discountStatusFilter,
    setDiscountStatusFilter,
    fines,
    finesStats,
    loadingFines,
    fetchFines,
    paymentHistoryData,
    loadingPaymentHistory,
    discountHistoryData,
    loadingDiscountHistory,
    showSuccessModal,
    setShowSuccessModal,
    showReceipt,
    setShowReceipt,
    showDetailedReceipt,
    setShowDetailedReceipt,
    showHistoryReceipt,
    setShowHistoryReceipt,
    selectedHistoryEntry,
    setSelectedHistoryEntry,
    isProcessing,
    setIsProcessing,
    paymentStep,
    setPaymentStep,
    paymentMethod,
    setPaymentMethod,
    promoCode,
    setPromoCode,
    installmentPlan,
    setInstallmentPlan,
    showUpiQr,
    setShowUpiQr,
    upiQrCode,
    setUpiQrCode,
    upiPaymentStatus,
    setUpiPaymentStatus,
    checkingPayment,
    setCheckingPayment,
    sharingQr,
    setSharingQr,
    latestReceipt,
    setLatestReceipt,
    
    // Computed
    allFeeData,
    filteredFees,
    stats,
    totalAmount,
    totalPaid,
    totalPending,
    overdueFees,
    totalDiscount,
    totalWaived,
    selectedFeesTotal,
    
    // Styles
    isDark,
    colors,
    cardCls,
    textPrimary,
    textSecondary,
    inputCls,
    
    // Helpers
    getStatusColor,
    getPriorityColor,
    normalizeCategory,
  };
}
