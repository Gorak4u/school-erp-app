// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface AttendanceModalProps {
  attendanceTracking: any; bulkMarkAttendance: any; getAttendanceStats: any; markAttendance: any; selectedStudents: any; setAttendanceTracking: any; setSelectedStudents: any; students: any; theme: any;
}

export default function AttendanceModal({ attendanceTracking, bulkMarkAttendance, getAttendanceStats, markAttendance, selectedStudents, setAttendanceTracking, setSelectedStudents, students, theme }: AttendanceModalProps) {
  return (
    <>
      {/* Attendance Tracking Modal */}
      <AnimatePresence>
        {attendanceTracking.showAttendanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]"
            onClick={() => setAttendanceTracking(prev => ({ ...prev, showAttendanceModal: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      📊 Attendance Tracking
                    </h3>
                    <button
                      onClick={() => setAttendanceTracking(prev => ({ ...prev, showAttendanceModal: false }))}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Date:
                    </label>
                    <input
                      type="date"
                      value={attendanceTracking.selectedDate}
                      onChange={(e) => setAttendanceTracking(prev => ({ ...prev, selectedDate: e.target.value }))}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => bulkMarkAttendance(selectedStudents, 'present')}
                        disabled={selectedStudents.length === 0}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                          selectedStudents.length === 0
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        ✅ Mark Present
                      </button>
                      <button
                        onClick={() => bulkMarkAttendance(selectedStudents, 'absent')}
                        disabled={selectedStudents.length === 0}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                          selectedStudents.length === 0
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        ❌ Mark Absent
                      </button>
                      <button
                        onClick={() => bulkMarkAttendance(selectedStudents, 'late')}
                        disabled={selectedStudents.length === 0}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                          selectedStudents.length === 0
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      >
                        ⏰ Mark Late
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
                      {/* Attendance Stats */}
                      <div className="lg:col-span-1 space-y-4">
                        {/* Today's Stats */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Today's Statistics
                          </h4>
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>Total Students</span>
                                <span className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{getAttendanceStats().total}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`text-sm text-green-500`}>Present</span>
                                <span className={`text-sm font-medium text-green-500`}>{getAttendanceStats().present}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`text-sm text-red-500`}>Absent</span>
                                <span className={`text-sm font-medium text-red-500`}>{getAttendanceStats().absent}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`text-sm text-yellow-500`}>Late</span>
                                <span className={`text-sm font-medium text-yellow-500`}>{getAttendanceStats().late}</span>
                              </div>
                              <div className={`pt-2 border-t ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                              }`}>
                                <div className="flex justify-between">
                                  <span className={`text-sm font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>Attendance %</span>
                                  <span className={`text-sm font-bold ${
                                    getAttendanceStats().percentage >= 90 ? 'text-green-500' :
                                    getAttendanceStats().percentage >= 75 ? 'text-yellow-500' : 'text-red-500'
                                  }`}>{getAttendanceStats().percentage}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Biometric Status */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Biometric Systems
                          </h4>
                          <div className="space-y-2">
                            <div className={`p-3 rounded-lg border flex items-center justify-between ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>Facial Recognition</span>
                              </div>
                              <span className={`text-xs text-green-500`}>Active</span>
                            </div>
                            <div className={`p-3 rounded-lg border flex items-center justify-between ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>Fingerprint Scanner</span>
                              </div>
                              <span className={`text-xs text-green-500`}>Active</span>
                            </div>
                            <div className={`p-3 rounded-lg border flex items-center justify-between ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>RFID Reader</span>
                              </div>
                              <span className={`text-xs text-yellow-500`}>Maintenance</span>
                            </div>
                          </div>
                        </div>

                        {/* Geo-fence Status */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Geo-fence Status
                          </h4>
                          <div className={`p-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>Status</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                attendanceTracking.geoFenceSettings.enabled
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {attendanceTracking.geoFenceSettings.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className={`text-xs space-y-1 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <div>Radius: {attendanceTracking.geoFenceSettings.radius}m</div>
                              <div>Entry: {attendanceTracking.geoFenceSettings.allowedEntryTime.start} - {attendanceTracking.geoFenceSettings.allowedEntryTime.end}</div>
                              <div>Grace Period: {attendanceTracking.geoFenceSettings.gracePeriod} min</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Student List */}
                      <div className="lg:col-span-3">
                        <div className={`rounded-lg border overflow-hidden ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}>
                          <div className={`px-4 py-3 border-b ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                Student Attendance
                              </h4>
                              <div className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {selectedStudents.length} selected
                              </div>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className={`${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                              }`}>
                                <tr>
                                  <th className={`px-4 py-2 text-left text-xs font-medium ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    <input
                                      type="checkbox"
                                      checked={selectedStudents.length === students.length}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedStudents(students.map(s => s.id));
                                        } else {
                                          setSelectedStudents([]);
                                        }
                                      }}
                                      className="rounded"
                                    />
                                  </th>
                                  <th className={`px-4 py-2 text-left text-xs font-medium ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Student</th>
                                  <th className={`px-4 py-2 text-left text-xs font-medium ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Class</th>
                                  <th className={`px-4 py-2 text-left text-xs font-medium ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Status</th>
                                  <th className={`px-4 py-2 text-left text-xs font-medium ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Time</th>
                                  <th className={`px-4 py-2 text-left text-xs font-medium ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Method</th>
                                  <th className={`px-4 py-2 text-left text-xs font-medium ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>Actions</th>
                                </tr>
                              </thead>
                              <tbody className={`divide-y ${
                                theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                              }`}>
                                {(attendanceTracking.selectedStudent ? [attendanceTracking.selectedStudent] : students.slice(0, 10)).map((student) => {
                                  const todayRecord = attendanceTracking.attendanceRecords.find(
                                    r => r.studentId === student.id && r.date === attendanceTracking.selectedDate
                                  );
                                  const status = todayRecord?.status || 'absent';
                                  const time = todayRecord?.checkInTime || '--:--';
                                  const method = todayRecord?.method || '--';

                                  return (
                                    <tr key={student.id} className={`${
                                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                    }`}>
                                      <td className="px-4 py-3">
                                        <input
                                          type="checkbox"
                                          checked={selectedStudents.includes(student.id)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedStudents([...selectedStudents, student.id]);
                                            } else {
                                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                            }
                                          }}
                                          className="rounded"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                          </div>
                                          <div>
                                            <div className={`text-sm font-medium ${
                                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            }`}>
                                              {student.name}
                                            </div>
                                            <div className={`text-xs ${
                                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                              {student.rollNo}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className={`px-4 py-3 text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {student.class}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                          status === 'present' ? 'bg-green-100 text-green-800' :
                                          status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                          status === 'excused' ? 'bg-blue-100 text-blue-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </span>
                                      </td>
                                      <td className={`px-4 py-3 text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {time}
                                      </td>
                                      <td className={`px-4 py-3 text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                                          method === 'biometric' ? 'bg-purple-100 text-purple-800' :
                                          method === 'rfid' ? 'bg-blue-100 text-blue-800' :
                                          method === 'mobile' ? 'bg-green-100 text-green-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {method === 'biometric' ? '🔐' :
                                           method === 'rfid' ? '📡' :
                                           method === 'mobile' ? '📱' : '✏️'}
                                          {method}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => markAttendance(student.id, 'biometric')}
                                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                              theme === 'dark'
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                          >
                                            🔐
                                          </button>
                                          <button
                                            onClick={() => markAttendance(student.id, 'manual')}
                                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                              theme === 'dark'
                                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                                            }`}
                                          >
                                            ✏️
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
