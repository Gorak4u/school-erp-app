'use client';

import React from 'react';
import { AcademicYear } from '../types';

interface AcademicYearsTabProps {
  isDark: boolean;
  academicYears: AcademicYear[];
  canManageSettings: boolean;
  openCreate: (type: string, initialData: any) => void;
  openEdit: (type: string, data: any) => void;
  handleDelete: (entity: string, id: string, name: string) => void;
  handleActivateAcademicYear: (ay: AcademicYear) => void;
}

export const AcademicYearsTab: React.FC<AcademicYearsTabProps> = ({
  isDark,
  academicYears,
  canManageSettings,
  openCreate,
  openEdit,
  handleDelete,
  handleActivateAcademicYear,
}) => (
  <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-4 shadow-sm`}>
    {/* Header - Compact */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Academic Years</h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{academicYears.length} configured</p>
        </div>
      </div>
      <button 
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isDark 
            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        }`}
        onClick={() => openCreate('academicYear', { year: '', name: '', startDate: '', endDate: '', isActive: false })}
      >
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </span>
      </button>
    </div>
    
    {academicYears.length === 0 ? (
      <div className={`text-center py-6 rounded-lg border border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
        <svg className={`mx-auto h-8 w-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No academic years</p>
      </div>
    ) : (
      <div className="space-y-2">
        {academicYears.map((ay: any) => (
          <div 
            key={ay.id} 
            className={`p-2.5 rounded-lg border transition-all ${
              ay.isActive 
                ? isDark 
                  ? 'bg-green-900/20 border-green-700' 
                  : 'bg-green-50 border-green-200'
                : isDark 
                  ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                  ay.isActive 
                    ? isDark ? 'bg-green-600/20' : 'bg-green-100' 
                    : isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <svg className={`w-3.5 h-3.5 ${ay.isActive ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{ay.name}</h4>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      ay.isActive 
                        ? 'bg-green-500 text-white' 
                        : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {ay.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {ay.year} • {ay.startDate?.slice(0, 10)} to {ay.endDate?.slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!ay.isActive && (
                  <button
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      isDark 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    disabled={!canManageSettings}
                    onClick={() => handleActivateAcademicYear(ay)}
                    title="Activate"
                  >
                    Activate
                  </button>
                )}
                <button 
                  className={`p-1.5 rounded transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  onClick={() => openEdit('academicYear', ay)}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  className={`p-1.5 rounded transition-colors ${
                    isDark 
                      ? 'hover:bg-red-900/30 text-red-400' 
                      : 'hover:bg-red-50 text-red-500'
                  }`}
                  onClick={() => handleDelete('academicYear', ay.id, ay.name)}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
