'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

// Type definitions for fee context
interface FeeContext {
  // State properties from useFeeState
  getSetting?: (group: string, key: string, defaultValue?: string) => string;
  theme?: string;
  feeCollections?: unknown;
  canManageFees?: boolean;
  // Handler methods
  data?: unknown;
  actions?: unknown;
  // Allow additional properties
  [key: string]: unknown;
}

import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from './types';
import { feeStructuresApi, feeRecordsApi, paymentsApi, discountsApi, studentsApi } from '@/lib/apiClient';
import { useFeeState } from './hooks/useFeeState';
import { createFeeDataHandlers } from './handlers/feeDataHandlers';
import { createFeeActionHandlers } from './handlers/feeActionHandlers';
import SearchPerformanceMonitor from '../shared/search/components/SearchPerformanceMonitor';
import { FeeSearchEngine } from './search/FeeSearchEngine';
import FeeDashboard from './components/FeeDashboard';
import FeeFilters from './components/FeeFilters';
import FeeTabContent from './components/FeeTabContent';
import FeeStructureModal from './components/FeeStructureModal';
import EnhancedFeeStructureModal from './components/EnhancedFeeStructureModal';
import FeeColumnSettingsModal from './components/FeeColumnSettingsModal';
import StudentWorkflows from './components/StudentWorkflows';
import EnhancedFeeCollection from './components/fee-collection';
import FeeInvoiceManagerOptimized from './components/FeeInvoiceManager-Optimized';
import FeeFinancialAnalytics from './components/FeeFinancialAnalytics';
import FeeNotificationManager from './components/FeeNotificationManager';
import StudentFinancialProfile from './components/StudentFinancialProfile';
import BulkFeeAssignmentForm from './components/BulkFeeAssignmentForm';
import FeeWorkflows from './components/FeeWorkflows';
import DiscountManagement from './components/discount/DiscountManagement';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, AdminOnly, RequirePermission } from '@/components/PermissionGuard';
import { motion } from 'framer-motion';
import { BarChart3, Users, TrendingUp, Wallet, FileText, Bell, Gift, Building2 } from 'lucide-react';

export default function FeesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const state = useFeeState();
  const [useEnhancedModal, setUseEnhancedModal] = useState(true); // Toggle between modals
  const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);
  
  // Fee Collection Modal State
  const [feeCollectionModal, setFeeCollectionModal] = useState<{
    show: boolean;
    selectedStudent: { studentId: string; studentName?: string; name?: string; studentClass?: string; class?: string; [key: string]: unknown } | null;
    feeData: unknown | null;
    loading: boolean;
  }>({
    show: false,
    selectedStudent: null,
    feeData: null,
    loading: false
  });
  
  // Permission-based access control
  const { 
    hasPermission, 
    isAdmin, 
    isTeacher,
    permissions 
  } = usePermissions();

  const canManageFees = isAdmin || hasPermission('manage_fees');

  // Fee Collection Modal Handler
  const handleOpenFeeCollection = async (studentId: string) => {
    setFeeCollectionModal(prev => ({ ...prev, show: true, selectedStudent: { studentId }, loading: true }));
    
    try {
      const params = new URLSearchParams({
        studentId,
        includeArchived: includeArchivedStudents ? 'true' : 'false',
      });
      const response = await fetch(`/api/fees/students?${params.toString()}`);
      const data = await response.json();
      if (data.success && data.data?.students) {
        const studentFeeData = data.data.students[0] || data.data.students.find((s: { studentId?: string }) => s.studentId === studentId);
        setFeeCollectionModal(prev => ({ 
          ...prev, 
          feeData: studentFeeData,
          selectedStudent: studentFeeData,
          loading: false 
        }));
      }
    } catch (error) {
      console.error('Failed to fetch fee data:', error);
      setFeeCollectionModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Refresh fee data after payment
  const handleRefreshFeeData = async () => {
    if (feeCollectionModal.selectedStudent?.studentId) {
      try {
        const params = new URLSearchParams({
          studentId: feeCollectionModal.selectedStudent.studentId,
          includeArchived: includeArchivedStudents ? 'true' : 'false',
        });
        const response = await fetch(`/api/fees/students?${params.toString()}`);
        const data = await response.json();
        if (data.success && data.data?.students) {
          const studentFeeData = data.data.students[0] || data.data.students.find((s: { studentId?: string }) => s.studentId === feeCollectionModal.selectedStudent?.studentId);
          setFeeCollectionModal(prev => ({ 
            ...prev, 
            feeData: studentFeeData,
            selectedStudent: studentFeeData
          }));
        }
      } catch (error) {
        console.error('Failed to refresh fee data:', error);
      }
    }
  };

  const handleCloseFeeCollection = () => {
    setFeeCollectionModal({
      show: false,
      selectedStudent: null,
      feeData: null,
      loading: false
    });
  };

  // Modern Fee Tabs - matching Student page structure
  const FEE_TABS = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: BarChart3, 
      description: 'Fee dashboard and analytics overview',
      gradient: 'from-green-500 to-emerald-600',
      permission: null
    },
    { 
      id: 'all-students', 
      label: 'All Students', 
      icon: Users, 
      description: 'Student fee records and management',
      gradient: 'from-blue-500 to-cyan-600',
      permission: null
    },
    { 
      id: 'fee-records', 
      label: 'Fee Records', 
      icon: FileText, 
      description: 'Manage fee records and payments',
      gradient: 'from-purple-500 to-pink-600',
      permission: 'manage_fees'
    },
    { 
      id: 'structures', 
      label: 'Structures', 
      icon: Building2, 
      description: 'Fee structures and categories',
      gradient: 'from-amber-500 to-orange-600',
      permission: 'manage_fees'
    },
    { 
      id: 'collections', 
      label: 'Collections', 
      icon: Wallet, 
      description: 'Fee collections and receipts',
      gradient: 'from-cyan-500 to-blue-600',
      permission: 'manage_fees'
    },
    { 
      id: 'discounts', 
      label: 'Discounts', 
      icon: Gift, 
      description: 'Discounts and waivers management',
      gradient: 'from-rose-500 to-pink-600',
      permission: 'manage_fees'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: TrendingUp, 
      description: 'Fee reports and analytics',
      gradient: 'from-teal-500 to-emerald-600',
      permission: 'manage_fees'
    },
    { 
      id: 'invoices', 
      label: 'Invoices', 
      icon: FileText, 
      description: 'Invoice generation and management',
      gradient: 'from-violet-500 to-purple-600',
      permission: 'manage_fees'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell, 
      description: 'Fee notifications and reminders',
      gradient: 'from-orange-500 to-red-600',
      permission: 'manage_fees'
    },
  ].filter(tab => {
    if (!tab.permission) return true;
    return hasPermission(tab.permission as any);
  });

  // Build handler context incrementally
  const ctx: FeeContext = { ...state, theme, feeCollections: state.feeCollections, canManageFees };
  Object.assign(ctx, createFeeDataHandlers(ctx));
  Object.assign(ctx, createFeeActionHandlers(ctx));

  // Destructure for JSX
  const {
    activeTab,
    setActiveTab,
    feeStructureForm,
    feeStructures,
    setFeeStructures,
    handleCreateFeeStructure,
    setFeeStructureForm,
    setShowFeeStructureModal,
    showFeeStructureModal,
    showColumnSettings,
    columnSettings,
    selectedColumns,
    toggleColumn,
    resetColumns,
    moveColumn,
    setShowColumnSettings,
    reorderColumns,
    isClient,
    setIsClient: setIsClientTyped,
    selectedStudents,
    studentFeeSummaries,
    includeArchivedStudents,
  } = ctx as typeof ctx & {
    setIsClient: (value: boolean) => void;
    isClient: boolean;
    setActiveTab: (value: string) => void;
    activeTab: string;
    toggleColumn: (key: string, direction: 'up' | 'down') => void;
    moveColumn: (key: string, direction: 'up' | 'down') => void;
    reorderColumns: (newOrder: string[]) => void;
    selectedStudents: string[];
    studentFeeSummaries: unknown[];
  };

  // Initialize client-side rendering
  useEffect(() => {
    setIsClientTyped(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout currentPage="fees" title="Fees Management">
      <div className="space-y-0 pb-6">
        {/* Header - Title + Collect Fee Button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Fees Management
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage fee collections, structures, and student payments
            </p>
          </div>
          {canManageFees && (
            <button
              onClick={() => window.location.href = '/fee-collection'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-lg"
            >
              <Wallet className="w-4 h-4" />
              Collect Fee
            </button>
          )}
        </div>

        {/* Modern Tabs - Matching Student Page */}
        <div className="relative mb-4">
          <div className={`flex space-x-1 p-1 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            {FEE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 relative overflow-hidden group ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                    : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:scale-105`
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeFeeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-100`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">
                  <tab.icon className="w-4 h-4" />
                </span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Description */}
          <div className="mt-4 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {FEE_TABS.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Overview Tab - Dashboard Only */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FeeDashboard ctx={ctx} />
          </motion.div>
        )}

        {/* Tab Content */}
        {activeTab !== 'overview' && (
          <>
            {/* Filters bar (All Students only) */}
            {activeTab === 'all-students' && <FeeFilters ctx={ctx} />}

            {activeTab === 'invoices' ? (
              <FeeInvoiceManagerOptimized theme={theme} activeTab={activeTab} />
            ) : activeTab === 'notifications' ? (
              <FeeNotificationManager theme={theme} />
            ) : activeTab === 'discounts' ? (
              <DiscountManagement theme={theme} />
            ) : (
              <FeeTabContent 
                ctx={ctx} 
                onOpenFeeCollection={handleOpenFeeCollection}
              />
            )}
          </>
        )}
      </div>

            {useEnhancedModal ? (
              <EnhancedFeeStructureModal 
                feeStructureForm={feeStructureForm} 
                handleCreateFeeStructure={handleCreateFeeStructure} 
                setFeeStructureForm={setFeeStructureForm} 
                setShowFeeStructureModal={setShowFeeStructureModal} 
                showFeeStructureModal={showFeeStructureModal} 
                theme={theme}
              />
            ) : (
              <FeeStructureModal 
                feeStructureForm={feeStructureForm} 
                handleCreateFeeStructure={handleCreateFeeStructure} 
                setFeeStructureForm={setFeeStructureForm} 
                setShowFeeStructureModal={setShowFeeStructureModal} 
                showFeeStructureModal={showFeeStructureModal} 
                theme={theme}
              />
            )}
      <FeeColumnSettingsModal 
        columnSettings={columnSettings}
        resetColumns={resetColumns}
        setShowColumnSettings={setShowColumnSettings}
        showColumnSettings={showColumnSettings}
        theme={theme}
        toggleColumn={toggleColumn}
        visibleColumns={selectedColumns}
        moveColumn={moveColumn}
        reorderColumns={reorderColumns}
      />
      
      {/* Fee Collection Modal */}
      {feeCollectionModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className={`relative w-full max-w-6xl mx-4 overflow-hidden rounded-2xl border shadow-lg ${
            theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Fee Collection - {feeCollectionModal.selectedStudent?.studentName || feeCollectionModal.selectedStudent?.name}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feeCollectionModal.selectedStudent?.studentClass || feeCollectionModal.selectedStudent?.class}
                  </p>
                </div>
                <button
                  onClick={handleCloseFeeCollection}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  ✖️ Close
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {feeCollectionModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Loading fee data...
                    </p>
                  </div>
                </div>
              ) : feeCollectionModal.feeData && feeCollectionModal.selectedStudent ? (
                <EnhancedFeeCollection
                  theme={theme}
                  studentId={feeCollectionModal.selectedStudent.studentId}
                  studentData={feeCollectionModal.feeData}
                  onClose={handleCloseFeeCollection}
                  onPaymentSuccess={handleRefreshFeeData}
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Failed to load fee data. Please try again.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Fee Assignment Modal */}
      {showBulkAssignmentModal && (
        <BulkFeeAssignmentForm
          theme={theme}
          onClose={() => setShowBulkAssignmentModal(false)}
          onSuccess={() => {
            setShowBulkAssignmentModal(false);
            // Refresh data or show success message
          }}
        />
      )}

      {/* Search Performance Monitor */}
      <SearchPerformanceMonitor 
        theme={theme} 
        engine={FeeSearchEngine.getInstance()} 
      />
    </AppLayout>
  );
}
