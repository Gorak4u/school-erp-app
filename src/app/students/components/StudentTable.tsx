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
  columnSettings: any;
  onPromoteSingle?: (studentId: string) => void;
  onPromoteClass?: (cls: string, section: string) => void;
  onExitSingle?: (studentId: string) => void;
}

export default function StudentTable({
  activeTab, currentPage, filteredStudents, handleDeleteStudent, isMobile,
  mobileView, pageSize, selectedStudents, setActiveTab, setCurrentPage,
  setEditingStudent, setSelectedStudent, sortConfig, setSortConfig, theme,
  toggleAllStudentsSelection, toggleStudentSelection, totalPages, visibleColumns, columnSettings,
  onPromoteSingle, onPromoteClass, onExitSingle
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
      case 'locked': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getAttendanceColor = (pct: number) => {
    if (pct >= 90) return 'text-green-500';
    if (pct >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  // Helper function to render table cell content based on column key
  const renderTableCell = (student: Student, columnKey: string) => {
    switch (columnKey) {
      case 'select':
        return (
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={selectedStudents.includes(student.id)}
              onChange={() => toggleStudentSelection(student.id)}
              className="rounded"
            />
          </td>
        );
      
      case 'photo':
        return (
          <td className="px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              {student.name.charAt(0)}
            </div>
          </td>
        );
      
      case 'admissionNo':
        return (
          <td className={`px-4 py-3 font-mono text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.admissionNo || 'N/A'}
          </td>
        );
      
      case 'admissionDate':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.admissionDate || 'N/A'}
          </td>
        );
      
      case 'rollNo':
        return (
          <td className={`px-4 py-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.rollNo || 'N/A'}
          </td>
        );
      
      case 'name':
        return (
          <td className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              {(student.needsPromotion || student.status === 'locked') && (
                <span title="Needs promotion to current AY" className="text-orange-500 text-sm">🔒</span>
              )}
              <div>
                <button
                  onClick={() => setSelectedStudent(student)}
                  className={`font-semibold hover:text-blue-500 transition-colors text-left ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                  {student.name}
                </button>
                {(student.needsPromotion || student.status === 'locked') ? (
                  <div className="text-xs text-orange-500 font-medium">
                    AY: {student.academicYear} — promote required
                  </div>
                ) : (
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{student.email || 'N/A'}</div>
                )}
              </div>
            </div>
          </td>
        );
      
      case 'dateOfBirth':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.dateOfBirth || 'N/A'}
          </td>
        );
      
      case 'gender':
        return (
          <td className={`px-4 py-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
              student.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
              student.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {student.gender || 'N/A'}
            </span>
          </td>
        );
      
      case 'bloodGroup':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.bloodGroup || 'N/A'}
          </td>
        );
      
      case 'category':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.category || 'N/A'}
          </td>
        );
      
      case 'religion':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.religion || 'N/A'}
          </td>
        );
      
      case 'parents':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="font-medium">{student.fatherName || student.parentName || 'N/A'}</div>
            <div className="text-xs opacity-70">{student.motherName || 'N/A'}</div>
          </td>
        );
      
      case 'phoneNumbers':
        return (
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
        );
      
      case 'fatherPhone':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.fatherPhone || 'N/A'}
          </td>
        );
      
      case 'motherPhone':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.motherPhone || 'N/A'}
          </td>
        );
      
      case 'class':
        return (
          <td className="px-4 py-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              {student.class || 'N/A'}
            </span>
          </td>
        );
      
      case 'medium':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.medium || 'N/A'}
          </td>
        );
      
      case 'board':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.board || 'N/A'}
          </td>
        );
      
      case 'phone':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.phone || 'N/A'}
          </td>
        );
      
      case 'email':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.email || 'N/A'}
          </td>
        );
      
      case 'address':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.address || 'N/A'}
          </td>
        );
      
      case 'city':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.city || 'N/A'}
          </td>
        );
      
      case 'state':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.state || 'N/A'}
          </td>
        );
      
      case 'aadharNumber':
        return (
          <td className={`px-4 py-3 font-mono text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.aadharNumber || 'N/A'}
          </td>
        );
      
      case 'stsId':
        return (
          <td className={`px-4 py-3 font-mono text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.stsId || 'N/A'}
          </td>
        );
      
      case 'transport':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.transport ? (
              <span className="text-green-500">✓ {student.transport}</span>
            ) : (
              <span className="text-gray-500">No</span>
            )}
          </td>
        );
      
      case 'hostel':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.hostel ? (
              <span className="text-green-500">✓ {student.hostel}</span>
            ) : (
              <span className="text-gray-500">No</span>
            )}
          </td>
        );
      
      case 'attendance':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.attendance ? (
              <div>
                <div className={`font-medium ${getAttendanceColor(student.attendance.percentage || 0)}`}>
                  {student.attendance.percentage || 0}%
                </div>
                <div className="text-xs opacity-70">
                  {student.attendance.presentDays || 0}/{student.attendance.totalDays || 0} days
                </div>
              </div>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </td>
        );
      
      case 'fees':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.fees ? (
              <div>
                <div className={`font-medium ${
                  student.fees.pending > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  ₹{student.fees.total?.toLocaleString() || 0}
                </div>
                <div className="text-xs opacity-70">
                  Paid: ₹{student.fees.paid?.toLocaleString() || 0}
                </div>
                {student.fees.pending > 0 && (
                  <div className="text-xs text-red-500">
                    Pending: ₹{student.fees.pending?.toLocaleString() || 0}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </td>
        );
      
      case 'grade':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.grade ? (
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                student.grade.includes('A') ? 'bg-green-100 text-green-700' :
                student.grade.includes('B') ? 'bg-blue-100 text-blue-700' :
                student.grade.includes('C') ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {student.grade}
              </span>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </td>
        );
      
      case 'status':
        return (
          <td className="px-4 py-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status || 'active')}`}>
              {student.status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
            </span>
          </td>
        );
      
      case 'actions':
        return (
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStudent(student)}
                className={`text-blue-600 hover:text-blue-800 text-lg ${
                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : ''
                }`}
                title="View Details"
              >
                👁️
              </button>
              <button
                onClick={() => setEditingStudent(student)}
                className={`text-green-600 hover:text-green-800 text-lg ${
                  theme === 'dark' ? 'text-green-400 hover:text-green-300' : ''
                }`}
                title="Edit"
              >
                ✏️
              </button>
              {onPromoteSingle && (
                <button
                  onClick={() => onPromoteSingle(student.id.toString())}
                  className={`text-purple-600 hover:text-purple-800 text-lg ${
                    theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : ''
                  }`}
                  title="Promote"
                >
                  🎓
                </button>
              )}
              {onExitSingle && (
                <button
                  onClick={() => onExitSingle(student.id.toString())}
                  className={`text-red-600 hover:text-red-800 text-lg ${
                    theme === 'dark' ? 'text-red-400 hover:text-red-300' : ''
                  }`}
                  title="Exit Student"
                >
                  🚪
                </button>
              )}
            </div>
          </td>
        );
      
      default:
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            N/A
          </td>
        );
    }
  };

  // Get column headers from columnSettings instead of hardcoded array
  const columnHeaders = columnSettings?.availableColumns || [
    { key: 'select', label: 'Select', fixed: true },
    { key: 'photo', label: 'Photo', fixed: false },
    { key: 'admissionNo', label: 'Admission No', fixed: false },
    { key: 'admissionDate', label: 'Admission Date', fixed: false },
    { key: 'rollNo', label: 'Roll No', fixed: false },
    { key: 'name', label: 'Name', fixed: true },
    { key: 'dateOfBirth', label: 'Date of Birth', fixed: false },
    { key: 'gender', label: 'Gender', fixed: false },
    { key: 'bloodGroup', label: 'Blood Group', fixed: false },
    { key: 'category', label: 'Category', fixed: false },
    { key: 'religion', label: 'Religion', fixed: false },
    { key: 'parents', label: 'Parents', fixed: false },
    { key: 'phoneNumbers', label: 'Phone Numbers', fixed: false },
    { key: 'fatherPhone', label: "Father's Phone", fixed: false },
    { key: 'motherPhone', label: "Mother's Phone", fixed: false },
    { key: 'class', label: 'Class / Section', fixed: false },
    { key: 'medium', label: 'Medium', fixed: false },
    { key: 'board', label: 'Board', fixed: false },
    { key: 'phone', label: 'Student Phone', fixed: false },
    { key: 'email', label: 'Email', fixed: false },
    { key: 'address', label: 'Address', fixed: false },
    { key: 'city', label: 'City', fixed: false },
    { key: 'state', label: 'State', fixed: false },
    { key: 'aadharNumber', label: 'Aadhar No', fixed: false },
    { key: 'stsId', label: 'STS ID', fixed: false },
    { key: 'transport', label: 'Transport', fixed: false },
    { key: 'hostel', label: 'Hostel', fixed: false },
    { key: 'attendance', label: 'Attendance', fixed: false },
    { key: 'fees', label: 'Fee Status', fixed: false },
    { key: 'grade', label: 'Grade / GPA', fixed: false },
    { key: 'status', label: 'Status', fixed: false },
    { key: 'actions', label: 'Actions', fixed: true },
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
                  {visibleColumns.map(columnKey => {
                    const column = columnHeaders.find(c => c.key === columnKey);
                    if (!column) return null;
                    
                    return (
                      <th
                        key={column.key}
                        onClick={() => !column.fixed && handleSort(column.key)}
                        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                          !column.fixed ? 'cursor-pointer hover:text-blue-500' : ''
                        } ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        <div className="flex items-center gap-1">
                          {column.key === 'select' ? (
                            <input
                              type="checkbox"
                              checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.includes(s.id))}
                              onChange={toggleAllStudentsSelection}
                              className="rounded"
                            />
                          ) : (
                            <>
                              {column.label}
                              {sortConfig?.key === column.key && !column.fixed && (
                                <span className="text-blue-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </>
                          )}
                        </div>
                      </th>
                    );
                  })}
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
                      {visibleColumns.map(columnKey => 
                        renderTableCell(student, columnKey)
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
