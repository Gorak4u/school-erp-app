// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';
import StudentProfileTabs from './StudentProfileTabs';
import StudentAnalytics from './StudentAnalytics';
import StudentMedicalInfo from './StudentMedicalInfo';

interface StudentProfileModalProps {
  activeTab: any; printStudentProfile: any; selectedStudent: any; sendStudentSMS: any; setAcademicPerformance: any; setActiveTab: any; setAttendanceTracking: any; setCommunicationCenter: any; setEditingStudent: any; setFeeManagement: any; setParentPortal: any; setSelectedStudent: any; theme: any; students?: Student[];
  onPromoteSingle?: (studentId: string) => void;
  onMarkExit?: (studentId: string) => void;
}

export default function StudentProfileModal({ activeTab, printStudentProfile, selectedStudent, sendStudentSMS, setAcademicPerformance, setActiveTab, setAttendanceTracking, setCommunicationCenter, setEditingStudent, setFeeManagement, setParentPortal, setSelectedStudent, theme, students = [], onPromoteSingle, onMarkExit }: StudentProfileModalProps) {
  return (
    <>
      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-7xl h-[90vh] mx-4 overflow-hidden rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Header */}
              <div className={`px-6 py-4 border-b ${
                theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      {selectedStudent.photo ? (
                        <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{selectedStudent.name}</h2>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        ADM{String(selectedStudent.id).padStart(4, '0')} • Class {selectedStudent.class} • Roll No: {selectedStudent.rollNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Student Action Buttons */}
                    
                    <button
                      onClick={() => sendStudentSMS(selectedStudent)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                        theme === 'dark'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      📱 SMS
                    </button>
                    
                                        
                    <button
                      onClick={() => printStudentProfile(selectedStudent)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                        theme === 'dark'
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                    >
                      🖨️ Print
                    </button>
                    
                    <button
                      onClick={() => setEditingStudent(selectedStudent)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                        theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      ✏️ Edit
                    </button>
                    
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Lock Banner ──────────────────────────────────────────── */}
              {(selectedStudent?.needsPromotion || selectedStudent?.status === 'locked') && (
                <div className="px-6 py-3 bg-orange-500/10 border-b border-orange-500/20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500 text-lg">🔒</span>
                      <div>
                        <p className="text-sm font-semibold text-orange-600">
                          Student record is locked — from AY {selectedStudent.academicYear}
                        </p>
                        <p className="text-xs text-orange-500">
                          Editing and new fee assignments are blocked until you promote this student to the current academic year or mark them as exit.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {onPromoteSingle && (
                        <button
                          onClick={() => { setSelectedStudent(null); onPromoteSingle(selectedStudent.id); }}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                        >
                          🎓 Promote Now
                        </button>
                      )}
                      {onMarkExit && (
                        <button
                          onClick={() => { onMarkExit(selectedStudent.id); setSelectedStudent(null); }}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                        >
                          🚪 Mark Exit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Navigation Tabs */}
              <div className={`px-6 py-3 border-b ${
                theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { id: 'overview', label: '📋 Overview', icon: '📋' },
                    { id: 'academics', label: '📈 Academics', icon: '📈' },
                    { id: 'fees', label: '💰 Fees', icon: '💰' },
                    { id: 'attendance', label: '📊 Attendance', icon: '📊' },
                    { id: 'analytics', label: '📈 Analytics', icon: '📈' },
                    { id: 'medical', label: '🏥 Medical', icon: '🏥' },
                    { id: 'communication', label: '💬 Communication', icon: '💬' },
                    { id: 'parents', label: '👨‍👩‍👧 Parents', icon: '👨‍👩‍👧' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? theme === 'dark'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Basic Information */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Date of Birth</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.dateOfBirth}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Gender</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.gender}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Blood Group</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.bloodGroup}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Phone</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.phone}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Email</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.email}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Language Medium</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.languageMedium}</p>
                          </div>
                        </div>
                      </div>

                      {/* Parents Information */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Parents Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Father Name</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.fatherName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Father Phone</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.fatherPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Father Email</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.fatherEmail || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Mother Name</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.motherName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Mother Phone</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.motherPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Mother Email</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.motherEmail || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Contact & Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Street Address</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.address || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>City</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.city || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>State</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.state || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Emergency Contact</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.emergencyContact || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Emergency Relation</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.emergencyRelation || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Category</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.category || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Academics Tab */}
                  {activeTab === 'academics' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className={`text-xl font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Academic Performance</h3>
                        <button
                          onClick={() => setAcademicPerformance(prev => ({ ...prev, showAcademicModal: true, selectedStudent }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            theme === 'dark'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          📊 View Detailed Analytics
                        </button>
                      </div>
                      
                      {/* Academic Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Current GPA</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.gpa?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                            }`}>
                              📈
                            </div>
                          </div>
                        </div>
                        
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Class Rank</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.rank || 'N/A'}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-between ${
                              theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                            }`}>
                              🏆
                            </div>
                          </div>
                        </div>
                        
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Attendance</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.attendance?.percentage || 0}%</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                            }`}>
                              📊
                            </div>
                          </div>
                        </div>
                        
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Discipline</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.disciplineScore || 100}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              ⭐
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Academic Stats */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h4 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Academic Statistics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Achievements</label>
                            <p className={`mt-1 text-lg font-semibold ${
                              theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            }`}>🏅 {selectedStudent.achievements || 0} Awards</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Incidents</label>
                            <p className={`mt-1 text-lg font-semibold ${
                              theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                            }`}>⚠️ {selectedStudent.incidents || 0} Records</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Admission Date</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.admissionDate || selectedStudent.enrollmentDate || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Academic Year</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.academicYear || 'N/A'}</p>
                          </div>
                        </div>
                        {selectedStudent.remarks && (
                          <div className="mt-4">
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Remarks</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <StudentProfileTabs
                    activeTab={activeTab}
                    selectedStudent={selectedStudent}
                    setFeeManagement={setFeeManagement}
                    setAttendanceTracking={setAttendanceTracking}
                    setParentPortal={setParentPortal}
                    setCommunicationCenter={setCommunicationCenter}
                    theme={theme}
                  />

                  {/* Analytics Tab */}
                  {activeTab === 'analytics' && (
                    <StudentAnalytics
                      theme={theme}
                      students={selectedStudent ? [selectedStudent] : []}
                      onClose={() => setActiveTab('overview')}
                    />
                  )}

                  {/* Medical Tab */}
                  {activeTab === 'medical' && (
                    <StudentMedicalInfo
                      theme={theme}
                      student={selectedStudent}
                      onClose={() => setActiveTab('overview')}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
