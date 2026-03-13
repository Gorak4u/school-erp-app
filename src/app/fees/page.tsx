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
import FeeDashboard from './components/FeeDashboard';
import FeeFilters from './components/FeeFilters';
import FeeTabContent from './components/FeeTabContent';
import FeeStructureModal from './components/FeeStructureModal';
import FeeColumnSettingsModal from './components/FeeColumnSettingsModal';
import StudentWorkflows from './components/StudentWorkflows';
import EnhancedFeeCollection from './components/EnhancedFeeCollection';
import FeeInvoiceManager from './components/FeeInvoiceManager';
import FeeFinancialAnalytics from './components/FeeFinancialAnalytics';
import FeeNotificationManager from './components/FeeNotificationManager';
import StudentFinancialProfile from './components/StudentFinancialProfile';
import FeeWorkflows from './components/FeeWorkflows';
import { useTheme } from '@/contexts/ThemeContext';

export default function FeesPage() {
  const { theme } = useTheme();
  const state = useFeeState();

  // Build handler context incrementally
  const ctx: any = { ...state, theme };
  Object.assign(ctx, createFeeDataHandlers(ctx));
  Object.assign(ctx, createFeeActionHandlers(ctx));

  // Destructure for JSX
  const {
    activeTab,
        feeStructureForm,
    feeStructures,
    handleCreateFeeStructure,
    setFeeStructureForm,
    setShowFeeStructureModal,
    showFeeStructureModal,
    showColumnSettings,
    columnSettings,
    selectedColumns,
    toggleColumn,
    resetColumns,
    setShowColumnSettings,
    initializeMockData,
    isClient,
    setIsClient,
    selectedStudents,
    studentFeeSummaries,
  } = ctx;

  // Initialize data
  useEffect(() => {
    setIsClient(true);
    initializeMockData();
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout currentPage="fees" title="Fees Management">
      <div className="space-y-0 pb-6">
        {/* Dashboard Section — same pattern as Students page */}
        <FeeDashboard ctx={ctx} />

        {/* Filters bar (search + dropdowns + action buttons) */}
        <FeeFilters ctx={ctx} />

        {/* Tab Navigation — outside the filter tile, above the data table */}
        <div className={`flex gap-1 overflow-x-auto mb-4 pb-1 scrollbar-hide`}>
          {[
            { id: 'all-students', label: '👥 All Students' },
            { id: 'fee-records', label: '📋 Fee Records' },
            { id: 'structures', label: '🏗️ Structures' },
            { id: 'collections', label: '💵 Collections' },
            { id: 'discounts', label: '🎁 Discounts' },
            { id: 'reports', label: '📈 Reports' },
            { id: 'invoices', label: '🧾 Invoices' },
            { id: 'analytics', label: '📉 Analytics' },
            { id: 'notifications', label: '🔔 Notifications' },
                      ].map(tab => (
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
          <FeeInvoiceManager theme={theme} />
        ) : activeTab === 'analytics' ? (
          <FeeFinancialAnalytics theme={theme} />
        ) : activeTab === 'notifications' ? (
          <FeeNotificationManager theme={theme} />
        ) : (
          <FeeTabContent ctx={ctx} />
        )}
      </div>

            <FeeStructureModal feeStructureForm={feeStructureForm} handleCreateFeeStructure={handleCreateFeeStructure} setFeeStructureForm={setFeeStructureForm} setShowFeeStructureModal={setShowFeeStructureModal} showFeeStructureModal={showFeeStructureModal} theme={theme} />
      <FeeColumnSettingsModal 
        columnSettings={columnSettings}
        resetColumns={resetColumns}
        setShowColumnSettings={setShowColumnSettings}
        showColumnSettings={showColumnSettings}
        theme={theme}
        toggleColumn={toggleColumn}
        visibleColumns={selectedColumns}
      />
      
      {/* Student Profile Modal */}
      {activeTab === 'student-profile' && selectedStudents.length === 1 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="sticky top-0 flex justify-between items-center p-6 border-b">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Student Financial Profile
              </h2>
              <button
                onClick={() => setActiveTab('all-students')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <StudentFinancialProfile 
                theme={theme} 
                studentId={selectedStudents[0]}
                studentData={studentFeeSummaries.find(s => s.studentId === selectedStudents[0])}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Student Workflows Modal */}
      {activeTab === 'workflows' && selectedStudents.length === 1 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="sticky top-0 flex justify-between items-center p-6 border-b">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Student Workflows
              </h2>
              <button
                onClick={() => setActiveTab('all-students')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <StudentWorkflows 
                theme={theme} 
                studentData={studentFeeSummaries.find(s => s.studentId === selectedStudents[0])}
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
