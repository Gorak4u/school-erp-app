'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';

export default function ActivateSubscriptionPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const activate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/activate-subscription', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast('Success', data.message);
        setTimeout(() => router.push('/admin'), 2000);
      } else {
        showErrorToast('Error', data.error);
      }
    } catch {
      showErrorToast('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout currentPage="admin" theme={theme} title="Activate Subscription">
      <div className="max-w-2xl mx-auto py-12">
        <div className={`max-w-md w-full rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h1 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Activate Super Admin Subscription</h1>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Click the button below to provision a complimentary Trial Plan for your school. 
            This will unlock all core features and allow you to fully test the platform.
          </p>

          <button 
            onClick={activate}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-medium text-white transition-all ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'
            }`}
          >
            {loading ? 'Activating...' : 'Activate Trial Plan Now'}
          </button>
        </div>
        <div className={`mt-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          This will give you unlimited students/teachers and remove all trial restrictions.
        </div>
      </div>
    </AppLayout>
  );
}
