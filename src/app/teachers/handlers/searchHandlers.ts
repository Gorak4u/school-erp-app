// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';

export function createTeacherSearchHandlers(ctx: any) {
  const { teachers, setTeachers, refresh } = ctx;
  
  // Search state
  const [teacherSearch, setTeacherSearch] = useState({
    enabled: false,
    isSearching: false,
    query: '',
    results: [],
    suggestions: [],
    searchAnalytics: {
      totalSearches: 0,
      averageResults: 0,
      recentSearches: [] as string[]
    }
  });

  // Initialize search engine when teachers data loads
  useEffect(() => {
    const initializeSearchEngine = async () => {
      if (teachers.length > 0) {
        const { TeacherSearchEngine } = await import('../search/TeacherSearchEngine');
        const searchEngine = TeacherSearchEngine.getInstance();
        
        // Build index if not already built or if data changed
        const metrics = searchEngine.getMetrics();
        if (metrics.totalRecords === 0 || metrics.totalRecords !== teachers.length) {
          searchEngine.buildIndex(teachers);
          console.log(`Teacher search engine initialized with ${teachers.length} records`);
        }
      }
    };
    
    initializeSearchEngine();
  }, [teachers.length]);

  // AI-powered search with SmartSearchEngine
  const performTeacherSearch = async (query: string) => {
    setTeacherSearch(prev => ({ ...prev, isSearching: true, query }));
    
    // Import TeacherSearchEngine dynamically to avoid circular dependencies
    const { TeacherSearchEngine } = await import('../search/TeacherSearchEngine');
    const searchEngine = TeacherSearchEngine.getInstance();
    
    // Ensure index is built
    if (searchEngine.getMetrics().totalRecords === 0) {
      searchEngine.buildIndex(teachers);
    }
    
    // Update search analytics
    setTeacherSearch(prev => ({
      ...prev,
      searchAnalytics: {
        ...prev.searchAnalytics,
        totalSearches: prev.searchAnalytics.totalSearches + 1
      }
    }));
    
    // Add to search history
    if (query && !teacherSearch.searchAnalytics.recentSearches.includes(query)) {
      setTeacherSearch(prev => ({
        ...prev,
        searchAnalytics: {
          ...prev.searchAnalytics,
          recentSearches: [query, ...prev.searchAnalytics.recentSearches.slice(0, 4)]
        }
      }));
    }
    
    // Execute smart search
    const searchResult = searchEngine.searchTeachers({
      text: query,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    const results = searchResult.teachers;
    
    // Update search state
    setTeacherSearch(prev => ({
      ...prev,
      results,
      suggestions: searchResult.suggestions,
      isSearching: false,
      searchAnalytics: {
        ...prev.searchAnalytics,
        averageResults: ((prev.searchAnalytics.averageResults * (prev.searchAnalytics.totalSearches - 1)) + results.length) / prev.searchAnalytics.totalSearches
      }
    }));
    
    return results;
  };

  // Handle search toggle
  const toggleTeacherSearch = () => {
    setTeacherSearch(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setTeacherSearch(prev => ({
      ...prev,
      searchAnalytics: {
        totalSearches: prev.searchAnalytics.totalSearches,
        averageResults: prev.searchAnalytics.averageResults,
        recentSearches: []
      }
    }));
  };

  // Get search suggestions
  const getSearchSuggestions = () => {
    if (teacherSearch.query.length < 2) return [];
    
    // Import TeacherSearchEngine dynamically
    const { TeacherSearchEngine } = require('../search/TeacherSearchEngine');
    const searchEngine = TeacherSearchEngine.getInstance();
    
    return searchEngine.generateTeacherSuggestions(teacherSearch.query);
  };

  return {
    teacherSearch,
    setTeacherSearch,
    performTeacherSearch,
    toggleTeacherSearch,
    clearSearchHistory,
    getSearchSuggestions
  };
}
