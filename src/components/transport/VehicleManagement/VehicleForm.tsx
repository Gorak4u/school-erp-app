'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VehicleFormProps {
  form: any;
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  label: string;
  input: string;
  btnPrimary: string;
  btnSecondary: string;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

const VEHICLE_TYPES = ['bus', 'van', 'auto', 'minibus', 'tempo'];

export function VehicleForm({
  form,
  isDark,
  card,
  text,
  subtext,
  label,
  input,
  btnPrimary,
  btnSecondary,
  onChange,
  onSave,
  onCancel,
  saving
}: VehicleFormProps) {
  const vehicleIcons = {
    bus: '🚌',
    van: '🚐',
    auto: '🛺',
    minibus: '🚍',
    tempo: '🚙'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className={`${card} rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <h3 className={`text-xl font-bold ${text} mb-6`}>
            {form.id ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Vehicle Number</label>
                <input
                  type="text"
                  value={form.vehicleNumber || ''}
                  onChange={(e) => onChange('vehicleNumber', e.target.value)}
                  className={input}
                  placeholder="e.g., VH-01"
                />
              </div>
              
              <div>
                <label className={label}>Vehicle Type</label>
                <select
                  value={form.vehicleType || 'bus'}
                  onChange={(e) => onChange('vehicleType', e.target.value)}
                  className={input}
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {vehicleIcons[type as keyof typeof vehicleIcons]} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Capacity</label>
                <input
                  type="number"
                  value={form.capacity || ''}
                  onChange={(e) => onChange('capacity', parseInt(e.target.value))}
                  className={input}
                  placeholder="40"
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className={label}>Registration Number</label>
                <input
                  type="text"
                  value={form.registrationNo || ''}
                  onChange={(e) => onChange('registrationNo', e.target.value)}
                  className={input}
                  placeholder="e.g., MH-01-AB-1234"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Driver Name</label>
                <input
                  type="text"
                  value={form.driverName || ''}
                  onChange={(e) => onChange('driverName', e.target.value)}
                  className={input}
                  placeholder="Driver name"
                />
              </div>
              
              <div>
                <label className={label}>Driver Phone</label>
                <input
                  type="tel"
                  value={form.driverPhone || ''}
                  onChange={(e) => onChange('driverPhone', e.target.value)}
                  className={input}
                  placeholder="Driver phone number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Insurance Expiry</label>
                <input
                  type="date"
                  value={form.insuranceExpiry || ''}
                  onChange={(e) => onChange('insuranceExpiry', e.target.value)}
                  className={input}
                />
              </div>
              
              <div>
                <label className={label}>Fitness Expiry</label>
                <input
                  type="date"
                  value={form.fitnessExpiry || ''}
                  onChange={(e) => onChange('fitnessExpiry', e.target.value)}
                  className={input}
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive || false}
                  onChange={(e) => onChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <span className={`text-sm ${text}`}>Active Vehicle</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={saving}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className={btnPrimary}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save Vehicle'
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
