'use client';

import React, { useState } from 'react';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

interface SchoolStructureSelectorProps {
  theme: 'dark' | 'light';
  onMediumChange?: (mediumId: string) => void;
  onClassChange?: (classId: string) => void;
  onSectionChange?: (sectionId: string) => void;
  selectedMedium?: string;
  selectedClass?: string;
  selectedSection?: string;
  showAll?: boolean;
  disabled?: boolean;
}

export default function SchoolStructureSelector({
  theme,
  onMediumChange,
  onClassChange,
  onSectionChange,
  selectedMedium,
  selectedClass,
  selectedSection,
  showAll = false,
  disabled = false
}: SchoolStructureSelectorProps) {
  const { mediums, classes, sections, getClassesByMedium, getSectionsByClass, getMediumById, getClassById, loading } = useSchoolConfig();

  const filteredClasses = selectedMedium ? getClassesByMedium(selectedMedium) : classes;
  const filteredSections = selectedClass ? getSectionsByClass(selectedClass) : [];

  const handleMediumChange = (mediumId: string) => {
    onMediumChange?.(mediumId);
    onClassChange?.('');
    onSectionChange?.('');
  };

  const handleClassChange = (classId: string) => {
    onClassChange?.(classId);
    onSectionChange?.('');
  };

  const inputClass = `px-3 py-2 rounded-lg text-sm border transition-colors ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  } ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
  } outline-none`;

  const labelClass = `block text-sm font-medium mb-2 ${
    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Medium Selection */}
      <div>
        <label className={labelClass}>
          Language Medium {showAll && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedMedium || ''}
          onChange={(e) => handleMediumChange(e.target.value)}
          disabled={disabled || loading}
          className={inputClass}
        >
          <option value="">{loading ? 'Loading...' : 'Select Medium'}</option>
          {!loading && mediums.map((medium) => (
            <option key={medium.id} value={medium.id}>
              {medium.name} ({medium.code})
            </option>
          ))}
        </select>
        {selectedMedium && (
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {getMediumById(selectedMedium)?.description}
          </p>
        )}
      </div>

      {/* Class Selection */}
      <div>
        <label className={labelClass}>
          Class {showAll && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedClass || ''}
          onChange={(e) => handleClassChange(e.target.value)}
          disabled={disabled || !selectedMedium || loading}
          className={inputClass}
        >
          <option value="">{loading ? 'Loading...' : 'Select Class'}</option>
          {!loading && filteredClasses.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - {(cls.level || '').replace('_', ' ')}
            </option>
          ))}
        </select>
        {selectedClass && (
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {getClassById(selectedClass)?.sections?.length || 0} sections available
          </p>
        )}
      </div>

      {/* Section Selection */}
      <div>
        <label className={labelClass}>
          Section {showAll && filteredSections.length > 0 && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedSection || ''}
          onChange={(e) => onSectionChange?.(e.target.value)}
          disabled={disabled || !selectedClass || loading}
          className={inputClass}
        >
          <option value="">{loading ? 'Loading...' : 'Select Section'}</option>
          {!loading && filteredSections.map((section) => (
            <option key={section.id} value={section.id}>
              Section {section.name} (Cap: {section.capacity})
            </option>
          ))}
        </select>
        {selectedClass && filteredSections.length === 0 && (
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
            No sections available for this class
          </p>
        )}
        {selectedSection && (
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Room: {filteredSections.find(s => s.id === selectedSection)?.roomNumber || 'TBA'}
          </p>
        )}
      </div>
    </div>
  );
}

// Additional component for displaying school structure overview
export function SchoolStructureOverview({ theme }: { theme: 'dark' | 'light' }) {
  const { mediums, classes, sections, getClassesByMedium, getMediumById, getSectionsByClass } = useSchoolConfig();
  const [selectedMedium, setSelectedMedium] = useState<string>('');
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const toggleClassExpansion = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const cardClass = `p-4 rounded-lg border ${
    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
  }`;

  const headerClass = `text-lg font-semibold mb-3 ${
    theme === 'dark' ? 'text-white' : 'text-gray-900'
  }`;

  const textClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  const displayClasses = selectedMedium ? getClassesByMedium(selectedMedium) : classes;

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <h3 className={headerClass}>School Structure Overview</h3>
        
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${textClass}`}>
            Filter by Medium:
          </label>
          <select
            value={selectedMedium}
            onChange={(e) => setSelectedMedium(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Mediums</option>
            {mediums.map((medium) => (
              <option key={medium.id} value={medium.id}>
                {medium.name}
              </option>
            ))}
          </select>
        </div>

        {/* Classes Display */}
        <div className="space-y-3">
          {displayClasses.map((cls) => {
            const clsSections = getSectionsByClass(cls.id);
            return (
              <div key={cls.id} className={`border rounded-lg p-3 ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
              }`}>
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleClassExpansion(cls.id)}
                >
                  <div>
                    <span className={`font-medium ${textClass}`}>
                      {cls.name} ({cls.code})
                    </span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {(cls.level || '').replace('_', ' ')}
                    </span>
                  </div>
                  <button className={`text-sm ${textClass} hover:text-blue-500`}>
                    {expandedClasses.has(cls.id) ? '▼' : '▶'}
                  </button>
                </div>

                {expandedClasses.has(cls.id) && (
                  <div className="mt-3 space-y-2">
                    <div className={`text-sm ${textClass}`}>
                      <strong>Medium:</strong> {getMediumById(cls.mediumId)?.name || '—'}
                    </div>
                    <div className={`text-sm ${textClass}`}>
                      <strong>Sections:</strong> {clsSections.length} sections
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {clsSections.map((section) => (
                        <div key={section.id} className={`text-xs p-2 rounded ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="font-medium">Section {section.name}</div>
                          <div>Capacity: {section.capacity}</div>
                          <div>Room: {section.roomNumber || 'TBA'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
