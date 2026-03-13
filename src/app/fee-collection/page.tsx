// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeeState } from '../fees/hooks/useFeeState';
import { createFeeDataHandlers } from '../fees/handlers/feeDataHandlers';
import EnhancedFeeCollection from '../fees/components/EnhancedFeeCollection';
import ErrorBoundary from '../fees/components/ErrorBoundary';

export default function FeeCollectionPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const feeState = useFeeState();
  const feeHandlers = createFeeDataHandlers(feeState);

  // Get student data from URL params or state
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentIdParam = urlParams.get('studentId');
    
    if (studentIdParam) {
      setStudentId(studentIdParam);
      // Find student data
      const student = feeState.studentFeeSummaries.find(s => s.studentId === studentIdParam);
      setStudentData(student);
    }
  }, [feeState.studentFeeSummaries]);

  const ctx = {
    ...feeState,
    ...feeHandlers,
    theme,
    router
  };

  return (
    <ErrorBoundary theme={theme}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className={`mb-4 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              ← Back
            </button>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Fee Collection
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive fee collection and management system
            </p>
          </div>

          {/* Fee Collection Component */}
          <EnhancedFeeCollection
            theme={theme}
            studentId={studentId}
            studentData={studentData}
            onClose={() => router.back()}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
