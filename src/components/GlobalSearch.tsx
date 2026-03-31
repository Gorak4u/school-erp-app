'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Search, 
  User, 
  Users, 
  GraduationCap, 
  DollarSign, 
  FileText, 
  Calendar,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
  X,
  Loader2
} from 'lucide-react';
import { showToast } from '@/lib/toastUtils';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  url: string;
  metadata?: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  query: string;
}

interface GlobalSearchProps {
  isDark: boolean;
  className?: string;
}

const ENTITY_ICONS = {
  student: User,
  teacher: Users,
  class: GraduationCap,
  fee: DollarSign,
  assignment: FileText,
  attendance: Calendar
};

const ENTITY_COLORS = {
  student: 'from-blue-500 to-cyan-500',
  teacher: 'from-purple-500 to-pink-500',
  class: 'from-green-500 to-emerald-500',
  fee: 'from-yellow-500 to-orange-500',
  assignment: 'from-indigo-500 to-purple-500',
  attendance: 'from-red-500 to-rose-500'
};

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function GlobalSearch({ isDark, className = '' }: GlobalSearchProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalResults(0);
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get schoolId from session
      const schoolId = session?.user?.schoolId;
      
      if (!schoolId) {
        showToast('error', 'Search Error', 'School context not found. Please refresh the page.');
        setResults([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/v1/search?q=${encodeURIComponent(searchQuery)}&entities=students,teachers,classes&limit=8&schoolId=${encodeURIComponent(schoolId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-school-id': schoolId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setTotalResults(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Search error:', error);
      showToast('error', 'Search Error', 'Failed to perform search. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Handle search input changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(query);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, debouncedSearch]);

  // Save search to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    setQuery('');
    setResults([]);
    router.push(result.url);
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const IconComponent = Search;

  return (
    <>
      {/* Mobile Search Button */}
      <div className={`md:hidden ${className}`}>
        <motion.button
          onClick={() => setIsMobileSearchOpen(true)}
          className={`p-2 rounded-xl transition-all duration-300 ${
            isDark 
              ? 'hover:bg-gray-800/50 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-900'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Search"
        >
          <Search className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 md:hidden ${
              isDark ? 'bg-black/90' : 'bg-white/95'
            } backdrop-blur-sm`}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`p-4 border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setIsOpen(false);
                    setQuery('');
                    setResults([]);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
                
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    placeholder="Search students, teachers, classes..."
                    className={`w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-colors ${
                      isDark 
                        ? 'bg-gray-800 text-white placeholder-gray-500 border border-gray-700' 
                        : 'bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300'
                    }`}
                    autoFocus
                  />
                  
                  {query && !isLoading && (
                    <motion.button
                      onClick={() => {
                        setQuery('');
                        setResults([]);
                        inputRef.current?.focus();
                      }}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                  
                  {isLoading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <Loader2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Mobile Search Results */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {isLoading && (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 mx-auto mb-4"
                    >
                      <Loader2 className={`w-full h-full ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </motion.div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Searching...
                    </p>
                  </div>
                )}
                
                {!isLoading && results.length > 0 && (
                  <div className="space-y-3">
                    <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {totalResults} results found
                    </div>
                    {results.map((result, index) => {
                      const IconComponent = ENTITY_ICONS[result.type as keyof typeof ENTITY_ICONS] || User;
                      const colorClass = ENTITY_COLORS[result.type as keyof typeof ENTITY_COLORS] || 'from-gray-500 to-gray-600';
                      
                      return (
                        <motion.div
                          key={`${result.type}-${result.id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl cursor-pointer transition-colors ${
                            isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r ${colorClass} shadow-lg flex-shrink-0`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {result.title}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                {result.subtitle}
                              </div>
                            </div>
                            <ArrowRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'} flex-shrink-0`} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                
                {!isLoading && results.length === 0 && query && (
                  <div className="text-center py-8">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <Search className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No results found for "{query}"
                    </p>
                  </div>
                )}
                
                {!isLoading && !query && recentSearches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Recent Searches
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className={`text-xs transition-colors ${
                          isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <motion.div
                          key={search}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                            isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => handleRecentSearchClick(search)}
                        >
                          <Clock className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {search}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Search */}
      <div className={`hidden md:block relative ${className}`} ref={dropdownRef}>
      <motion.div
        className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50' 
            : 'bg-gray-100/50 border-gray-300 hover:bg-gray-200/50'
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Search Icon with AI Badge */}
        <div className="relative">
          <IconComponent className={`w-4 h-4 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder="AI Search..."
          className={`bg-transparent outline-none text-sm w-32 lg:w-48 xl:w-64 transition-all duration-300 ${
            isDark ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
          }`}
        />
        
        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </motion.div>
        )}
        
        {/* Clear Button */}
        {query && !isLoading && (
          <motion.button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className={`p-1 rounded-lg transition-all duration-200 ${
              isDark
                ? 'hover:bg-gray-600 text-gray-400'
                : 'hover:bg-gray-300 text-gray-500'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-3 h-3" />
          </motion.button>
        )}
        
        {/* AI Assistant Button */}
        <motion.button
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            isDark
              ? 'hover:bg-blue-600/20 text-blue-400'
              : 'hover:bg-blue-100 text-blue-600'
          }`}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          title="AI Search Assistant"
        >
          <Sparkles className="w-3 h-3" />
        </motion.button>
      </motion.div>

      {/* Search Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 right-0 mt-2 w-96 rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-xl z-50 ${
              isDark 
                ? 'bg-gray-900/95 border-gray-700' 
                : 'bg-white/95 border-gray-200'
            }`}
            style={{ minWidth: '384px' }}
          >
            {/* Search Header */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {query ? `Searching for "${query}"` : 'Global Search'}
                  </span>
                </div>
                {totalResults > 0 && (
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {totalResults} results
                  </div>
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {/* Loading State */}
              {isLoading && (
                <div className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 mx-auto mb-4"
                  >
                    <Loader2 className={`w-full h-full ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </motion.div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Searching...
                  </p>
                </div>
              )}

              {/* Results */}
              {!isLoading && results.length > 0 && (
                <div className="py-2">
                  {results.map((result, index) => {
                    const IconComponent = ENTITY_ICONS[result.type as keyof typeof ENTITY_ICONS] || User;
                    const colorClass = ENTITY_COLORS[result.type as keyof typeof ENTITY_COLORS] || 'from-gray-500 to-gray-600';
                    
                    return (
                      <motion.div
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          selectedIndex === index
                            ? isDark ? 'bg-gray-800' : 'bg-gray-100'
                            : isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Entity Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r ${colorClass} shadow-lg flex-shrink-0`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          
                          {/* Result Info */}
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {result.title}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                              {result.subtitle}
                            </div>
                          </div>
                          
                          {/* Arrow */}
                          <ArrowRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'} flex-shrink-0`} />
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Load More */}
                  {hasMore && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`px-4 py-3 text-center border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <button
                        className={`text-sm font-medium transition-colors ${
                          isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                        onClick={() => {
                          showToast('info', 'Load More', 'Pagination feature coming soon!');
                        }}
                      >
                        Load more results...
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Recent Searches */}
              {!isLoading && results.length === 0 && recentSearches.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className={`text-xs transition-colors ${
                        isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'
                      }`}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <motion.div
                        key={search}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleRecentSearchClick(search)}
                      >
                        <Clock className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {search}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && results.length === 0 && recentSearches.length === 0 && (
                <div className="p-8 text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <Search className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                    No recent searches
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Start typing to search students, teachers, and classes
                  </p>
                </div>
              )}
            </div>

            {/* Search Footer */}
            <div className={`p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    AI-powered search
                  </span>
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Press ↑↓ to navigate, Enter to select
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
