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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className={`${card} p-6 rounded-xl border`}
    >
      <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
        🚌 Vehicle Status
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-green-600/20 border border-green-600/30' : 'bg-green-100 border border-green-200'}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Active
            </span>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {activeVehicles.length}
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600/20 border border-gray-600/30' : 'bg-gray-100 border border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total
            </span>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {vehicles.length}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className={`text-sm font-medium ${subtext} mb-2`}>Vehicle Types</h4>
        {Object.entries(vehicleTypeIcons).map(([type, icon]) => {
          const count = vehicleTypes[type] || 0;
          const percentage = vehicles.length > 0 ? (count / vehicles.length) * 100 : 0;
          
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + Math.random() * 0.2, duration: 0.3 }}
              className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className={`text-sm font-medium ${text}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${subtext}`}>{count}</span>
                <div className={`w-16 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-1.5`}>
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
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
