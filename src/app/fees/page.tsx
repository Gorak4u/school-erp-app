// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import PaymentReceipt from './components/PaymentReceipt';
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
  const [showDetailedReceipt, setShowDetailedReceipt] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any>(null);
  const [useEnhancedModal, setUseEnhancedModal] = useState(true); // Toggle between modals
  
  // Permission-based access control
  const { 
    hasPermission, 
    isAdmin, 
    isTeacher,
    permissions 
  } = usePermissions();

  const canManageFees = isAdmin || hasPermission('manage_fees');

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
          <FeeTabContent ctx={ctx} />
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
      
      
      {/* Detailed Receipt Modal */}
      {showDetailedReceipt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailedReceipt(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full h-full max-w-6xl max-h-[90vh] overflow-hidden bg-white rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PaymentReceipt
              theme={theme}
              studentData={{
                name: 'Rahul Sharma',
                studentClass: '10-A',
                admissionNo: 'ADM-2023-045',
                parentName: 'Mr. Rajesh Sharma',
                previousYearPending: {
                  '2023-24': {
                    total: 85000,
                    paid: 75000,
                    discount: 0,
                    pending: 10000,
                    overdueFees: ['Transport Fee', 'Sports Fee'],
                    lastPaymentDate: '2024-02-15'
                  }
                }
              }}
              paymentData={{
                currentYearFees: [{
                  name: 'Tuition Fee',
                  category: 'Academic',
                  totalAmount: 50000,
                  paidAmount: 25000,
                  discount: 0,
                  balance: 25000,
                  status: 'partial'
                }]
              }}
              receiptNumber={selectedPaymentForReceipt?.receipt || 'RCPT-2024-DEFAULT'}
              paymentDate={selectedPaymentForReceipt?.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              paymentMethod={selectedPaymentForReceipt?.method || 'Unknown'}
              onPrint={() => window.print()}
              onDownload={() => {
  const filename = `Receipt_${(selectedPaymentForReceipt?.receipt || 'RCPT-DEFAULT').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  PDFGenerator.generateFromElement('receipt-print', filename);
}}
              onClose={() => setShowDetailedReceipt(false)}
            />
          </motion.div>
        </motion.div>
      )}
      
      {/* Search Performance Monitor */}
      <SearchPerformanceMonitor 
        theme={theme} 
        engine={FeeSearchEngine.getInstance()} 
      />
    </AppLayout>
  );
}
