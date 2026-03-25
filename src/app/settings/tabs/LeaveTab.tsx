'use client';

import React from 'react';
import LeaveManagementSettings from '@/components/settings/LeaveManagementSettings';

interface LeaveTabProps {
  isDark: boolean;
  card: string;
  heading: string;
  subtext: string;
}

export const LeaveTab: React.FC<LeaveTabProps> = ({ isDark }) => (
  <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-rose-600/20' : 'bg-rose-100'}`}>
        <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M9 12l3-3m0 0l3 3m-3-3v12" />
        </svg>
      </div>
      <div>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Leave Management</h3>
        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configure leave policies</p>
      </div>
    </div>
    <LeaveManagementSettings theme={isDark ? 'dark' : 'light'} isDark={isDark} />
  </div>
);
