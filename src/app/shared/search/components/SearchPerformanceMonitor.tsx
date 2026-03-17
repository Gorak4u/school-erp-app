// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';

/**
 * Search Performance Monitor
 * Tracks and displays search engine performance metrics
 */

interface PerformanceMetrics {
  totalSearches: number;
  averageSearchTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  indexSize: number;
  totalRecords: number;
  lastUpdated: number;
}

interface SearchPerformanceMonitorProps {
  theme: 'dark' | 'light';
  engine: {
    getMetrics: () => PerformanceMetrics;
    reset: () => void;
  };
}

export default function SearchPerformanceMonitor({ theme, engine }: SearchPerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setMetrics(engine.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, engine]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1) return '< 1ms';
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, type: 'time' | 'memory' | 'rate'): string => {
    switch (type) {
      case 'time':
        if (value < 50) return 'text-green-500';
        if (value < 100) return 'text-yellow-500';
        return 'text-red-500';
      
      case 'memory':
        if (value < 50 * 1024 * 1024) return 'text-green-500'; // < 50MB
        if (value < 100 * 1024 * 1024) return 'text-yellow-500'; // < 100MB
        return 'text-red-500';
      
      case 'rate':
        if (value > 80) return 'text-green-500';
        if (value > 60) return 'text-yellow-500';
        return 'text-red-500';
      
      default:
        return 'text-gray-500';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 p-2 rounded-lg text-xs font-medium transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Show Search Performance Monitor"
      >
        📊
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-80 rounded-xl border shadow-lg p-4 ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-sm ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Search Performance
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className={`p-1 rounded text-xs transition-colors ${
            theme === 'dark' 
              ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          ✕
        </button>
      </div>

      {metrics ? (
        <div className="space-y-3">
          {/* Search Statistics */}
          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className={`font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Searches
                </div>
                <div className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {metrics.totalSearches}
                </div>
              </div>
              <div>
                <div className={`font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Records Indexed
                </div>
                <div className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {metrics.totalRecords.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Avg Search Time
              </span>
              <span className={`text-sm font-medium ${getPerformanceColor(metrics.averageSearchTime, 'time')}`}>
                {formatTime(metrics.averageSearchTime)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Cache Hit Rate
              </span>
              <span className={`text-sm font-medium ${getPerformanceColor(metrics.cacheHitRate, 'rate')}`}>
                {(metrics.cacheHitRate * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Memory Usage
              </span>
              <span className={`text-sm font-medium ${getPerformanceColor(metrics.memoryUsage, 'memory')}`}>
                {formatBytes(metrics.memoryUsage)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Index Size
              </span>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {formatBytes(metrics.indexSize)}
              </span>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className={`p-3 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-xs font-medium mb-2">
              Performance Status
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  metrics.averageSearchTime < 50 ? 'bg-green-500' : 
                  metrics.averageSearchTime < 100 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Search Speed: {metrics.averageSearchTime < 50 ? 'Excellent' : 
                               metrics.averageSearchTime < 100 ? 'Good' : 'Needs Optimization'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  metrics.cacheHitRate > 0.8 ? 'bg-green-500' : 
                  metrics.cacheHitRate > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Cache Efficiency: {metrics.cacheHitRate > 0.8 ? 'Excellent' : 
                                   metrics.cacheHitRate > 0.6 ? 'Good' : 'Poor'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  metrics.memoryUsage < 50 * 1024 * 1024 ? 'bg-green-500' : 
                  metrics.memoryUsage < 100 * 1024 * 1024 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Memory Usage: {metrics.memoryUsage < 50 * 1024 * 1024 ? 'Optimal' : 
                                  metrics.memoryUsage < 100 * 1024 * 1024 ? 'Acceptable' : 'High'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => engine.reset()}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Reset Cache
            </button>
            <button
              onClick={() => setMetrics(engine.getMetrics())}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className={`text-center py-4 text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Loading metrics...
        </div>
      )}
    </div>
  );
}
