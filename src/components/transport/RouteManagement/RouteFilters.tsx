'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RouteFiltersProps {
  search: string;
  statusFilter: string;
  academicYearFilter: string;
  academicYears: any[];
  isDark: boolean;
  input: string;
  label: string;
  btnSecondary: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onAcademicYearFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function RouteFilters({
  search,
  statusFilter,
  academicYearFilter,
  academicYears,
  isDark,
  input,
  label,
  btnSecondary,
  onSearchChange,
  onStatusFilterChange,
  onAcademicYearFilterChange,
  onClearFilters
}: RouteFiltersProps) {
  const hasActiveFilters = search || statusFilter !== 'all' || academicYearFilter !== 'all';

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
            placeholder="Search routes by number, name, or description..."
            className={`${input} w-full`}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className={input}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select
            value={academicYearFilter}
            onChange={(e) => onAcademicYearFilterChange(e.target.value)}
            className={input}
          >
            <option value="all">All Academic Years</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
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
            {statusFilter !== 'all' && (
              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                Status: {statusFilter}
              </span>
            )}
            {academicYearFilter !== 'all' && (
              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                Year: {academicYears.find(y => y.id === academicYearFilter)?.name || academicYearFilter}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
