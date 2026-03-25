'use client';

import React from 'react';
import RolesManagement from '@/components/settings/RolesManagement';

interface RolesTabProps {
  isDark: boolean;
  card: string;
  heading: string;
  subtext: string;
}

export const RolesTab: React.FC<RolesTabProps> = ({ isDark }) => (
  <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-cyan-600/20' : 'bg-cyan-100'}`}>
        <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <div>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Custom Roles</h3>
        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage RBAC permissions</p>
      </div>
    </div>
    <RolesManagement theme={isDark ? 'dark' : 'light'} isDark={isDark} />
  </div>
);
