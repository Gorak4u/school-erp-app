'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VehicleStatusProps {
  vehicles: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
}

export function VehicleStatus({ vehicles, isDark, card, text, subtext }: VehicleStatusProps) {
  const activeVehicles = vehicles.filter(v => v.isActive);
  const vehicleTypes = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.vehicleType] = (acc[vehicle.vehicleType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vehicleTypeIcons = {
    bus: '🚌',
    van: '🚐',
    auto: '🛺',
    minibus: '🚍',
    tempo: '🚙'
  };

  const fleetHealthScore = Math.round((activeVehicles.length / vehicles.length) * 100) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 100 }}
      className={`${card} p-6 rounded-2xl border hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group`}
    >
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-purple-600/5 via-transparent to-pink-600/5' : 'from-purple-500/3 via-transparent to-pink-500/3'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${text} flex items-center gap-2`}>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500'} shadow-lg`}
            >
              <span className="text-white text-sm">🚌</span>
            </motion.div>
            Vehicle Fleet
          </h3>
          
          {/* Smart Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-purple-600/20 to-pink-600/20' : 'from-purple-100 to-pink-100'} border border-purple-300/30`}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">🚗</span>
              <span className={`${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Fleet</span>
            </div>
          </motion.div>
        </div>
        
        {/* Fleet Health Score */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${isDark ? 'from-purple-600/20 to-pink-600/20' : 'from-purple-50 to-pink-50'} border ${isDark ? 'border-purple-600/30' : 'border-purple-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Fleet Health Score</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Performance analysis</div>
            </div>
            <div className="text-right">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                className={`text-2xl font-bold ${text}`}
              >
                {fleetHealthScore}%
              </motion.div>
              <div className={`text-xs ${fleetHealthScore > 80 ? 'text-green-500' : fleetHealthScore > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                {fleetHealthScore > 80 ? 'Excellent' : fleetHealthScore > 60 ? 'Good' : 'Needs Attention'}
              </div>
            </div>
          </div>
          
          {/* Health Progress Bar */}
          <div className="mt-3">
            <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${fleetHealthScore}%` }}
                transition={{ delay: 0.8, duration: 1.0, type: "spring", stiffness: 100 }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  fleetHealthScore > 80 
                    ? 'from-green-500 to-emerald-500'
                    : fleetHealthScore > 60
                    ? 'from-yellow-500 to-orange-500'
                    : 'from-red-500 to-pink-500'
                } relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-50 to-emerald-50'} border ${isDark ? 'border-green-600/30' : 'border-green-200'} hover:shadow-lg transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  Active
                </span>
              </div>
              <span className="text-xs text-green-500">🟢</span>
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}
            >
              {activeVehicles.length}
            </motion.div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Vehicles operational
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-gray-600/20 to-slate-600/20' : 'from-gray-50 to-slate-50'} border ${isDark ? 'border-gray-600/30' : 'border-gray-200'} hover:shadow-lg transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total
                </span>
              </div>
              <span className="text-xs text-gray-500">📊</span>
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
              className={`text-2xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {vehicles.length}
            </motion.div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total fleet size
            </div>
          </motion.div>
        </div>
        
        {/* Vehicle Types Distribution */}
        <div>
          <h4 className={`text-sm font-bold ${subtext} mb-3 flex items-center gap-2`}>
            <span>🚐</span> Vehicle Distribution
          </h4>
          <div className="space-y-3">
            {Object.entries(vehicleTypeIcons).map(([type, icon], index) => {
              const count = vehicleTypes[type] || 0;
              const percentage = vehicles.length > 0 ? (count / vehicles.length) * 100 : 0;
              
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                  className={`p-3 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-600/50' : 'bg-gray-50 border-gray-200'} hover:shadow-lg transition-all duration-300 hover:scale-102`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.4 }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500'} shadow-md`}
                      >
                        <span className="text-white text-lg">{icon}</span>
                      </motion.div>
                      <div>
                        <div className={`font-semibold ${text} text-sm capitalize`}>
                          {type}
                        </div>
                        <div className={`text-xs ${subtext}`}>
                          {count} vehicle{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.0 + index * 0.1, type: "spring", stiffness: 200 }}
                        className={`text-lg font-bold ${text}`}
                      >
                        {Math.round(percentage)}%
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 1.1 + index * 0.1, duration: 0.8, type: "spring", stiffness: 100 }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* AI Insight */}
                  {percentage > 40 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      className={`mt-2 p-2 rounded-lg bg-gradient-to-r ${isDark ? 'from-purple-600/20 to-pink-600/20' : 'from-purple-50 to-pink-50'} border ${isDark ? 'border-purple-600/30' : 'border-purple-200'}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs">🎯</span>
                        <span className={`text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                          Most used vehicle type
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
