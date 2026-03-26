'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RouteCardProps {
  route: any;
  isDark: boolean;
  text: string;
  subtext: string;
  onEdit: (route: any) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onBulkRefund?: (route: any) => void;
}

export function RouteCard({
  route,
  isDark,
  text,
  subtext,
  onEdit,
  onToggleStatus,
  onBulkRefund
}: RouteCardProps) {
  const utilization = route.capacity > 0 ? Math.round((route.assignedStudents || 0) / route.capacity * 100) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} rounded-xl border p-4 cursor-pointer hover:shadow-lg transition-all`}
      onClick={() => onEdit(route)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
            <span className="text-lg">🗺️</span>
          </div>
          <div>
            <h4 className={`font-semibold ${text}`}>
              {route.routeNumber}
            </h4>
            <p className={`text-sm ${subtext}`}>
              {route.routeName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${route.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-xs font-medium ${route.isActive ? 'text-green-400' : 'text-red-400'}`}>
            {route.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={`text-xs ${subtext}`}>Capacity</span>
          <span className={`text-sm font-medium ${text}`}>
            {route.assignedStudents || 0}/{route.capacity}
          </span>
        </div>
        
        <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              utilization > 80 ? 'bg-red-500' : utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`text-xs ${subtext}`}>Monthly Fee</span>
          <span className={`text-sm font-medium ${text}`}>
            ₹{route.monthlyFee || 0}
          </span>
        </div>
        
        {route.driverName && (
          <div className="flex justify-between items-center">
            <span className={`text-xs ${subtext}`}>Driver</span>
            <span className={`text-sm ${text}`}>
              {route.driverName}
            </span>
          </div>
        )}
        
        {/* Bulk Refund Button */}
        {route.isActive && (route.assignedStudents || 0) > 0 && onBulkRefund && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBulkRefund(route);
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30`}
            >
              💸 Bulk Refund ({route.assignedStudents} students)
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
