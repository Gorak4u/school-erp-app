'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import DiscountRequestForm from './DiscountRequestForm';
import EnhancedDiscountApprovalQueue from './EnhancedDiscountApprovalQueue';
import EnhancedDiscountAuditLog from './EnhancedDiscountAuditLog';
import DiscountAnalytics from './DiscountAnalytics';

interface DiscountManagementProps {
  theme: 'dark' | 'light';
}

export default function DiscountManagement({ theme }: DiscountManagementProps) {
  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;
  const row = `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;

  const [activeTab, setActiveTab] = useState<'requests' | 'approvals' | 'audit' | 'analytics'>('requests');
  const [showForm, setShowForm] = useState(false);
  const { isAdmin, isSuperAdmin, hasPermission } = usePermissions();
  const canApproveDiscounts = isSuperAdmin || isAdmin || hasPermission('manage_fees');
  const canViewDiscounts = isAdmin || hasPermission('view_fees');
  const canCreateDiscounts = isAdmin || hasPermission('manage_fees');

  return (
    <div className={`space-y-6 ${card} p-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${isDark ? 'text-white' : 'text-gray-900'}`}>🎁 Discount Management</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Create, approve, and track fee discounts across the school</p>
        </div>
        
        {canCreateDiscounts && (
          <button
            onClick={() => setShowForm(true)}
            className={btnPrimary}
          >
            + New Discount Request
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6 pb-1 scrollbar-hide">
        {canViewDiscounts && (
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'requests' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            📝 My Requests
          </button>
        )}
        {canApproveDiscounts && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'approvals' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            ✅ Approval Queue
          </button>
        )}
        {canApproveDiscounts && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            📊 Audit Logs
          </button>
        )}
        {canApproveDiscounts && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            📈 Analytics
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'requests' && <EnhancedDiscountApprovalQueue theme={theme} canApproveDiscounts={canApproveDiscounts} viewMode="my_requests" />}
        {activeTab === 'approvals' && <EnhancedDiscountApprovalQueue theme={theme} canApproveDiscounts={canApproveDiscounts} viewMode="all" />}
        {activeTab === 'audit' && <EnhancedDiscountAuditLog theme={theme} />}
        {activeTab === 'analytics' && <DiscountAnalytics theme={theme} />}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${card}`}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>🎁 New Discount Request</h2>
              <button
                onClick={() => setShowForm(false)}
                className={`p-3 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <DiscountRequestForm theme={theme} onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
