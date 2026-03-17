// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';

interface ClassTeacherFormAssignmentsProps {
  assignments: any[];
  boards: any[];
  mediums: any[];
  classes: any[];
  sections: any[];
  academicYears: any[];
  theme: 'dark' | 'light';
  onChange: (assignments: any[]) => void;
}

export default function ClassTeacherFormAssignments({
  assignments,
  boards,
  mediums,
  classes,
  sections,
  academicYears,
  theme,
  onChange
}: ClassTeacherFormAssignmentsProps) {
  const [newAssignment, setNewAssignment] = useState({
    boardId: '',
    mediumId: '',
    classId: '',
    sectionId: '',
    academicYearId: ''
  });
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);

  const isDark = theme === 'dark';
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  }`;

  // Filter classes based on selected board and medium
  useEffect(() => {
    if (newAssignment.boardId && newAssignment.mediumId) {
      const filtered = classes.filter(cls => 
        cls.boardId === newAssignment.boardId && 
        cls.mediumId === newAssignment.mediumId
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [newAssignment.boardId, newAssignment.mediumId, classes]);

  // Filter sections based on selected class
  useEffect(() => {
    if (newAssignment.classId) {
      const filtered = sections.filter(section => 
        section.classId === newAssignment.classId
      );
      setFilteredSections(filtered);
    } else {
      setFilteredSections([]);
    }
  }, [newAssignment.classId, sections]);

  const handleAddAssignment = () => {
    if (!newAssignment.boardId || !newAssignment.mediumId || !newAssignment.classId || !newAssignment.academicYearId) {
      return;
    }

    const selectedBoard = boards.find(b => b.id === newAssignment.boardId);
    const selectedMedium = mediums.find(m => m.id === newAssignment.mediumId);
    const selectedClass = classes.find(c => c.id === newAssignment.classId);
    const selectedSection = sections.find(s => s.id === newAssignment.sectionId);
    const selectedYear = academicYears.find(y => y.id === newAssignment.academicYearId);

    const assignment = {
      id: Date.now().toString(),
      boardId: newAssignment.boardId,
      boardName: selectedBoard?.name || 'Unknown',
      mediumId: newAssignment.mediumId,
      mediumName: selectedMedium?.name || 'Unknown',
      classId: newAssignment.classId,
      className: selectedClass?.name || 'Unknown',
      sectionId: newAssignment.sectionId,
      sectionName: selectedSection?.name || 'All Sections',
      academicYearId: newAssignment.academicYearId,
      academicYearName: selectedYear?.name || selectedYear?.year || 'Unknown',
      assignedDate: new Date().toISOString().split('T')[0]
    };

    onChange([...assignments, assignment]);
    
    // Reset form
    setNewAssignment({
      boardId: '',
      mediumId: '',
      classId: '',
      sectionId: '',
      academicYearId: ''
    });
  };

  const handleRemoveAssignment = (id: string) => {
    onChange(assignments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className={`text-sm font-medium mb-3 ${txt}`}>Class Teacher Assignments</h4>
        
        {/* Current Assignments */}
        {assignments.length > 0 && (
          <div className="space-y-2 mb-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-sm">
                  <p className={`font-medium ${txt}`}>
                    {assignment.className} {assignment.sectionName}
                  </p>
                  <p className={`text-xs ${sub}`}>
                    {assignment.boardName} • {assignment.mediumName} • {assignment.academicYearName}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveAssignment(assignment.id)}
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

        {/* Add New Assignment */}
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h5 className={`text-sm font-medium mb-3 ${txt}`}>Add Class Assignment</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>Board *</label>
              <select
                className={inputCls}
                value={newAssignment.boardId}
                onChange={e => setNewAssignment(prev => ({ ...prev, boardId: e.target.value }))}
              >
                <option value="">Select Board</option>
                {boards.map(board => (
                  <option key={board.id} value={board.id}>{board.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>Medium *</label>
              <select
                className={inputCls}
                value={newAssignment.mediumId}
                onChange={e => setNewAssignment(prev => ({ ...prev, mediumId: e.target.value }))}
              >
                <option value="">Select Medium</option>
                {mediums.map(medium => (
                  <option key={medium.id} value={medium.id}>{medium.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>Class *</label>
              <select
                className={inputCls}
                value={newAssignment.classId}
                onChange={e => setNewAssignment(prev => ({ ...prev, classId: e.target.value }))}
                disabled={!newAssignment.boardId || !newAssignment.mediumId}
              >
                <option value="">Select Class</option>
                {filteredClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>Section (Optional)</label>
              <select
                className={inputCls}
                value={newAssignment.sectionId}
                onChange={e => setNewAssignment(prev => ({ ...prev, sectionId: e.target.value }))}
                disabled={!newAssignment.classId}
              >
                <option value="">All Sections</option>
                {filteredSections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>Academic Year *</label>
              <select
                className={inputCls}
                value={newAssignment.academicYearId}
                onChange={e => setNewAssignment(prev => ({ ...prev, academicYearId: e.target.value }))}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map(year => (
                  <option key={year.id} value={year.id}>{year.name || year.year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddAssignment}
                disabled={!newAssignment.boardId || !newAssignment.mediumId || !newAssignment.classId || !newAssignment.academicYearId}
                className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
