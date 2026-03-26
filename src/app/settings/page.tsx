'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  TABS,
  showToast,
  getCardClass,
  getBtnPrimaryClass,
  getBtnSecondaryClass,
  getBtnDangerClass,
  getInputClass,
  getLabelClass,
  getBadgeClass,
  getHeadingClass,
  getSubtextClass,
  AcademicYear,
  Board,
  Medium,
  Class,
  Section,
  Timing,
  FeeStructure,
  LockDialogData,
} from './index';
import {
  SchoolDetailsTab,
  AcademicYearsTab,
  StructureTab,
  FeeTab,
  TimingsTab,
  IntegrationsTab,
  AppSettingsTab,
  ThemeTab,
  RolesTab,
  UsersTab,
  LeaveTab,
  EntityModal,
  CopyAcademicYearModal,
  LockDialog,
  CascadeDeleteDialog,
} from './index';

// Enhanced TypeScript interfaces
type EntityType = 'academicYear' | 'board' | 'medium' | 'class' | 'section' | 'timing' | 'feeStructure';
type TabType = string;

interface DeleteModalData {
  entity: string;
  id: string;
  name: string;
  classCount: number;
  sectionCount: number;
  feeStructureCount: number;
}

// Enhanced API interfaces with better typing
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface ApiClient {
  list: (params?: any) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  activate?: (id: string) => Promise<any>;
  clone?: (source: string, target: string) => Promise<any>;
}

// APIs
const academicYearsApi = {
  list: async () => {
    const response = await fetch('/api/school-structure/academic-years');
    if (!response.ok) {
      throw new Error(`Failed to fetch academic years: ${response.status}`);
    }
    return response.json();
  },
  create: (data: any) => fetch('/api/school-structure/academic-years', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  update: (id: string, data: any) => fetch(`/api/school-structure/academic-years/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  delete: (id: string) => fetch(`/api/school-structure/academic-years/${id}`, { method: 'DELETE' }).then(r => r.json()),
  activate: (id: string) => fetch(`/api/school-structure/academic-years/${id}/activate`, { method: 'POST' }).then(r => r.json()),
};

const boardsApi = {
  list: () => fetch('/api/school-structure/boards').then(r => r.json()),
  create: (data: any) => fetch('/api/school-structure/boards', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  update: (id: string, data: any) => fetch(`/api/school-structure/boards/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  delete: (id: string) => fetch(`/api/school-structure/boards?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
};

const mediumsApi = {
  list: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetch(`/api/school-structure/mediums${qs}`).then(r => r.json());
  },
  create: (data: any) => fetch('/api/school-structure/mediums', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  update: (id: string, data: any) => fetch(`/api/school-structure/mediums/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  delete: (id: string) => fetch(`/api/school-structure/mediums?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
};

const classesApi = {
  list: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetch(`/api/school-structure/classes${qs}`).then(r => r.json());
  },
  create: (data: any) => fetch('/api/school-structure/classes', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  update: (id: string, data: any) => fetch(`/api/school-structure/classes?id=${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  delete: (id: string) => fetch(`/api/school-structure/classes?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
};

const sectionsApi = {
  list: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetch(`/api/school-structure/sections${qs}`).then(r => r.json());
  },
  create: (data: any) => fetch('/api/school-structure/sections', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  update: (id: string, data: any) => fetch(`/api/school-structure/sections?id=${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  delete: (id: string) => fetch(`/api/school-structure/sections?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
};

const timingsApi = {
  list: () => fetch('/api/school-structure/timings').then(r => r.json()),
  create: (data: any) => fetch('/api/school-structure/timings', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  update: (id: string, data: any) => fetch('/api/school-structure/timings', { method: 'PUT', body: JSON.stringify({ id, ...data }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  delete: (id: string) => fetch(`/api/school-structure/timings?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
};

const feeStructuresApi = {
  list: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetch(`/api/fees/structures${qs}`).then(r => r.json());
  },
  create: (data: any) => fetch('/api/fees/structures', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  update: (id: string, data: any) => fetch(`/api/fees/structures/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  delete: (id: string) => fetch(`/api/fees/structures/${id}`, { method: 'DELETE' }).then(r => r.json()),
  clone: (source: string, target: string) => fetch(`/api/fees/structures/clone?source=${source}&target=${target}`, { method: 'POST' }).then(r => r.json()),
};

const settingsApi = {
  list: () => fetch('/api/school-structure/settings').then(r => r.json()),
  update: (group: string, key: string, value: string) => fetch('/api/school-structure/settings', { method: 'POST', body: JSON.stringify({ group, key, value }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  getAll: () => fetch('/api/school-structure/settings').then(r => r.json()),
  upsertBatch: (data: { group: string; settings: Record<string, string> }) => fetch('/api/school-structure/settings', { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
};

export default function SettingsPage() {
  const { theme } = useTheme();
  const { refresh: refreshSchoolConfig } = useSchoolConfig();
  const { hasPermission, isAdmin } = usePermissions();
  const canManageSettings = isAdmin || hasPermission('manage_settings');
  
  // Theme state
  const isDark = theme === 'dark';
  
  // Enhanced state management with proper typing
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('school');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug loading state changes
  console.log('Main loading state:', loading);

  // Data state with better typing
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [timings, setTimings] = useState<Timing[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, Record<string, string>>>({});
  const [activeAY, setActiveAY] = useState<AcademicYear | null>(null);

  // Modal state with proper typing
  const [showModal, setShowModal] = useState(false);
  const [modalEntity, setModalEntity] = useState<EntityType | ''>('');
  const [editingItem, setEditingItem] = useState<AcademicYear | Board | Medium | Class | Section | Timing | FeeStructure | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showCascadeDeleteModal, setShowCascadeDeleteModal] = useState<DeleteModalData | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [previousYearForCopy, setPreviousYearForCopy] = useState<AcademicYear | null>(null);

  // Memoized API clients mapping
  const apiClients = useMemo(() => ({
    academicYear: academicYearsApi,
    board: boardsApi,
    medium: mediumsApi,
    class: classesApi,
    section: sectionsApi,
    timing: timingsApi,
    feeStructure: feeStructuresApi,
  }), []);

  // Memoized CSS classes with world-class UI template
  const darkMode = isDark;
  const enhancedCard = `backdrop-blur-2xl bg-gradient-to-br ${darkMode ? 'from-gray-800/90 to-gray-900/90 border-gray-700/50' : 'from-white/90 to-gray-50/90 border-gray-200/50'} rounded-3xl shadow-2xl p-6 border backdrop-blur-xl`;
  const enhancedInput = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const enhancedLabel = `block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const enhancedBtnPrimary = `px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const enhancedBtnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  // Handle URL tab parameter with useCallback
  const handleUrlTabParam = useCallback(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && TABS.find(tab => tab.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Enhanced utility functions with useCallback
  const getSetting = useCallback((group: string, key: string, defaultValue: string) => {
    return settingsMap?.[group]?.[key] || defaultValue;
  }, [settingsMap]);

  const saveBatchSettings = useCallback(async (group: string, settings: Record<string, string>) => {
    setSaving(true);
    setError(null);
    try {
      await settingsApi.upsertBatch({ group, settings });
      await fetchAll();
      refreshSchoolConfig();
      showToast({ type: 'success', title: 'Settings saved successfully' });
    } catch (e: any) {
      setError(e.message);
      showToast({ type: 'error', title: 'Failed to save settings', message: e.message });
    } finally {
      setSaving(false);
    }
  }, [refreshSchoolConfig]);

  // Optimized data fetching with error handling
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add a timeout to see if the API calls are hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API timeout after 10 seconds')), 10000);
      });
      
      const apiPromise = (async () => {
        const ayRes = await academicYearsApi.list();
        
        setAcademicYears(ayRes.academicYears || []);
        
        const [
          boardsRes,
          mediumsRes,
          classesRes,
          sectionsRes,
          timingsRes,
          feesRes,
          settingsRes,
        ] = await Promise.all([
          boardsApi.list(),
          mediumsApi.list(),
          classesApi.list(),
          sectionsApi.list(),
          timingsApi.list(),
          feeStructuresApi.list(),
          settingsApi.getAll(),
        ]);

        console.log('fetchAll - timings response:', timingsRes);

        setBoards(boardsRes.boards || []);
        setMediums(mediumsRes.mediums || []);
        setClasses(classesRes.classes || []);
        setSections(sectionsRes.sections || []);
        setTimings(timingsRes.timings || []);
        setFeeStructures(feesRes.feeStructures || []);
        setSettingsMap(settingsRes.settings || {});
        
        const active = (ayRes.academicYears || []).find((ay: AcademicYear) => ay.isActive);
        setActiveAY(active || null);
      })();
      
      await Promise.race([apiPromise, timeoutPromise]);
      
    } catch (e: any) {
      setError(e.message);
      showToast({ type: 'error', title: 'Failed to load data', message: e.message });
    } finally {
      setLoading(false);
    }
  }, [academicYearsApi, boardsApi, mediumsApi, classesApi, sectionsApi, timingsApi, feeStructuresApi, settingsApi]);

  // Refresh timings without setting main loading state
  const refreshTimings = useCallback(async () => {
    console.log('refreshTimings called - NOT setting loading state');
    try {
      const timingsRes = await timingsApi.list();
      setTimings(timingsRes.timings || []);
    } catch (e: any) {
      console.error('Failed to refresh timings:', e);
      showToast({ type: 'error', title: 'Failed to refresh timings', message: e.message });
    }
  }, [timingsApi]);

  // Enhanced modal handlers with validation
  const openCreate = useCallback((entity: string, initialData: any = {}) => {
    setEditingItem(null);
    
    // Add academicYearId for entities that need it
    const dataWithAcademicYear = ['medium', 'class', 'section'].includes(entity) 
      ? { ...initialData, academicYearId: '' }
      : initialData;
    
    // Validate active academic year
    if (['medium', 'class', 'section'].includes(entity) && !academicYears.some((ay: any) => ay.isActive)) {
      showToast({ 
        type: 'error', 
        title: 'No Active Academic Year', 
        message: 'Please create and activate an academic year first before creating school structure entities.' 
      });
      return;
    }
    
    setFormData(dataWithAcademicYear);
    setModalEntity(entity as EntityType);
    setShowModal(true);
  }, [academicYears]);

  const openEdit = useCallback((entity: string, item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalEntity(entity as EntityType);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setModalEntity('');
  }, []);

  // Initialize component and handle URL parameters
  useEffect(() => {
    setIsClient(true);
    handleUrlTabParam();
    fetchAll();
  }, []); // Run only once on mount

  // ─── Delete handler ───────────────────────────────────────────────────────────
  const handleDelete = async (entity: string, id: string, name: string, cascade: boolean = false) => {
    console.log('handleDelete called:', { entity, id, name, cascade });
    
    if (!cascade) {
      if (!confirm(`Delete "${name}"?`)) return;
    }
    
    try {
      let api;
      switch (entity) {
        case 'academicYear': api = academicYearsApi; break;
        case 'board': api = boardsApi; break;
        case 'medium': api = mediumsApi; break;
        case 'class': api = classesApi; break;
        case 'section': api = sectionsApi; break;
        case 'timing': api = timingsApi; break;
        case 'feeStructure': api = feeStructuresApi; break;
        default: return;
      }
      
      // For entities that support cascade delete, use custom fetch with cascade parameter
      let deletePromise;
      if (['medium', 'class', 'section', 'board'].includes(entity)) {
        const deleteUrl = `/api/school-structure/${entity}s?id=${id}${cascade ? '&cascade=true' : ''}`;
        console.log('Making delete request to:', deleteUrl);
        deletePromise = fetch(deleteUrl, { method: 'DELETE' }).then(r => r.json());
      } else {
        console.log('Using API client delete method');
        deletePromise = api.delete(id);
      }
      
      const result = await deletePromise;
      console.log('Delete response:', result);
      
      // Check if the result has an error (API clients might return different format)
      if (result.error) {
        console.log('API returned error:', result);
        if (result.code === 'FOREIGN_KEY_CONSTRAINT') {
          console.log('Foreign key constraint detected, showing cascade dialog');
          // Show cascade delete confirmation dialog
          setShowCascadeDeleteModal({
            entity,
            id,
            name,
            classCount: result.counts?.classes || 0,
            sectionCount: result.counts?.sections || 0,
            feeStructureCount: result.counts?.feeStructures || 0,
          });
          return; // Exit early - don't show any toast message
        } else {
          showToast({ type: 'error', title: 'Failed to delete', message: result.error || 'Unknown error' });
          return;
        }
      }
      
      console.log('Delete successful, showing success toast');
      await fetchAll();
      showToast({ type: 'success', title: 'Deleted successfully' });
    } catch (e: any) {
      console.log('Delete error:', e);
      showToast({ type: 'error', title: 'Failed to delete', message: e.message });
    }
  };

  // ─── Style helpers ───────────────────────────────────────────────────────────
  const card = getCardClass(isDark);
  const btnPrimary = getBtnPrimaryClass(isDark);
  const btnSecondary = getBtnSecondaryClass(isDark);
  const btnDanger = getBtnDangerClass(isDark);
  const input = getInputClass(isDark);
  const label = getLabelClass(isDark);
  const heading = getHeadingClass(isDark);
  const subtext = getSubtextClass(isDark);

  // ─── Tab content renderer ─────────────────────────────────────────────────────
  const renderTabContent = () => {
    const commonProps = {
      isDark,
      canManageSettings,
      academicYears,
      activeAY,
      boards,
      mediums,
      classes,
      sections,
      timings,
      feeStructures,
      settingsMap,
      openCreate,
      openEdit,
      handleDelete,
      fetchAll,
      saveBatchSettings,
      getSetting,
      saving,
      card,
      heading,
      subtext,
      btnPrimary,
      btnSecondary,
      btnDanger,
      input,
      label,
      // Additional props required by specific tabs
      handleActivateAcademicYear: async (ay: AcademicYear) => {
        try {
          await academicYearsApi.activate(ay.id);
          await fetchAll();
          showToast({ type: 'success', title: 'Academic year activated successfully' });
        } catch (e: any) {
          showToast({ type: 'error', title: 'Failed to activate academic year', message: e.message });
        }
      },
      boardsApi,
      mediumsApi,
      classesApi,
      sectionsApi,
      feeStructuresApi,
      timingsApi,
      badge: getBadgeClass(isDark, true),
    };

    switch (activeTab) {
      case 'school':
        return <SchoolDetailsTab {...commonProps} />;
      case 'academic':
        return <AcademicYearsTab {...commonProps} />;
      case 'structure':
        return <StructureTab {...commonProps} />;
      case 'fees':
        return <FeeTab {...commonProps} />;
      case 'timings':
        return <TimingsTab {...commonProps} onTimingsChange={refreshTimings} />;
      case 'integrations':
        return <IntegrationsTab {...commonProps} />;
      case 'theme':
        return <ThemeTab {...commonProps} />;
      case 'roles':
        return <RolesTab {...commonProps} />;
      case 'users':
        return <UsersTab {...commonProps} />;
      case 'leave':
        return <LeaveTab {...commonProps} />;
      case 'app':
        return <AppSettingsTab {...commonProps} />;
      default:
        return <SchoolDetailsTab {...commonProps} />;
    }
  };

  if (!isClient) {
    return (
      <AppLayout currentPage="settings" title="Settings" theme={theme}>
        <div className="min-h-screen p-4 md:p-6">
          <div className="space-y-8 pb-8">
            {/* Tab Navigation Skeleton */}
            <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
            
            {/* Tab Content Skeleton */}
            <div className="backdrop-blur-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 rounded-3xl shadow-2xl p-6 border backdrop-blur-xl">
              <div className="space-y-4">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="settings" title="Settings" theme={theme}>
      <div className="min-h-screen p-4 md:p-6">
        <div className="space-y-8 pb-8">
          {/* Modern Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`rounded-2xl border p-1.5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm overflow-x-auto`}
          >
            <div className="flex flex-nowrap md:flex-wrap gap-1 min-w-max md:min-w-0">
              {TABS.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-100'
                      : isDark 
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: activeTab === tab.id ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Tab Content Skeleton */}
              <div className="backdrop-blur-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 rounded-3xl shadow-2xl p-6 border backdrop-blur-xl">
                <div className="space-y-6">
                  {/* Header Skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                  </div>
                  
                  {/* Content Skeleton */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Additional Content Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="p-4 bg-gray-200/20 dark:bg-gray-700/20 rounded-2xl animate-pulse">
                        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-3" />
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab Content */}
          {!loading && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          )}
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 p-4 rounded-xl border shadow-lg ${
              isDark 
                ? 'bg-red-900/90 border-red-700/50 text-red-200' 
                : 'bg-red-100 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold">Error</h4>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className={`p-1 rounded-lg ${isDark ? 'hover:bg-red-800' : 'hover:bg-red-200'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {/* Enhanced CRUD Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
              onClick={() => setShowModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className={`w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
              >
                <EntityModal
                  isOpen={showModal}
                  onClose={closeModal}
                  type={modalEntity}
                  data={editingItem || formData}
                  onSave={async (data: any) => {
                    try {
                      if (editingItem) {
                        // Update existing entity
                        let api;
                        switch (modalEntity) {
                          case 'academicYear': api = academicYearsApi; break;
                          case 'board': api = boardsApi; break;
                          case 'medium': api = mediumsApi; break;
                          case 'class': api = classesApi; break;
                          case 'section': api = sectionsApi; break;
                          case 'timing': api = timingsApi; break;
                          case 'feeStructure': api = feeStructuresApi; break;
                          default: return;
                        }
                        await api.update(editingItem.id, data);
                        showToast({ type: 'success', title: 'Updated successfully' });
                      } else {
                        // Create new entity
                        let api;
                        switch (modalEntity) {
                          case 'academicYear': api = academicYearsApi; break;
                          case 'board': api = boardsApi; break;
                          case 'medium': api = mediumsApi; break;
                          case 'class': api = classesApi; break;
                          case 'section': api = sectionsApi; break;
                          case 'timing': api = timingsApi; break;
                          case 'feeStructure': api = feeStructuresApi; break;
                          default: return;
                        }
                        await api.create(data);
                        showToast({ type: 'success', title: 'Created successfully' });
                      }
                      await fetchAll();
                      closeModal();
                    } catch (e: any) {
                      showToast({ type: 'error', title: 'Failed to save', message: e.message });
                    }
                  }}
                  isDark={isDark}
                  academicYears={academicYears}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Cascade Delete Modal */}
        <AnimatePresence>
          {showCascadeDeleteModal && (
            <CascadeDeleteDialog
              isOpen={true}
              onClose={() => setShowCascadeDeleteModal(null)}
              entity={showCascadeDeleteModal.entity || ''}
              name={showCascadeDeleteModal.name || ''}
              classCount={showCascadeDeleteModal.classCount || 0}
              sectionCount={showCascadeDeleteModal.sectionCount || 0}
              feeStructureCount={showCascadeDeleteModal.feeStructureCount || 0}
              onConfirm={async () => {
                if (showCascadeDeleteModal.id) {
                  await handleDelete(
                    showCascadeDeleteModal.entity || '',
                    showCascadeDeleteModal.id,
                    showCascadeDeleteModal.name || '',
                    true // cascade = true
                  );
                }
                setShowCascadeDeleteModal(null);
              }}
              isDark={isDark}
            />
          )}
        </AnimatePresence>

        {/* Enhanced Copy Academic Year Modal */}
        <AnimatePresence>
          {showCopyModal && previousYearForCopy && (
            <CopyAcademicYearModal
              isOpen={showCopyModal}
              onClose={() => setShowCopyModal(false)}
              onCopyWithData={async () => {
                // Handle copy logic
                await fetchAll();
                setShowCopyModal(false);
              }}
              onCreateFresh={async () => {
                // Handle fresh creation logic
                await fetchAll();
                setShowCopyModal(false);
              }}
              previousYear={previousYearForCopy}
              pendingYear={academicYears.find(ay => ay.id !== previousYearForCopy?.id)}
              isDark={isDark}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
