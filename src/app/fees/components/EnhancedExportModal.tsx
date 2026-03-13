// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface EnhancedExportModalProps {
  theme: 'dark' | 'light';
  filteredStudentSummaries: any[];
  selectedStudents: string[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function EnhancedExportModal({ theme, filteredStudentSummaries, selectedStudents, onClose, onSuccess }: EnhancedExportModalProps) {
  const [exportType, setExportType] = useState<'excel' | 'pdf' | 'csv' | 'receipts'>('excel');
  const [dateRange, setDateRange] = useState<'current' | 'custom'>('current');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeOptions, setIncludeOptions] = useState({
    paidFees: true,
    pendingFees: true,
    overdueFees: true,
    paymentHistory: false,
    studentDetails: true,
    summaryStats: true,
    charts: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export process
      const steps = exportType === 'receipts' ? 5 : 3;
      
      for (let i = 0; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setExportProgress(Math.round((i / steps) * 100));
      }

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `fee-export-${timestamp}.${exportType === 'excel' ? 'xlsx' : exportType === 'pdf' ? 'pdf' : exportType === 'csv' ? 'csv' : 'zip'}`;

      // Simulate download
      const mockData = generateMockExportData();
      downloadFile(mockData, filename, exportType);

      onSuccess(`Export completed: ${filename}`);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateMockExportData = () => {
    const data = filteredStudentSummaries.filter(student => 
      selectedStudents.length === 0 || selectedStudents.includes(student.studentId)
    );

    if (exportType === 'csv') {
      const headers = ['Student Name', 'Class', 'Roll No', 'Total Fees', 'Paid Amount', 'Pending Amount', 'Overdue Amount', 'Status'];
      const csvContent = [
        headers.join(','),
        ...data.map(student => [
          student.studentName,
          student.studentClass,
          student.rollNo,
          student.totalFees,
          student.totalPaid,
          student.totalPending,
          student.totalOverdue,
          student.paymentStatus
        ].join(','))
      ].join('\n');
      
      return csvContent;
    }

    return JSON.stringify(data, null, 2);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { 
      type: type === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportFormats = [
    { id: 'excel', label: 'Excel Spreadsheet', icon: '📊', description: 'Detailed data with formatting' },
    { id: 'pdf', label: 'PDF Report', icon: '📄', description: 'Professional report format' },
    { id: 'csv', label: 'CSV Data', icon: '📋', description: 'Plain data for analysis' },
    { id: 'receipts', label: 'Payment Receipts', icon: '🧾', description: 'Individual payment receipts' }
  ];

  return (
    <div className={`rounded-xl ${cardCls} p-6 max-w-3xl mx-auto`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Export Fee Data</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          ✕
        </button>
      </div>

      {/* Export Format Selection */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-3 ${textPrimary}`}>Export Format</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exportFormats.map(format => (
            <button
              key={format.id}
              onClick={() => setExportType(format.id)}
              className={`p-4 rounded-lg border transition-all ${
                exportType === format.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : cardCls
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{format.icon}</span>
                <div className="text-left">
                  <div className={`font-medium ${textPrimary}`}>{format.label}</div>
                  <div className={`text-xs ${textSecondary}`}>{format.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-3 ${textPrimary}`}>Date Range</label>
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => setDateRange('current')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              dateRange === 'current'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : cardCls
            }`}
          >
            Current Period
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              dateRange === 'custom'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : cardCls
            }`}
          >
            Custom Range
          </button>
        </div>
        
        {dateRange === 'custom' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={`block text-xs mb-1 ${textSecondary}`}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-xs mb-1 ${textSecondary}`}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Include Options */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-3 ${textPrimary}`}>Include in Export</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries({
            paidFees: 'Paid Fees',
            pendingFees: 'Pending Fees', 
            overdueFees: 'Overdue Fees',
            paymentHistory: 'Payment History',
            studentDetails: 'Student Details',
            summaryStats: 'Summary Statistics',
            charts: 'Charts & Graphs'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOptions[key]}
                onChange={(e) => setIncludeOptions({ ...includeOptions, [key]: e.target.checked })}
                className="rounded"
              />
              <span className={`text-sm ${textPrimary}`}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Export Summary */}
      <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h4 className={`text-sm font-medium mb-2 ${textPrimary}`}>Export Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className={textSecondary}>Students:</span>
            <span className={`ml-2 font-medium ${textPrimary}`}>
              {selectedStudents.length > 0 ? selectedStudents.length : filteredStudentSummaries.length}
            </span>
          </div>
          <div>
            <span className={textSecondary}>Format:</span>
            <span className={`ml-2 font-medium ${textPrimary}`}>{exportType.toUpperCase()}</span>
          </div>
          <div>
            <span className={textSecondary}>Period:</span>
            <span className={`ml-2 font-medium ${textPrimary}`}>
              {dateRange === 'current' ? 'Current' : 'Custom'}
            </span>
          </div>
          <div>
            <span className={textSecondary}>Est. Size:</span>
            <span className={`ml-2 font-medium ${textPrimary}`}>
              ~{Math.round((selectedStudents.length || filteredStudentSummaries.length) * 0.5)}KB
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isExporting && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${textPrimary}`}>Exporting...</span>
            <span className={`text-sm ${textPrimary}`}>{exportProgress}%</span>
          </div>
          <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors`}
        >
          {isExporting ? 'Exporting...' : `Export ${exportType.toUpperCase()}`}
        </button>
        <button
          onClick={onClose}
          disabled={isExporting}
          className={`px-6 py-3 font-medium rounded-lg transition-colors ${cardCls} ${textPrimary} disabled:opacity-50`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
