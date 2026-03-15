'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DashboardAnalyticsProps {
  theme: 'dark' | 'light';
}

export default function DashboardAnalytics({ theme }: DashboardAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'academic' | 'financial' | 'operational'>('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Build query parameters for optimized API call
        const params = new URLSearchParams();
        params.append('period', selectedPeriod);
        if (selectedMetric !== 'all') {
          params.append('metric', selectedMetric);
        }
        params.append('limit', '100'); // Add reasonable limit
        params.append('cache', 'true'); // Enable caching
        
        const response = await fetch(`/api/dashboard/analytics?${params}`);
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedPeriod, selectedMetric]);

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
            Analytics & Insights
          </h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="all">All Metrics</option>
              <option value="academic">Academic</option>
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
            </select>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl border ${cardBg}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
              Performance Overview
            </h3>
            {analyticsData ? (
              <div className={`space-y-4 ${subTextColor}`}>
                <p>Analytics data will be displayed here</p>
                <p>Connect to real analytics API for data visualization</p>
              </div>
            ) : (
              <div className={`text-center py-8 ${subTextColor}`}>
                No analytics data available
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl border ${cardBg}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
              Key Metrics
            </h3>
            {analyticsData ? (
              <div className={`space-y-4 ${subTextColor}`}>
                <p>Key performance indicators will be displayed here</p>
                <p>Implement real metrics from your database</p>
              </div>
            ) : (
              <div className={`text-center py-8 ${subTextColor}`}>
                No metrics data available
              </div>
            )}
          </div>
        </div>

        <div className={`mt-6 p-6 rounded-xl border ${cardBg}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
            Detailed Analytics
          </h3>
          <div className={`text-center py-12 ${subTextColor}`}>
            <p className="mb-2">📊 Analytics Dashboard</p>
            <p>Real analytics charts and graphs will be implemented here</p>
            <p className="text-sm mt-2">Connect to your analytics API for comprehensive insights</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
