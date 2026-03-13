// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface MedicalRecord {
  id: string;
  date: string;
  type: 'checkup' | 'vaccination' | 'incident' | 'prescription';
  title: string;
  description: string;
  doctor: string;
  status: 'completed' | 'scheduled' | 'pending';
}

interface StudentMedicalInfoProps {
  theme: 'dark' | 'light';
  student: Student | null;
  onClose: () => void;
}

export default function StudentMedicalInfo({ theme, student, onClose }: StudentMedicalInfoProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'vaccinations' | 'allergies'>('overview');
  const [showAddRecord, setShowAddRecord] = useState(false);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const mockRecords: MedicalRecord[] = [
    { id: '1', date: '2026-03-10', type: 'checkup', title: 'Annual Health Checkup', description: 'Routine annual health screening', doctor: 'Dr. Sharma', status: 'completed' },
    { id: '2', date: '2026-02-15', type: 'vaccination', title: 'COVID-19 Booster', description: 'COVID-19 booster dose administered', doctor: 'Dr. Patel', status: 'completed' },
    { id: '3', date: '2026-04-01', type: 'checkup', title: 'Dental Checkup', description: 'Scheduled dental examination', doctor: 'Dr. Gupta', status: 'scheduled' },
    { id: '4', date: '2026-01-20', type: 'incident', title: 'Sports Injury', description: 'Minor sprain during PE class', doctor: 'Dr. Kumar', status: 'completed' },
    { id: '5', date: '2025-12-05', type: 'prescription', title: 'Eye Checkup', description: 'Prescribed corrective lenses', doctor: 'Dr. Reddy', status: 'completed' },
  ];

  const vaccinations = [
    { name: 'BCG', date: '2014-03-15', status: 'completed', nextDue: '-' },
    { name: 'Hepatitis B (3 doses)', date: '2014-06-20', status: 'completed', nextDue: '-' },
    { name: 'DPT (5 doses)', date: '2019-04-10', status: 'completed', nextDue: '-' },
    { name: 'Polio (5 doses)', date: '2019-04-10', status: 'completed', nextDue: '-' },
    { name: 'MMR (2 doses)', date: '2016-08-25', status: 'completed', nextDue: '-' },
    { name: 'Typhoid', date: '2023-07-12', status: 'completed', nextDue: '2026-07-12' },
    { name: 'COVID-19', date: '2026-02-15', status: 'completed', nextDue: '2027-02-15' },
    { name: 'Influenza', date: '2025-10-01', status: 'completed', nextDue: '2026-10-01' },
    { name: 'HPV', date: '-', status: 'pending', nextDue: '2026-06-01' },
  ];

  const getTypeStyles = (type: MedicalRecord['type']) => {
    const map = {
      checkup: { bg: isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600', label: 'Checkup' },
      vaccination: { bg: isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600', label: 'Vaccination' },
      incident: { bg: isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600', label: 'Incident' },
      prescription: { bg: isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600', label: 'Prescription' },
    };
    return map[type];
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'records', label: 'Medical Records' },
    { id: 'vaccinations', label: 'Vaccinations' },
    { id: 'allergies', label: 'Allergies & Conditions' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${textPrimary}`}>Medical Information</h2>
          {student && <p className={`text-sm ${textSecondary}`}>{student.name} - {student.class}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowAddRecord(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
            Add Record
          </button>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${cardCls}`}>
              <p className={`text-sm ${textSecondary}`}>Blood Group</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>{student?.bloodGroup || 'N/A'}</p>
            </div>
            <div className={`p-4 rounded-lg border ${cardCls}`}>
              <p className={`text-sm ${textSecondary}`}>Known Allergies</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>{student?.allergies || 'None'}</p>
            </div>
            <div className={`p-4 rounded-lg border ${cardCls}`}>
              <p className={`text-sm ${textSecondary}`}>Medical Conditions</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>{student?.medicalConditions || 'None'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Emergency Contacts</h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`font-medium ${textPrimary}`}>{student?.parentName || 'Parent'}</p>
                  <p className={`text-sm ${textSecondary}`}>Parent - {student?.parentPhone || 'N/A'}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`font-medium ${textPrimary}`}>{student?.emergencyContact || 'Emergency Contact'}</p>
                  <p className={`text-sm ${textSecondary}`}>{student?.emergencyRelation || 'Relation'} - {student?.emergencyContact || 'N/A'}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`font-medium ${textPrimary}`}>{student?.doctorName || 'Family Doctor'}</p>
                  <p className={`text-sm ${textSecondary}`}>Doctor - {student?.doctorPhone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Current Medications</h3>
              <div className="space-y-3">
                {student?.medications ? (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`font-medium ${textPrimary}`}>{student.medications}</p>
                  </div>
                ) : (
                  <div className={`text-center py-6 ${textSecondary}`}>
                    <p className="text-sm">No current medications</p>
                  </div>
                )}
              </div>

              <h3 className={`text-lg font-semibold mb-4 mt-6 ${textPrimary}`}>Upcoming Appointments</h3>
              <div className="space-y-3">
                {mockRecords.filter(r => r.status === 'scheduled').map(record => (
                  <div key={record.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${textPrimary}`}>{record.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
                        {record.date}
                      </span>
                    </div>
                    <p className={`text-sm ${textSecondary}`}>{record.doctor}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Medical Records Tab */}
      {activeTab === 'records' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} border-b`}>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Date</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Type</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Title</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Doctor</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Status</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockRecords.map(record => {
                  const typeStyle = getTypeStyles(record.type);
                  return (
                    <tr key={record.id} className={`${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                      <td className={`py-3 px-4 text-sm ${textPrimary}`}>{record.date}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${typeStyle.bg}`}>{typeStyle.label}</span></td>
                      <td className={`py-3 px-4 text-sm ${textPrimary}`}>{record.title}</td>
                      <td className={`py-3 px-4 text-sm ${textSecondary}`}>{record.doctor}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          record.status === 'completed' ? isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
                          : isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                        }`}>{record.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Vaccinations Tab */}
      {activeTab === 'vaccinations' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} border-b`}>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Vaccine</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Date Administered</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Status</th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Next Due</th>
                </tr>
              </thead>
              <tbody>
                {vaccinations.map((vac, i) => (
                  <tr key={i} className={`${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                    <td className={`py-3 px-4 text-sm font-medium ${textPrimary}`}>{vac.name}</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>{vac.date}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        vac.status === 'completed' ? isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
                        : isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                      }`}>{vac.status}</span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${vac.nextDue === '-' ? textSecondary : 'text-orange-400'}`}>{vac.nextDue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Allergies & Conditions Tab */}
      {activeTab === 'allergies' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Allergies</h3>
              <div className="space-y-3">
                {(student?.allergies || 'None reported').split(',').map((allergy, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>!</div>
                      <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>{allergy.trim()}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>Active</span>
                  </div>
                ))}
              </div>
              <button className={`mt-4 w-full px-4 py-2 rounded-lg text-sm border-2 border-dashed transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                + Add Allergy
              </button>
            </div>

            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Medical Conditions</h3>
              <div className="space-y-3">
                {(student?.medicalConditions || 'None reported').split(',').map((condition, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>!</div>
                      <span className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>{condition.trim()}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>Monitored</span>
                  </div>
                ))}
              </div>
              <button className={`mt-4 w-full px-4 py-2 rounded-lg text-sm border-2 border-dashed transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                + Add Condition
              </button>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${cardCls}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Insurance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-sm ${textSecondary}`}>Provider</p>
                <p className={`font-medium ${textPrimary}`}>National Health Insurance</p>
              </div>
              <div>
                <p className={`text-sm ${textSecondary}`}>Policy Number</p>
                <p className={`font-medium ${textPrimary}`}>NHI-2026-45678</p>
              </div>
              <div>
                <p className={`text-sm ${textSecondary}`}>Valid Until</p>
                <p className={`font-medium ${textPrimary}`}>March 2027</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Record Modal */}
      <AnimatePresence>
        {showAddRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowAddRecord(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`w-full max-w-md p-6 rounded-xl border ${cardCls}`}
              onClick={e => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Add Medical Record</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Record Type</label>
                  <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                    <option value="">Select type...</option>
                    <option value="checkup">Health Checkup</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="incident">Incident/Injury</option>
                    <option value="prescription">Prescription</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Title</label>
                  <input type="text" placeholder="Enter title" className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Date</label>
                  <input type="date" className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Doctor</label>
                  <input type="text" placeholder="Doctor name" className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Description</label>
                  <textarea rows={3} placeholder="Enter description" className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button onClick={() => setShowAddRecord(false)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                  Save Record
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
