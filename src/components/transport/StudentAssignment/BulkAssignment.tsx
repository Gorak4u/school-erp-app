'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BulkAssignmentProps {
  routes: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  label: string;
  input: string;
  btnPrimary: string;
  btnSecondary: string;
  onBulkAssign: (routeId: string, studentIds: string[]) => void;
  onClose: () => void;
}

export function BulkAssignment({
  routes,
  isDark,
  card,
  text,
  subtext,
  label,
  input,
  btnPrimary,
  btnSecondary,
  onBulkAssign,
  onClose
}: BulkAssignmentProps) {
  const [selectedRoute, setSelectedRoute] = React.useState('');
  const [studentList, setStudentList] = React.useState('');
  const [processing, setProcessing] = React.useState(false);

  const handleBulkAssign = async () => {
    if (!selectedRoute || !studentList.trim()) return;
    
    setProcessing(true);
    const studentIds = studentList
      .split('\n')
      .map(id => id.trim())
      .filter(id => id);
    
    await onBulkAssign(selectedRoute, studentIds);
    setProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className={`${card} rounded-2xl border max-w-2xl w-full`}>
        <div className="p-6">
          <h3 className={`text-xl font-bold ${text} mb-6`}>
            Bulk Student Assignment
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={label}>Select Route</label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className={input}
              >
                <option value="">Choose a route...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.routeNumber} - {route.routeName} (Available: {route.capacity - (route.assignedStudents || 0)})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={label}>Student Admission Numbers</label>
              <textarea
                value={studentList}
                onChange={(e) => setStudentList(e.target.value)}
                className={`${input} resize-none`}
                rows={8}
                placeholder="Enter student admission numbers, one per line:
STU001
STU002
STU003
..."
              />
              <div className={`text-xs ${subtext} mt-1`}>
                Enter one admission number per line. Maximum 50 students at a time.
              </div>
            </div>
            
            {selectedRoute && studentList.trim() && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                <div className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                  Assignment Preview
                </div>
                <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-500'}`}>
                  {studentList.split('\n').filter(id => id.trim()).length} students will be assigned to:
                  <br />
                  <strong>
                    {routes.find(r => r.id === selectedRoute)?.routeNumber} - {routes.find(r => r.id === selectedRoute)?.routeName}
                  </strong>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={processing}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={handleBulkAssign}
              disabled={processing || !selectedRoute || !studentList.trim()}
              className={btnPrimary}
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Assign Students'
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
