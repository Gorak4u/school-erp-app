// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import EmptyState from './EmptyState';

interface MobileFeeTableProps {
  filteredStudentSummaries: any[];
  selectedStudents: string[];
  setSelectedStudents: (students: string[]) => void;
  theme: 'dark' | 'light';
  isLoading: boolean;
  onCollectFee: (studentId: string) => void;
  onViewProfile: (studentId: string) => void;
  onViewWorkflows: (studentId: string) => void;
}

export default function MobileFeeTable({
  filteredStudentSummaries,
  selectedStudents,
  setSelectedStudents,
  theme,
  isLoading,
  onCollectFee,
  onViewProfile,
  onViewWorkflows
}: MobileFeeTableProps) {
  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fully_paid': return 'bg-green-100 text-green-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'no_payment': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(
      selectedStudents.includes(studentId)
        ? selectedStudents.filter(id => id !== studentId)
        : [...selectedStudents, studentId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={textSecondary}>Loading students...</p>
        </div>
      </div>
    );
  }

  if (filteredStudentSummaries.length === 0) {
    return (
      <EmptyState
        theme={theme}
        icon="👥"
        title="No Students Found"
        description="No students match your current filters."
        action={{
          label: "Clear Filters",
          onClick: () => {
            // This would need to be passed as a prop
            console.log('Clear filters');
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-4 px-4">
      {filteredStudentSummaries.map((student, index) => (
        <motion.div
          key={student.studentId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`${cardCls} rounded-xl p-4 border ${
            selectedStudents.includes(student.studentId) 
              ? 'ring-2 ring-blue-500' 
              : ''
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.studentId)}
                onChange={() => toggleStudentSelection(student.studentId)}
                className={`rounded border-gray-300 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
              <div>
                <h3 className={`font-semibold ${textPrimary}`}>{student.studentName}</h3>
                <p className={`text-sm ${textSecondary}`}>
                  {student.studentClass} • {student.rollNo}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(student.paymentStatus || 'no_payment')}`}>
              {(student.paymentStatus || 'no_payment').replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Fee Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${textSecondary} mb-1`}>Total Fees</p>
              <p className={`font-semibold ${textPrimary}`}>₹{student.totalFees?.toLocaleString() || 0}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${textSecondary} mb-1`}>Pending</p>
              <p className={`font-semibold text-red-600`}>₹{student.totalPending?.toLocaleString() || 0}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${textSecondary} mb-1`}>Overdue</p>
              <p className={`font-semibold text-orange-600`}>₹{student.totalOverdue?.toLocaleString() || 0}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${textSecondary} mb-1`}>Last Payment</p>
              <p className={`text-sm ${textPrimary}`}>
                {student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = `/fee-collection?studentId=${student.studentId}`}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              💰 Collect
            </button>
            <button
              onClick={() => onViewProfile(student.studentId)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              👤 Profile
            </button>
            <button
              onClick={() => onViewWorkflows(student.studentId)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              ⚙️ Workflows
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
