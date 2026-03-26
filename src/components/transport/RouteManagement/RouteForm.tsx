'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RouteFormProps {
  form: any;
  vehicles: any[];
  academicYears: any[];
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

export function RouteForm({
  form,
  vehicles,
  academicYears,
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
}: RouteFormProps) {
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
            {form.id ? 'Edit Route' : 'Add New Route'}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Route Number</label>
                <input
                  type="text"
                  value={form.routeNumber || ''}
                  onChange={(e) => onChange('routeNumber', e.target.value)}
                  className={input}
                  placeholder="e.g., R-01"
                />
              </div>
              
              <div>
                <label className={label}>Route Name</label>
                <input
                  type="text"
                  value={form.routeName || ''}
                  onChange={(e) => onChange('routeName', e.target.value)}
                  className={input}
                  placeholder="e.g., City Center to School"
                />
              </div>
            </div>
            
            <div>
              <label className={label}>Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => onChange('description', e.target.value)}
                className={`${input} resize-none`}
                rows={3}
                placeholder="Route description and details"
              />
            </div>
            
            <div>
              <label className={label}>Route Stops</label>
              <textarea
                value={form.stops || ''}
                onChange={(e) => onChange('stops', e.target.value)}
                className={`${input} resize-none`}
                rows={3}
                placeholder="Enter stops separated by commas (e.g., Stop 1, Stop 2, Stop 3)"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Vehicle</label>
                <select
                  value={form.vehicleId || ''}
                  onChange={(e) => onChange('vehicleId', e.target.value)}
                  className={input}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicleNumber} - {vehicle.vehicleType}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={label}>Academic Year</label>
                <select
                  value={form.academicYearId || ''}
                  onChange={(e) => onChange('academicYearId', e.target.value)}
                  className={input}
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className={label}>Monthly Fee (₹)</label>
                <input
                  type="number"
                  value={form.monthlyFee || ''}
                  onChange={(e) => onChange('monthlyFee', parseFloat(e.target.value))}
                  className={input}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className={label}>Yearly Fee (₹)</label>
                <input
                  type="number"
                  value={form.yearlyFee || ''}
                  onChange={(e) => onChange('yearlyFee', parseFloat(e.target.value))}
                  className={input}
                  placeholder="0"
                  min="0"
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
                <span className={`text-sm ${text}`}>Active Route</span>
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
                'Save Route'
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
