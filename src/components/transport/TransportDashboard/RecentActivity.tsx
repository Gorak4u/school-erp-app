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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className={`${card} p-6 rounded-xl border`}
    >
      <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
        📋 Recent Activity
      </h3>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
            className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} transition-colors`}
          >
            <div className={`w-8 h-8 ${activity.bgColor} rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${text} text-sm`}>
                {activity.title}
              </div>
              <div className={`text-xs ${subtext} mt-1`}>
                {activity.description}
              </div>
              <div className={`text-xs ${subtext} mt-1 opacity-70`}>
                {activity.time}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="mt-4"
      >
        <button className={`w-full text-sm ${subtext} hover:${text} transition-colors`}>
          View All Activity →
        </button>
      </motion.div>
    </motion.div>
  );
}
