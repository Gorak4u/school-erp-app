'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DashboardPerformanceProps {
  theme: 'dark' | 'light';
}

export default function DashboardPerformance({ theme }: DashboardPerformanceProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<'all' | 'academic' | 'admin' | 'support'>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // Build query parameters for optimized API call
        const params = new URLSearchParams();
        if (selectedDepartment !== 'all') {
          params.append('department', selectedDepartment);
        }
        params.append('timeframe', selectedTimeframe);
        params.append('limit', '100'); // Add reasonable limit
        params.append('cache', 'true'); // Enable caching
        
        const response = await fetch(`/api/dashboard/performance?${params}`);
        if (response.ok) {
          const data = await response.json();
          setPerformanceData(data);
        }
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [selectedDepartment, selectedTimeframe]);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const subTextColor = isDark ? 'text-gray-400' : 'text-gray-600';

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className={`h-8 ${cardBg} rounded-lg mb-4`}></div>
          <div className={`h-64 ${cardBg} rounded-lg`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className={`text-2xl font-bold ${textColor}`}>
            Performance Metrics
          </h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value as any)}
              className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="all">All Departments</option>
              <option value="academic">Academic</option>
              <option value="admin">Administration</option>
              <option value="support">Support</option>
            </select>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Performance Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl border ${cardBg}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
              KPI Overview
            </h3>
            {performanceData ? (
              <div className={`space-y-4 ${subTextColor}`}>
                <p>Performance KPIs will be displayed here</p>
                <p>Connect to real performance API for metrics</p>
              </div>
            ) : (
              <div className={`text-center py-8 ${subTextColor}`}>
                No performance data available
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl border ${cardBg}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
              Department Performance
            </h3>
            {performanceData ? (
              <div className={`space-y-4 ${subTextColor}`}>
                <p>Department-specific metrics will be displayed here</p>
                <p>Implement real department performance tracking</p>
              </div>
            ) : (
              <div className={`text-center py-8 ${subTextColor}`}>
                No department data available
              </div>
            )}
          </div>
        </div>

        <div className={`mt-6 p-6 rounded-xl border ${cardBg}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
            Performance Trends
          </h3>
          <div className={`text-center py-12 ${subTextColor}`}>
            <p className="mb-2">📈 Performance Analytics</p>
            <p>Real performance charts and trends will be implemented here</p>
            <p className="text-sm mt-2">Connect to your performance API for comprehensive tracking</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
