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
}

export default function StudentProfileModal({ activeTab, printStudentProfile, selectedStudent, sendStudentSMS, setAcademicPerformance, setActiveTab, setAttendanceTracking, setCommunicationCenter, setEditingStudent, setFeeManagement, setParentPortal, setSelectedStudent, theme, students = [] }: StudentProfileModalProps) {
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className={`font-medium mb-2 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>Father</h4>
                            <div className="space-y-2">
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.fatherName}</p>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>{selectedStudent.fatherPhone}</p>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>{selectedStudent.fatherOccupation}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className={`font-medium mb-2 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>Mother</h4>
                            <div className="space-y-2">
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.motherName}</p>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>{selectedStudent.motherPhone}</p>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>{selectedStudent.motherOccupation}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Address Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Street Address</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.address}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>City</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.city}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>State</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.state}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Pin Code</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.pinCode}</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              }`}>3.85</p>
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
                              }`}>5/45</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
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
                              }`}>Attendance Rate</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>92%</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                            }`}>
                              📊
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Grades */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h4 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Recent Grades</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`border-b ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                              }`}>
                                <th className={`text-left py-2 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Subject</th>
                                <th className={`text-left py-2 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Assessment</th>
                                <th className={`text-left py-2 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Grade</th>
                                <th className={`text-left py-2 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Percentage</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className={`border-b ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                              }`}>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Mathematics</td>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Mid Term Exam</td>
                                <td className={`py-3 px-4`}>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                                  }`}>A+</span>
                                </td>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>92%</td>
                              </tr>
                              <tr className={`border-b ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                              }`}>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Science</td>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Mid Term Exam</td>
                                <td className={`py-3 px-4`}>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                                  }`}>A</span>
                                </td>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>88%</td>
                              </tr>
                              <tr className={`border-b ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                              }`}>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>English</td>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Mid Term Exam</td>
                                <td className={`py-3 px-4`}>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                  }`}>B+</span>
                                </td>
                                <td className={`py-3 px-4 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>78%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
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
