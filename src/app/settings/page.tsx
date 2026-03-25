'use client';

import React, { useEffect, useState } from 'react';
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

// APIs
const academicYearsApi = {
  list: () => fetch('/api/school-structure/academic-years').then(r => r.json()),
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
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('school');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Handle URL tab parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && TABS.find(tab => tab.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // ─── Data state ────────────────────────────────────────────────────────────
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [timings, setTimings] = useState<Timing[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, Record<string, string>>>({});
  const [activeAY, setActiveAY] = useState<AcademicYear | null>(null);

  // ─── Modal / form state ────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalEntity, setModalEntity] = useState('');
  const [editingItem, setEditingItem] = useState<AcademicYear | Board | Medium | Class | Section | Timing | FeeStructure | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showCascadeDeleteModal, setShowCascadeDeleteModal] = useState<{
  entity: string;
  id: string;
  name: string;
  classCount: number;
  sectionCount: number;
  feeStructureCount: number;
} | null>(null);
  
  // ─── Copy confirmation modal state ───────────────────────────────────────────
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [previousYearForCopy, setPreviousYearForCopy] = useState<AcademicYear | null>(null);

  // ─── Utility functions ───────────────────────────────────────────────────────
  const getSetting = (group: string, key: string, defaultValue: string) => {
    return settingsMap?.[group]?.[key] || defaultValue;
  };

  const saveBatchSettings = async (group: string, settings: Record<string, string>) => {
    setSaving(true);
    try {
      await settingsApi.upsertBatch({ group, settings });
      await fetchAll();
      refreshSchoolConfig();
      showToast({ type: 'success', title: 'Settings saved successfully' });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to save settings', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Data fetching ───────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        ayRes,
        boardsRes,
        mediumsRes,
        classesRes,
        sectionsRes,
        timingsRes,
        feesRes,
        settingsRes,
      ] = await Promise.all([
        academicYearsApi.list(),
        boardsApi.list(),
        mediumsApi.list(),
        classesApi.list(),
        sectionsApi.list(),
        timingsApi.list(),
        feeStructuresApi.list(),
        settingsApi.getAll(),
      ]);

      setAcademicYears(ayRes.academicYears || []);
      setBoards(boardsRes.boards || []);
      setMediums(mediumsRes.mediums || []);
      setClasses(classesRes.classes || []);
      setSections(sectionsRes.sections || []);
      setTimings(timingsRes.timings || []);
      setFeeStructures(feesRes.feeStructures || []);
      setSettingsMap(settingsRes.settings || {});
      
      const active = (ayRes.academicYears || []).find((ay: AcademicYear) => ay.isActive);
      setActiveAY(active || null);
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to load data', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchAll();
  }, []);

  // ─── Modal handlers ───────────────────────────────────────────────────────────
  const openCreate = (entity: string, initialData: any = {}) => {
    setEditingItem(null);
    
    // Add academicYearId for entities that need it (but let user select it)
    const dataWithAcademicYear = ['medium', 'class', 'section'].includes(entity) 
      ? { ...initialData, academicYearId: '' }
      : initialData;
    
    // Validate that we have at least one active academic year for entities that need it
    if (['medium', 'class', 'section'].includes(entity) && !academicYears.some((ay: any) => ay.isActive)) {
      showToast({ 
        type: 'error', 
        title: 'No Active Academic Year', 
        message: 'Please create and activate an academic year first before creating school structure entities.' 
      });
      return;
    }
    
    setFormData(dataWithAcademicYear);
    setModalEntity(entity);
    setShowModal(true);
  };

  const openEdit = (entity: string, item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalEntity(entity);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setModalEntity('');
  };

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
  const isDark = theme === 'dark';
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
        return <TimingsTab {...commonProps} />;
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
    return null;
  }

  return (
    <AppLayout currentPage="settings">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Settings
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your school configuration and settings
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>

      {/* Entity Modal */}
      <AnimatePresence>
        {showModal && (
          <EntityModal
            isOpen={showModal}
            onClose={closeModal}
            type={modalEntity}
            data={editingItem}
            academicYears={academicYears}
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
          />
        )}
      </AnimatePresence>

      {/* Cascade Delete Modal */}
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

      {/* Copy Academic Year Modal */}
      <AnimatePresence>
        {showCopyModal && previousYearForCopy && (
          <CopyAcademicYearModal
            isOpen={showCopyModal}
            onClose={() => setShowCopyModal(false)}
            sourceYear={previousYearForCopy}
            targetYears={academicYears.filter(ay => ay.id !== previousYearForCopy.id)}
            onCopy={async (targetYear: AcademicYear) => {
              // Handle copy logic
              await fetchAll();
              setShowCopyModal(false);
            }}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
