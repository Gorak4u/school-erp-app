'use client';

import React, { useState } from 'react';
import { showToast } from '../utils';

interface SchoolDetailsTabProps {
  isDark: boolean;
  saving: boolean;
  getSetting: (category: string, key: string, defaultValue: string) => string;
  saveBatchSettings: (category: string, settings: Record<string, string>) => void;
}

export const SchoolDetailsTab: React.FC<SchoolDetailsTabProps> = ({
  isDark,
  saving,
  getSetting,
  saveBatchSettings,
}) => {
  const [local, setLocal] = useState({
    name: getSetting('school_details', 'name', ''),
    address: getSetting('school_details', 'address', ''),
    city: getSetting('school_details', 'city', ''),
    state: getSetting('school_details', 'state', ''),
    pincode: getSetting('school_details', 'pincode', ''),
    phone: getSetting('school_details', 'phone', ''),
    email: getSetting('school_details', 'email', ''),
    website: getSetting('school_details', 'website', ''),
    principal: getSetting('school_details', 'principal', ''),
    affiliation_no: getSetting('school_details', 'affiliation_no', ''),
    established: getSetting('school_details', 'established', ''),
    logo_url: getSetting('school_details', 'logo_url', ''),
  });
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'school_logo');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocal({ ...local, logo_url: data.url });
      showToast({ type: 'success', title: 'Logo uploaded', message: 'Logo has been successfully uploaded' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Upload failed', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const textFields = Object.entries(local).filter(([key]) => key !== 'logo_url');

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-4 shadow-sm`}>
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>School Details</h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Basic information</p>
          </div>
        </div>
        <button 
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          disabled={saving} 
          onClick={() => saveBatchSettings('school_details', local)}
        >
          {saving ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </span>
          )}
        </button>
      </div>

      {/* Logo Upload - Compact */}
      <div className={`mb-3 p-3 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-lg border flex items-center justify-center overflow-hidden ${isDark ? 'border-gray-600 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            {local.logo_url ? (
              <img src={local.logo_url} alt="School Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span className={`text-2xl ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>🏫</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>School Logo</span>
              <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>PNG, JPG, SVG • Max 2MB</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <label className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}>
                {uploading ? 'Uploading...' : 'Choose'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
              {local.logo_url && (
                <button 
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  onClick={() => setLocal({ ...local, logo_url: '' })}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Grid - Compact Dense */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {textFields.map(([key, val]) => (
          <div key={key} className="space-y-0.5">
            <label className={`block text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </label>
            <input 
              className={`w-full px-2 py-1.5 rounded-md border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              value={val} 
              onChange={e => setLocal({ ...local, [key]: e.target.value })} 
              placeholder={`Enter ${key.replace(/_/g, ' ').toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
