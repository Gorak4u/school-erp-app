'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminPaymentsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/saas-config')
      .then(r => r.json())
      .then(d => { if (d.config) setConfig(d.config); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
      setMessage({ type: res.ok ? 'success' : 'error', text: res.ok ? 'Saved successfully!' : data.error });
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-orange-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const cardCls = `rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const set = (key: string, val: string) => setConfig(p => ({ ...p, [key]: val }));

  if (loading) return <div className={`text-center py-20 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SaaS Platform Configuration</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Platform-level SMTP and payment settings — used for subscription billing and system emails only</p>
        <div className={`mt-3 px-4 py-2.5 rounded-lg border text-xs flex items-start gap-2 ${
          isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span className="mt-0.5">ℹ️</span>
          <span>
            <strong>SaaS settings vs School settings:</strong> These settings are for the platform itself — sending password reset emails, subscription invoices, etc.
            Each school configures their own SMTP and payment gateway separately via <strong>Settings → SMTP &amp; Payments</strong> for school-level activities (fee receipts, school notifications).
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* SaaS SMTP */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>SaaS SMTP — Platform Emails</h3>
          <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 font-medium">SaaS Only</span>
        </div>
        <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Used for: password reset emails, welcome emails, subscription invoices, platform notifications.<br />
          <strong className={isDark ? 'text-gray-400' : 'text-gray-600'}>Not used</strong> for school fee receipts or school notifications (schools configure their own SMTP).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>SMTP Host</label>
            <input className={inputCls} placeholder="smtp.gmail.com" value={config.smtp_host || ''} onChange={e => set('smtp_host', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>SMTP Port</label>
            <input className={inputCls} placeholder="587" value={config.smtp_port || ''} onChange={e => set('smtp_port', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>SMTP Username</label>
            <input className={inputCls} placeholder="platform@yourcompany.com" value={config.smtp_username || ''} onChange={e => set('smtp_username', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>SMTP Password / App Password</label>
            <input className={inputCls} type="password" placeholder="App password or SMTP password" value={config.smtp_password || ''} onChange={e => set('smtp_password', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>From Email</label>
            <input className={inputCls} type="email" placeholder="noreply@schoolerp.com" value={config.smtp_from_email || ''} onChange={e => set('smtp_from_email', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>From Name</label>
            <input className={inputCls} placeholder="School ERP" value={config.smtp_from_name || ''} onChange={e => set('smtp_from_name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={config.smtp_enabled || 'false'} onChange={e => set('smtp_enabled', e.target.value)}>
              <option value="false">Disabled (dev mode — reset link shown on screen)</option>
              <option value="true">Enabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Razorpay */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Razorpay Integration</h3>
        <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Get keys from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" className="text-orange-400 underline">dashboard.razorpay.com</a>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Key ID</label>
            <input className={inputCls} placeholder="rzp_live_xxxxxxxx" value={config.razorpay_key_id || ''} onChange={e => set('razorpay_key_id', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Key Secret</label>
            <input className={inputCls} type="password" placeholder="Secret key" value={config.razorpay_key_secret || ''} onChange={e => set('razorpay_key_secret', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Webhook Secret</label>
            <input className={inputCls} type="password" placeholder="Webhook signing secret" value={config.razorpay_webhook_secret || ''} onChange={e => set('razorpay_webhook_secret', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={config.razorpay_enabled || 'false'} onChange={e => set('razorpay_enabled', e.target.value)}>
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Bank Account Details</h3>
        <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>For manual bank transfers and invoice display</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Bank Name</label>
            <input className={inputCls} placeholder="e.g. State Bank of India" value={config.bank_name || ''} onChange={e => set('bank_name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Account Holder Name</label>
            <input className={inputCls} placeholder="Company/person name" value={config.bank_account_name || ''} onChange={e => set('bank_account_name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Account Number</label>
            <input className={inputCls} placeholder="Account number" value={config.bank_account_number || ''} onChange={e => set('bank_account_number', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>IFSC Code</label>
            <input className={inputCls} placeholder="e.g. SBIN0001234" value={config.bank_ifsc_code || ''} onChange={e => set('bank_ifsc_code', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Branch</label>
            <input className={inputCls} placeholder="Branch name" value={config.bank_branch || ''} onChange={e => set('bank_branch', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>UPI ID</label>
            <input className={inputCls} placeholder="e.g. company@upi" value={config.bank_upi_id || ''} onChange={e => set('bank_upi_id', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Business / Invoice */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Business & Invoice Details</h3>
        <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Displayed on invoices and payment receipts</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Company Name</label>
            <input className={inputCls} placeholder="Your company name" value={config.company_name || ''} onChange={e => set('company_name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>GST Number</label>
            <input className={inputCls} placeholder="e.g. 22AAAAA0000A1Z5" value={config.gst_number || ''} onChange={e => set('gst_number', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>GST %</label>
            <input className={inputCls} type="number" placeholder="18" value={config.gst_percentage || ''} onChange={e => set('gst_percentage', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select className={inputCls} value={config.payment_currency || 'INR'} onChange={e => set('payment_currency', e.target.value)}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Company Address</label>
            <input className={inputCls} placeholder="Full address" value={config.company_address || ''} onChange={e => set('company_address', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Support Email</label>
            <input className={inputCls} type="email" placeholder="support@company.com" value={config.support_email || ''} onChange={e => set('support_email', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg font-medium transition-all">
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
