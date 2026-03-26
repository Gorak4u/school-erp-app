'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RecentActivityProps {
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
}

export function RecentActivity({ isDark, card, text, subtext }: RecentActivityProps) {
  const activities = [
    {
      id: 1,
      type: 'route',
      icon: '🗺️',
      title: 'New Route Added',
      description: 'Route R-15 - City Center to School',
      time: '2 hours ago',
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDark ? 'bg-blue-600/20' : 'bg-blue-100'
    },
    {
      id: 2,
      type: 'vehicle',
      icon: '🚌',
      title: 'Vehicle Maintenance',
      description: 'Bus BH-01-AB-1234 scheduled for service',
      time: '5 hours ago',
      color: isDark ? 'text-green-400' : 'text-green-600',
      bgColor: isDark ? 'bg-green-600/20' : 'bg-green-100'
    },
    {
      id: 3,
      type: 'student',
      icon: '👥',
      title: 'Bulk Assignment',
      description: '25 students assigned to Route R-08',
      time: '1 day ago',
      color: isDark ? 'text-purple-400' : 'text-purple-600',
      bgColor: isDark ? 'bg-purple-600/20' : 'bg-purple-100'
    },
    {
      id: 4,
      type: 'fee',
      icon: '💰',
      title: 'Fee Collection',
      description: '₹45,000 collected from transport fees',
      time: '2 days ago',
      color: isDark ? 'text-orange-400' : 'text-orange-600',
      bgColor: isDark ? 'bg-orange-600/20' : 'bg-orange-100'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 100 }}
      className={`${card} p-6 rounded-2xl border hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group`}
    >
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-gray-600/5 via-transparent to-purple-600/5' : 'from-gray-500/3 via-transparent to-purple-500/3'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${text} flex items-center gap-2`}>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-gray-600 to-purple-600' : 'from-gray-500 to-purple-500'} shadow-lg`}
            >
              <span className="text-white text-sm">📋</span>
            </motion.div>
            Recent Activity
          </h3>
          
          {/* Smart Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-gray-600/20 to-purple-600/20' : 'from-gray-100 to-purple-100'} border border-gray-300/30`}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">🔄</span>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Live</span>
            </div>
          </motion.div>
        </div>
        
        {/* Activity List */}
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
              className={`flex items-start gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-600/50' : 'bg-gray-50 border-gray-200'} hover:shadow-lg transition-all duration-300 hover:scale-102`}
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.4 }}
                className={`w-10 h-10 ${activity.bgColor} rounded-xl flex items-center justify-center text-sm flex-shrink-0 shadow-md`}
              >
                {activity.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold ${text} text-sm mb-1`}>
                  {activity.title}
                </div>
                <div className={`text-xs ${subtext} mb-2`}>
                  {activity.description}
                </div>
                <div className={`text-xs ${subtext} opacity-70 flex items-center gap-1`}>
                  <span>⏰</span>
                  <span>{activity.time}</span>
                </div>
              </div>
              
              {/* Activity Status Indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.0 + index * 0.1, type: "spring", stiffness: 200 }}
                className={`w-2 h-2 rounded-full ${activity.color} animate-pulse`}
              ></motion.div>
            </motion.div>
          ))}
        </div>
        
        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.3 }}
          className="mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
              isDark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>👁️</span>
              <span>View All Activity</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                {activities.length} items
              </span>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
