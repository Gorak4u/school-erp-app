// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface StudentTableProps {
  activeTab: string;
  currentPage: number;
  filteredStudents: Student[];
  handleDeleteStudent: (id: number) => void;
  isMobile: boolean;
  mobileView: string;
  pageSize: number;
  selectedStudents: number[];
  setActiveTab: (v: string) => void;
  setCurrentPage: (v: number) => void;
  setEditingStudent: (v: Student | null) => void;
  setSelectedStudent: (v: Student | null) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  setSortConfig: (v: any) => void;
  theme: 'dark' | 'light';
  toggleAllStudentsSelection: () => void;
  toggleStudentSelection: (id: number) => void;
  totalPages: number;
  visibleColumns: string[];
}

export default function StudentTable({
  activeTab, currentPage, filteredStudents, handleDeleteStudent, isMobile,
  mobileView, pageSize, selectedStudents, setActiveTab, setCurrentPage,
  setEditingStudent, setSelectedStudent, sortConfig, setSortConfig, theme,
  toggleAllStudentsSelection, toggleStudentSelection, totalPages, visibleColumns
}: StudentTableProps) {

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal = a[key];
    let bVal = b[key];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedStudents = sortedStudents.slice(startIdx, startIdx + pageSize);
  const actualTotalPages = Math.ceil(filteredStudents.length / pageSize) || 1;

  const tabs = [
    { key: 'overview', label: '📋 Overview' },
    { key: 'academics', label: '📚 Academics' },
    { key: 'attendance', label: '📊 Attendance' },
    { key: 'fees', label: '💰 Fees' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'graduated': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'transferred': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getAttendanceColor = (pct: number) => {
    if (pct >= 90) return 'text-green-500';
    if (pct >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  const columnHeaders = [
    { key: 'select', label: '', sortable: false },
    { key: 'photo', label: 'Photo', sortable: false },
    { key: 'admissionNo', label: 'Adm. No', sortable: true },
    { key: 'rollNo', label: 'Roll No', sortable: true },
    { key: 'name', label: 'Student Name', sortable: true },
    { key: 'parents', label: 'Parents', sortable: false },
    { key: 'phoneNumbers', label: 'Phone Numbers', sortable: false },
    { key: 'class', label: 'Class', sortable: true },
    { key: 'address', label: 'Address', sortable: false },
    { key: 'attendance', label: 'Attendance', sortable: false },
    { key: 'grade', label: 'Grade', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false },
  ];

  return (
    <>
      {/* Navigation Tabs */}
      <div className={`flex gap-1 mb-4 p-1 rounded-xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Student Table */}
      <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Mobile Card View */}
        {isMobile && mobileView !== 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {paginatedStudents.map(student => (
              <motion.div
                key={student.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'}`}
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{student.name}</h4>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{student.admissionNo} | Class {student.class}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(student.status)}`}>{student.status}</span>
                  <span className={`text-xs font-medium ${getAttendanceColor(student.attendance?.percentage || 0)}`}>{student.attendance?.percentage || 0}%</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => window.location.href = `/fee-collection?studentId=${student.id}`}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    💰 Fee
                  </button>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    👁️ View
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  {columnHeaders.filter(h => visibleColumns.includes(h.key)).map(header => (
                    <th
                      key={header.key}
                      onClick={() => header.sortable && handleSort(header.key)}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                        header.sortable ? 'cursor-pointer hover:text-blue-500' : ''
                      } ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      <div className="flex items-center gap-1">
                        {header.key === 'select' ? (
                          <input
                            type="checkbox"
                            checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.includes(s.id))}
                            onChange={toggleAllStudentsSelection}
                            className="rounded"
                          />
                        ) : (
                          <>
                            {header.label}
                            {sortConfig?.key === header.key && (
                              <span className="text-blue-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="px-4 py-12 text-center">
                      <div className={`text-lg ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        No students found matching your criteria
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student, idx) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`transition-colors ${
                        selectedStudents.includes(student.id)
                          ? theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
                          : theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {visibleColumns.includes('select') && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="rounded"
                          />
                        </td>
                      )}
                      {visibleColumns.includes('photo') && (
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('admissionNo') && (
                        <td className={`px-4 py-3 font-mono text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {student.admissionNo}
                        </td>
                      )}
                      {visibleColumns.includes('rollNo') && (
                        <td className={`px-4 py-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {student.rollNo}
                        </td>
                      )}
                      {visibleColumns.includes('name') && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className={`font-semibold hover:text-blue-500 transition-colors text-left ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                          >
                            {student.name}
                          </button>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{student.email}</div>
                        </td>
                      )}
                      {visibleColumns.includes('parents') && (
                        <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="font-medium">{student.fatherName || student.parentName || 'N/A'}</div>
                          <div className="text-xs opacity-70">{student.motherName || 'N/A'}</div>
                        </td>
                      )}
                      {visibleColumns.includes('phoneNumbers') && (
                        <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="font-medium">
                            {student.fatherPhone ? (
                              <>
                                <span className="text-blue-500">Father:</span> {student.fatherPhone}
                              </>
                            ) : 'N/A'}
                          </div>
                          <div className="text-xs opacity-70">
                            {student.emergencyContact ? (
                              <>
                                <span className="text-red-500">Emergency:</span> {student.emergencyContact}
                              </>
                            ) : 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('class') && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {student.class}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('address') && (
                        <td className={`px-4 py-3 text-xs max-w-[150px] truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {student.address}
                        </td>
                      )}
                      {visibleColumns.includes('attendance') && (
                        <td className="px-4 py-3">
                          <span className={`font-semibold text-sm ${getAttendanceColor(student.attendance?.percentage || 0)}`}>
                            {student.attendance?.percentage || 0}%
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('grade') && (
                        <td className={`px-4 py-3 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {student.gpa ? student.gpa.toFixed(1) : 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('status') && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('actions') && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => window.location.href = `/fee-collection?studentId=${student.id}`}
                              className="p-1 rounded hover:bg-green-500/10 text-green-500 transition-colors"
                              title="Collect Fee"
                            >
                              💰
                            </button>
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="p-1 rounded hover:bg-blue-500/10 text-blue-500 transition-colors"
                              title="View Profile"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => setEditingStudent(student)}
                              className="p-1 rounded hover:bg-amber-500/10 text-amber-500 transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete ${student.name}?`)) {
                                  handleDeleteStudent(student.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className={`flex items-center justify-between px-4 py-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {startIdx + 1}-{Math.min(startIdx + pageSize, filteredStudents.length)} of {filteredStudents.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, actualTotalPages) }, (_, i) => {
              let pageNum;
              if (actualTotalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= actualTotalPages - 2) {
                pageNum = actualTotalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(actualTotalPages, currentPage + 1))}
              disabled={currentPage >= actualTotalPages}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                currentPage >= actualTotalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
