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
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 100 }}
      className={`${card} p-6 rounded-2xl border hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group`}
    >
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-blue-600/5 via-transparent to-purple-600/5' : 'from-blue-500/3 via-transparent to-purple-500/3'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${text} flex items-center gap-2`}>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-lg`}
            >
              <span className="text-white text-sm">📊</span>
            </motion.div>
            Route Performance
          </h3>
          
          {/* Smart Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-100 to-purple-100'} border border-blue-300/30`}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">📊</span>
              <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Analytics</span>
            </div>
          </motion.div>
        </div>
        
        {/* Performance Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-50 to-purple-50'} border ${isDark ? 'border-blue-600/30' : 'border-blue-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Overall Performance</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Data-driven insights</div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${text}`}>87%</div>
              <div className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>+5% vs last month</div>
            </div>
          </div>
        </motion.div>
        
        {/* Route List */}
        <div className="space-y-3">
          {statsRoutes.slice(0, 5).map((route, index) => {
            const occupancy = ((route.assignedStudents || 0) / route.capacity) * 100;
            const performanceColor = occupancy > 80 
              ? 'from-green-500 to-emerald-500'
              : occupancy > 60 
              ? 'from-yellow-500 to-orange-500'
              : 'from-red-500 to-pink-500';
            
            return (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-600/50' : 'bg-gray-50 border-gray-200'} hover:shadow-lg transition-all duration-300 hover:scale-102`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-md`}
                    >
                      <span className="text-white text-sm">🗺️</span>
                    </motion.div>
                    <div>
                      <div className={`font-semibold ${text} text-sm`}>
                        {route.routeNumber}
                      </div>
                      <div className={`text-xs ${subtext}`}>
                        {route.routeName}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 200 }}
                      className={`text-lg font-bold ${text}`}
                    >
                      {Math.round(occupancy)}%
                    </motion.div>
                    <div className={`text-xs ${subtext}`}>
                      Occupancy
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-xs ${subtext}`}>
                    {route.assignedStudents || 0} of {route.capacity} students
                  </div>
                  <div className={`text-xs font-semibold ${
                    occupancy > 80 
                      ? 'text-green-500'
                      : occupancy > 60 
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}>
                    {occupancy > 80 ? 'Excellent' : occupancy > 60 ? 'Good' : 'Needs Attention'}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative">
                  <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(occupancy, 100)}%` }}
                      transition={{ delay: 0.9 + index * 0.1, duration: 0.8, type: "spring", stiffness: 100 }}
                      className={`h-full rounded-full bg-gradient-to-r ${performanceColor} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </motion.div>
                  </div>
                </div>
                
                {/* AI Recommendation */}
                {occupancy < 60 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                    className={`mt-2 p-2 rounded-lg bg-gradient-to-r ${isDark ? 'from-yellow-600/20 to-orange-600/20' : 'from-yellow-50 to-orange-50'} border ${isDark ? 'border-yellow-600/30' : 'border-yellow-200'}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs">💡</span>
                      <span className={`text-xs font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                        Consider route optimization
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {/* View All Button */}
        {statsRoutes.length > 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.3 }}
            className="mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${isDark ? 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} text-white shadow-lg shadow-blue-500/25`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>🚀</span>
                <span>View All Routes Analytics</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {statsRoutes.length} routes
                </span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
