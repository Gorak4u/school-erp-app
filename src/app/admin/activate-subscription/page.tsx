'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function ActivateSubscriptionPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const router = useRouter();

  const activate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/activate-subscription', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => router.push('/admin'), 2000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h1 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Activate Super Admin Subscription</h1>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Remove the trial banner by activating an Enterprise subscription for your demo school.
        </p>

        {message && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <button
          onClick={activate}
          disabled={loading}
          className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all ${
            loading
              ? 'bg-gray-600 text-white cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-500 text-white'
          }`}
        >
          {loading ? 'Activating...' : 'Activate Enterprise Subscription'}
        </button>

        <div className={`mt-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          This will give you unlimited students/teachers and remove all trial restrictions.
        </div>
      </div>
    </div>
  );
}
