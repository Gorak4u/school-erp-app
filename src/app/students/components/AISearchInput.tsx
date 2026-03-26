'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ChevronDown,
  Clock,
  TrendingUp,
  Users,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Activity,
  Hash,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Sliders
} from 'lucide-react';

interface AISearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  theme: 'dark' | 'light';
  placeholder?: string;
  getInputClass?: () => string;
  getBtnClass?: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass?: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
  students: any[];
  isAISearchEnabled?: boolean;
  onToggleAISearch?: () => void;
  recentSearches?: string[];
  onClearRecentSearches?: () => void;
}

export default function AISearchInput({
  value,
  onChange,
  onSearch,
  theme,
  placeholder = "Search students...",
  getInputClass,
  getBtnClass,
  getTextClass,
  students,
  isAISearchEnabled = false,
  onToggleAISearch,
  recentSearches = [],
  onClearRecentSearches
}: AISearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const inputClass = getInputClass?.() || (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900');
  const primaryTextClass = getTextClass?.('primary') || (isDark ? 'text-white' : 'text-gray-900');
  const secondaryTextClass = getTextClass?.('secondary') || (isDark ? 'text-gray-400' : 'text-gray-600');
  const accentTextClass = getTextClass?.('accent') || (isDark ? 'text-blue-400' : 'text-blue-600');

  // Smart search suggestions
  const searchSuggestions = useMemo(() => {
    if (!value || value.length < 2 || !isAISearchEnabled) return [];

    const suggestions = [];
    const lowerValue = value.toLowerCase();

    // Smart suggestions based on data patterns
    if (students && students.length > 0) {
      // Name suggestions
      const nameMatches = students
        .filter((s: any) => s.name && s.name.toLowerCase().includes(lowerValue))
        .slice(0, 3)
        .map((s: any) => ({
          text: s.name,
          type: 'name' as const,
          student: s,
          icon: <Users className="w-4 h-4" />
        }));
      suggestions.push(...nameMatches);

      // Class suggestions
      const classes = [...new Set(students.map((s: any) => s.class).filter(Boolean))];
      const classMatches = classes
        .filter((cls: string) => cls.toLowerCase().includes(lowerValue))
        .slice(0, 2)
        .map((cls: string) => ({
          text: cls,
          type: 'class' as const,
          description: `Class ${cls} students`,
          icon: <Target className="w-4 h-4" />
        }));
      suggestions.push(...classMatches);

      // Status suggestions
      if (lowerValue.includes('active') || lowerValue.includes('inactive')) {
        suggestions.push({
          text: lowerValue.includes('active') ? 'Active Students' : 'Inactive Students',
          type: 'status' as const,
          description: lowerValue.includes('active') ? 'Currently enrolled students' : 'Not active students',
          icon: lowerValue.includes('active') ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />
        });
      }

      // Performance suggestions
      if (lowerValue.includes('top') || lowerValue.includes('best') || lowerValue.includes('high')) {
        suggestions.push({
          text: 'Top Performers',
          type: 'performance' as const,
          description: 'Students with highest scores',
          icon: <TrendingUp className="w-4 h-4 text-purple-500" />
        });
      }

      // Attendance suggestions
      if (lowerValue.includes('attendance') || lowerValue.includes('present')) {
        suggestions.push({
          text: 'High Attendance',
          type: 'attendance' as const,
          description: 'Students with 90%+ attendance',
          icon: <Activity className="w-4 h-4 text-green-500" />
        });
      }

      // Fee suggestions
      if (lowerValue.includes('fee') || lowerValue.includes('payment')) {
        suggestions.push({
          text: 'Pending Fees',
          type: 'fees' as const,
          description: 'Students with outstanding fees',
          icon: <AlertCircle className="w-4 h-4 text-orange-500" />
        });
      }
    }

    // Recent searches
    const recentMatches = searchHistory
      .filter(search => search.toLowerCase().includes(lowerValue))
      .slice(0, 2)
      .map(search => ({
        text: search,
        type: 'recent' as const,
        description: 'Recent search',
        icon: <Clock className="w-4 h-4 text-gray-500" />
      }));
    suggestions.push(...recentMatches);

    return suggestions.slice(0, 6);
  }, [value, students, isAISearchEnabled, searchHistory]);

  // AI search insights
  const searchInsights = useMemo(() => {
    if (!isAISearchEnabled || !value || value.length < 3) return [];

    const insights = [];
    const lowerValue = value.toLowerCase();

    // Analyze search query for AI insights
    if (lowerValue.includes('class') && /\d+/.test(value)) {
      insights.push({
        type: 'class-specific',
        message: `Searching for class ${value.match(/\d+/)?.[0]} students`,
        icon: <Target className="w-4 h-4 text-blue-500" />
      });
    }

    if (lowerValue.includes('attendance')) {
      insights.push({
        type: 'attendance-analysis',
        message: 'Attendance-based search with performance metrics',
        icon: <Activity className="w-4 h-4 text-green-500" />
      });
    }

    if (lowerValue.includes('fee') || lowerValue.includes('payment')) {
      insights.push({
        type: 'financial-focus',
        message: 'Financial status and payment history included',
        icon: <BarChart3 className="w-4 h-4 text-orange-500" />
      });
    }

    if (students && students.length > 0) {
      const potentialMatches = students.filter((s: any) => 
        s.name?.toLowerCase().includes(lowerValue) ||
        s.email?.toLowerCase().includes(lowerValue) ||
        s.phone?.includes(value)
      ).length;
      
      if (potentialMatches > 0) {
        insights.push({
          type: 'match-estimate',
          message: `~${potentialMatches} potential matches found`,
          icon: <Zap className="w-4 h-4 text-purple-500" />
        });
      }
    }

    return insights.slice(0, 2);
  }, [value, isAISearchEnabled, students]);

  // Handle search with debouncing
  useEffect(() => {
    if (!value) return;

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      onSearch(value);
      
      // Add to search history
      if (value.length > 2 && !searchHistory.includes(value)) {
        setSearchHistory(prev => [value, ...prev.slice(0, 9)]);
      }
      
      setTimeout(() => setIsSearching(false), 500);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, onSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchSuggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? searchSuggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchSuggestions[selectedIndex]) {
          handleSuggestionClick(searchSuggestions[selectedIndex]);
        } else {
          onSearch(value);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    onChange(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleClearSearch = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative">
      {/* Main Search Input */}
      <motion.div
        className="relative"
        animate={{ scale: isFocused ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {isAISearchEnabled ? (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-1"
              >
                <Search className="w-5 h-5 text-blue-500" />
                <Zap className="w-3 h-3 text-blue-400 animate-pulse" />
              </motion.div>
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={isAISearchEnabled 
              ? "🔍 Enhanced Search: try 'class 10 students with low attendance' or 'fee pending students'..." 
              : placeholder
            }
            className={`
              w-full pl-12 pr-12 py-3 rounded-xl border-2 text-sm
              transition-all duration-300
              ${inputClass}
              ${isFocused ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-gray-500/30'}
              ${isAISearchEnabled ? 'bg-gradient-to-r from-purple-50/5 to-blue-50/5' : ''}
            `}
          />

          {/* Clear Button */}
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClearSearch}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}

          {/* Search Indicator */}
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <RefreshCw className="w-4 h-4 text-blue-500" />
            </motion.div>
          )}
        </div>

        {/* Enhanced AI Search Toggle */}
        {onToggleAISearch && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleAISearch}
            className={`absolute -right-2 top-1/2 transform -translate-y-1/2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isAISearchEnabled
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg border border-purple-400/50'
                : isDark 
                  ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isAISearchEnabled ? (
                <>
                  <Search className="w-3 h-3" />
                  <span>Enhanced</span>
                  <Zap className="w-3 h-3 text-yellow-300" />
                </>
              ) : (
                <>
                  <Search className="w-3 h-3" />
                  <span>Basic</span>
                </>
              )}
            </div>
          </motion.button>
        )}
      </motion.div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (searchSuggestions.length > 0 || searchInsights.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute z-50 w-full mt-2 rounded-xl border-2 shadow-2xl
              ${inputClass}
              border-gray-500/30 backdrop-blur-sm
            `}
          >
            {/* Search Insights */}
            {searchInsights.length > 0 && (
              <div className={`p-3 border-b border-gray-500/20 ${
                isDark ? 'bg-purple-900/20' : 'bg-purple-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  <span className={`text-xs font-bold ${accentTextClass}`}>Search Insights</span>
                </div>
                <div className="space-y-1">
                  {searchInsights.map((insight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {insight.icon}
                      <span className={`text-xs ${secondaryTextClass}`}>{insight.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions List */}
            <div className="max-h-64 overflow-y-auto">
              {searchSuggestions.map((suggestion, index) => (
                <motion.button
                  key={`${suggestion.text}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    w-full px-4 py-3 text-left flex items-center gap-3
                    transition-all duration-200
                    hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10
                    ${selectedIndex === index ? 'bg-blue-500/20 border-l-4 border-blue-500' : ''}
                  `}
                >
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {suggestion.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate ${primaryTextClass}`}>
                      {suggestion.text}
                    </div>
                    {'description' in suggestion && suggestion.description && (
                      <div className={`text-xs truncate ${secondaryTextClass}`}>
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                  {suggestion.type === 'recent' && (
                    <Clock className="w-3 h-3 text-gray-400" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className={`p-2 border-t border-gray-500/20 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${secondaryTextClass}`}>
                  {isAISearchEnabled ? 'Enhanced Search' : 'Basic Search'}
                </span>
                {isAISearchEnabled && (
                  <Zap className="w-3 h-3 text-blue-400" />
                )}
              </div>
              {recentSearches.length > 0 && (
                <button
                  onClick={onClearRecentSearches}
                  className={`text-xs ${secondaryTextClass} hover:${primaryTextClass}`}
                >
                  Clear History
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
