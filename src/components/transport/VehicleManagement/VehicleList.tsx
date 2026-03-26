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
    <div className="space-y-4">
      {vehicles.map((vehicle, index) => (
        <motion.div
          key={vehicle.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className={`${card} p-6 rounded-xl border hover:shadow-lg transition-all`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                  <span className="text-xl">
                    {vehicleIcons[vehicle.vehicleType as keyof typeof vehicleIcons] || '🚌'}
                  </span>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${text}`}>
                    {vehicle.vehicleNumber}
                  </h3>
                  <p className={`text-sm ${subtext} capitalize`}>
                    {vehicle.vehicleType} • Capacity: {vehicle.capacity}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className={`text-xs ${subtext} mb-1`}>Driver</div>
                  <div className={`font-medium ${text}`}>
                    {vehicle.driverName || 'Not assigned'}
                  </div>
                  {vehicle.driverPhone && (
                    <div className={`text-xs ${subtext}`}>
                      {vehicle.driverPhone}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className={`text-xs ${subtext} mb-1`}>Registration</div>
                  <div className={`font-medium ${text}`}>
                    {vehicle.registrationNo || 'Not registered'}
                  </div>
                  <div className={`text-xs ${subtext}`}>
                    Status: {getStatusText(vehicle)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className={`text-xs ${subtext} mb-1`}>Insurance Expiry</div>
                  <div className={`font-medium ${text}`}>
                    {vehicle.insuranceExpiry 
                      ? new Date(vehicle.insuranceExpiry).toLocaleDateString()
                      : 'Not specified'
                    }
                  </div>
                </div>
                
                <div>
                  <div className={`text-xs ${subtext} mb-1`}>Fitness Expiry</div>
                  <div className={`font-medium ${text}`}>
                    {vehicle.fitnessExpiry 
                      ? new Date(vehicle.fitnessExpiry).toLocaleDateString()
                      : 'Not specified'
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(vehicle)}`}></div>
                  <span className={`text-xs font-medium ${
                    !vehicle.isActive ? 'text-gray-400' :
                    (getStatusText(vehicle) === 'Expiring Soon' ? 'text-yellow-400' : 'text-green-400')
                  }`}>
                    {getStatusText(vehicle)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleStatus(vehicle.id, !vehicle.isActive)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      vehicle.isActive
                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {vehicle.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => onEdit(vehicle)}
                    className={btnSecondary}
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => onDelete(vehicle.id)}
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
