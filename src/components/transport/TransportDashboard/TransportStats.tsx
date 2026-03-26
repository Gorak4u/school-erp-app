'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TransportStatsProps {
  stats: {
    totalRoutes: number;
    totalVehicles: number;
    totalStudents: number;
    pendingTransportFees: number;
    activeRefunds?: number;
    totalRefunds?: number;
    refundAmount?: number;
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
      color: isDark ? 'from-blue-600 to-cyan-600' : 'from-blue-500 to-cyan-500',
      bgColor: isDark ? 'bg-blue-600/20' : 'bg-blue-100',
      textColor: isDark ? 'text-blue-400' : 'text-blue-600',
      trend: '+12%',
      trendType: 'up' as const,
      aiInsight: 'Optimized routes'
    },
    {
      title: 'Active Vehicles',
      value: stats.totalVehicles,
      icon: '🚌',
      color: isDark ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500',
      bgColor: isDark ? 'bg-green-600/20' : 'bg-green-100',
      textColor: isDark ? 'text-green-400' : 'text-green-600',
      trend: '+8%',
      trendType: 'up' as const,
      aiInsight: 'Smart fleet management'
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: '👥',
      color: isDark ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500',
      bgColor: isDark ? 'bg-purple-600/20' : 'bg-purple-100',
      textColor: isDark ? 'text-purple-400' : 'text-purple-600',
      trend: '+15%',
      trendType: 'up' as const,
      aiInsight: 'Growing enrollment'
    },
    {
      title: 'Pending Fees',
      value: stats.pendingTransportFees,
      icon: '💰',
      color: isDark ? 'from-orange-600 to-red-600' : 'from-orange-500 to-red-500',
      bgColor: isDark ? 'bg-orange-600/20' : 'bg-orange-100',
      textColor: isDark ? 'text-orange-400' : 'text-orange-600',
      trend: '-5%',
      trendType: 'down' as const,
      aiInsight: 'Improved collection'
    },
    ...(stats.activeRefunds !== undefined ? [{
      title: 'Active Refunds',
      value: stats.activeRefunds,
      icon: '🔄',
      color: isDark ? 'from-red-600 to-pink-600' : 'from-red-500 to-pink-500',
      bgColor: isDark ? 'bg-red-600/20' : 'bg-red-100',
      textColor: isDark ? 'text-red-400' : 'text-red-600',
      trend: '+3%',
      trendType: 'up' as const,
      aiInsight: 'Processing refunds'
    }] : []),
    ...(stats.totalRefunds !== undefined ? [{
      title: 'Total Refunds',
      value: stats.totalRefunds,
      icon: '💸',
      color: isDark ? 'from-indigo-600 to-purple-600' : 'from-indigo-500 to-purple-500',
      bgColor: isDark ? 'bg-indigo-600/20' : 'bg-indigo-100',
      textColor: isDark ? 'text-indigo-400' : 'text-indigo-600',
      trend: '+10%',
      trendType: 'up' as const,
      aiInsight: 'Refund analytics'
    }] : [])
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${statCards.length >= 6 ? 3 : 4} xl:grid-cols-${statCards.length >= 6 ? 6 : 4} gap-4 mb-6`}>
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
          className={`${card} p-6 rounded-2xl border hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 relative overflow-hidden group`}
        >
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-blue-600/5 via-transparent to-purple-600/5' : 'from-blue-500/3 via-transparent to-purple-500/3'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          
          {/* Animated Background Pattern */}
          <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} rounded-full -mr-16 -mt-16 opacity-20 animate-pulse`}></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center text-2xl shadow-lg relative`}
              >
                {stat.icon}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-ping"></div>
              </motion.div>
              
              {/* Smart Badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-100 to-purple-100'} border border-indigo-300/30`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">✨</span>
                  <span className={`${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Smart</span>
                </div>
              </motion.div>
            </div>
            
            {/* Main Value */}
            <div className="mb-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
                className={`text-3xl font-bold ${text}`}
              >
                {stat.value.toLocaleString()}
              </motion.div>
            </div>
            
            {/* Title and Trend */}
            <div className="flex items-center justify-between mb-3">
              <div className={`text-sm font-medium ${subtext}`}>
                {stat.title}
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  stat.trendType === 'up' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}
              >
                <span>{stat.trendType === 'up' ? '📈' : '📉'}</span>
                <span>{stat.trend}</span>
              </motion.div>
            </div>
            
            {/* Smart Insight */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}
            >
              <span>💡</span>
              <span>{stat.aiInsight}</span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
