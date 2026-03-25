'use client';

import React, { useState } from 'react';

interface IntegrationsTabProps {
  isDark: boolean;
  canManageSettings: boolean;
  getSetting: (category: string, key: string, defaultValue: string) => string;
  saveBatchSettings: (category: string, settings: Record<string, string>) => void;
  saving: boolean;
  card: string;
  heading: string;
  btnPrimary: string;
  input: string;
  label: string;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  isDark,
  canManageSettings,
  getSetting,
  saveBatchSettings,
  saving,
  card,
  heading,
  btnPrimary,
  input,
  label,
}) => {
  const [smtpConfig, setSmtpConfig] = useState({
    host: getSetting('smtp', 'host', ''),
    port: getSetting('smtp', 'port', '587'),
    user: getSetting('smtp', 'user', ''),
    pass: getSetting('smtp', 'pass', ''),
    from: getSetting('smtp', 'from', ''),
    secure: getSetting('smtp', 'secure', 'true'),
  });

  const [paymentConfig, setPaymentConfig] = useState({
    razorpay_key_id: getSetting('payment', 'razorpay_key_id', ''),
    razorpay_key_secret: getSetting('payment', 'razorpay_key_secret', ''),
    stripe_publishable_key: getSetting('payment', 'stripe_publishable_key', ''),
    stripe_secret_key: getSetting('payment', 'stripe_secret_key', ''),
    upi_id: getSetting('payment', 'upi_id', ''),
  });

  return (
    <div className="space-y-3">
      {/* SMTP Configuration - Compact */}
      <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
              <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Email (SMTP)</h3>
              <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email delivery settings</p>
            </div>
          </div>
          <button 
            className={`px-2 py-1 rounded text-[10px] font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            disabled={saving || !canManageSettings}
            onClick={() => saveBatchSettings('smtp', smtpConfig)}
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="space-y-0.5">
            <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Host</label>
            <input className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={smtpConfig.host} onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value })} placeholder="smtp.gmail.com" />
          </div>
          <div className="space-y-0.5">
            <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Port</label>
            <input className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={smtpConfig.port} onChange={e => setSmtpConfig({ ...smtpConfig, port: e.target.value })} placeholder="587" />
          </div>
          <div className="space-y-0.5">
            <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Username</label>
            <input className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={smtpConfig.user} onChange={e => setSmtpConfig({ ...smtpConfig, user: e.target.value })} placeholder="user@example.com" />
          </div>
          <div className="space-y-0.5">
            <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Password</label>
            <input type="password" className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={smtpConfig.pass} onChange={e => setSmtpConfig({ ...smtpConfig, pass: e.target.value })} placeholder="••••••••" />
          </div>
          <div className="space-y-0.5">
            <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>From Email</label>
            <input className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={smtpConfig.from} onChange={e => setSmtpConfig({ ...smtpConfig, from: e.target.value })} placeholder="noreply@school.com" />
          </div>
          <div className="space-y-0.5">
            <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Secure</label>
            <select className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={smtpConfig.secure} onChange={e => setSmtpConfig({ ...smtpConfig, secure: e.target.value })}>
              <option value="true">SSL/TLS</option>
              <option value="false">None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Gateway - Compact */}
      <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Gateway</h3>
              <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Payment processing config</p>
            </div>
          </div>
          <button 
            className={`px-2 py-1 rounded text-[10px] font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            disabled={saving || !canManageSettings}
            onClick={() => saveBatchSettings('payment', paymentConfig)}
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
        <div className="space-y-2">
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-blue-900/10 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <h4 className={`text-xs font-medium mb-1.5 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Razorpay</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Key ID</label>
                <input className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={paymentConfig.razorpay_key_id} onChange={e => setPaymentConfig({ ...paymentConfig, razorpay_key_id: e.target.value })} placeholder="rzp_test_..." />
              </div>
              <div className="space-y-0.5">
                <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Key Secret</label>
                <input type="password" className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={paymentConfig.razorpay_key_secret} onChange={e => setPaymentConfig({ ...paymentConfig, razorpay_key_secret: e.target.value })} placeholder="••••••••" />
              </div>
            </div>
          </div>
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-purple-900/10 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
            <h4 className={`text-xs font-medium mb-1.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Stripe</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Publishable Key</label>
                <input className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={paymentConfig.stripe_publishable_key} onChange={e => setPaymentConfig({ ...paymentConfig, stripe_publishable_key: e.target.value })} placeholder="pk_test_..." />
              </div>
              <div className="space-y-0.5">
                <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Secret Key</label>
                <input type="password" className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={paymentConfig.stripe_secret_key} onChange={e => setPaymentConfig({ ...paymentConfig, stripe_secret_key: e.target.value })} placeholder="••••••••" />
              </div>
            </div>
          </div>
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-orange-900/10 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
            <h4 className={`text-xs font-medium mb-1.5 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>UPI Configuration</h4>
            <div className="space-y-0.5">
              <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>UPI ID</label>
              <input className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={paymentConfig.upi_id} onChange={e => setPaymentConfig({ ...paymentConfig, upi_id: e.target.value })} placeholder="school@upi" />
              <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Enter your UPI ID for direct payments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
