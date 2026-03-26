'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TransportStatsProps {
  stats: {
    totalRoutes: number;
    totalVehicles: number;
    totalStudents: number;
    pendingTransportFees: number;
  };
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
}

export function TransportStats({ stats, isDark, card, text, subtext }: TransportStatsProps) {
  const statCards = [
    {
      title: 'Total Routes',
      value: stats.totalRoutes,
      icon: '🗺️',
      color: isDark ? 'from-blue-600 to-blue-700' : 'from-blue-500 to-blue-600',
      bgColor: isDark ? 'bg-blue-600/20' : 'bg-blue-100',
      textColor: isDark ? 'text-blue-400' : 'text-blue-600'
    },
    {
      title: 'Active Vehicles',
      value: stats.totalVehicles,
      icon: '🚌',
      color: isDark ? 'from-green-600 to-green-700' : 'from-green-500 to-green-600',
      bgColor: isDark ? 'bg-green-600/20' : 'bg-green-100',
      textColor: isDark ? 'text-green-400' : 'text-green-600'
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: '👥',
      color: isDark ? 'from-purple-600 to-purple-700' : 'from-purple-500 to-purple-600',
      bgColor: isDark ? 'bg-purple-600/20' : 'bg-purple-100',
      textColor: isDark ? 'text-purple-400' : 'text-purple-600'
    },
    {
      title: 'Pending Fees',
      value: stats.pendingTransportFees,
      icon: '💰',
      color: isDark ? 'from-orange-600 to-orange-700' : 'from-orange-500 to-orange-600',
      bgColor: isDark ? 'bg-orange-600/20' : 'bg-orange-100',
      textColor: isDark ? 'text-orange-400' : 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className={`${card} p-6 rounded-xl border relative overflow-hidden`}
        >
          <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} rounded-full -mr-10 -mt-10 opacity-10`}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
              <div className={`text-xs font-medium ${stat.textColor} bg-white/10 px-2 py-1 rounded`}>
                Overview
              </div>
            </div>
            <div className={`text-3xl font-bold ${text} mb-1`}>
              {stat.value.toLocaleString()}
            </div>
            <div className={`text-sm ${subtext}`}>
              {stat.title}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
