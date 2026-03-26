'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AssignmentFormProps {
  form: any;
  routes: any[];
  searchResults: any[];
  searchLoading: boolean;
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  label: string;
  input: string;
  btnPrimary: string;
  btnSecondary: string;
  onChange: (field: string, value: any) => void;
  onStudentSearch: (query: string) => void;
  onSelectStudent: (student: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function AssignmentForm({
  form,
  routes,
  searchResults,
  searchLoading,
  isDark,
  card,
  text,
  subtext,
  label,
  input,
  btnPrimary,
  btnSecondary,
  onChange,
  onStudentSearch,
  onSelectStudent,
  onSave,
  onCancel,
  saving
}: AssignmentFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className={`${card} rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <h3 className={`text-xl font-bold ${text} mb-6`}>
            {form.id ? 'Edit Student Assignment' : 'Assign Student to Transport'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={label}>Search Student</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.studentSearch || ''}
                  onChange={(e) => {
                    onChange('studentSearch', e.target.value);
                    onStudentSearch(e.target.value);
                  }}
                  className={`${input} w-full`}
                  placeholder="Search by name, admission number..."
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <div className={`mt-2 max-h-32 overflow-y-auto ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => onSelectStudent(student)}
                      className={`p-2 cursor-pointer hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors`}
                    >
                      <div className={`font-medium ${text}`}>
                        {student.name}
                      </div>
                      <div className={`text-xs ${subtext}`}>
                        {student.admissionNo} • {student.class?.name} {student.section?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {form.studentId && (
                <div className={`mt-2 p-2 ${isDark ? 'bg-green-600/20' : 'bg-green-100'} rounded-lg`}>
                  <div className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    Selected: {form.studentName || 'Student'}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-green-300' : 'text-green-500'}`}>
                    {form.studentAdmissionNo}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className={label}>Select Route</label>
              <select
                value={form.routeId || ''}
                onChange={(e) => onChange('routeId', e.target.value)}
                className={input}
              >
                <option value="">Select Route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.routeNumber} - {route.routeName} (Capacity: {route.capacity - (route.assignedStudents || 0)})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Pickup Stop</label>
                <input
                  type="text"
                  value={form.pickupStop || ''}
                  onChange={(e) => onChange('pickupStop', e.target.value)}
                  className={input}
                  placeholder="Enter pickup location"
                />
              </div>
              
              <div>
                <label className={label}>Drop Stop</label>
                <input
                  type="text"
                  value={form.dropStop || ''}
                  onChange={(e) => onChange('dropStop', e.target.value)}
                  className={input}
                  placeholder="Enter drop location"
                />
              </div>
            </div>
            
            <div>
              <label className={label}>Monthly Fee (₹)</label>
              <input
                type="number"
                value={form.monthlyFee || ''}
                onChange={(e) => onChange('monthlyFee', parseFloat(e.target.value))}
                className={input}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive || false}
                  onChange={(e) => onChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <span className={`text-sm ${text}`}>Active Assignment</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={saving}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || !form.studentId || !form.routeId}
              className={btnPrimary}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save Assignment'
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
