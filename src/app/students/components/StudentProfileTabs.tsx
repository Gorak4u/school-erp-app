// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface StudentProfileTabsProps {
  activeTab: string;
  selectedStudent: any;
  feeData?: any; // Fee data with fines-inclusive totals
  setFeeManagement: any;
  setAttendanceTracking: any;
  setParentPortal: any;
  setCommunicationCenter: any;
  theme: 'dark' | 'light';
  setShowCalendarModal?: (show: boolean) => void;
  setCalendarStudent?: (student: any) => void;
}

const card = (theme: string) =>
  `rounded-lg border p-4 ${theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`;

const label = (theme: string) =>
  `text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`;

const value = (theme: string) =>
  `mt-1 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`;

const heading = (theme: string) =>
  `text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`;

function Field({ lbl, val, theme }: { lbl: string; val: any; theme: string }) {
  return (
    <div>
      <p className={label(theme)}>{lbl}</p>
      <p className={value(theme)}>{val || '—'}</p>
    </div>
  );
}

function StatCard({ title, val, color, theme }: { title: string; val: string | number; color: string; theme: string }) {
  return (
    <div className={card(theme)}>
      <p className={label(theme)}>{title}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{val}</p>
    </div>
  );
}

function StatusBadge({ status, theme }: { status: string; theme: string }) {
  const colors: Record<string, string> = {
    paid: theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
    partial: theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
    pending: theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
  };
  const labels: Record<string, string> = { paid: 'Paid', partial: 'Partial', pending: 'Pending' };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.pending}`}>
      {labels[status] || status}
    </span>
  );
}

export default function StudentProfileTabs({
  activeTab, selectedStudent, feeData, setFeeManagement, setAttendanceTracking,
  setParentPortal, setCommunicationCenter, theme, setShowCalendarModal, setCalendarStudent
}: StudentProfileTabsProps) {
  const { isAdmin, hasPermission } = usePermissions();
  const canManageFees = isAdmin || hasPermission('manage_fees');
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refunds, setRefunds] = useState([]);
  const [refundStats, setRefundStats] = useState<any>(null);

  useEffect(() => {
    if (selectedStudent?.id && activeTab === 'fees') {
      setFeeLoading(true);
      setFeeError('');
      fetch(`/api/fees/records?studentId=${selectedStudent.id}&pageSize=50`)
        .then(r => r.json())
        .then(data => {
          setFeeRecords(data.records || []);
          setFeeLoading(false);
        })
        .catch(err => {
          console.error(err);
          setFeeError('Failed to load fee records');
          setFeeLoading(false);
        });
    }
  }, [selectedStudent?.id, activeTab]);

  useEffect(() => {
    if (selectedStudent?.id && activeTab === 'refunds') {
      setRefundLoading(true);
      setRefundError('');
      fetch(`/api/students/${selectedStudent.id}/refunds`)
        .then(r => r.json())
        .then(data => {
          setRefunds(data.refunds || []);
          setRefundStats(data.summary);
          setRefundLoading(false);
        })
        .catch(err => {
          console.error(err);
          setRefundError('Failed to load refund history');
          setRefundLoading(false);
        });
    }
  }, [selectedStudent?.id, activeTab]);

  if (!selectedStudent) return null;

  // Use feeData if available (has fines-inclusive totals from API)
  // Otherwise fall back to selectedStudent properties
  const dataSource = feeData || selectedStudent;
  
  // Fines-inclusive totals from API response
  const totalFees = dataSource.totalFees || 0;
  const totalPaid = dataSource.totalPaid || 0;
  const totalPending = dataSource.totalPending || 0;
  const totalDiscount = dataSource.totalDiscount || 0;
  const totalOverdue = dataSource.totalOverdue || 0;
  
  // Fines breakdown (separate from fees)
  const finesTotal = dataSource.finesTotal || 0;
  const finesPaid = dataSource.finesPaid || 0;
  const finesPending = dataSource.finesPending || 0;
  const finesWaived = dataSource.finesWaived || 0;
  const pendingFinesCount = dataSource.pendingFinesCount || 0;
  
  // Legacy fallback for backward compatibility
  const fees = selectedStudent.fees || {};
  const legacyTotal = fees.total || 0;
  const legacyPaid = fees.paid || 0;
  const legacyPending = fees.pending || 0;
  const legacyDiscount = fees.discount || 0;
  
  // Use new fines-inclusive values if available, otherwise fall back to legacy
  const displayTotal = totalFees || legacyTotal;
  const displayPaid = totalPaid || legacyPaid;
  const displayPending = totalPending || legacyPending;
  const displayDiscount = totalDiscount || legacyDiscount;
  
  const att = selectedStudent.attendance || {};
  const totalDays = (att.present || 0) + (att.absent || 0) + (att.late || 0);

  return (
    <div className="max-h-[60vh] overflow-y-auto space-y-6">
      {/* ─── FEES TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className={heading(theme)}>Fee Overview</h3>
            {canManageFees && (
              <button
                onClick={() => setFeeManagement((prev: any) => ({ ...prev, showFeeModal: true, selectedStudent }))}
                className={`px-4 py-2 text-sm rounded-lg font-medium ${
                  theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                💰 Manage Fees
              </button>
            )}
          </div>

          {/* Summary — includes fines in totals with fines breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Total" val={`₹${displayTotal.toLocaleString()}`} color={theme === 'dark' ? 'text-white' : 'text-gray-900'} theme={theme} />
            <StatCard title="Paid" val={`₹${displayPaid.toLocaleString()}`} color="text-green-500" theme={theme} />
            <StatCard title="Pending" val={`₹${displayPending.toLocaleString()}`} color="text-yellow-500" theme={theme} />
            <StatCard title="Discount" val={`₹${displayDiscount.toLocaleString()}`} color="text-blue-500" theme={theme} />
            {finesPending > 0 && (
              <StatCard title="Fines Pending" val={`₹${finesPending.toLocaleString()}`} color="text-orange-500" theme={theme} />
            )}
            {totalOverdue > 0 && (
              <StatCard title="Overdue" val={`₹${totalOverdue.toLocaleString()}`} color="text-red-500" theme={theme} />
            )}
          </div>

          {/* Fines breakdown section */}
          {(finesTotal > 0) && (
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-orange-800 bg-orange-900/20' : 'border-orange-200 bg-orange-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>📝 Fines Summary</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-orange-800 text-orange-200' : 'bg-orange-100 text-orange-700'}`}>
                  {pendingFinesCount} pending
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total:</span>
                  <span className={`ml-2 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹{finesTotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Paid:</span>
                  <span className="ml-2 font-medium text-green-500">₹{finesPaid.toLocaleString()}</span>
                </div>
                <div>
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Pending:</span>
                  <span className="ml-2 font-medium text-orange-500">₹{finesPending.toLocaleString()}</span>
                </div>
                <div>
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Waived:</span>
                  <span className="ml-2 font-medium text-purple-500">₹{finesWaived.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {fees.lastPaymentDate && (
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Last payment: {fees.lastPaymentDate}
            </p>
          )}

          {/* Individual fee records */}
          <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Fee Records</h4>
            </div>
            {feeLoading ? (
              <div className={`p-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading fee records...
              </div>
            ) : feeError ? (
              <div className="p-8 text-center text-sm text-red-500">{feeError}</div>
            ) : feeRecords.length === 0 ? (
              <div className={`p-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                No fee records found. Use "Manage Fees" to assign fee structures.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <tr>
                      {['Fee Type', 'Academic Year', 'Amount', 'Paid', 'Pending', 'Due Date', 'Status'].map(h => (
                        <th key={h} className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {feeRecords.map((rec: any) => {
                      const pending = (rec.amount || 0) - (rec.paidAmount || 0) - (rec.discount || 0);
                      return (
                        <tr key={rec.id} className={theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                          <td className={`py-3 px-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {rec.feeStructure?.name || 'Fee'}
                            {rec.feeStructure?.category && rec.feeStructure.category !== rec.feeStructure?.name && (
                              <span className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>({rec.feeStructure.category})</span>
                            )}
                          </td>
                          <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{rec.academicYear || '—'}</td>
                          <td className={`py-3 px-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₹{(rec.amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-green-500 font-medium">₹{(rec.paidAmount || 0).toLocaleString()}</td>
                          <td className={`py-3 px-4 font-medium ${pending > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                            ₹{Math.max(0, pending).toLocaleString()}
                          </td>
                          <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {rec.dueDate ? new Date(rec.dueDate).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={rec.status || 'pending'} theme={theme} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ATTENDANCE TAB ───────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className={heading(theme)}>Attendance Summary</h3>
            <button
              onClick={() => {
                // Open calendar modal with selected student
                if (setShowCalendarModal && setCalendarStudent) {
                  setCalendarStudent(selectedStudent);
                  setShowCalendarModal(true);
                }
              }}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg ${
                theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              }`}
            >
              📅 View Detailed Attendance
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Days" val={totalDays} color={theme === 'dark' ? 'text-white' : 'text-gray-900'} theme={theme} />
            <StatCard title="Present" val={att.present || 0} color="text-green-500" theme={theme} />
            <StatCard title="Absent" val={att.absent || 0} color="text-red-500" theme={theme} />
            <StatCard title="Late" val={att.late || 0} color="text-yellow-500" theme={theme} />
          </div>

          <div className={card(theme)}>
            <div className="flex items-center justify-between mb-3">
              <p className={label(theme)}>Attendance Percentage</p>
              <p className={`text-2xl font-bold ${(att.percentage || 0) >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                {att.percentage || 0}%
              </p>
            </div>
            <div className={`w-full rounded-full h-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className={`h-3 rounded-full transition-all ${(att.percentage || 0) >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(att.percentage || 0, 100)}%` }}
              />
            </div>
            {(att.percentage || 0) < 75 && (
              <p className="mt-2 text-xs text-red-500">⚠️ Attendance below 75% threshold</p>
            )}
          </div>
        </div>
      )}

      {/* ─── PARENTS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'parents' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className={heading(theme)}>Parent / Guardian Information</h3>
            <button
              onClick={() => setParentPortal((prev: any) => ({ ...prev, showParentPortalModal: true, selectedStudent }))}
              className={`px-4 py-2 text-sm rounded-lg font-medium ${
                theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              👨‍👩‍👧 Manage Portal
            </button>
          </div>

          {/* Primary Contact */}
          {(selectedStudent.parentName || selectedStudent.parentPhone) && (
            <div className={card(theme)}>
              <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Primary Contact</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field lbl="Name" val={selectedStudent.parentName} theme={theme} />
                <Field lbl="Phone" val={selectedStudent.parentPhone} theme={theme} />
                <Field lbl="Email" val={selectedStudent.parentEmail} theme={theme} />
              </div>
            </div>
          )}

          {/* Father */}
          {(selectedStudent.fatherName || selectedStudent.fatherPhone) && (
            <div className={card(theme)}>
              <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>👨 Father</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field lbl="Name" val={selectedStudent.fatherName} theme={theme} />
                <Field lbl="Phone" val={selectedStudent.fatherPhone} theme={theme} />
                <Field lbl="Email" val={selectedStudent.fatherEmail} theme={theme} />
              </div>
            </div>
          )}

          {/* Mother */}
          {(selectedStudent.motherName || selectedStudent.motherPhone) && (
            <div className={card(theme)}>
              <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>👩 Mother</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field lbl="Name" val={selectedStudent.motherName} theme={theme} />
                <Field lbl="Phone" val={selectedStudent.motherPhone} theme={theme} />
                <Field lbl="Email" val={selectedStudent.motherEmail} theme={theme} />
              </div>
            </div>
          )}

          {/* Emergency */}
          {(selectedStudent.emergencyContact || selectedStudent.emergencyRelation) && (
            <div className={card(theme)}>
              <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>🚨 Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field lbl="Contact Number" val={selectedStudent.emergencyContact} theme={theme} />
                <Field lbl="Relation" val={selectedStudent.emergencyRelation} theme={theme} />
              </div>
            </div>
          )}

          {/* Fallback if no parent info */}
          {!selectedStudent.parentName && !selectedStudent.fatherName && !selectedStudent.motherName && (
            <div className={`p-8 text-center text-sm rounded-lg border ${theme === 'dark' ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
              No parent information on record. Edit student profile to add parent details.
            </div>
          )}
        </div>
      )}

      {/* ─── COMMUNICATION TAB ───────────────────────────────────────── */}
      {activeTab === 'communication' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className={heading(theme)}>Communication</h3>
            <button
              onClick={() => setCommunicationCenter((prev: any) => ({ ...prev, showCommunicationModal: true, selectedStudent }))}
              className={`px-4 py-2 text-sm rounded-lg font-medium ${
                theme === 'dark' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-500 hover:bg-teal-600 text-white'
              }`}
            >
              💬 Communication Center
            </button>
          </div>

          {/* Student contacts */}
          <div className={card(theme)}>
            <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Student Contact</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field lbl="Phone" val={selectedStudent.phone} theme={theme} />
              <Field lbl="Email" val={selectedStudent.email} theme={theme} />
            </div>
          </div>

          {/* Quick action buttons */}
          <div className={card(theme)}>
            <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Quick Actions</h4>
            <div className="flex flex-wrap gap-3">
              {selectedStudent.phone && (
                <a
                  href={`tel:${selectedStudent.phone}`}
                  className={`px-4 py-2 text-sm rounded-lg font-medium ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                >
                  📞 Call Student
                </a>
              )}
              {selectedStudent.email && (
                <a
                  href={`mailto:${selectedStudent.email}?subject=Regarding ${selectedStudent.name}`}
                  className={`px-4 py-2 text-sm rounded-lg font-medium ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                  📧 Email Student
                </a>
              )}
              {(selectedStudent.fatherPhone || selectedStudent.parentPhone) && (
                <a
                  href={`tel:${selectedStudent.fatherPhone || selectedStudent.parentPhone}`}
                  className={`px-4 py-2 text-sm rounded-lg font-medium ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                >
                  📞 Call Parent
                </a>
              )}
              {(selectedStudent.fatherEmail || selectedStudent.motherEmail || selectedStudent.parentEmail) && (
                <a
                  href={`mailto:${[selectedStudent.fatherEmail, selectedStudent.motherEmail, selectedStudent.parentEmail].filter(Boolean).join(',')}?subject=Regarding ${selectedStudent.name}`}
                  className={`px-4 py-2 text-sm rounded-lg font-medium ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                >
                  📧 Email Parent(s)
                </a>
              )}
            </div>
          </div>

          {/* Parent contact summary */}
          {(selectedStudent.fatherName || selectedStudent.motherName) && (
            <div className={card(theme)}>
              <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Parent Contacts</h4>
              <div className="space-y-3">
                {selectedStudent.fatherName && (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedStudent.fatherName} (Father)</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{selectedStudent.fatherPhone || 'No phone'} · {selectedStudent.fatherEmail || 'No email'}</p>
                    </div>
                    {selectedStudent.fatherPhone && (
                      <a href={`tel:${selectedStudent.fatherPhone}`} className="text-green-500 hover:text-green-600 text-xs font-medium">Call</a>
                    )}
                  </div>
                )}
                {selectedStudent.motherName && (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedStudent.motherName} (Mother)</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{selectedStudent.motherPhone || 'No phone'} · {selectedStudent.motherEmail || 'No email'}</p>
                    </div>
                    {selectedStudent.motherPhone && (
                      <a href={`tel:${selectedStudent.motherPhone}`} className="text-green-500 hover:text-green-600 text-xs font-medium">Call</a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── REFUNDS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'refunds' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className={heading(theme)}>Refund History</h3>
            {canManageFees && (
              <button
                onClick={() => window.open('/refunds', '_blank')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Manage Refunds
              </button>
            )}
          </div>

          {/* Refund Statistics */}
          {refundStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Refunds" val={refundStats.totalRefunds} color="text-blue-500" theme={theme} />
              <StatCard title="Total Amount" val={`₹${refundStats.totalAmount.toLocaleString()}`} color="text-green-500" theme={theme} />
              <StatCard title="Pending" val={refundStats.pendingCount} color="text-yellow-500" theme={theme} />
              <StatCard title="Processed" val={refundStats.processedCount} color="text-purple-500" theme={theme} />
            </div>
          )}

          {/* Refund List */}
          {refundLoading ? (
            <div className={`p-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading refund history...
            </div>
          ) : refundError ? (
            <div className="p-8 text-center text-sm text-red-500">{refundError}</div>
          ) : refunds.length === 0 ? (
            <div className={`p-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No refund history found for this student.
            </div>
          ) : (
            <div className={card(theme)}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <tr>
                      {['Date', 'Type', 'Amount', 'Net Amount', 'Status', 'Method'].map(h => (
                        <th key={h} className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {refunds.map((refund: any) => (
                      <tr key={refund.id} className={theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                        <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {new Date(refund.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className={`py-3 px-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {refund.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className={`py-3 px-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{refund.amount.toLocaleString()}
                        </td>
                        <td className={`py-3 px-4 font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                          ₹{refund.netAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={refund.status} theme={theme} />
                        </td>
                        <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {refund.refundMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
