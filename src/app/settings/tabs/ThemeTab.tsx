'use client';

import React from 'react';
import ThemeManager from '@/components/settings/ThemeManager';

interface ThemeTabProps {
  isDark: boolean;
  card: string;
  heading: string;
  subtext: string;
}

export const ThemeTab: React.FC<ThemeTabProps> = ({ isDark }) => (
  <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-pink-600/20' : 'bg-pink-100'}`}>
        <svg className="w-3.5 h-3.5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </div>
      <div>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Theme & Branding</h3>
        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customize appearance</p>
      </div>
    </div>
    <ThemeManager schoolId="default" />
  </div>
);
