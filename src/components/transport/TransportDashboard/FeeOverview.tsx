'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FeeOverviewProps {
  pendingTransportFees: number;
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnPrimary: string;
}

export function FeeOverview({ pendingTransportFees, isDark, card, text, subtext, btnPrimary }: FeeOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 100 }}
      className={`${card} p-6 rounded-2xl border hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group`}
    >
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-orange-600/5 via-transparent to-red-600/5' : 'from-orange-500/3 via-transparent to-red-500/3'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${text} flex items-center gap-2`}>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-orange-600 to-red-600' : 'from-orange-500 to-red-500'} shadow-lg`}
            >
              <span className="text-white text-sm">💰</span>
            </motion.div>
            Fee Overview
          </h3>
          
          {/* Smart Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-orange-600/20 to-red-600/20' : 'from-orange-100 to-red-100'} border border-orange-300/30`}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">📈</span>
              <span className={`${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Analytics</span>
            </div>
          </motion.div>
        </div>
        
        {/* Main Pending Fees Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-orange-600/20 to-red-600/20' : 'from-orange-50 to-red-50'} border ${isDark ? 'border-orange-600/30' : 'border-orange-200'} mb-6`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                Pending Fees
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {pendingTransportFees} students
              </div>
            </div>
            <div className="text-right">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}
              >
                ₹{(pendingTransportFees * 500).toLocaleString()}
              </motion.div>
              <div className={`text-xs ${subtext}`}>
                Monthly estimate
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ delay: 0.9, duration: 1.0, type: "spring", stiffness: 100 }}
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-50 to-emerald-50'} border ${isDark ? 'border-green-600/30' : 'border-green-200'} hover:shadow-lg transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Collection Rate</span>
              <span className="text-xs text-green-500">📊</span>
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
              className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}
            >
              85%
            </motion.div>
            <div className={`text-xs ${subtext}`}>Above target</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
            className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-blue-600/20 to-indigo-600/20' : 'from-blue-50 to-indigo-50'} border ${isDark ? 'border-blue-600/30' : 'border-blue-200'} hover:shadow-lg transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Overdue</span>
              <span className="text-xs text-blue-500">⚠️</span>
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
              className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
            >
              12
            </motion.div>
            <div className={`text-xs ${subtext}`}>Need attention</div>
          </motion.div>
        </div>
        
        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${isDark ? 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' : 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'} text-white shadow-lg shadow-orange-500/25`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>📋</span>
              <span>View Fee Details</span>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
