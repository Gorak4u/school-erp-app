'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VehicleFiltersProps {
  search: string;
  typeFilter: string;
  statusFilter: string;
  isDark: boolean;
  input: string;
  btnSecondary: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

const VEHICLE_TYPES = ['bus', 'van', 'auto', 'minibus', 'tempo'];

const vehicleIcons = {
  bus: '🚌',
  van: '🚐',
  auto: '🛺',
  minibus: '🚍',
  tempo: '🚙'
};

export function VehicleFilters({
  search,
  typeFilter,
  statusFilter,
  isDark,
  input,
  btnSecondary,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onClearFilters
}: VehicleFiltersProps) {
  const hasActiveFilters = search || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-xl border p-4`}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search vehicles by number, driver, or registration..."
            className={`${input} w-full`}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className={input}
          >
            <option value="all">All Types</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {vehicleIcons[type as keyof typeof vehicleIcons]} {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className={input}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expiring">Expiring Soon</option>
          </select>
          
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onClearFilters}
              className={btnSecondary}
            >
              Clear
            </motion.button>
          )}
        </div>
      </div>
      
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex flex-wrap gap-2">
            {search && (
              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                Search: {search}
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                Type: {vehicleIcons[typeFilter as keyof typeof vehicleIcons]} {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
