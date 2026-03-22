// @ts-nocheck
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
import EnhancedFeeCollection from './components/EnhancedFeeCollection';
import FeeInvoiceManagerOptimized from './components/FeeInvoiceManager-Optimized';
import FeeFinancialAnalytics from './components/FeeFinancialAnalytics';
import FeeNotificationManager from './components/FeeNotificationManager';
import StudentFinancialProfile from './components/StudentFinancialProfile';
import FeeWorkflows from './components/FeeWorkflows';
import DiscountManagement from './components/discount/DiscountManagement';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, AdminOnly, RequirePermission } from '@/components/PermissionGuard';

export default function FeesPage() {
  const { theme } = useTheme();
  const state = useFeeState();
  const [useEnhancedModal, setUseEnhancedModal] = useState(true); // Toggle between modals
  
  // Fee Collection Modal State
  const [feeCollectionModal, setFeeCollectionModal] = useState({
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
      const response = await fetch(`/api/fees/students?includeArchived=${includeArchivedStudents}`);
      const data = await response.json();
      if (data.success && data.data?.students) {
        const studentFeeData = data.data.students.find(s => s.studentId === studentId);
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
        const response = await fetch(`/api/fees/students?includeArchived=${includeArchivedStudents}`);
        const data = await response.json();
        if (data.success && data.data?.students) {
          const studentFeeData = data.data.students.find(s => s.studentId === feeCollectionModal.selectedStudent.studentId);
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

  // Teachers see only All Students view; manage_fees unlocks everything else
  const availableTabs = [
    { id: 'all-students', label: '👥 All Students', permission: null },
    { id: 'fee-records', label: '📋 Fee Records', permission: 'manage_fees' },
    { id: 'structures', label: '🏗️ Structures', permission: 'manage_fees' },
    { id: 'collections', label: '💵 Collections', permission: 'manage_fees' },
    { id: 'discounts', label: '🎁 Discounts', permission: 'manage_fees' },
    { id: 'reports', label: '📈 Reports', permission: 'manage_fees' },
    { id: 'invoices', label: '🧾 Invoices', permission: 'manage_fees' },
    { id: 'analytics', label: '📉 Analytics', permission: 'manage_fees' },
    { id: 'notifications', label: '🔔 Notifications', permission: 'manage_fees' },
    { id: 'student-profile', label: '👤 Student Profile', permission: 'view_fees' },
  ].filter(tab => {
    if (!tab.permission) return true;
    return hasPermission(tab.permission);
  });

  // Build handler context incrementally
  const ctx: any = { ...state, theme, feeCollections: state.feeCollections, canManageFees };
  Object.assign(ctx, createFeeDataHandlers(ctx));
  Object.assign(ctx, createFeeActionHandlers(ctx));

  // Destructure for JSX
  const {
    activeTab,
    setActiveTab,
    feeStructureForm,
    feeStructures,
    setFeeStructures,
    setFeeRecords,
    setDiscounts,
    setFeeCollections,
    feeCollections,
    setStudentFeeSummaries,
    calculateStudentFeeSummaries,
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
    setIsClient,
    selectedStudents,
    studentFeeSummaries,
    includeArchivedStudents,
  } = ctx;

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout currentPage="fees" title="Fees Management">
      <div className="space-y-0 pb-6">
        {/* Dashboard Section */}
        <FeeDashboard ctx={ctx} />

        {/* Filters bar (search + dropdowns + action buttons) */}
        <FeeFilters ctx={ctx} />

        {/* Tab Navigation — outside the filter tile, above the data table */}
        <div className={`flex gap-1 overflow-x-auto mb-4 pb-1 scrollbar-hide`}>
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => ctx.setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : theme === 'dark'
                    ? 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'invoices' ? (
          <FeeInvoiceManagerOptimized theme={theme} activeTab={activeTab} />
        ) : activeTab === 'analytics' ? (
          <FeeFinancialAnalytics theme={theme} />
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
      
      {/* Student Profile Modal */}
      {activeTab === 'student-profile' && selectedStudents.length === 1 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-6xl max-h-[90vh] rounded-2xl border shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 flex justify-between items-center px-6 py-4 border-b ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Student Financial Profile
              </h2>
              <button
                onClick={() => setActiveTab('all-students')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-64px)] p-6">
              <StudentFinancialProfile 
                theme={theme} 
                studentId={selectedStudents[0]}
                studentData={studentFeeSummaries.find(s => s.studentId === selectedStudents[0])}
                onClose={() => setActiveTab('all-students')}
              />
            </div>
          </div>
        </div>
      )}
      
      
      {/* Fee Collection Modal */}
      {feeCollectionModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className={`relative w-full max-w-6xl mx-4 overflow-hidden rounded-2xl border shadow-lg ${
            theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
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
              ) : feeCollectionModal.feeData ? (
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

      {/* Search Performance Monitor */}
      <SearchPerformanceMonitor 
        theme={theme} 
        engine={FeeSearchEngine.getInstance()} 
      />
    </AppLayout>
  );
}
