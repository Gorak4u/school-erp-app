'use client';

import React from 'react';
import UsersManagement from '@/components/settings/UsersManagement';

interface UsersTabProps {
  isDark: boolean;
  card: string;
  heading: string;
  subtext: string;
}

export const UsersTab: React.FC<UsersTabProps> = ({ isDark }) => (
  <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-teal-600/20' : 'bg-teal-100'}`}>
        <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <div>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Users & Access</h3>
        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage user accounts</p>
      </div>
    </div>
    <UsersManagement theme={isDark ? 'dark' : 'light'} isDark={isDark} />
  </div>
);
