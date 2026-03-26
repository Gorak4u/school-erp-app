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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {routes.map((route, index) => (
        <motion.div
          key={route.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.4, type: "spring", stiffness: 100 }}
          className={`${card} p-4 rounded-2xl border hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 relative overflow-hidden group`}
        >
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-blue-600/10 via-transparent to-purple-600/10' : 'from-blue-500/5 via-transparent to-purple-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                route.isActive 
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${route.isActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                {route.isActive ? 'Active' : 'Inactive'}
              </div>
            </motion.div>
          </div>
          
          {/* Header Section */}
          <div className="flex items-start gap-3 mb-4">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-lg relative`}
            >
              <span className="text-xl text-white">🗺️</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-bold ${text} line-clamp-1 mb-1`}>
                {route.routeNumber}
              </h3>
              <p className={`text-xs ${subtext} line-clamp-1 font-medium`}>
                {route.routeName}
              </p>
              {route.description && (
                <p className={`text-xs ${subtext} line-clamp-2 mt-1 opacity-75`}>
                  {route.description}
                </p>
              )}
            </div>
          </div>
          
          {/* AI Insights Badge */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`mb-3 px-2 py-1 rounded-lg bg-gradient-to-r ${isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-100 to-purple-100'} border border-indigo-300/30`}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">✨</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                AI Optimized Route
              </span>
            </div>
          </motion.div>
          
          {/* Key Metrics */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className="text-xs">👤</span>
                </div>
                <span className={`text-xs ${subtext}`}>Driver</span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-semibold ${text} truncate max-w-[100px]`}>
                  {route.driverName || 'Not assigned'}
                </div>
                {route.driverPhone && (
                  <div className={`text-xs ${subtext}`}>
                    {route.driverPhone}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className="text-xs">👥</span>
                </div>
                <span className={`text-xs ${subtext}`}>Occupancy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((route.assignedStudents || 0) / route.capacity) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className={`h-full rounded-full ${
                      ((route.assignedStudents || 0) / route.capacity) > 0.8 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500'
                        : ((route.assignedStudents || 0) / route.capacity) > 0.6
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}
                  ></motion.div>
                </div>
                <span className={`text-xs font-bold ${text}`}>
                  {route.assignedStudents || 0}/{route.capacity}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className="text-xs">💰</span>
                </div>
                <span className={`text-xs ${subtext}`}>Monthly Fee</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  ₹{route.monthlyFee || 0}
                </span>
                {route.monthlyFee > 1000 && (
                  <span className="text-xs text-yellow-500">⭐</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Route Stops Preview */}
          {route.stops && (
            <div className="mb-4">
              <div className={`text-xs ${subtext} mb-2 font-semibold flex items-center gap-1`}>
                <span>📍</span> Route Stops ({route.stops.split(',').length})
              </div>
              <div className={`text-xs ${text} bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-700' : 'from-gray-50 to-gray-100'} rounded-lg p-2 border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex flex-wrap gap-1">
                  {route.stops.split(',').slice(0, 3).map((stop: string, idx: number) => (
                    <motion.span 
                      key={idx} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * idx }}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {stop.trim()}
                    </motion.span>
                  ))}
                  {route.stops.split(',').length > 3 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-600/30 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                      +{route.stops.split(',').length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggleStatus(route.id, !route.isActive)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                route.isActive
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
              }`}
            >
              {route.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(route)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${btnSecondary} border-2 ${isDark ? 'border-blue-500/30' : 'border-blue-300'}`}
            >
              ✏️ Edit
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(route.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${btnDanger}`}
            >
              🗑️ Delete
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
