// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { teachersApi, classesApi, sectionsApi } from '@/lib/apiClient';

interface ClassTeacherAssignment {
  id: string;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  classId: string;
  className: string;
  sectionId?: string;
  sectionName?: string;
  academicYearId: string;
  academicYearName: string;
  assignedDate: string;
  status: 'active' | 'inactive';
}

export default function ClassTeachersPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    teacherId: '',
    classId: '',
    sectionId: '',
    academicYearId: ''
  });

  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const card = `p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  }`;

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teachersRes, classesRes, sectionsRes, academicYearsRes] = await Promise.all([
        teachersApi.list(),
        classesApi.list(),
        sectionsApi.list(),
        fetch('/api/school-structure/academic-years').then(r => r.json())
      ]);

      setTeachers(teachersRes.teachers || []);
      setClasses(classesRes.classes || []);
      setSections(sectionsRes.sections || []);
      setAcademicYears(academicYearsRes.academicYears || []);

      // Mock assignments data - in real app, this would come from API
      const mockAssignments: ClassTeacherAssignment[] = [
        {
          id: '1',
          teacherId: 1,
          teacherName: 'John Doe',
          teacherEmail: 'john@school.com',
          classId: '1',
          className: 'Class 10',
          sectionId: '1',
          sectionName: 'A',
          academicYearId: '1',
          academicYearName: '2024-25',
          assignedDate: '2024-01-15',
          status: 'active'
        },
        {
          id: '2',
          teacherId: 2,
          teacherName: 'Jane Smith',
          teacherEmail: 'jane@school.com',
          classId: '2',
          className: 'Class 9',
          sectionId: '2',
          sectionName: 'B',
          academicYearId: '1',
          academicYearName: '2024-25',
          assignedDate: '2024-01-16',
          status: 'active'
        }
      ];
      setAssignments(mockAssignments);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClassTeacher = async () => {
    if (!formData.teacherId || !formData.classId || !formData.academicYearId) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const selectedTeacher = teachers.find(t => t.id === parseInt(formData.teacherId));
      const selectedClass = classes.find(c => c.id === formData.classId);
      const selectedSection = sections.find(s => s.id === formData.sectionId);
      const selectedYear = academicYears.find(y => y.id === formData.academicYearId);

      const newAssignment: ClassTeacherAssignment = {
        id: Date.now().toString(),
        teacherId: parseInt(formData.teacherId),
        teacherName: selectedTeacher?.name || 'Unknown',
        teacherEmail: selectedTeacher?.email || '',
        classId: formData.classId,
        className: selectedClass?.label || 'Unknown',
        sectionId: formData.sectionId,
        sectionName: selectedSection?.label || 'All Sections',
        academicYearId: formData.academicYearId,
        academicYearName: selectedYear?.name || 'Unknown',
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      setAssignments(prev => [...prev, newAssignment]);
      
      // Reset form
      setFormData({
        teacherId: '',
        classId: '',
        sectionId: '',
        academicYearId: ''
      });
      setShowAssignModal(false);
    } catch (error) {
      console.error('Failed to assign class teacher:', error);
      alert('Failed to assign class teacher');
    }
  };

  const handleRemoveAssignment = async (assignment: ClassTeacherAssignment) => {
    if (!confirm(`Remove ${assignment.teacherName} as class teacher of ${assignment.className} ${assignment.sectionName || ''}?`)) {
      return;
    }

    try {
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
    } catch (error) {
      console.error('Failed to remove assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  return (
    <AppLayout currentPage="class-teachers" title="Class Teacher Assignments">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-2xl font-bold ${txt}`}>Class Teacher Assignments</h2>
            <p className={`mt-1 text-sm ${sub}`}>
              {loading ? 'Loading…' : `${assignments.length} total assignments`}
            </p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            + Assign Class Teacher
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Assignments', value: assignments.length, icon: '👥', color: 'blue' },
            { label: 'Active Teachers', value: assignments.filter(a => a.status === 'active').length, icon: '✅', color: 'green' },
            { label: 'Classes Covered', value: new Set(assignments.map(a => a.className)).size, icon: '📚', color: 'purple' },
            { label: 'Academic Years', value: new Set(assignments.map(a => a.academicYearName)).size, icon: '📅', color: 'orange' },
          ].map(s => (
            <div key={s.label} className={card}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-xs font-medium ${sub}`}>{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${txt}`}>{s.value}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Assignments Table */}
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>Teacher</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>Class</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>Section</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>Academic Year</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>Assigned Date</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>Status</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${60 + (j * 7) % 30}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <p className={`text-lg font-medium ${txt}`}>No class teacher assignments found</p>
                      <p className={`text-sm mt-1 ${sub}`}>Assign your first class teacher to get started</p>
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => (
                    <tr key={assignment.id} className={`transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`font-medium text-sm ${txt}`}>{assignment.teacherName}</p>
                          <p className={`text-xs ${sub}`}>{assignment.teacherEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{assignment.className}</td>
                      <td className="px-4 py-3 text-sm">{assignment.sectionName || 'All Sections'}</td>
                      <td className="px-4 py-3 text-sm">{assignment.academicYearName}</td>
                      <td className="px-4 py-3 text-sm">{assignment.assignedDate}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'active'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assign Class Teacher Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}>
            <div className={`w-full max-w-md mx-4 rounded-xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-bold ${txt}`}>Assign Class Teacher</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>Teacher *</label>
                  <select
                    className={inputCls}
                    value={formData.teacherId}
                    onChange={e => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.email}</option>
                    ))}
                  </select>
                </div>
                
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
    </AppLayout>
  );
}
