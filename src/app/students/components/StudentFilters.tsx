'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Plus,
  Download,
  Settings,
  ChevronDown,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Trash2,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Zap,
  Hash,
  Heart,
  BarChart3,
  TrendingUp,
  GraduationCap,
  BookOpen,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { Student } from '../types';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import AIDropdown from './AIDropdown';
import AISearchInput from './AISearchInput';

interface StudentFiltersProps {
  advancedFilters: any;
  advancedSearch: any;
  applySavedFilter: (f: any) => void;
  attendanceFilter: string;
  clearAdvancedFilters: () => void;
  deleteSavedFilter: (id: string) => void;
  exportAllFilteredStudents: () => void;
  exportSelectedStudents: () => void;
  filteredStudents: Student[];
  isMobile: boolean;
  mobileView: string;
  pageSize: number;
  performAdvancedSearch: (q: string) => void;
  savedFilters: any[];
  searchTerm: string;
  selectedClass: string;
  selectedGender: string;
  selectedLanguage: string;
  selectedStatus: string;
  selectedMedium: string;
  selectedBloodGroup: string;
  selectedCategory: string;
  selectedAttendanceRange: string;
  selectedFeeStatus: string;
  selectedStudents: number[];
  includeArchivedStudents: boolean;
  setAdvancedFilters: (v: any) => void;
  setAdvancedSearch: (v: any) => void;
  setAttendanceFilter: (v: string) => void;
  setCurrentPage: (v: number) => void;
  setMobileView: (v: string) => void;
  setPageSize: (v: number) => void;
  setSearchTerm: (v: string) => void;
  setSelectedClass: (v: string) => void;
  setSelectedGender: (v: string) => void;
  setSelectedLanguage: (v: string) => void;
  setSelectedStatus: (v: string) => void;
  setSelectedMedium: (v: string) => void;
  setSelectedBloodGroup: (v: string) => void;
  setSelectedCategory: (v: string) => void;
  setSelectedAttendanceRange: (v: string) => void;
  setSelectedFeeStatus: (v: string) => void;
  setSelectedStudents: (v: number[]) => void;
  setIncludeArchivedStudents: (v: boolean) => void;
  setShowAdvancedFilters: (v: boolean) => void;
  setShowBulkOperationModal: (v: boolean) => void;
  setShowColumnSettings: (v: boolean) => void;
  setShowSaveFilterModal: (v: boolean) => void;
  showAdvancedFilters: boolean;
  showColumnSettings: boolean;
  students: Student[];
  theme: 'dark' | 'light';
  onPromoteBulk?: () => void;
  onPromoteClass?: (cls: string, section: string) => void;
  canPromoteStudents?: boolean;
  canManageStudentBulk?: boolean;
  themeConfig?: any;
  getCardClass?: () => string;
  getInputClass?: () => string;
  getBtnClass?: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass?: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
}

export default function StudentFilters({
  advancedFilters, advancedSearch, applySavedFilter, attendanceFilter,
  clearAdvancedFilters, deleteSavedFilter, exportAllFilteredStudents,
  exportSelectedStudents, filteredStudents, isMobile, mobileView, pageSize,
  performAdvancedSearch, savedFilters, searchTerm, selectedClass, selectedGender,
  selectedLanguage, selectedStatus, selectedMedium, selectedBloodGroup, selectedCategory, selectedAttendanceRange, selectedFeeStatus, selectedStudents, setAdvancedFilters, setAdvancedSearch, setAttendanceFilter, setCurrentPage, setMobileView,
  canPromoteStudents = true,
  canManageStudentBulk = true,
  setPageSize, setSearchTerm, setSelectedClass, setSelectedGender,
  setSelectedLanguage, setSelectedStatus, setSelectedMedium, setSelectedBloodGroup, setSelectedCategory, setSelectedAttendanceRange, setSelectedFeeStatus, setSelectedStudents, includeArchivedStudents, setIncludeArchivedStudents,
  setShowAdvancedFilters, setShowBulkOperationModal, setShowColumnSettings,
  setShowSaveFilterModal, showAdvancedFilters, showColumnSettings, students, theme,
  onPromoteBulk, onPromoteClass,
  themeConfig,
  getCardClass,
  getInputClass,
  getBtnClass,
  getTextClass
}: StudentFiltersProps) {
  const { dropdowns } = useSchoolConfig();
  const [classesData, setClassesData] = useState<any[]>([]);
  const [mediumsData, setMediumsData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const isDark = theme === 'dark';

  // Fetch classes and mediums from API
  useEffect(() => {
    const fetchSchoolStructure = async () => {
      setLoadingData(true);
      try {
        // Fetch classes
        const classesResponse = await fetch('/api/school-structure/classes');
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setClassesData(classesData.classes || []);
        }

        // Fetch mediums
        const mediumsResponse = await fetch('/api/school-structure/mediums');
        if (mediumsResponse.ok) {
          const mediumsData = await mediumsResponse.json();
          setMediumsData(mediumsData.mediums || []);
        }
      } catch (error) {
        console.error('Failed to fetch school structure:', error);
        // Fallback to dropdowns data if API fails
        setClassesData(dropdowns.classes || []);
        setMediumsData(dropdowns.mediums || []);
      } finally {
        setLoadingData(false);
      }
    };

    fetchSchoolStructure();
  }, [dropdowns.classes, dropdowns.mediums]);
  
  // Use provided theme functions or fallback
  const cardClass = getCardClass?.() || (isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200');
  const inputClass = getInputClass?.() || (isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400');
  const primaryBtnClass = getBtnClass?.('primary') || 'bg-gradient-to-r from-blue-600 to-purple-600 text-white';
  const secondaryBtnClass = getBtnClass?.('secondary') || (isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800');
  const dangerBtnClass = getBtnClass?.('danger') || 'bg-red-600 text-white';
  const successBtnClass = getBtnClass?.('success') || 'bg-green-600 text-white';
  const primaryTextClass = getTextClass?.('primary') || (isDark ? 'text-white' : 'text-gray-900');
  const secondaryTextClass = getTextClass?.('secondary') || (isDark ? 'text-gray-400' : 'text-gray-600');
  const mutedTextClass = getTextClass?.('muted') || (isDark ? 'text-gray-500' : 'text-gray-500');
  
  const selectClass = `${inputClass} cursor-pointer`;
  const labelClass = `block text-sm font-semibold mb-2 ${secondaryTextClass}`;

  // Mobile state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Mobile Filter Drawer Component
  const MobileFilterDrawer = () => {
    if (!isMobile) return null;

    return (
      <AnimatePresence>
        {showMobileFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 h-full w-full max-w-md z-50 shadow-2xl lg:hidden ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-4 border-b ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <h2 className={`text-lg font-bold ${primaryTextClass}`}>
                  Filters ({activeFilterCount})
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="h-[calc(100vh-140px)] overflow-y-auto p-4 space-y-6">
                {/* Quick Stats */}
                <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${primaryTextClass}`}>{filteredStudents.length}</p>
                    <p className={`text-xs ${mutedTextClass}`}>Students Found</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${primaryTextClass}`}>{activeFilterCount}</p>
                    <p className={`text-xs ${mutedTextClass}`}>Active Filters</p>
                  </div>
                </div>

                {/* Class Filter */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${secondaryTextClass}`}>
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => { setSelectedClass(e.target.value); setCurrentPage(1); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-base ${
                      selectedClass !== 'all'
                        ? isDark
                          ? 'bg-blue-900/30 border-blue-500 text-white'
                          : 'bg-blue-50 border-blue-400 text-blue-900'
                        : isDark
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Classes</option>
                    {classesData.map((cls: any) => {
                      const medium = mediumsData.find((m: any) => m.id === cls.mediumId);
                      const mediumName = medium ? medium.name || medium.label : '';
                      const className = cls.name || cls.label;
                      const displayText = mediumName ? `${className} (${mediumName})` : className;
                      // Use composite key: className|mediumName
                      const value = mediumName ? `${className}|${mediumName}` : className;
                      return (
                        <option key={cls.id || cls.value} value={value}>{displayText}</option>
                      );
                    })}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${secondaryTextClass}`}>
                    <Activity className="w-4 h-4 inline mr-2" />
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['all', 'active', 'inactive', 'graduated', 'transferred', 'suspended'].map((status) => (
                      <button
                        key={status}
                        onClick={() => { setSelectedStatus(status); setCurrentPage(1); }}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedStatus === status
                            ? isDark
                              ? 'bg-green-600 text-white shadow-lg'
                              : 'bg-green-500 text-white shadow-lg'
                            : isDark
                              ? 'bg-gray-800 text-gray-300 border border-gray-700'
                              : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${secondaryTextClass}`}>
                    <Users className="w-4 h-4 inline mr-2" />
                    Gender
                  </label>
                  <div className="flex gap-2">
                    {['all', 'Male', 'Female', 'Other'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => { setSelectedGender(gender); setCurrentPage(1); }}
                        className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedGender === gender
                            ? isDark
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-purple-500 text-white shadow-lg'
                            : isDark
                              ? 'bg-gray-800 text-gray-300 border border-gray-700'
                              : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                      >
                        {gender === 'all' ? 'All' : gender}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medium Filter */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${secondaryTextClass}`}>
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Medium
                  </label>
                  <select
                    value={selectedMedium}
                    onChange={(e) => { setSelectedMedium(e.target.value); setCurrentPage(1); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-base ${
                      selectedMedium !== 'all'
                        ? isDark
                          ? 'bg-purple-900/30 border-purple-500 text-white'
                          : 'bg-purple-50 border-purple-400 text-purple-900'
                        : isDark
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Mediums</option>
                    {mediumsData.map((medium: any) => (
                      <option key={medium.id || medium.value} value={medium.name || medium.label}>
                        {medium.name || medium.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${secondaryTextClass}`}>
                    <Award className="w-4 h-4 inline mr-2" />
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-base ${
                      selectedCategory !== 'all'
                        ? isDark
                          ? 'bg-purple-900/30 border-purple-500 text-white'
                          : 'bg-purple-50 border-purple-400 text-purple-900'
                        : isDark
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Categories</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

                {/* Attendance Filter */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${secondaryTextClass}`}>
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Attendance Range
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Attendance', color: 'gray' },
                      { value: '90-100', label: '90% - 100% (Excellent)', color: 'green' },
                      { value: '75-89', label: '75% - 89% (Good)', color: 'blue' },
                      { value: '60-74', label: '60% - 74% (Average)', color: 'yellow' },
                      { value: 'below-60', label: 'Below 60% (Poor)', color: 'red' }
                    ].map((range) => (
                      <button
                        key={range.value}
                        onClick={() => { setSelectedAttendanceRange(range.value); setCurrentPage(1); }}
                        className={`w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3 ${
                          selectedAttendanceRange === range.value
                            ? isDark
                              ? 'bg-orange-600 text-white shadow-lg'
                              : 'bg-orange-500 text-white shadow-lg'
                            : isDark
                              ? 'bg-gray-800 text-gray-300 border border-gray-700'
                              : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          range.color === 'green' ? 'bg-green-400' :
                          range.color === 'blue' ? 'bg-blue-400' :
                          range.color === 'yellow' ? 'bg-yellow-400' :
                          range.color === 'red' ? 'bg-red-400' :
                          'bg-gray-400'
                        }`} />
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fee Status Filter */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${secondaryTextClass}`}>
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Fee Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['all', 'paid', 'pending', 'overdue', 'partial'].map((status) => (
                      <button
                        key={status}
                        onClick={() => { setSelectedFeeStatus(status); setCurrentPage(1); }}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedFeeStatus === status
                            ? isDark
                              ? 'bg-orange-600 text-white shadow-lg'
                              : 'bg-orange-500 text-white shadow-lg'
                            : isDark
                              ? 'bg-gray-800 text-gray-300 border border-gray-700'
                              : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Include Archived */}
                <div className={`flex items-center justify-between p-4 rounded-xl ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <span className={`font-medium ${secondaryTextClass}`}>
                    Include Archived Students
                  </span>
                  <button
                    onClick={() => setIncludeArchivedStudents(!includeArchivedStudents)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      includeArchivedStudents
                        ? 'bg-blue-600'
                        : isDark ? 'bg-gray-700' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      animate={{ x: includeArchivedStudents ? 24 : 4 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex gap-3">
                  <button
                    onClick={clearAdvancedFilters}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                      isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium text-white transition-colors ${
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    Show {filteredStudents.length} Results
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  // Calculate active filter count
  const activeFilterCount = [
    selectedClass !== 'all',
    selectedStatus !== 'all',
    selectedGender !== 'all',
    selectedMedium !== 'all',
    selectedCategory !== 'all',
    selectedBloodGroup !== 'all',
    selectedAttendanceRange !== 'all',
    selectedFeeStatus !== 'all',
    includeArchivedStudents
  ].filter(Boolean).length;

  // Active Filter Badges Component
  const ActiveFilterBadges = () => {
    const activeFilters = [];
    
    if (selectedClass !== 'all') {
      activeFilters.push({ 
        key: 'class', 
        label: 'Class', 
        value: selectedClass, 
        color: 'blue',
        onRemove: () => setSelectedClass('all')
      });
    }
    
    if (selectedStatus !== 'all') {
      activeFilters.push({ 
        key: 'status', 
        label: 'Status', 
        value: selectedStatus, 
        color: 'green',
        onRemove: () => setSelectedStatus('all')
      });
    }
    
    if (selectedGender !== 'all') {
      activeFilters.push({ 
        key: 'gender', 
        label: 'Gender', 
        value: selectedGender, 
        color: 'purple',
        onRemove: () => setSelectedGender('all')
      });
    }
    
    if (selectedMedium !== 'all') {
      activeFilters.push({ 
        key: 'medium', 
        label: 'Medium', 
        value: selectedMedium, 
        color: 'purple',
        onRemove: () => setSelectedMedium('all')
      });
    }
    
    if (selectedCategory !== 'all') {
      activeFilters.push({ 
        key: 'category', 
        label: 'Category', 
        value: selectedCategory, 
        color: 'purple',
        onRemove: () => setSelectedCategory('all')
      });
    }
    
    if (selectedBloodGroup !== 'all') {
      activeFilters.push({ 
        key: 'bloodGroup', 
        label: 'Blood Group', 
        value: selectedBloodGroup, 
        color: 'purple',
        onRemove: () => setSelectedBloodGroup('all')
      });
    }
    
    if (selectedAttendanceRange !== 'all') {
      activeFilters.push({ 
        key: 'attendance', 
        label: 'Attendance', 
        value: selectedAttendanceRange, 
        color: 'orange',
        onRemove: () => setSelectedAttendanceRange('all')
      });
    }
    
    if (selectedFeeStatus !== 'all') {
      activeFilters.push({ 
        key: 'feeStatus', 
        label: 'Fee Status', 
        value: selectedFeeStatus, 
        color: 'orange',
        onRemove: () => setSelectedFeeStatus('all')
      });
    }
    
    if (includeArchivedStudents) {
      activeFilters.push({ 
        key: 'archived', 
        label: 'Archived', 
        value: 'Included', 
        color: 'gray',
        onRemove: () => setIncludeArchivedStudents(false)
      });
    }

    if (activeFilters.length === 0) return null;

    const colorClasses = {
      blue: isDark ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300',
      green: isDark ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-300',
      purple: isDark ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-300',
      orange: isDark ? 'bg-orange-900/50 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-300',
      gray: isDark ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300',
    };

    return (
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`text-sm font-medium ${secondaryTextClass}`}>
          Active Filters:
        </span>
        {activeFilters.map((filter) => (
          <span
            key={filter.key}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-default ${colorClasses[filter.color as keyof typeof colorClasses]}`}
          >
            <span className="font-semibold">{filter.label}:</span>
            <span className="truncate max-w-[100px]">{filter.value.includes('|') ? filter.value.split('|')[0] : filter.value}</span>
            <button
              onClick={filter.onRemove}
              className={`ml-1 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors`}
              title={`Remove ${filter.label} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        {/* Clear All Button - Always visible when filters exist */}
        {activeFilters.length > 0 && (
          <button
            onClick={clearAdvancedFilters}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:opacity-80 ${
              isDark 
                ? 'bg-red-900/30 border-red-500/30 text-red-300 hover:bg-red-900/50' 
                : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
            }`}
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Modern Advanced Filters Section */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-6 rounded-2xl overflow-hidden ${cardClass} shadow-lg border-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'}`}>
                    <SlidersHorizontal className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${primaryTextClass}`}>Advanced Filters</h3>
                    <p className={`text-sm ${secondaryTextClass}`}>Refine your search with specific criteria</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAdvancedFilters} 
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all transform ${dangerBtnClass} shadow-lg flex items-center gap-2`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSaveFilterModal(true)} 
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all transform ${successBtnClass} shadow-lg flex items-center gap-2`}
                  >
                    <Save className="w-4 h-4" />
                    Save Filter
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAdvancedFilters(false)} 
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all transform ${secondaryBtnClass} border-2 flex items-center gap-2`}
                  >
                    <X className="w-4 h-4" />
                    Close
                  </motion.button>
                </div>
              </div>

              {/* Modern Filter Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className={labelClass}>
                    <User className="w-4 h-4 inline mr-2" />
                    Student Name
                  </label>
                  <input 
                    type="text" 
                    value={advancedFilters.name} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, name: e.target.value }))} 
                    placeholder="Search by name..." 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className={labelClass}>
                    <Hash className="w-4 h-4 inline mr-2" />
                    Admission No
                  </label>
                  <input 
                    type="text" 
                    value={advancedFilters.admissionNo} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, admissionNo: e.target.value }))} 
                    placeholder="Admission number..." 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className={labelClass}>
                    <Users className="w-4 h-4 inline mr-2" />
                    Parent Name
                  </label>
                  <input 
                    type="text" 
                    value={advancedFilters.parentName} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, parentName: e.target.value }))} 
                    placeholder="Parent name..." 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className={labelClass}>
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone
                  </label>
                  <input 
                    type="text" 
                    value={advancedFilters.phone} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, phone: e.target.value }))} 
                    placeholder="Phone number..." 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className={labelClass}>
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input 
                    type="text" 
                    value={advancedFilters.email} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, email: e.target.value }))} 
                    placeholder="Email..." 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className={labelClass}>
                    <Heart className="w-4 h-4 inline mr-2" />
                    Blood Group
                  </label>
                  <select 
                    value={advancedFilters.bloodGroup} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, bloodGroup: e.target.value }))} 
                    className={`${selectClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="all">All Blood Groups</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label className={labelClass}>
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Fee Status
                  </label>
                  <select 
                    value={advancedFilters.feeStatus} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, feeStatus: e.target.value }))} 
                    className={`${selectClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <label className={labelClass}>
                    <Users className="w-4 h-4 inline mr-2" />
                    Category
                  </label>
                  <select 
                    value={advancedFilters.category} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, category: e.target.value }))} 
                    className={`${selectClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="all">All Categories</option>
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                  </select>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <label className={labelClass}>
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Attendance Min %
                  </label>
                  <input 
                    type="number" 
                    value={advancedFilters.attendanceMin} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, attendanceMin: e.target.value }))} 
                    placeholder="0" 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <label className={labelClass}>
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Attendance Max %
                  </label>
                  <input 
                    type="number" 
                    value={advancedFilters.attendanceMax} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, attendanceMax: e.target.value }))} 
                    placeholder="100" 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <label className={labelClass}>
                    <MapPin className="w-4 h-4 inline mr-2" />
                    City
                  </label>
                  <input 
                    type="text" 
                    value={advancedFilters.city} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, city: e.target.value }))} 
                    placeholder="City..." 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <label className={labelClass}>
                    <MapPin className="w-4 h-4 inline mr-2" />
                    State
                  </label>
                  <input 
                    type="text" 
                    value={advancedFilters.state} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, state: e.target.value }))} 
                    placeholder="State..." 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  <label className={labelClass}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date of Birth
                  </label>
                  <input 
                    type="date" 
                    value={advancedFilters.dateOfBirth} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, dateOfBirth: e.target.value }))} 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  <label className={labelClass}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Admission From
                  </label>
                  <input 
                    type="date" 
                    value={advancedFilters.admissionDateFrom} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, admissionDateFrom: e.target.value }))} 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                >
                  <label className={labelClass}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Admission To
                  </label>
                  <input 
                    type="date" 
                    value={advancedFilters.admissionDateTo} 
                    onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, admissionDateTo: e.target.value }))} 
                    className={`${inputClass} px-4 py-3 rounded-xl border-2 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer`} 
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 }}
                  className="flex items-center space-x-3 pt-6 lg:col-span-2"
                >
                  <input
                    type="checkbox"
                    id="includeArchivedStudents"
                    checked={includeArchivedStudents}
                    onChange={e => setIncludeArchivedStudents(e.target.checked)}
                    className={`w-5 h-5 rounded border-2 text-blue-600 focus:ring-2 focus:ring-blue-500/20 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                  <label htmlFor="includeArchivedStudents" className={`text-sm font-semibold ${primaryTextClass} cursor-pointer`}>
                    <EyeOff className="w-4 h-4 inline mr-2" />
                    Include Exited/Graduated Students
                  </label>
                </motion.div>
              </div>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Saved Filters</h4>
                  <div className="flex flex-wrap gap-2">
                    {savedFilters.map(filter => (
                      <div key={filter.id} className="flex items-center gap-1">
                        <button
                          onClick={() => applySavedFilter(filter)}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            theme === 'dark' ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {filter.name}
                        </button>
                        <button onClick={() => deleteSavedFilter(filter.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Quick Filters Bar */}
      <div className={`rounded-xl border p-4 mb-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Enhanced Search Input */}
        <div className="mb-4">
          <AISearchInput
            value={advancedSearch.enabled ? advancedSearch.query : searchTerm}
            onChange={(newValue) => {
              if (advancedSearch.enabled) {
                setAdvancedSearch((prev: any) => ({ ...prev, query: newValue }));
                performAdvancedSearch(newValue);
              } else {
                setSearchTerm(newValue);
              }
              setCurrentPage(1);
            }}
            onSearch={(query) => {
              if (advancedSearch.enabled) {
                performAdvancedSearch(query);
              }
            }}
            theme={theme}
            placeholder="Search students by name, email, phone, admission no..."
            getInputClass={() => inputClass}
            getBtnClass={getBtnClass}
            getTextClass={getTextClass}
            students={students}
            isAISearchEnabled={advancedSearch.enabled}
            onToggleAISearch={() => setAdvancedSearch((prev: any) => ({ ...prev, enabled: !prev.enabled }))}
            recentSearches={advancedSearch.searchAnalytics?.recentSearches || []}
            onClearRecentSearches={() => {
              setAdvancedSearch((prev: any) => ({
                ...prev,
                searchAnalytics: {
                  totalSearches: prev.searchAnalytics?.totalSearches || 0,
                  averageResults: prev.searchAnalytics?.averageResults || 0,
                  recentSearches: []
                }
              }));
            }}
          />
        </div>

        {/* Active Filter Badges */}
        <ActiveFilterBadges />

        {/* Compact Filter Section with Icons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Filters Row - All in one line with icons */}
          <div className="flex items-center gap-2">
            {/* Class with Icon */}
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <GraduationCap className={`w-3.5 h-3.5 ${selectedClass !== 'all' ? 'text-blue-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <select 
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setCurrentPage(1); }}
                className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all min-w-[110px] appearance-none cursor-pointer ${
                  selectedClass !== 'all' 
                    ? theme === 'dark' 
                      ? 'bg-blue-900/30 border-blue-500/50 text-blue-200' 
                      : 'bg-blue-50 border-blue-300 text-blue-700'
                    : theme === 'dark' 
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <option value="all">All Classes</option>
                {classesData.map((cls: any) => {
                  const medium = mediumsData.find((m: any) => m.id === cls.mediumId);
                  const mediumName = medium ? medium.name || medium.label : '';
                  const className = cls.name || cls.label;
                  const displayText = mediumName ? `${className} (${mediumName})` : className;
                  const value = mediumName ? `${className}|${mediumName}` : className;
                  return (
                    <option key={cls.id || cls.value} value={value}>{displayText}</option>
                  );
                })}
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Status with Icon */}
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Activity className={`w-3.5 h-3.5 ${selectedStatus !== 'all' ? 'text-green-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <select 
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all appearance-none cursor-pointer ${
                  selectedStatus !== 'all' 
                    ? theme === 'dark' 
                      ? 'bg-green-900/30 border-green-500/50 text-green-200' 
                      : 'bg-green-50 border-green-300 text-green-700'
                    : theme === 'dark' 
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <option value="all">Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="transferred">Transferred</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Gender with Icon */}
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Users className={`w-3.5 h-3.5 ${selectedGender !== 'all' ? 'text-purple-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <select 
                value={selectedGender}
                onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }}
                className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all appearance-none cursor-pointer ${
                  selectedGender !== 'all' 
                    ? theme === 'dark' 
                      ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                      : 'bg-purple-50 border-purple-300 text-purple-700'
                    : theme === 'dark' 
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <option value="all">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Medium with Icon */}
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <BookOpen className={`w-3.5 h-3.5 ${selectedMedium !== 'all' ? 'text-indigo-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <select 
                value={selectedMedium}
                onChange={(e) => { setSelectedMedium(e.target.value); setCurrentPage(1); }}
                className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer ${
                  selectedMedium !== 'all' 
                    ? theme === 'dark' 
                      ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-200' 
                      : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : theme === 'dark' 
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <option value="all">Medium</option>
                {mediumsData.map((medium: any) => (
                  <option key={medium.id || medium.value} value={medium.name || medium.label}>
                    {medium.name || medium.label}
                  </option>
                ))}
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Category with Icon */}
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Award className={`w-3.5 h-3.5 ${selectedCategory !== 'all' ? 'text-pink-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <select 
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all appearance-none cursor-pointer ${
                  selectedCategory !== 'all' 
                    ? theme === 'dark' 
                      ? 'bg-pink-900/30 border-pink-500/50 text-pink-200' 
                      : 'bg-pink-50 border-pink-300 text-pink-700'
                    : theme === 'dark' 
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <option value="all">Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Attendance with Icon */}
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <TrendingUp className={`w-3.5 h-3.5 ${selectedAttendanceRange !== 'all' ? 'text-orange-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <select 
                value={selectedAttendanceRange}
                onChange={(e) => { setSelectedAttendanceRange(e.target.value); setCurrentPage(1); }}
                className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all appearance-none cursor-pointer ${
                  selectedAttendanceRange !== 'all' 
                    ? theme === 'dark' 
                      ? 'bg-orange-900/30 border-orange-500/50 text-orange-200' 
                      : 'bg-orange-50 border-orange-300 text-orange-700'
                    : theme === 'dark' 
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <option value="all">Attendance</option>
                <option value="90-100">90%+</option>
                <option value="75-89">75-89%</option>
                <option value="60-74">60-74%</option>
                <option value="below-60">&lt;60%</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Fee Status with Icon */}
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <CreditCard className={`w-3.5 h-3.5 ${selectedFeeStatus !== 'all' ? 'text-red-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <select 
                value={selectedFeeStatus}
                onChange={(e) => { setSelectedFeeStatus(e.target.value); setCurrentPage(1); }}
                className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all appearance-none cursor-pointer ${
                  selectedFeeStatus !== 'all' 
                    ? theme === 'dark' 
                      ? 'bg-red-900/30 border-red-500/50 text-red-200' 
                      : 'bg-red-50 border-red-300 text-red-700'
                    : theme === 'dark' 
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <option value="all">Fees</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Blood Group with Icon */}
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Heart className={`w-3.5 h-3.5 ${selectedBloodGroup !== 'all' ? 'text-rose-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <select 
                value={selectedBloodGroup}
                onChange={(e) => { setSelectedBloodGroup(e.target.value); setCurrentPage(1); }}
                className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all appearance-none cursor-pointer ${
                  selectedBloodGroup !== 'all' 
                    ? theme === 'dark' 
                      ? 'bg-rose-900/30 border-rose-500/50 text-rose-200' 
                      : 'bg-rose-50 border-rose-300 text-rose-700'
                    : theme === 'dark' 
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <option value="all">Blood</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          </div>

          {/* Divider */}
          <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

          {/* Icon Actions */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
              className={`p-1.5 rounded-md transition-all ${
                showAdvancedFilters 
                  ? 'bg-blue-500 text-white' 
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Advanced Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setShowColumnSettings(true)} 
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Column Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {canPromoteStudents && onPromoteClass && selectedClass && selectedClass !== 'all' && (
              <button 
                onClick={() => onPromoteClass(selectedClass, '')} 
                className={`p-1.5 rounded-md transition-colors text-purple-400 hover:text-purple-300 hover:bg-purple-900/20`}
                title={`Promote ${selectedClass}`}
              >
                <GraduationCap className="w-4 h-4" />
              </button>
            )}
            
            <button 
              onClick={exportAllFilteredStudents} 
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'dark' 
                  ? 'text-green-400 hover:text-green-300 hover:bg-green-900/20' 
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
              }`}
              title={`Export ${filteredStudents.length} students`}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Students Actions */}
        {selectedStudents.length > 0 && (
          <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {selectedStudents.length} selected
            </span>
            <button onClick={exportSelectedStudents} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
              📥 Export Selected
            </button>
            {canPromoteStudents && onPromoteBulk && (
              <button onClick={onPromoteBulk} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}>
                🎓 Promote Selected
              </button>
            )}
            {canManageStudentBulk && (
              <button onClick={() => setShowBulkOperationModal(true)} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                ⚙️ Bulk Operations
              </button>
            )}
            <button onClick={() => setSelectedStudents([])} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}>
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Button - Only visible on mobile */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowMobileFilters(true)}
          className={`fixed bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg lg:hidden ${
            activeFilterCount > 0
              ? theme === 'dark'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : theme === 'dark'
                ? 'bg-gray-800 text-white border border-gray-700'
                : 'bg-white text-gray-900 border border-gray-300'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">
            {activeFilterCount > 0 ? `${activeFilterCount} Filters` : 'Filters'}
          </span>
        </motion.button>
      )}

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer />
    </>
  );
}
