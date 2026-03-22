// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeeState } from '../fees/hooks/useFeeState';
import { createFeeDataHandlers } from '../fees/handlers/feeDataHandlers';
import EnhancedFeeCollection from '../fees/components/EnhancedFeeCollection';

export default function FeeCollectionPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const feeState = useFeeState();
  const feeHandlers = createFeeDataHandlers(feeState);

  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    setIsClient(true);
    feeState.setIsClient(true);
    // Load all students including archived ones for fee collection
    console.log('Fee collection: Loading all students including archived...');
    feeState.loadAllStudentsData(1, 100, true);
  }, []);

  // Ensure fee collection always includes archived students (they might have outstanding fees)
  useEffect(() => {
    if (isClient && feeState.studentFeeSummaries.length === 0) {
      console.log('Fee collection: No students found, reloading with archived=true...');
      feeState.loadAllStudentsData(1, 100, true);
    } else if (isClient) {
      console.log(`Fee collection: Loaded ${feeState.studentFeeSummaries.length} students`);
    }
  }, [isClient, feeState.studentFeeSummaries.length]);

  useEffect(() => {
    if (!isClient) return;
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('studentId');
    if (sid) {
      setStudentId(sid);
    }
  }, [isClient]);

  useEffect(() => {
    if (studentId && feeState.studentFeeSummaries.length > 0) {
      const found = feeState.studentFeeSummaries.find(s => s.studentId === studentId);
      if (found) setSelectedStudent(found);
    }
  }, [studentId, feeState.studentFeeSummaries]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return feeState.studentFeeSummaries;
    const q = searchQuery.toLowerCase();
    return feeState.studentFeeSummaries.filter(s =>
      s.studentName?.toLowerCase().includes(q) ||
      s.rollNo?.toLowerCase().includes(q) ||
      s.studentClass?.toLowerCase().includes(q)
    );
  }, [searchQuery, feeState.studentFeeSummaries]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fully_paid': return isDark ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-green-50 text-green-700 border-green-200';
      case 'partially_paid': return isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'overdue': return isDark ? 'bg-red-900/30 text-red-400 border-red-700' : 'bg-red-50 text-red-700 border-red-200';
      default: return isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentId(student.studentId);
    setSearchQuery('');
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentId(null);
    setSearchQuery('');
    router.replace('/fee-collection');
  };

  if (!isClient) return null;

  // Show loading state while data is being fetched
  if (feeState.isLoading) {
    return (
      <AppLayout currentPage="fee-collection" title="Fee Collection">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading fee data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="fee-collection" title="Fee Collection">
      <div className="space-y-6 pb-6">

        {/* Page Header */}
        <div className={`px-6 pt-6 pb-4 border-b ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>💰 Fee Collection</h1>
              <p className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {selectedStudent
                  ? `Collecting fees for ${selectedStudent.studentName}`
                  : 'Search for a student to collect fees'}
              </p>
            </div>
            {selectedStudent && (
              <button
                onClick={handleClearStudent}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                ← Change Student
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Student Search — shown only when no student selected AND no studentId in URL */}
        <AnimatePresence mode="wait">
          {!selectedStudent && !studentId ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="px-6 space-y-6"
            >
              {/* Search Box */}
              <div className={`rounded-xl border p-6 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Find Student</h2>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, roll number or class..."
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Student Results */}
              <div className={`rounded-xl border overflow-hidden ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`px-6 py-3 border-b ${
                  isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'
                }`}>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                  </span>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No students match your search</p>
                  </div>
                ) : (
                  <div className="divide-y ${
                    isDark ? 'divide-gray-700' : 'divide-gray-100'
                  }">
                    {filteredStudents.map(student => (
                      <motion.button
                        key={student.studentId}
                        whileHover={{ x: 4 }}
                        onClick={() => handleSelectStudent(student)}
                        className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {student.studentName?.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>{student.studentName}</p>
                            <p className={`text-xs mt-0.5 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Roll No: {student.rollNo} &nbsp;·&nbsp; Class {student.studentClass}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>Pending</p>
                            <p className={`text-sm font-semibold ${
                              student.totalPending > 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              ₹{(student.totalPending || 0).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full border font-medium ${
                            getStatusColor(student.paymentStatus)
                          }`}>
                            {student.paymentStatus?.replace('_', ' ')}
                          </span>
                          <span className={isDark ? 'text-gray-500' : 'text-gray-300'}>›</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Step 2: Fee Collection for selected student */
            <motion.div
              key="collection"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="px-6 space-y-6"
            >
              {/* Student Info Banner */}
              {selectedStudent ? (
                <div className={`rounded-xl border p-5 flex items-center justify-between ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {selectedStudent.studentName?.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedStudent.studentName}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Roll No: {selectedStudent.rollNo} &nbsp;·&nbsp; Class {selectedStudent.studentClass}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Fees</p>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{(selectedStudent.totalFees || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Paid</p>
                      <p className="font-bold text-green-500">₹{(selectedStudent.totalPaid || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
                      <p className="font-bold text-red-500">₹{(selectedStudent.totalPending || 0).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full border font-medium ${getStatusColor(selectedStudent.paymentStatus)}`}>
                      {selectedStudent.paymentStatus?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl border p-5 flex items-center gap-4 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse" />
                  <div className="space-y-2">
                    <div className={`h-4 w-40 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
                    <div className={`h-3 w-28 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
                  </div>
                </div>
              )}

              {/* Fee Collection Component */}
              <EnhancedFeeCollection
                theme={theme}
                studentId={studentId}
                studentData={selectedStudent}
                onClose={handleClearStudent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
