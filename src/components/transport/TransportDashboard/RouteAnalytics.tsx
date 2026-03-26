'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RouteAnalyticsProps {
  statsRoutes: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnPrimary: string;
}

export function RouteAnalytics({ statsRoutes, isDark, card, text, subtext, btnPrimary }: RouteAnalyticsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className={`${card} p-6 rounded-xl border`}
    >
      <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
        📊 Route Performance
      </h3>
      
      <div className="space-y-4">
        {statsRoutes.slice(0, 5).map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
            className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${text}`}>
                  {route.routeNumber} - {route.routeName}
                </div>
                <div className={`text-sm ${subtext}`}>
                  {route.assignedStudents || 0} students • Capacity: {route.capacity}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${text}`}>
                  {Math.round(((route.assignedStudents || 0) / route.capacity) * 100)}%
                </div>
                <div className={`text-xs ${subtext}`}>
                  Occupancy
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className={`w-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((route.assignedStudents || 0) / route.capacity) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {statsRoutes.length > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="mt-4"
        >
          <button className={`w-full ${btnPrimary} text-sm`}>
            View All Routes Analytics
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
