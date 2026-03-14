'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

type Tab = 'smtp' | 'razorpay' | 'bank' | 'business';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'smtp',     label: 'SMTP Email',    icon: '✉️' },
  { id: 'razorpay', label: 'Razorpay',      icon: '💳' },
  { id: 'bank',     label: 'Bank Account',  icon: '🏦' },
  { id: 'business', label: 'Business Info', icon: '🏢' },
];

function FieldRow({
  label, hint, value, onChange, type = 'text', placeholder, secret = false,
  isDark,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; secret?: boolean; isDark: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputCls = `flex-1 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-orange-500/50`;
  return (
    <div>
      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</label>
      <div className="flex gap-2">
        <input
          className={inputCls}
          type={secret && !show ? 'password' : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {secret && (
          <button type="button" onClick={() => setShow(s => !s)}
            className={`px-3 py-2 rounded-lg border text-xs ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
            {show ? '🙈 Hide' : '👁 Show'}
          </button>
        )}
      </div>
      {hint && <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{hint}</p>}
    </div>
  );
}

function StatusBadge({ enabled, isDark }: { enabled: boolean; isDark: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${enabled
      ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
      : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
    }`}>
      {enabled ? '● Enabled' : '○ Disabled'}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('smtp');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetch('/api/admin/saas-config')
      .then(r => r.json())
      .then(d => { if (d.config) setConfig(d.config); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, val: string) => {
    setConfig(p => ({ ...p, [key]: val }));
    setHasChanges(true);
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/saas-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        setHasChanges(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className={`h-10 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`} />
      <div className={`h-64 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment & Email Config</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Platform-level settings for billing, SMTP, and business identity</p>
        </div>
        <div className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
          <span>ℹ️</span>
          <span>These are platform settings — not per-school settings</span>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <span className="text-sm">✉️ SMTP</span>
          <StatusBadge enabled={config.smtp_enabled === 'true'} isDark={isDark} />
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <span className="text-sm">💳 Razorpay</span>
          <StatusBadge enabled={config.razorpay_enabled === 'true'} isDark={isDark} />
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <span className="text-sm">🏦 Bank</span>
          <StatusBadge enabled={!!config.bank_account_number} isDark={isDark} />
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <span className="text-sm">🏢 Business</span>
          <StatusBadge enabled={!!config.company_name} isDark={isDark} />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Tab bar */}
      <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === t.id
                ? isDark ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-900 shadow'
                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={`${cardCls} p-6 space-y-5`}>
        {/* SMTP */}
        {activeTab === 'smtp' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>✉️ SMTP Configuration</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>For: password reset emails, welcome emails, subscription invoices, platform notifications</p>
              </div>
              <select
                className={`px-3 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                value={config.smtp_enabled || 'false'} onChange={e => set('smtp_enabled', e.target.value)}>
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldRow label="SMTP Host" placeholder="smtp.gmail.com" value={config.smtp_host || ''} onChange={v => set('smtp_host', v)} isDark={isDark} />
              <FieldRow label="SMTP Port" placeholder="587" value={config.smtp_port || ''} onChange={v => set('smtp_port', v)} isDark={isDark} hint="587 for TLS, 465 for SSL" />
              <FieldRow label="Username / Email" placeholder="platform@yourcompany.com" value={config.smtp_username || ''} onChange={v => set('smtp_username', v)} isDark={isDark} />
              <FieldRow label="Password / App Password" placeholder="App password" value={config.smtp_password || ''} onChange={v => set('smtp_password', v)} isDark={isDark} secret />
              <FieldRow label="From Email" type="email" placeholder="noreply@schoolerp.com" value={config.smtp_from_email || ''} onChange={v => set('smtp_from_email', v)} isDark={isDark} />
              <FieldRow label="From Name" placeholder="School ERP Platform" value={config.smtp_from_name || ''} onChange={v => set('smtp_from_name', v)} isDark={isDark} />
            </div>
            <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              💡 When disabled, password reset links are shown on-screen (dev mode). Enable for production.
            </div>
          </>
        )}

        {/* Razorpay */}
        {activeTab === 'razorpay' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>💳 Razorpay Integration</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Get keys from{' '}
                  <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">
                    dashboard.razorpay.com ↗
                  </a>
                </p>
              </div>
              <select
                className={`px-3 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                value={config.razorpay_enabled || 'false'} onChange={e => set('razorpay_enabled', e.target.value)}>
                <option value="false">Disabled (test mode)</option>
                <option value="true">Enabled (live)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldRow label="Key ID" placeholder="rzp_live_xxxxxxxxxxxxxxx" value={config.razorpay_key_id || ''} onChange={v => set('razorpay_key_id', v)} isDark={isDark}
                hint="Starts with rzp_live_ for production" />
              <FieldRow label="Key Secret" placeholder="Secret key from dashboard" value={config.razorpay_key_secret || ''} onChange={v => set('razorpay_key_secret', v)} isDark={isDark} secret />
              <FieldRow label="Webhook Secret" placeholder="Webhook signing secret" value={config.razorpay_webhook_secret || ''} onChange={v => set('razorpay_webhook_secret', v)} isDark={isDark} secret
                hint="Set in Razorpay Dashboard → Webhooks" />
              <FieldRow label="Currency" placeholder="INR" value={config.payment_currency || 'INR'} onChange={v => set('payment_currency', v)} isDark={isDark} />
            </div>
            <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
              ⚠️ Use <code>rzp_test_</code> keys during development. Switch to <code>rzp_live_</code> keys only in production with proper webhook verification.
            </div>
          </>
        )}

        {/* Bank */}
        {activeTab === 'bank' && (
          <>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>🏦 Bank Account Details</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Shown on invoices for manual bank transfer payments</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldRow label="Bank Name" placeholder="e.g. State Bank of India" value={config.bank_name || ''} onChange={v => set('bank_name', v)} isDark={isDark} />
              <FieldRow label="Account Holder Name" placeholder="Company or person name" value={config.bank_account_name || ''} onChange={v => set('bank_account_name', v)} isDark={isDark} />
              <FieldRow label="Account Number" placeholder="Account number" value={config.bank_account_number || ''} onChange={v => set('bank_account_number', v)} isDark={isDark} secret />
              <FieldRow label="IFSC Code" placeholder="e.g. SBIN0001234" value={config.bank_ifsc_code || ''} onChange={v => set('bank_ifsc_code', v)} isDark={isDark} />
              <FieldRow label="Branch Name" placeholder="e.g. Koramangala, Bengaluru" value={config.bank_branch || ''} onChange={v => set('bank_branch', v)} isDark={isDark} />
              <FieldRow label="UPI ID" placeholder="e.g. company@ybl" value={config.bank_upi_id || ''} onChange={v => set('bank_upi_id', v)} isDark={isDark} />
            </div>
          </>
        )}

        {/* Business */}
        {activeTab === 'business' && (
          <>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>🏢 Business & Invoice Details</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Displayed on subscription invoices and payment receipts</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldRow label="Company Name" placeholder="Your company/product name" value={config.company_name || ''} onChange={v => set('company_name', v)} isDark={isDark} />
              <FieldRow label="Support Email" type="email" placeholder="support@company.com" value={config.support_email || ''} onChange={v => set('support_email', v)} isDark={isDark} />
              <FieldRow label="GST Number" placeholder="e.g. 22AAAAA0000A1Z5" value={config.gst_number || ''} onChange={v => set('gst_number', v)} isDark={isDark} />
              <FieldRow label="GST %" placeholder="18" value={config.gst_percentage || ''} onChange={v => set('gst_percentage', v)} isDark={isDark} />
              <div className="md:col-span-2">
                <FieldRow label="Company Address" placeholder="Full registered address" value={config.company_address || ''} onChange={v => set('company_address', v)} isDark={isDark} />
              </div>
              <div className="md:col-span-2">
                <FieldRow label="Invoice Footer Note" placeholder="e.g. Thank you for your business!" value={config.invoice_footer || ''} onChange={v => set('invoice_footer', v)} isDark={isDark} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save bar */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <span className={`text-sm ${hasChanges ? isDark ? 'text-yellow-400' : 'text-yellow-600' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {hasChanges ? '● Unsaved changes' : '✓ All changes saved'}
        </span>
        <button onClick={save} disabled={saving || !hasChanges}
          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-sm">
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
