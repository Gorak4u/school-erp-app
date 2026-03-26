'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RouteListProps {
  routes: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnDanger: string;
  btnSecondary: string;
  onEdit: (route: any) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export function RouteList({
  routes,
  isDark,
  card,
  text,
  subtext,
  btnDanger,
  btnSecondary,
  onEdit,
  onDelete,
  onToggleStatus
}: RouteListProps) {
  return (
    <div className="space-y-4">
      {routes.map((route, index) => (
        <motion.div
          key={route.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className={`${card} p-6 rounded-xl border hover:shadow-lg transition-all`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                  <span className="text-xl">🗺️</span>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${text}`}>
                    {route.routeNumber} - {route.routeName}
                  </h3>
                  <p className={`text-sm ${subtext}`}>
                    {route.description || 'No description provided'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className={`text-xs ${subtext} mb-1`}>Driver</div>
                  <div className={`font-medium ${text}`}>
                    {route.driverName || 'Not assigned'}
                  </div>
                  {route.driverPhone && (
                    <div className={`text-xs ${subtext}`}>
                      {route.driverPhone}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className={`text-xs ${subtext} mb-1`}>Capacity</div>
                  <div className={`font-medium ${text}`}>
                    {route.capacity} students
                  </div>
                  <div className={`text-xs ${subtext}`}>
                    {route.assignedStudents || 0} assigned
                  </div>
                </div>
                
                <div>
                  <div className={`text-xs ${subtext} mb-1`}>Fees</div>
                  <div className={`font-medium ${text}`}>
                    Monthly: ₹{route.monthlyFee || 0}
                  </div>
                  <div className={`text-xs ${subtext}`}>
                    Yearly: ₹{route.yearlyFee || 0}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className={`text-xs ${subtext} mb-2`}>Route Stops</div>
                <div className={`text-sm ${text} bg-gray-100 dark:bg-gray-700 rounded-lg p-2 max-h-20 overflow-y-auto`}>
                  {route.stops ? route.stops.split(',').map((stop: string, idx: number) => (
                    <span key={idx} className="inline-block mr-2 mb-1">
                      {stop.trim()}
                    </span>
                  )) : 'No stops defined'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${route.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs font-medium ${route.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {route.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleStatus(route.id, !route.isActive)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      route.isActive
                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {route.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => onEdit(route)}
                    className={btnSecondary}
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => onDelete(route.id)}
                    className={btnDanger}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
