// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { classesApi, sectionsApi, teachersApi } from '@/lib/apiClient';
import { showToast } from '@/lib/toastUtils';

interface ClassTeacherAssignment {
  classId: string;
  className: string;
  sectionId?: string;
  sectionName?: string;
  teacherId: number;
  teacherName: string;
  academicYearId: string;
  academicYearName: string;
  assignedDate: string;
}

interface ClassTeacherAssignmentsProps {
  teacherId?: number;
  teacherName?: string;
  theme: 'dark' | 'light';
  onAssignmentChange?: () => void;
}

export default function ClassTeacherAssignments({ 
  teacherId, 
  teacherName, 
  theme, 
  onAssignmentChange 
}: ClassTeacherAssignmentsProps) {
  const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    sectionId: '',
    academicYearId: '',
    teacherId: teacherId || 0
  });

  const isDark = theme === 'dark';
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  }`;

  // Load assignments and data
  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load classes, sections, and academic years
      const [classesRes, sectionsRes, academicYearsRes] = await Promise.all([
        classesApi.list(),
        sectionsApi.list(),
        fetch('/api/school-structure/academic-years').then(r => r.json())
      ]);

      setClasses(classesRes.classes || []);
      setSections(sectionsRes.sections || []);
      setAcademicYears(academicYearsRes.academicYears || []);

      // Load teacher assignments
      if (teacherId) {
        // This would be a new API endpoint - for now using mock data
        const mockAssignments: ClassTeacherAssignment[] = [
          {
            classId: '1',
            className: 'Class 10',
            sectionId: '1',
            sectionName: 'A',
            teacherId: teacherId || 1,
            teacherName: teacherName || 'John Doe',
            academicYearId: '1',
            academicYearName: '2024-25',
            assignedDate: '2024-01-15'
          }
        ];
        setAssignments(mockAssignments);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClassTeacher = async () => {
    if (!formData.classId || !formData.academicYearId || !formData.teacherId) {
      showToast('warning', 'Missing Fields', 'Please fill all required fields');
      return;
    }

    try {
      // This would be a new API endpoint
      const selectedClass = classes.find(c => c.id === formData.classId);
      const selectedSection = sections.find(s => s.id === formData.sectionId);
      const selectedYear = academicYears.find(y => y.id === formData.academicYearId);

      const newAssignment: ClassTeacherAssignment = {
        classId: formData.classId,
        className: selectedClass?.label || 'Unknown',
        sectionId: formData.sectionId,
        sectionName: selectedSection?.label || 'All Sections',
        teacherId: formData.teacherId,
        teacherName: teacherName || 'Unknown',
        academicYearId: formData.academicYearId,
        academicYearName: selectedYear?.name || 'Unknown',
        assignedDate: new Date().toISOString().split('T')[0]
      };

      // Add to assignments (in real app, this would be an API call)
      setAssignments(prev => [...prev, newAssignment]);
      
      // Reset form and close modal
      setFormData({
        classId: '',
        sectionId: '',
        academicYearId: '',
        teacherId: teacherId || 0
      });
      setShowAssignModal(false);
      
      if (onAssignmentChange) {
        onAssignmentChange();
      }
      showToast('success', 'Assigned', 'Class teacher assigned successfully');
    } catch (error) {
      console.error('Failed to assign class teacher:', error);
      showToast('error', 'Assignment Failed', 'Failed to assign class teacher');
    }
  };

  const handleRemoveAssignment = async (assignment: ClassTeacherAssignment) => {
    if (!confirm(`Remove ${teacherName} as class teacher of ${assignment.className} ${assignment.sectionName || ''}?`)) {
      return;
    }

    try {
      // Remove from assignments (in real app, this would be an API call)
      setAssignments(prev => prev.filter(a => 
        !(a.classId === assignment.classId && 
          a.sectionId === assignment.sectionId && 
          a.academicYearId === assignment.academicYearId)
      ));
      
      if (onAssignmentChange) {
        onAssignmentChange();
      }
    } catch (error) {
      console.error('Failed to remove assignment:', error);
      showToast('error', 'Remove Failed', 'Failed to remove assignment');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className={`h-4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} w-1/4 mb-2`} />
          <div className={`h-8 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-lg font-semibold ${txt}`}>Class Teacher Assignments</h3>
          <p className={`text-sm ${sub}`}>Classes where {teacherName} is assigned as class teacher</p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          + Assign Class
        </button>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className={`p-8 text-center rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-sm ${sub}`}>No class teacher assignments found</p>
          <button
            onClick={() => setShowAssignModal(true)}
            className={`mt-2 text-sm text-blue-600 hover:text-blue-700 ${isDark ? 'text-blue-400' : ''}`}
          >
            Assign first class
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border flex justify-between items-center ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div>
                <p className={`font-medium ${txt}`}>
                  {assignment.className} {assignment.sectionName}
                </p>
                <p className={`text-sm ${sub}`}>
                  {assignment.academicYearName} • Assigned {assignment.assignedDate}
                </p>
              </div>
              <button
                onClick={() => handleRemoveAssignment(assignment)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  isDark 
                    ? 'border-red-600 text-red-400 hover:bg-red-600/20' 
                    : 'border-red-500 text-red-600 hover:bg-red-50'
                }`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assign Class Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}>
          <div className={`w-full max-w-md mx-4 rounded-xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold ${txt}`}>Assign Class Teacher</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Class *</label>
                <select
                  className={inputCls}
                  value={formData.classId}
                  onChange={e => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Section (Optional)</label>
                <select
                  className={inputCls}
                  value={formData.sectionId}
                  onChange={e => setFormData(prev => ({ ...prev, sectionId: e.target.value }))}
                >
                  <option value="">All Sections</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>{section.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Academic Year *</label>
                <select
                  className={inputCls}
                  value={formData.academicYearId}
                  onChange={e => setFormData(prev => ({ ...prev, academicYearId: e.target.value }))}
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name || year.year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setShowAssignModal(false)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                Cancel
              </button>
              <button
                onClick={handleAssignClassTeacher}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
