'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  X,
  Zap,
  Brain,
  Sparkles,
  TrendingUp,
  Users,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sliders,
  Target,
  BarChart3,
  Eye,
  EyeOff,
  Settings,
  Hash,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Heart,
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  Activity
} from 'lucide-react';

interface AIFilterStatusTileProps {
  theme: 'dark' | 'light';
  filteredCount: number;
  totalCount: number;
  activeFilters: {
    searchTerm?: string;
    selectedClass?: string;
    selectedStatus?: string;
    selectedGender?: string;
    selectedLanguage?: string;
    attendanceFilter?: string;
    pageSize?: number;
    includeArchivedStudents?: boolean;
    advancedFilters?: any;
  };
  onClearAllFilters: () => void;
  onClearFilter: (filterKey: string) => void;
  getCardClass?: () => string;
  getBtnClass?: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass?: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
}

export default function AIFilterStatusTile({
  theme,
  filteredCount,
  totalCount,
  activeFilters,
  onClearAllFilters,
  onClearFilter,
  getCardClass,
  getBtnClass,
  getTextClass
}: AIFilterStatusTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  const isDark = theme === 'dark';
  const cardClass = getCardClass?.() || (isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200');
  const primaryTextClass = getTextClass?.('primary') || (isDark ? 'text-white' : 'text-gray-900');
  const secondaryTextClass = getTextClass?.('secondary') || (isDark ? 'text-gray-400' : 'text-gray-600');
  const accentTextClass = getTextClass?.('accent') || (isDark ? 'text-blue-400' : 'text-blue-600');
  const mutedTextClass = getTextClass?.('muted') || (isDark ? 'text-gray-500' : 'text-gray-500');

  // AI-powered filter analysis
  const filterAnalysis = useMemo(() => {
    const activeFilterCount = Object.entries(activeFilters).filter(([key, value]) => {
      if (key === 'advancedFilters') return value && Object.keys(value).length > 0;
      return value && value !== 'all' && value !== '' && value !== false;
    }).length;

    const filterEfficiency = totalCount > 0 ? ((totalCount - filteredCount) / totalCount) * 100 : 0;
    
    // AI insights based on filter patterns
    const insights = [];
    
    if (filterEfficiency > 50) {
      insights.push({
        type: 'efficiency',
        message: 'Highly efficient filtering - consider saving this filter combination',
        priority: 'high',
        icon: <Zap className="w-4 h-4 text-yellow-500" />
      });
    }
    
    if (activeFilters.selectedClass && activeFilters.selectedClass !== 'all') {
      insights.push({
        type: 'class',
        message: `Class-specific view: ${activeFilters.selectedClass}`,
        priority: 'medium',
        icon: <GraduationCap className="w-4 h-4 text-blue-500" />
      });
    }
    
    if (activeFilters.attendanceFilter && activeFilters.attendanceFilter !== 'all') {
      insights.push({
        type: 'attendance',
        message: `Attendance focus: ${activeFilters.attendanceFilter} performers`,
        priority: 'medium',
        icon: <Activity className="w-4 h-4 text-green-500" />
      });
    }
    
    if (activeFilters.searchTerm && activeFilters.searchTerm.length > 2) {
      insights.push({
        type: 'search',
        message: `Targeted search: "${activeFilters.searchTerm}"`,
        priority: 'low',
        icon: <Search className="w-4 h-4 text-purple-500" />
      });
    }

    return {
      activeFilterCount,
      filterEfficiency,
      insights,
      hasActiveFilters: activeFilterCount > 0
    };
  }, [activeFilters, filteredCount, totalCount]);

  // Get active filter details for display
  const getActiveFilterDetails = () => {
    const details = [];
    
    if (activeFilters.searchTerm) {
      details.push({
        key: 'searchTerm',
        label: 'Search',
        value: activeFilters.searchTerm,
        icon: <Search className="w-4 h-4" />,
        color: 'purple'
      });
    }
    
    if (activeFilters.selectedClass && activeFilters.selectedClass !== 'all') {
      details.push({
        key: 'selectedClass',
        label: 'Class',
        value: activeFilters.selectedClass,
        icon: <GraduationCap className="w-4 h-4" />,
        color: 'blue'
      });
    }
    
    if (activeFilters.selectedStatus && activeFilters.selectedStatus !== 'all') {
      details.push({
        key: 'selectedStatus',
        label: 'Status',
        value: activeFilters.selectedStatus,
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'green'
      });
    }
    
    if (activeFilters.selectedGender && activeFilters.selectedGender !== 'all') {
      details.push({
        key: 'selectedGender',
        label: 'Gender',
        value: activeFilters.selectedGender,
        icon: <Users className="w-4 h-4" />,
        color: 'pink'
      });
    }
    
    if (activeFilters.attendanceFilter && activeFilters.attendanceFilter !== 'all') {
      details.push({
        key: 'attendanceFilter',
        label: 'Attendance',
        value: activeFilters.attendanceFilter,
        icon: <Activity className="w-4 h-4" />,
        color: 'orange'
      });
    }
    
    if (activeFilters.includeArchivedStudents) {
      details.push({
        key: 'includeArchivedStudents',
        label: 'Archived',
        value: 'Included',
        icon: <Clock className="w-4 h-4" />,
        color: 'gray'
      });
    }
    
    return details;
  };

  const activeFilterDetails = getActiveFilterDetails();
  const { activeFilterCount, filterEfficiency, insights, hasActiveFilters } = filterAnalysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border-2 ${cardClass} shadow-lg transition-all duration-300 ${
        hasActiveFilters ? 'border-blue-500/30 shadow-blue-500/10' : 'border-gray-500/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: hasActiveFilters ? 360 : 0 }}
            transition={{ duration: 0.5 }}
            className={`p-3 rounded-xl ${
              hasActiveFilters 
                ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <Filter className="w-6 h-6 text-white" />
          </motion.div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-bold ${primaryTextClass}`}>Filter Status</h3>
              {hasActiveFilters && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30"
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span className="text-xs font-bold text-blue-500">AI</span>
                </motion.div>
              )}
            </div>
            <p className={`text-sm ${secondaryTextClass}`}>
              {filteredCount} of {totalCount} students
              {hasActiveFilters && ` • ${activeFilterCount} filters active`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearAllFilters}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${getBtnClass?.('danger')}`}
            >
              <div className="flex items-center gap-2">
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </div>
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-all ${getBtnClass?.('secondary')}`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      {/* Filter Efficiency Bar */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${primaryTextClass}`}>Filter Efficiency</span>
            <span className={`text-sm ${accentTextClass}`}>{filterEfficiency.toFixed(1)}%</span>
          </div>
          <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${filterEfficiency}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500`}
            />
          </div>
        </motion.div>
      )}

      {/* Active Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Active Filter Pills */}
            {activeFilterDetails.length > 0 && (
              <div>
                <h4 className={`text-sm font-semibold ${primaryTextClass} mb-3`}>Active Filters</h4>
                <div className="flex flex-wrap gap-2">
                  {activeFilterDetails.map((filter, index) => (
                    <motion.div
                      key={filter.key}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 ${
                        isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100/50 border-gray-300'
                      }`}
                    >
                      <div className={`p-1 rounded ${
                        filter.color === 'purple' ? 'bg-purple-500/20 text-purple-500' :
                        filter.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                        filter.color === 'green' ? 'bg-green-500/20 text-green-500' :
                        filter.color === 'pink' ? 'bg-pink-500/20 text-pink-500' :
                        filter.color === 'orange' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {filter.icon}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium ${secondaryTextClass}`}>{filter.label}:</span>
                        <span className={`text-xs font-bold ${primaryTextClass}`}>{filter.value}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onClearFilter(filter.key)}
                        className={`p-1 rounded-full transition-colors ${
                          isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {insights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <h4 className={`text-sm font-semibold ${primaryTextClass}`}>AI Insights</h4>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAIInsights(!showAIInsights)}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    {showAIInsights ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </motion.button>
                </div>
                
                <AnimatePresence>
                  {showAIInsights && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      {insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            insight.priority === 'high' 
                              ? 'bg-yellow-500/10 border border-yellow-500/30' 
                              : 'bg-blue-500/10 border border-blue-500/30'
                          }`}
                        >
                          {insight.icon}
                          <div className="flex-1">
                            <p className={`text-sm ${primaryTextClass}`}>{insight.message}</p>
                          </div>
                          {insight.priority === 'high' && (
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                              Priority
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h4 className={`text-sm font-semibold ${primaryTextClass} mb-3`}>Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border-2 transition-all ${getBtnClass?.('secondary')}`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span className={`text-sm ${primaryTextClass}`}>Save Filter</span>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border-2 transition-all ${getBtnClass?.('secondary')}`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className={`text-sm ${primaryTextClass}`}>Export Results</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
