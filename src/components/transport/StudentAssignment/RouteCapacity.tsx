'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RouteCapacityProps {
  routes: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
}

export function RouteCapacity({ routes, isDark, card, text, subtext }: RouteCapacityProps) {
  const totalCapacity = routes.reduce((sum, route) => sum + route.capacity, 0);
  const totalAssigned = routes.reduce((sum, route) => sum + (route.assignedStudents || 0), 0);
  const overallUtilization = totalCapacity > 0 ? (totalAssigned / totalCapacity) * 100 : 0;

  const getCapacityStatus = (utilization: number) => {
    if (utilization >= 90) return { color: 'red', text: 'Full', bgColor: 'bg-red-600/20' };
    if (utilization >= 70) return { color: 'yellow', text: 'High', bgColor: 'bg-yellow-600/20' };
    if (utilization >= 40) return { color: 'green', text: 'Moderate', bgColor: 'bg-green-600/20' };
    return { color: 'blue', text: 'Low', bgColor: 'bg-blue-600/20' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className={`${card} p-6 rounded-xl border`}
    >
      <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
        📊 Route Capacity Overview
      </h3>
      
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${text}`}>Overall Utilization</span>
          <span className={`text-lg font-bold ${text}`}>{overallUtilization.toFixed(1)}%</span>
        </div>
        <div className={`w-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-3`}>
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              overallUtilization >= 90 ? 'bg-red-500' :
              overallUtilization >= 70 ? 'bg-yellow-500' :
              overallUtilization >= 40 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(overallUtilization, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
          <span className={`text-xs ${subtext}`}>{totalAssigned} students assigned</span>
          <span className={`text-xs ${subtext}`}>{totalCapacity} total capacity</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className={`text-sm font-medium ${subtext}`}>Route-wise Capacity</h4>
        {routes.map((route, index) => {
          const utilization = route.capacity > 0 ? ((route.assignedStudents || 0) / route.capacity) * 100 : 0;
          const status = getCapacityStatus(utilization);
          const available = route.capacity - (route.assignedStudents || 0);
          
          return (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
              className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`font-medium ${text}`}>
                    {route.routeNumber} - {route.routeName}
                  </div>
                  <div className={`text-xs ${subtext}`}>
                    {route.assignedStudents || 0}/{route.capacity} students
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${text}`}>
                    {utilization.toFixed(0)}%
                  </div>
                  <div className={`text-xs ${subtext}`}>
                    {available} available
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`flex-1 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      utilization >= 90 ? 'bg-red-500' :
                      utilization >= 70 ? 'bg-yellow-500' :
                      utilization >= 40 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  ></div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isDark ? status.bgColor + ' text-' + status.color + '-400' : 
                  status.bgColor.replace('600/20', '100') + ' text-' + status.color + '-600'
                }`}>
                  {status.text}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
