'use client';

import React from 'react';
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
  Target
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
  selectedLanguage, selectedStatus, selectedStudents, setAdvancedFilters, setAdvancedSearch, setAttendanceFilter, setCurrentPage, setMobileView,
  canPromoteStudents = true,
  canManageStudentBulk = true,
  setPageSize, setSearchTerm, setSelectedClass, setSelectedGender,
  setSelectedLanguage, setSelectedStatus, setSelectedStudents, includeArchivedStudents, setIncludeArchivedStudents,
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
  const dbClasses = dropdowns.classes;
  const dbMediums = dropdowns.mediums;
  const isDark = theme === 'dark';
  
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
        {/* AI-Powered Search Input */}
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

        {/* Quick Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="min-w-[180px]">
            <AIDropdown
              value={selectedClass}
              onChange={(value) => { setSelectedClass(value); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Classes', icon: <Users className="w-4 h-4" />, description: 'Show students from all classes' },
                ...dbClasses.map(cls => ({
                  value: cls.label,
                  label: cls.label,
                  description: cls.mediumName ? `Medium: ${cls.mediumName}` : undefined
                }))
              ]}
              placeholder="Select Class"
              theme={theme}
              getCardClass={getCardClass}
              getInputClass={getInputClass}
              getBtnClass={getBtnClass}
              getTextClass={getTextClass}
              searchable={true}
              aiSuggestions={true}
            />
          </div>

          <div className="min-w-[180px]">
            <AIDropdown
              value={selectedStatus}
              onChange={(value) => { setSelectedStatus(value); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Status', icon: <Users className="w-4 h-4" />, description: 'Show students with any status' },
                { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4 text-green-500" />, description: 'Currently enrolled students' },
                { value: 'inactive', label: 'Inactive', icon: <XCircle className="w-4 h-4 text-red-500" />, description: 'Not currently active' },
                { value: 'graduated', label: 'Graduated', icon: <GraduationCap className="w-4 h-4 text-blue-500" />, description: 'Completed studies' },
                { value: 'transferred', label: 'Transferred', icon: <Target className="w-4 h-4 text-purple-500" />, description: 'Moved to another institution' },
                { value: 'suspended', label: 'Suspended', icon: <AlertCircle className="w-4 h-4 text-orange-500" />, description: 'Temporarily suspended' },
                { value: 'exited', label: 'Exited', icon: <X className="w-4 h-4 text-gray-500" />, description: 'Left the institution' },
                { value: 'locked', label: 'Locked', icon: <EyeOff className="w-4 h-4 text-gray-500" />, description: 'Account locked' }
              ]}
              placeholder="Select Status"
              theme={theme}
              getCardClass={getCardClass}
              getInputClass={getInputClass}
              getBtnClass={getBtnClass}
              getTextClass={getTextClass}
              searchable={true}
              aiSuggestions={true}
            />
          </div>

          <div className="min-w-[160px]">
            <AIDropdown
              value={selectedGender}
              onChange={(value) => { setSelectedGender(value); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Genders', icon: <Users className="w-4 h-4" />, description: 'Show all students' },
                { value: 'Male', label: 'Male', icon: <User className="w-4 h-4 text-blue-500" />, description: 'Male students' },
                { value: 'Female', label: 'Female', icon: <User className="w-4 h-4 text-pink-500" />, description: 'Female students' },
                { value: 'Other', label: 'Other', icon: <User className="w-4 h-4 text-purple-500" />, description: 'Other gender identities' }
              ]}
              placeholder="Select Gender"
              theme={theme}
              getCardClass={getCardClass}
              getInputClass={getInputClass}
              getBtnClass={getBtnClass}
              getTextClass={getTextClass}
              aiSuggestions={true}
            />
          </div>

          <div className="min-w-[160px]">
            <AIDropdown
              value={selectedLanguage}
              onChange={(value) => { setSelectedLanguage(value); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Mediums', icon: <BookOpen className="w-4 h-4" />, description: 'All instruction mediums' },
                ...dbMediums.map(m => ({
                  value: m.label,
                  label: m.label,
                  description: `Instruction medium: ${m.label}`
                }))
              ]}
              placeholder="Select Medium"
              theme={theme}
              getCardClass={getCardClass}
              getInputClass={getInputClass}
              getBtnClass={getBtnClass}
              getTextClass={getTextClass}
              searchable={true}
              aiSuggestions={true}
            />
          </div>

          <div className="min-w-[180px]">
            <AIDropdown
              value={attendanceFilter}
              onChange={(value) => { setAttendanceFilter(value); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Attendance', icon: <BarChart3 className="w-4 h-4" />, description: 'Show all students regardless of attendance' },
                { value: 'high', label: 'High (≥90%)', icon: <TrendingUp className="w-4 h-4 text-green-500" />, description: 'Excellent attendance record' },
                { value: 'average', label: 'Average (75-89%)', icon: <BarChart3 className="w-4 h-4 text-yellow-500" />, description: 'Good attendance record' },
                { value: 'low', label: 'Low (<75%)', icon: <AlertCircle className="w-4 h-4 text-red-500" />, description: 'Needs attention' }
              ]}
              placeholder="Select Attendance"
              theme={theme}
              getCardClass={getCardClass}
              getInputClass={getInputClass}
              getBtnClass={getBtnClass}
              getTextClass={getTextClass}
              aiSuggestions={true}
            />
          </div>

          <div className="min-w-[140px]">
            <AIDropdown
              value={pageSize.toString()}
              onChange={(value) => { setPageSize(Number(value)); setCurrentPage(1); }}
              options={[
                { value: '10', label: '10 per page', icon: <Hash className="w-4 h-4" />, description: 'Show 10 students per page' },
                { value: '25', label: '25 per page', icon: <Hash className="w-4 h-4" />, description: 'Show 25 students per page' },
                { value: '50', label: '50 per page', icon: <Hash className="w-4 h-4" />, description: 'Show 50 students per page' },
                { value: '100', label: '100 per page', icon: <Hash className="w-4 h-4" />, description: 'Show 100 students per page' }
              ]}
              placeholder="Page Size"
              theme={theme}
              getCardClass={getCardClass}
              getInputClass={getInputClass}
              getBtnClass={getBtnClass}
              getTextClass={getTextClass}
              aiSuggestions={true}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${showAdvancedFilters ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`} title="Advanced Search">
              🔍 Advanced
            </button>
            <button onClick={() => setShowColumnSettings(true)} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Column Settings">
              ⚙️
            </button>
            {canPromoteStudents && onPromoteClass && selectedClass && selectedClass !== 'all' && (
              <button onClick={() => onPromoteClass(selectedClass, '')} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}>
                🎓 Promote {selectedClass}
              </button>
            )}
            <button onClick={exportAllFilteredStudents} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
              📥 Export ({filteredStudents.length})
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
    </>
  );
}
