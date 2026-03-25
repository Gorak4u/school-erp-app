'use client';

import React, { useState, useEffect } from 'react';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  data?: any;
  onSave: (data: any) => void;
  isDark: boolean;
  academicYears?: any[];
}

export const EntityModal: React.FC<EntityModalProps> = ({ isOpen, onClose, type, data, onSave, isDark, academicYears = [] }) => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(data || getDefaultData(type));
    }
  }, [isOpen, data, type]);

  const getDefaultData = (entityType: string) => {
    switch (entityType) {
      case 'academicYear':
        return { name: '', year: '', startDate: '', endDate: '', isActive: false };
      case 'board':
        return { name: '', code: '', description: '', isActive: true };
      case 'medium':
        return { name: '', code: '', isActive: true, academicYearId: '' };
      case 'class':
        return { name: '', code: '', level: 'primary', isActive: true, academicYearId: '' };
      case 'section':
        return { name: '', isActive: true, academicYearId: '' };
      case 'timing':
        return { name: '', startTime: '09:00', endTime: '15:00', breakTime: '12:00-13:00', isActive: true };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
    isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  const labelClass = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {data?.id ? 'Edit' : 'Create'} {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(formData).map(([key, value]) => {
            if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return null;
            if (key === 'academicYearId') return (
              <div key={key}>
                <label className={labelClass}>Academic Year</label>
                <select
                  value={value as string}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYears
                    .filter((ay: any) => ay.isActive)
                    .map((ay: any) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name} ({ay.startDate} - {ay.endDate})
                      </option>
                    ))}
                </select>
              </div>
            );
            if (key === 'isActive') return (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={key}
                  checked={value as boolean}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <label htmlFor={key} className={labelClass}>Active</label>
              </div>
            );
            return (
              <div key={key}>
                <label className={labelClass}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                <input
                  type={key.includes('Date') ? 'date' : key.includes('Time') ? 'time' : 'text'}
                  value={value as string}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className={inputClass}
                  placeholder={`Enter ${key}`}
                />
              </div>
            );
          })}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Saving...' : data?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
