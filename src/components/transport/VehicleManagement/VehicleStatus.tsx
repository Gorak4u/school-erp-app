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
  const expiringSoon = vehicles.filter(v => {
    if (!v.isActive) return false;
    
    const today = new Date();
    const insuranceDate = v.insuranceExpiry ? new Date(v.insuranceExpiry) : null;
    const fitnessDate = v.fitnessExpiry ? new Date(v.fitnessExpiry) : null;
    
    const insuranceExpiring = insuranceDate && (insuranceDate.getTime() - today.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    const fitnessExpiring = fitnessDate && (fitnessDate.getTime() - today.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    
    return insuranceExpiring || fitnessExpiring;
  });

  const vehicleTypes = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.vehicleType] = (acc[vehicle.vehicleType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vehicleIcons = {
    bus: '🚌',
    van: '🚐',
    auto: '🛺',
    minibus: '🚍',
    tempo: '🚙'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className={`${card} p-6 rounded-xl border`}
    >
      <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
        🚌 Vehicle Status Overview
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-green-600/20 border border-green-600/30' : 'bg-green-100 border border-green-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Active
            </span>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {activeVehicles.length}
          </div>
          <div className={`text-xs ${subtext}`}>
            vehicles in service
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-600/20 border border-yellow-600/30' : 'bg-yellow-100 border border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
              Expiring Soon
            </span>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {expiringSoon.length}
          </div>
          <div className={`text-xs ${subtext}`}>
            need attention
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-600/20 border border-gray-600/30' : 'bg-gray-100 border border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Fleet
            </span>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {vehicles.length}
          </div>
          <div className={`text-xs ${subtext}`}>
            registered vehicles
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className={`text-sm font-medium ${subtext} mb-2`}>Vehicle Types Distribution</h4>
        {Object.entries(vehicleIcons).map(([type, icon]) => {
          const count = vehicleTypes[type] || 0;
          const percentage = vehicles.length > 0 ? (count / vehicles.length) * 100 : 0;
          
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + Math.random() * 0.2, duration: 0.3 }}
              className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <div>
                  <span className={`text-sm font-medium ${text}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  <div className={`text-xs ${subtext}`}>
                    {count} vehicle{count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${subtext}`}>{percentage.toFixed(0)}%</span>
                <div className={`w-20 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
