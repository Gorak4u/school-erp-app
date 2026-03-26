'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../utils';

// Enhanced TypeScript interfaces
interface SchoolDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  principal: string;
  affiliation_no: string;
  established: string;
  logo_url: string;
}

interface SchoolDetailsTabProps {
  isDark: boolean;
  saving: boolean;
  getSetting: (category: string, key: string, defaultValue: string) => string;
  saveBatchSettings: (category: string, settings: Record<string, string>) => Promise<void>;
}

// Field configuration with metadata
const fieldConfig = [
  { key: 'name' as const, label: 'School Name', type: 'text', required: true },
  { key: 'address' as const, label: 'Address', type: 'text', required: true },
  { key: 'city' as const, label: 'City', type: 'text', required: true },
  { key: 'state' as const, label: 'State', type: 'text', required: true },
  { key: 'pincode' as const, label: 'Pincode', type: 'text', required: false },
  { key: 'phone' as const, label: 'Phone', type: 'tel', required: true },
  { key: 'email' as const, label: 'Email', type: 'email', required: true },
  { key: 'website' as const, label: 'Website', type: 'url', required: false },
  { key: 'principal' as const, label: 'Principal', type: 'text', required: false },
  { key: 'affiliation_no' as const, label: 'Affiliation No', type: 'text', required: false },
  { key: 'established' as const, label: 'Established', type: 'text', required: false },
  { key: 'logo_url' as const, label: 'Logo URL', type: 'text', required: false },
];

export const SchoolDetailsTab: React.FC<SchoolDetailsTabProps> = ({
  isDark,
  saving,
  getSetting,
  saveBatchSettings,
}) => {
  // Enhanced state management with proper typing
  const [local, setLocal] = useState<SchoolDetails>(() => ({
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
  }));
  
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolDetails, string>>>({});

  // Memoized CSS classes with world-class UI template
  const cardClasses = useMemo(() => 
    `backdrop-blur-2xl bg-gradient-to-br ${
      isDark 
        ? 'from-gray-800/90 to-gray-900/90 border-gray-700/50' 
        : 'from-white/90 to-gray-50/90 border-gray-200/50'
    } rounded-3xl shadow-2xl p-6 border backdrop-blur-xl`,
    [isDark]
  );

  const inputClasses = useMemo(() =>
    `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
      isDark 
        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
        : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400'
    }`,
    [isDark]
  );

  const labelClasses = useMemo(() =>
    `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    [isDark]
  );

  const btnPrimaryClasses = useMemo(() =>
    `px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${
      isDark 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
    }`,
    [isDark]
  );

  const btnSecondaryClasses = useMemo(() =>
    `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${
      isDark 
        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
    }`,
    [isDark]
  );

  // Enhanced handlers with useCallback
  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      showToast({ 
        type: 'error', 
        title: 'File too large', 
        message: 'Logo must be less than 2MB' 
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({ 
        type: 'error', 
        title: 'Invalid file type', 
        message: 'Please select an image file' 
      });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'school_logo');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocal(prev => ({ ...prev, logo_url: data.url }));
      showToast({ 
        type: 'success', 
        title: 'Logo uploaded', 
        message: 'Logo has been successfully uploaded' 
      });
    } catch (err: any) {
      showToast({ 
        type: 'error', 
        title: 'Upload failed', 
        message: err.message 
      });
    } finally {
      setUploading(false);
    }
  }, []);

  const handleInputChange = useCallback((key: keyof SchoolDetails, value: string) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }, [errors]);

  const handleRemoveLogo = useCallback(() => {
    setLocal(prev => ({ ...prev, logo_url: '' }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof SchoolDetails, string>> = {};
    
    // Required fields validation
    const requiredFields = ['name', 'address', 'city', 'state', 'phone', 'email'] as const;
    requiredFields.forEach(field => {
      if (!local[field]?.trim()) {
        newErrors[field] = `${fieldConfig.find(f => f.key === field)?.label || field} is required`;
      }
    });

    // Email validation
    if (local.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(local.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (local.phone && !/^[+]?[\d\s-()]+$/.test(local.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Website validation
    if (local.website && !isValidUrl(local.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [local]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showToast({ 
        type: 'error', 
        title: 'Validation Error', 
        message: 'Please fill in all required fields correctly' 
      });
      return;
    }

    try {
      await saveBatchSettings('school_details', local as unknown as Record<string, string>);
      showToast({ 
        type: 'success', 
        title: 'Settings saved', 
        message: 'School details have been successfully updated' 
      });
    } catch (err: any) {
      showToast({ 
        type: 'error', 
        title: 'Save failed', 
        message: err.message 
      });
    }
  }, [local, validateForm, saveBatchSettings]);

  // Helper function for URL validation
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Memoized filtered fields
  const textFields = useMemo(() => 
    fieldConfig.filter(field => field.key !== 'logo_url'),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cardClasses}
    >
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20' : 'bg-gradient-to-br from-blue-100 to-blue-200'
            }`}
          >
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </motion.div>
          <div>
            <h3 className={`text-xl font-bold bg-gradient-to-r ${isDark ? 'from-blue-400 to-blue-300' : 'from-blue-600 to-blue-500'} bg-clip-text text-transparent`}>
              School Details
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your school's basic information and branding
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={btnPrimaryClasses}
          disabled={saving || uploading} 
          onClick={handleSave}
        >
          <AnimatePresence mode="wait">
            {saving || uploading ? (
              <motion.span 
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                {uploading ? 'Uploading...' : 'Saving...'}
              </motion.span>
            ) : (
              <motion.span 
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Enhanced Logo Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`p-6 rounded-2xl border backdrop-blur-sm ${
          isDark 
            ? 'border-gray-600/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50' 
            : 'border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white/50'
        }`}
      >
        <div className="flex items-center gap-6">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center overflow-hidden ${
              isDark 
                ? 'border-gray-600 bg-gradient-to-br from-gray-900 to-gray-800' 
                : 'border-gray-300 bg-gradient-to-br from-white to-gray-50'
            }`}
          >
            <AnimatePresence mode="wait">
              {local.logo_url ? (
                <motion.img
                  key="logo"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  src={local.logo_url} 
                  alt="School Logo" 
                  className="w-full h-full object-contain p-2" 
                />
              ) : (
                <motion.span
                  key="placeholder"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-4xl"
                >
                  🏫
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h4 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                School Logo
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Upload your school logo for branding. Supports PNG, JPG, SVG formats • Maximum 2MB
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.label
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg' 
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg'
                }`}
              >
                <AnimatePresence mode="wait">
                  {uploading ? (
                    <motion.span
                      key="uploading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Uploading...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="choose"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose File
                    </motion.span>
                  )}
                </AnimatePresence>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoUpload} 
                  disabled={uploading} 
                />
              </motion.label>
              
              {local.logo_url && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                  }`}
                  onClick={handleRemoveLogo}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Form Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {textFields.map((field, index) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
            className="space-y-2"
          >
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type={field.type}
              className={`${inputClasses} ${errors[field.key as keyof SchoolDetails] ? 'border-red-500 focus:ring-red-500/20' : ''}`}
              value={local[field.key as keyof SchoolDetails]} 
              onChange={e => handleInputChange(field.key as keyof SchoolDetails, e.target.value)} 
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
            <AnimatePresence>
              {errors[field.key as keyof SchoolDetails] && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs text-red-500 mt-1"
                >
                  {errors[field.key as keyof SchoolDetails]}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};
