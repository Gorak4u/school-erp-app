'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VehicleListProps {
  vehicles: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnDanger: string;
  btnSecondary: string;
  onEdit: (vehicle: any) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export function VehicleList({
  vehicles,
  isDark,
  card,
  text,
  subtext,
  btnDanger,
  btnSecondary,
  onEdit,
  onDelete,
  onToggleStatus
}: VehicleListProps) {
  const vehicleIcons = {
    bus: '🚌',
    van: '🚐',
    auto: '🛺',
    minibus: '🚍',
    tempo: '🚙'
  };

  const getStatusColor = (vehicle: any) => {
    if (!vehicle.isActive) return 'bg-gray-500';
    
    // Check if insurance or fitness is expiring soon (within 30 days)
    const today = new Date();
    const insuranceDate = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null;
    const fitnessDate = vehicle.fitnessExpiry ? new Date(vehicle.fitnessExpiry) : null;
    
    const insuranceExpiring = insuranceDate && (insuranceDate.getTime() - today.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    const fitnessExpiring = fitnessDate && (fitnessDate.getTime() - today.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    
    if (insuranceExpiring || fitnessExpiring) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (vehicle: any) => {
    if (!vehicle.isActive) return 'Inactive';
    
    const today = new Date();
    const insuranceDate = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null;
    const fitnessDate = vehicle.fitnessExpiry ? new Date(vehicle.fitnessExpiry) : null;
    
    const insuranceExpiring = insuranceDate && (insuranceDate.getTime() - today.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    const fitnessExpiring = fitnessDate && (fitnessDate.getTime() - today.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    
    if (insuranceExpiring || fitnessExpiring) return 'Expiring Soon';
    return 'Active';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {vehicles.map((vehicle, index) => (
        <motion.div
          key={vehicle.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.4, type: "spring", stiffness: 100 }}
          className={`${card} p-4 rounded-2xl border hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 relative overflow-hidden group`}
        >
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-purple-600/10 via-transparent to-pink-600/10' : 'from-purple-500/5 via-transparent to-pink-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                !vehicle.isActive 
                  ? 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400 border border-gray-500/30' 
                  : getStatusText(vehicle) === 'Expiring Soon'
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
              }`}
            >
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  !vehicle.isActive ? 'bg-gray-400' :
                  getStatusText(vehicle) === 'Expiring Soon' ? 'bg-yellow-400' : 'bg-green-400'
                } animate-pulse`}></div>
                {getStatusText(vehicle)}
              </div>
            </motion.div>
          </div>
          
          {/* Header Section */}
          <div className="flex items-start gap-3 mb-4">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500'} shadow-lg relative`}
            >
              <span className="text-xl text-white">
                {vehicleIcons[vehicle.vehicleType as keyof typeof vehicleIcons] || '🚌'}
              </span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-bold ${text} line-clamp-1 mb-1`}>
                {vehicle.vehicleNumber}
              </h3>
              <p className={`text-xs ${subtext} line-clamp-1 font-medium capitalize`}>
                {vehicle.vehicleType}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs ${subtext}`}>Capacity:</span>
                <span className={`text-xs font-bold ${text}`}>{vehicle.capacity} seats</span>
              </div>
            </div>
          </div>
          
          {/* AI Insights Badge */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`mb-3 px-2 py-1 rounded-lg bg-gradient-to-r ${isDark ? 'from-purple-600/20 to-pink-600/20' : 'from-purple-100 to-pink-100'} border border-purple-300/30`}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">🤖</span>
              <span className={`text-xs font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                AI Smart Vehicle
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
                  {vehicle.driverName || 'Not assigned'}
                </div>
                {vehicle.driverPhone && (
                  <div className={`text-xs ${subtext}`}>
                    {vehicle.driverPhone}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className="text-xs">📋</span>
                </div>
                <span className={`text-xs ${subtext}`}>Registration</span>
              </div>
              <div className={`text-xs font-semibold ${text} truncate max-w-[100px]`}>
                {vehicle.registrationNo || 'Not registered'}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className="text-xs">🛡️</span>
                </div>
                <span className={`text-xs ${subtext}`}>Insurance</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-semibold ${
                  vehicle.insuranceExpiry && 
                  (new Date(vehicle.insuranceExpiry).getTime() - new Date().getTime()) <= (30 * 24 * 60 * 60 * 1000)
                    ? 'text-yellow-400'
                    : isDark ? 'text-green-400' : 'text-green-600'
                }`}>
                  {vehicle.insuranceExpiry 
                    ? new Date(vehicle.insuranceExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Not set'
                  }
                </span>
                {vehicle.insuranceExpiry && 
                 (new Date(vehicle.insuranceExpiry).getTime() - new Date().getTime()) <= (30 * 24 * 60 * 60 * 1000) && (
                  <span className="text-xs text-yellow-500 animate-pulse">⚠️</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className="text-xs">💪</span>
                </div>
                <span className={`text-xs ${subtext}`}>Fitness</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-semibold ${
                  vehicle.fitnessExpiry && 
                  (new Date(vehicle.fitnessExpiry).getTime() - new Date().getTime()) <= (30 * 24 * 60 * 60 * 1000)
                    ? 'text-yellow-400'
                    : isDark ? 'text-green-400' : 'text-green-600'
                }`}>
                  {vehicle.fitnessExpiry 
                    ? new Date(vehicle.fitnessExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Not set'
                  }
                </span>
                {vehicle.fitnessExpiry && 
                 (new Date(vehicle.fitnessExpiry).getTime() - new Date().getTime()) <= (30 * 24 * 60 * 60 * 1000) && (
                  <span className="text-xs text-yellow-500 animate-pulse">⚠️</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="mb-4">
            <div className={`text-xs ${subtext} mb-2 font-semibold flex items-center gap-1`}>
              <span>📊</span> Vehicle Health
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${subtext}`}>Overall Score</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                    ></motion.div>
                  </div>
                  <span className={`text-xs font-bold ${text}`}>85%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggleStatus(vehicle.id, !vehicle.isActive)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                vehicle.isActive
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
              }`}
            >
              {vehicle.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(vehicle)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${btnSecondary} border-2 ${isDark ? 'border-purple-500/30' : 'border-purple-300'}`}
            >
              ✏️ Edit
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(vehicle.id)}
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
