'use client';

import React, { useState } from 'react';
import DiscountRequestForm from './DiscountRequestForm';
import DiscountApprovalQueue from './DiscountApprovalQueue';
import DiscountAuditLog from './DiscountAuditLog';

interface DiscountManagementProps {
  theme: 'dark' | 'light';
  userRole: string;
}

export default function DiscountManagement({ theme, userRole }: DiscountManagementProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'approvals' | 'audit'>('requests');
  const [showForm, setShowForm] = useState(false);

  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const bgCard = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Discount Management</h2>
          <p className={`text-sm ${textSecondary}`}>Manage fee discounts, approvals, and audit trails</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          + New Discount Request
        </button>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'requests'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          My Requests
        </button>
        {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'principal') && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'approvals'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Approval Queue
          </button>
        )}
        {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'principal') && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Audit Logs
          </button>
        )}
      </div>

      <div className={`p-6 rounded-xl border ${bgCard}`}>
        {activeTab === 'requests' && <DiscountApprovalQueue theme={theme} userRole={userRole} viewMode="my_requests" />}
        {activeTab === 'approvals' && <DiscountApprovalQueue theme={theme} userRole={userRole} viewMode="all" />}
        {activeTab === 'audit' && <DiscountAuditLog theme={theme} />}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${bgCard}`}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${textPrimary}`}>New Discount Request</h2>
              <button
                onClick={() => setShowForm(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
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
