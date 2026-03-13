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
import { useFeeState } from './hooks/useFeeState';
import { createFeeDataHandlers } from './handlers/feeDataHandlers';
import { createFeeActionHandlers } from './handlers/feeActionHandlers';
import FeeCollectionModal from './components/FeeCollectionModal';
import FeeDashboard from './components/FeeDashboard';
import FeeTabContent from './components/FeeTabContent';
import FeeStructureModal from './components/FeeStructureModal';
import FeeInvoiceManager from './components/FeeInvoiceManager';
import FeeFinancialAnalytics from './components/FeeFinancialAnalytics';
import FeeNotificationManager from './components/FeeNotificationManager';
import StudentFinancialProfile from './components/StudentFinancialProfile';
import FeeWorkflows from './components/FeeWorkflows';

export default function FeesPage() {
  const state = useFeeState();
  const [showInvoices, setShowInvoices] = useState(false);
  const [showFinancialAnalytics, setShowFinancialAnalytics] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [showFeeWorkflows, setShowFeeWorkflows] = useState(false);

  // Build handler context incrementally
  const ctx: any = { ...state };
  Object.assign(ctx, createFeeDataHandlers(ctx));
  Object.assign(ctx, createFeeActionHandlers(ctx));

  // Destructure for JSX
  const {
    activeTab,
    advancedFilters,
    collectionForm,
    currentPage,
    dashboardCollapsed,
    discounts,
    feeCollections,
    feeStructureForm,
    feeStructures,
    filteredFeeRecords,
    filteredStudentSummaries,
    handleCollectFee,
    handleCreateFeeStructure,
    isMobile,
    mobileView,
    pageSize,
    prepareFeeCategoryData,
    prepareMonthlyCollectionData,
    preparePaymentMethodData,
    recentActivities,
    searchAnalytics,
    searchTerm,
    selectedClass,
    selectedStatus,
    selectedStudents,
    setActiveTab,
    setAdvancedFilters,
    setCollectionForm,
    setDashboardCollapsed,
    setFeeStructureForm,
    setMobileView,
    setPageSize,
    setSearchAnalytics,
    setSearchTerm,
    setSelectedClass,
    setSelectedStatus,
    setSelectedStudents,
    setShowAdvancedFilters,
    setShowBulkCollectionModal,
    setShowBulkDiscountModal,
    setShowCollectionModal,
    setShowColumnSettings,
    setShowExportModal,
    setShowFeeStructureModal,
    setShowImportModal,
    setShowReceiptModal,
    setTheme,
    showAdvancedFilters,
    showCollectionModal,
    showColumnSettings,
    showFeeStructureModal,
    stats,
    studentFeeSummaries,
    theme,
    initializeMockData,
    isClient,
    setIsClient,
  } = ctx;

  // Initialize data (moved from handler - React hooks must be in component)
  useEffect(() => {
    setIsClient(true);
    initializeMockData();
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout 
      currentPage="fees" 
      title="Fees Management"
      theme={theme}
      onThemeChange={setTheme}
    >
        <FeeDashboard ctx={ctx} />

        {/* Tabs */}
        <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'all-students', label: 'All Students Fees', icon: '👥' },
              { id: 'fee-records', label: 'Fee Records', icon: '📋' },
              { id: 'structures', label: 'Fee Structures', icon: '🏗️' },
              { id: 'collections', label: 'Collections', icon: '💵' },
              { id: 'discounts', label: 'Discounts', icon: '🎁' },
              { id: 'reports', label: 'Reports', icon: '📈' },
              { id: 'invoices', label: 'Invoices', icon: '🧾' },
              { id: 'analytics', label: 'Analytics', icon: '📉' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'student-profile', label: 'Student Profile', icon: '👤' },
              { id: 'workflows', label: 'Workflows', icon: '🔄' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : theme === 'dark'
                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'invoices' ? (
          <FeeInvoiceManager theme={theme} />
        ) : activeTab === 'analytics' ? (
          <FeeFinancialAnalytics theme={theme} />
        ) : activeTab === 'notifications' ? (
          <FeeNotificationManager theme={theme} />
        ) : activeTab === 'student-profile' ? (
          <StudentFinancialProfile theme={theme} />
        ) : activeTab === 'workflows' ? (
          <FeeWorkflows theme={theme} />
        ) : (
          <FeeTabContent ctx={ctx} />
        )}

      <FeeCollectionModal collectionForm={collectionForm} feeStructures={feeStructures} handleCollectFee={handleCollectFee} setCollectionForm={setCollectionForm} setShowCollectionModal={setShowCollectionModal} showCollectionModal={showCollectionModal} theme={theme} />
      <FeeStructureModal feeStructureForm={feeStructureForm} handleCreateFeeStructure={handleCreateFeeStructure} setFeeStructureForm={setFeeStructureForm} setShowFeeStructureModal={setShowFeeStructureModal} showFeeStructureModal={showFeeStructureModal} theme={theme} />
    </AppLayout>
  );
}
