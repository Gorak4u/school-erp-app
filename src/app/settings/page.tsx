// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import {
  academicYearsApi, boardsApi, mediumsApi, classesApi, sectionsApi,
  schoolSettingsApi, schoolTimingsApi, feeStructuresApi,
} from '@/lib/apiClient';
import RolesManagement from '@/components/settings/RolesManagement';
import UsersManagement from '@/components/settings/UsersManagement';
import LeaveManagementSettings from '@/components/settings/LeaveManagementSettings';
import { usePermissions } from '@/hooks/usePermissions';

const showToast = (t: any) => { if ((window as any).toast) (window as any).toast(t); };

const LEVELS = [
  { value: 'kindergarten', label: 'Kindergarten' },
  { value: 'primary', label: 'Primary' },
  { value: 'middle', label: 'Middle' },
  { value: 'high', label: 'High' },
  { value: 'higher_secondary', label: 'Higher Secondary' },
];

const TABS = [
  { id: 'school', label: 'School Details', icon: '🏫' },
  { id: 'academic', label: 'Academic Years', icon: '📅' },
  { id: 'structure', label: 'Board / Medium / Class / Section', icon: '🏛️' },
  { id: 'fees', label: 'Fee Structure', icon: '💰' },
  { id: 'timings', label: 'School Timings', icon: '🕐' },
  { id: 'integrations', label: 'SMTP & Payments', icon: '🔌' },
  { id: 'leave', label: 'Leave Management', icon: '🏖️' },
  { id: 'app', label: 'App Settings', icon: '⚙️' },
  { id: 'roles', label: 'Custom Roles', icon: '🎭' },
  { id: 'users', label: 'Users & Access', icon: '👥' },
];

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
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [mediums, setMediums] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [timings, setTimings] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, Record<string, string>>>({});

  // ─── Modal / form state ────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalEntity, setModalEntity] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [showMediumDeleteModal, setShowMediumDeleteModal] = useState(null);
  
  // ─── Copy confirmation modal state ───────────────────────────────────────────
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [previousYearForCopy, setPreviousYearForCopy] = useState<any>(null);
  const [pendingAcademicYear, setPendingAcademicYear] = useState<any>(null);

  // ─── Student lock dialog (shown when activating a new AY) ────────────────────
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockDialogData, setLockDialogData] = useState<{ ay: any; count: number; byAY: any[] } | null>(null);
  const [lockingSaving, setLockingSaving] = useState(false);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const isDark = theme === 'dark';
  const card = `rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const row = `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;
  const btnSecondary = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'}`;
  const badge = (active: boolean) => `px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
  const heading = `text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`;
  const subtext = `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  // ─── Fetch all data ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Fetch academic years first to find the active one
      const ayRes = await academicYearsApi.list();
      const academicYearsList = ayRes.academicYears || [];
      setAcademicYears(academicYearsList);
      
      // Use the NEWEST active academic year (guard against multiple active years)
      const activeAcademicYear = [...academicYearsList]
        .filter((ay: any) => ay.isActive)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
      const activeAYId = activeAcademicYear?.id;
      
      console.log('📅 Active Academic Year:', activeAcademicYear?.name, '(ID:', activeAYId, ')');
      
      // Step 2: Fetch other entities filtered by active academic year and isActive=true
      const [bRes, mRes, cRes, secRes, tRes, sRes, fsRes] = await Promise.allSettled([
        boardsApi.list({ isActive: 'true' }), // Boards are global, just filter by active
        mediumsApi.list(activeAYId ? { academicYearId: activeAYId, isActive: 'true' } : { isActive: 'true' }),
        classesApi.list(activeAYId ? { academicYearId: activeAYId, isActive: 'true' } : { isActive: 'true' }),
        sectionsApi.list(activeAYId ? { academicYearId: activeAYId, isActive: 'true' } : { isActive: 'true' }),
        schoolTimingsApi.list(),
        schoolSettingsApi.getAll(),
        feeStructuresApi.list(activeAYId ? { academicYearId: activeAYId, isActive: 'true' } : { isActive: 'true' }),
      ]);
      
      // Log any rejected promises for debugging
      const apiNames = ['boards', 'mediums', 'classes', 'sections', 'timings', 'settings', 'feeStructures'];
      const results = [bRes, mRes, cRes, secRes, tRes, sRes, fsRes];
      
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          console.error(`❌ ${apiNames[idx]} API failed:`, res.reason);
        }
      });
      
      if (bRes.status === 'fulfilled') setBoards(bRes.value.boards || []);
      if (mRes.status === 'fulfilled') setMediums(mRes.value.mediums || []);
      if (cRes.status === 'fulfilled') setClasses(cRes.value.classes || []);
      if (secRes.status === 'fulfilled') setSections(secRes.value.sections || []);
      if (tRes.status === 'fulfilled') setTimings(tRes.value.timings || []);
      if (sRes.status === 'fulfilled') setSettingsMap(sRes.value.settings || {});
      if (fsRes.status === 'fulfilled') setFeeStructures(fsRes.value.feeStructures || []);
      
      console.log('✅ Loaded data for active AY:', {
        boards: bRes.status === 'fulfilled' ? bRes.value.boards?.length : 0,
        mediums: mRes.status === 'fulfilled' ? mRes.value.mediums?.length : 0,
        classes: cRes.status === 'fulfilled' ? cRes.value.classes?.length : 0,
        sections: secRes.status === 'fulfilled' ? secRes.value.sections?.length : 0,
        feeStructures: fsRes.status === 'fulfilled' ? fsRes.value.feeStructures?.length : 0,
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to load data', message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setIsClient(true); fetchAll(); }, [fetchAll]);

  if (!isClient) return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>Loading...</div>;

  // ─── Settings helpers ──────────────────────────────────────────────────────
  const getSetting = (group: string, key: string, fallback = '') => settingsMap[group]?.[key] ?? fallback;

  const saveBatchSettings = async (group: string, settings: Record<string, string>) => {
    setSaving(true);
    try {
      await schoolSettingsApi.upsertBatch({ group, settings });
      setSettingsMap(prev => ({ ...prev, [group]: { ...(prev[group] || {}), ...settings } }));
      showToast({ type: 'success', title: 'Settings saved' });
      refreshSchoolConfig();
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to save', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Generic CRUD ──────────────────────────────────────────────────────────
  const openCreate = (entity: string, defaults: any = {}) => {
    setEditingItem(null);
    setFormData(defaults);
    setModalEntity(entity);
    setShowModal(true);
  };

  const openEdit = (entity: string, item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalEntity(entity);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const apiMap: any = { academicYear: academicYearsApi, board: boardsApi, medium: mediumsApi, class: classesApi, section: sectionsApi, timing: schoolTimingsApi };
      const api = apiMap[modalEntity];
      
      if (editingItem) {
        await api.update({ id: editingItem.id, ...formData });
        showToast({ type: 'success', title: `${modalEntity} updated` });
      } else {
        // Special handling for academic year creation
        if (modalEntity === 'academicYear') {
          // Check if there are previous academic years (get the most recent one)
          const previousYears = academicYears
            .filter((ay: any) => ay.id !== formData.id)
            .sort((a: any, b: any) => b.year.localeCompare(a.year)); // Sort by year descending
          
          console.log('🔍 Academic Year Creation Check:', {
            totalAcademicYears: academicYears.length,
            previousYearsFound: previousYears.length,
            previousYear: previousYears[0]
          });
          
          if (previousYears.length > 0) {
            // Store data for modal and show copy confirmation modal
            console.log('✅ Showing copy modal for previous year:', previousYears[0].name);
            setPreviousYearForCopy(previousYears[0]);
            setPendingAcademicYear(formData);
            setShowCopyModal(true);
            return; // Don't close the main modal yet
          } else {
            console.log('ℹ️ No previous years found, creating fresh academic year');
            await api.create(formData);
            showToast({ type: 'success', title: 'Academic Year created' });
          }
        } else {
          await api.create(formData);
          showToast({ type: 'success', title: `${modalEntity} created` });
        }
      }
      setShowModal(false);
      fetchAll();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed', message: err.message || 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  // Function to copy data from previous academic year
  const copyDataFromPreviousYear = async (previousYearId: string, newYearId: string) => {
    try {
      console.log(`🔄 Copying data from academic year ${previousYearId} to ${newYearId}`);
      
      if (!newYearId) {
        throw new Error('newYearId is required but was not provided');
      }
      
      // 0. Skip boards - they are global entities, not year-specific
      // Boards are shared across all academic years, so no need to copy them
      console.log('🏫 Boards are global entities - skipping copy (they already exist)');
      
      // 1. First, validate there's data to copy
      console.log('� Validating data availability in previous academic year...');
      
      let mediumsResponse, classesResponse, sectionsResponse, feeStructuresResponse;
      
      try {
        [mediumsResponse, classesResponse, sectionsResponse, feeStructuresResponse] = await Promise.all([
          mediumsApi.list({ academicYearId: previousYearId }),
          classesApi.list({ academicYearId: previousYearId }),
          sectionsApi.list({ academicYearId: previousYearId }),
          feeStructuresApi.list({ academicYearId: previousYearId })
        ]);
      } catch (error) {
        console.error('  ❌ Failed to fetch data for validation:', error);
        throw error;
      }
      
      const mediums = mediumsResponse.mediums || [];
      const classes = classesResponse.classes || [];
      const sections = sectionsResponse.sections || [];
      const feeStructures = feeStructuresResponse.feeStructures || [];
      
      console.log(`  📊 Data validation results:`);
      console.log(`    - Mediums: ${mediums.length}`);
      console.log(`    - Classes: ${classes.length}`);
      console.log(`    - Sections: ${sections.length}`);
      console.log(`    - Fee Structures: ${feeStructures.length}`);
      
      const totalEntities = mediums.length + classes.length + sections.length + feeStructures.length;
      
      if (totalEntities === 0) {
        console.warn('  ⚠️ No data found to copy from previous academic year');
        throw new Error(`No data found to copy from previous academic year. The previous year has 0 mediums, 0 classes, 0 sections, and 0 fee structures.`);
      }
      
      console.log(`  ✅ Found ${totalEntities} entities to copy - proceeding with copy process`);
      
      // 2. Copy mediums
      console.log('📖 Copying mediums...');
      console.log('  📋 Mediums API response:', mediumsResponse);
      
      const mediumMapping: { [key: string]: string } = {};
      
      // Create a safe year suffix (use last 4 chars or fallback to timestamp)
      const yearSuffix = newYearId.slice(-4) || Date.now().toString().slice(-4);
      console.log(`  🏷️ Using year suffix: ${yearSuffix}`);
      
      for (const medium of mediums) {
        try {
          console.log(`  📝 Creating medium: ${medium.name} -> ${medium.code}_${yearSuffix}`);
          const mediumResponse = await mediumsApi.create({
            code: `${medium.code}_${yearSuffix}`, // Add year suffix to ensure uniqueness
            name: medium.name,
            description: medium.description,
            isActive: medium.isActive,
            academicYearId: newYearId
          });
          
          // Extract medium from response object
          const newMedium = mediumResponse.medium || mediumResponse;
          mediumMapping[medium.id] = newMedium.id;
          console.log(`  ✅ Copied medium: ${medium.name} (ID: ${newMedium.id})`);
          
          if (!newMedium.id) {
            console.error(`  ❌ Failed to get new medium ID for ${medium.name}:`, mediumResponse);
          }
        } catch (error) {
          console.error(`  ❌ Failed to copy medium ${medium.name}:`, error);
          throw error;
        }
      }

      // 2. Copy classes
      console.log('📚 Copying classes...');
      console.log(`  📊 Found ${classes.length} classes to copy from previous year`);
      console.log('  📋 Medium mapping available:', mediumMapping);
      const classMapping: { [key: string]: string } = {};
      
      if (classes.length === 0) {
        console.warn('  ⚠️ No classes found in previous academic year to copy');
      }
      
      for (const cls of classes) {
        try {
          console.log(`  📝 Processing class: ${cls.name} (ID: ${cls.id}, mediumId: ${cls.mediumId})`);
          
          // Find corresponding medium in new year
          const newMediumId = mediumMapping[cls.mediumId];
          console.log(`  🔗 Original mediumId: ${cls.mediumId} -> New mediumId: ${newMediumId}`);
          
          if (!newMediumId) {
            console.warn(`  ⚠️ Skipping class ${cls.name} - no corresponding medium found (original mediumId: ${cls.mediumId})`);
            console.warn(`  🔍 Available medium mappings:`, Object.keys(mediumMapping));
            continue; // Skip this class if no medium mapping exists
          }
          
          const classData = {
            code: `${cls.code}_${yearSuffix}`, // Add year suffix to ensure uniqueness
            name: cls.name,
            level: cls.level,
            isActive: cls.isActive,
            academicYearId: newYearId,
            mediumId: newMediumId // Only set if we have a valid mapping
          };
          
          console.log(`  📝 Creating class with data:`, classData);
          
          const classResponse = await classesApi.create(classData);
          
          // Extract class from response object
          const newClass = classResponse.class || classResponse;
          classMapping[cls.id] = newClass.id;
          console.log(`  ✅ Copied class: ${cls.name} (ID: ${newClass.id})`);
          
          if (!newClass.id) {
            console.error(`  ❌ Failed to get new class ID for ${cls.name}:`, classResponse);
          }
        } catch (error) {
          console.error(`  ❌ Failed to copy class ${cls.name}:`, error);
          // Continue with other classes instead of throwing
          console.warn(`  ⚠️ Continuing with remaining classes...`);
        }
      }
      
      console.log(`  📊 Class mapping result:`, classMapping);
      console.log(`  📊 Successfully copied ${Object.keys(classMapping).length} classes`);

      // 3. Copy sections
      console.log('📝 Copying sections...');
      console.log(`  📊 Found ${sections.length} sections to copy`);
      
      for (const section of sections) {
        try {
          // Find corresponding class in new year
          const newClassId = classMapping[section.classId];
          console.log(`  📝 Creating section: ${section.name} -> ${section.code}_${yearSuffix}`);
          console.log(`  🔗 Original classId: ${section.classId} -> New classId: ${newClassId}`);
          
          if (!newClassId) {
            console.warn(`  ⚠️ Skipping section ${section.name} - no corresponding class found (original classId: ${section.classId})`);
            continue; // Skip this section if no class mapping exists
          }
          
          const sectionResponse = await sectionsApi.create({
            code: `${section.code}_${yearSuffix}`, // Add year suffix to ensure uniqueness
            name: section.name,
            capacity: section.capacity,
            roomNumber: section.roomNumber,
            isActive: section.isActive,
            classId: newClassId, // Only set if we have a valid mapping
            academicYearId: newYearId
          });
          
          // Extract section from response object
          const newSection = sectionResponse.section || sectionResponse;
          console.log(`  ✅ Copied section: ${section.name} (ID: ${newSection.id})`);
          
          if (!newSection.id) {
            console.error(`  ❌ Failed to get new section ID for ${section.name}:`, sectionResponse);
          }
        } catch (error) {
          console.error(`  ❌ Failed to copy section ${section.name}:`, error);
          throw error;
        }
      }

      // 4. Copy fee structures
      console.log('💰 Copying fee structures...');
      console.log(`  📊 Found ${feeStructures.length} fee structures to copy`);
      
      for (const fee of feeStructures) {
        try {
          // Find corresponding entities in new year
          const newMediumId = fee.mediumId ? mediumMapping[fee.mediumId] : undefined;
          const newClassId = fee.classId ? classMapping[fee.classId] : undefined;
          console.log(`  📝 Creating fee structure: ${fee.name}`);
          
          const newFee = await feeStructuresApi.create({
            name: fee.name,
            category: fee.category,
            amount: fee.amount,
            frequency: fee.frequency,
            dueDate: fee.dueDate,
            lateFee: fee.lateFee,
            description: fee.description,
            applicableCategories: fee.applicableCategories,
            isActive: fee.isActive,
            academicYearId: newYearId,
            boardId: fee.boardId,
            mediumId: newMediumId,
            classId: newClassId
          });
          console.log(`  ✅ Copied fee structure: ${fee.name} (ID: ${newFee.id})`);
        } catch (error) {
          console.error(`  ❌ Failed to copy fee structure ${fee.name}:`, error);
          throw error;
        }
      }

      // 5. Mark old academic year entities as inactive (optional - based on business logic)
      console.log('🔄 Marking previous year entities as inactive...');
      
      // Mark old mediums as inactive
      for (const medium of mediums) {
        await mediumsApi.update({
          ...medium,
          isActive: false
        });
        console.log(`  ✅ Marked medium as inactive: ${medium.name}`);
      }
      
      // Mark old classes as inactive
      console.log(`  🔄 Marking ${classes.length} old classes as inactive...`);
      for (const cls of classes) {
        try {
          console.log(`  🔄 Marking class inactive: ${cls.name} (ID: ${cls.id})`);
          const updateData = {
            ...cls,
            isActive: false
          };
          console.log(`  📝 Update data:`, updateData);
          
          await classesApi.update(updateData);
          console.log(`  ✅ Marked class as inactive: ${cls.name}`);
        } catch (error) {
          console.error(`  ❌ Failed to mark class ${cls.name} as inactive:`, error);
          // Continue with other classes
        }
      }
      
      // Mark old sections as inactive
      for (const section of sections) {
        await sectionsApi.update({
          ...section,
          isActive: false
        });
        console.log(`  ✅ Marked section as inactive: ${section.name}`);
      }
      
      // Mark old fee structures as inactive
      for (const fee of feeStructures) {
        await feeStructuresApi.update(fee.id, {
          ...fee,
          isActive: false
        });
        console.log(`  ✅ Marked fee structure as inactive: ${fee.name}`);
      }

      console.log('🎉 Copy process completed successfully!');
      console.log(`✅ Created new entities for ${newYearId}`);
      console.log(`✅ Marked old entities from ${previousYearId} as inactive`);
      
      // Refresh all data to show newly created entities
      console.log('🔄 Refreshing UI data...');
      await fetchAll();
      console.log('✅ UI data refreshed successfully');
      
    } catch (error) {
      console.error('Failed to copy data from previous year:', error);
      throw error;
    }
  };

  // ─── Copy modal handlers ─────────────────────────────────────────────────────
  const handleCopyWithPreviousYear = async () => {
    try {
      setSaving(true);
      
      // Create academic year first
      const response = await academicYearsApi.create(pendingAcademicYear);
      
      console.log('🔍 Academic Year API Response:', response);
      
      // Extract academicYear from the response object
      const newAcademicYear = response.academicYear || response;
      
      if (!newAcademicYear?.id) {
        console.error('❌ Academic Year response structure:', response);
        throw new Error('Failed to get new academic year ID from response');
      }
      
      console.log('✅ Extracted academic year:', newAcademicYear);
      
      // Then copy data from previous year
      await copyDataFromPreviousYear(previousYearForCopy.id, newAcademicYear.id);
      
      showToast({ 
        type: 'success', 
        title: 'Academic Year Created', 
        message: 'Successfully created and copied data from previous year' 
      });
      
      // Reset modal state
      setShowCopyModal(false);
      setPreviousYearForCopy(null);
      setPendingAcademicYear(null);
      setShowModal(false);
      
      fetchAll();
    } catch (error: any) {
      showToast({ type: 'error', title: 'Failed', message: error.message || 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFreshYear = async () => {
    try {
      setSaving(true);
      
      // Create academic year without copying
      await academicYearsApi.create(pendingAcademicYear);
      
      showToast({ type: 'success', title: 'Academic Year created' });
      
      // Reset modal state
      setShowCopyModal(false);
      setPreviousYearForCopy(null);
      setPendingAcademicYear(null);
      setShowModal(false);
      
      fetchAll();
    } catch (error: any) {
      showToast({ type: 'error', title: 'Failed', message: error.message || 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCopy = () => {
    setShowCopyModal(false);
    setPreviousYearForCopy(null);
    setPendingAcademicYear(null);
  };

  const handleDelete = async (entity: string, id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const apiMap: any = { academicYear: academicYearsApi, board: boardsApi, medium: mediumsApi, class: classesApi, section: sectionsApi, timing: schoolTimingsApi };
      await apiMap[entity].delete(id);
      showToast({ type: 'success', title: `${name} deleted` });
      fetchAll();
      refreshSchoolConfig();
    } catch (e: any) {
      // Handle foreign key constraint with cascading deletion option
      if (e.message?.includes('FOREIGN_KEY_CONSTRAINT') && entity === 'medium') {
        const affectedClasses = classes.filter((c: any) => c.mediumId === id);
        const affectedSections = affectedClasses.reduce((sum: number, cls: any) => sum + (cls.sections?.length || 0), 0);
        const affectedFeeStructures = feeStructures.filter((fs: any) => fs.mediumId === id).length;
        
        if (affectedClasses.length > 0 || affectedFeeStructures > 0) {
          setShowMediumDeleteModal({ 
            mediumId: id, 
            mediumName: name, 
            affectedClasses, 
            affectedSections,
            affectedFeeStructures,
            deleting: false
          });
          return;
        }
      }
      showToast({ type: 'error', title: 'Delete failed', message: e.message });
    }
  };

  // ─── Activate Academic Year with auto-lock dialog ──────────────────────────
  const handleActivateAcademicYear = async (ay: any) => {
    try {
      // 1. Preview how many students would need locking
      const res = await fetch('/api/students/bulk-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview' }),
      });
      const data = await res.json();

      // 2. Activate the AY first
      await academicYearsApi.update({ id: ay.id, isActive: true });
      fetchAll();
      refreshSchoolConfig();
      showToast({ type: 'success', title: `${ay.name} is now the active academic year` });

      // 3. If there are students to lock, show the lock dialog
      if (data.count > 0) {
        setLockDialogData({ ay, count: data.count, byAY: data.byAcademicYear || [] });
        setShowLockDialog(true);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to activate academic year', message: err.message });
    }
  };

  const handleConfirmLock = async (doLock: boolean) => {
    if (doLock) {
      setLockingSaving(true);
      try {
        const res = await fetch('/api/students/bulk-lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'lock' }),
        });
        const data = await res.json();
        showToast({ type: 'success', title: `${data.count} student(s) locked`, message: 'They must be promoted before any edits.' });
      } catch (err: any) {
        showToast({ type: 'error', title: 'Lock failed', message: err.message });
      } finally {
        setLockingSaving(false);
      }
    }
    setShowLockDialog(false);
    setLockDialogData(null);
  };

  // ─── Active academic year (newest active year wins) ────────────────────────
  const activeAY = [...academicYears]
    .filter((a: any) => a.isActive)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

  // ─── School Details Tab ────────────────────────────────────────────────────
  const SchoolDetailsTab = () => {
    const [local, setLocal] = useState({
      name: getSetting('school_details', 'name', ''),
      address: getSetting('school_details', 'address', ''),
      city: getSetting('school_details', 'city', ''),
      state: getSetting('school_details', 'state', ''),
      pincode: getSetting('school_details', 'pincode', ''),
      phone: getSetting('school_details', 'phone', ''),
      email: getSetting('school_details', 'email', ''),
      website: getSetting('school_details', 'website', ''),
      principal: getSetting('school_details', 'principal', ''),
      affiliation_no: getSetting('school_details', 'affiliation_no', ''),
      established: getSetting('school_details', 'established', ''),
      logo_url: getSetting('school_details', 'logo_url', ''),
    });
    const [uploading, setUploading] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'school_logo');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLocal({ ...local, logo_url: data.url });
        showToast({ type: 'success', title: 'Logo uploaded' });
      } catch (err: any) {
        showToast({ type: 'error', title: 'Upload failed', message: err.message });
      } finally {
        setUploading(false);
      }
    };

    const textFields = Object.entries(local).filter(([key]) => key !== 'logo_url');

    return (
      <div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-8 shadow-lg`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>School Details</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configure your school's basic information</p>
            </div>
          </div>
          <button 
            className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 ${
              isDark 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
            }`}
            disabled={saving} 
            onClick={() => saveBatchSettings('school_details', local)}
          >
            <span className="flex items-center gap-2">
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Details
                </>
              )}
            </span>
          </button>
        </div>

        {/* Modern Logo Upload Section */}
        <div className={`mb-8 p-6 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
          <div className="flex items-center gap-6">
            <div className={`w-32 h-32 rounded-2xl border-4 flex items-center justify-center overflow-hidden ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} shadow-lg`}>
              {local.logo_url ? (
                <img src={local.logo_url} alt="School Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span className={`text-5xl ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>🏫</span>
              )}
            </div>
            <div className="flex-1">
              <label className={`block text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>School Logo</label>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Upload your school logo for branding</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mb-4`}>
                Supported formats: PNG, JPG, WEBP, SVG • Maximum size: 2MB<br />
                This logo will appear on receipts, reports, and official documents
              </p>
              <div className="flex items-center gap-3">
                <label className={`px-5 py-2.5 rounded-xl font-medium cursor-pointer transition-all transform hover:scale-105 ${
                  isDark 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                </label>
                {local.logo_url && (
                  <button 
                    className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
                      isDark 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    onClick={() => setLocal({ ...local, logo_url: '' })}
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {textFields.map(([key, val]) => (
            <div key={key}>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </label>
              <input 
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                value={val} 
                onChange={e => setLocal({ ...local, [key]: e.target.value })} 
                placeholder={`Enter ${key.replace(/_/g, ' ').toLowerCase()}`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Academic Years Tab ────────────────────────────────────────────────────
  const AcademicYearsTab = () => (
    <div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-8 shadow-lg`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Academic Years</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage academic year periods and activations</p>
          </div>
        </div>
        <button 
          className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
            isDark 
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg' 
              : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg'
          }`}
          onClick={() => openCreate('academicYear', { year: '', name: '', startDate: '', endDate: '', isActive: false })}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Academic Year
          </span>
        </button>
      </div>
      
      {academicYears.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
          <svg className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className={`mt-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No academic years configured yet</p>
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Add your first academic year to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {academicYears.map((ay: any) => (
            <div 
              key={ay.id} 
              className={`p-5 rounded-xl border transition-all ${
                ay.isActive 
                  ? isDark 
                    ? 'bg-green-900/20 border-green-700 shadow-md' 
                    : 'bg-green-50 border-green-300 shadow-sm'
                  : isDark 
                    ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    ay.isActive 
                      ? isDark ? 'bg-green-600/20' : 'bg-green-100' 
                      : isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-6 h-6 ${ay.isActive ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{ay.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ay.isActive 
                          ? 'bg-green-500 text-white' 
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {ay.isActive ? '✓ Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-medium">{ay.year}</span> • {ay.startDate} to {ay.endDate}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!ay.isActive && (
                    <button
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                        isDark 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                      onClick={() => handleActivateAcademicYear(ay)}
                      title="Set as active academic year"
                    >
                      <span className="flex items-center gap-1.5">
                        ⚡ Activate
                      </span>
                    </button>
                  )}
                  <button 
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    onClick={() => openEdit('academicYear', ay)}
                  >
                    Edit
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    onClick={() => handleDelete('academicYear', ay.id, ay.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Structure Tab (Board / Medium / Class / Section) ─────────────────────
  const StructureTab = () => {
    const [filterAY, setFilterAY] = useState(activeAY?.id || '');
    const [newRows, setNewRows] = useState([]);
    const gridMediums = filterAY ? mediums.filter((m) => m.academicYearId === filterAY) : mediums;
    const gridClasses = filterAY ? classes.filter((c) => c.academicYearId === filterAY) : classes;
    const uniqueClassNames = [...new Set(gridClasses.map((c) => c.name))].sort();

    const autoCode = (name, medCode) => {
      const parts = name.trim().split(/\s+/);
      const abbr = parts.map((p) => p[0] || '').join('').toUpperCase();
      return (`${abbr}${(medCode || '').replace(/[^A-Z0-9]/gi, '')}`).toUpperCase().slice(0, 8) || 'CLS';
    };
    const autoLevel = (name) => {
      const n = name.toLowerCase();
      if (/kg|kinder|nursery|lkg|ukg|pp/.test(n)) return 'kindergarten';
      if (/\b[1-5]\b|1st|2nd|3rd|4th|5th/.test(n)) return 'primary';
      if (/\b[6-8]\b|6th|7th|8th/.test(n)) return 'middle';
      if (/\b(9|10)\b|9th|10th/.test(n)) return 'high';
      if (/\b(11|12)\b|11th|12th|plus/.test(n)) return 'higher_secondary';
      return 'primary';
    };
    const addNewRow = () => setNewRows((prev) => [...prev, { id: Date.now().toString(), name: '', selectedMediums: new Set(), saving: false }]);
    const saveRow = async (rowId) => {
      const nr = newRows.find((r) => r.id === rowId);
      if (!nr || !nr.name.trim() || nr.selectedMediums.size === 0) return;
      setNewRows((prev) => prev.map((r) => r.id === rowId ? { ...r, saving: true } : r));
      try {
        await Promise.all([...nr.selectedMediums].map((mediumId) => {
          const med = gridMediums.find((m) => m.id === mediumId);
          return classesApi.create({ name: nr.name.trim(), code: autoCode(nr.name, med?.code || ''), level: autoLevel(nr.name), mediumId, academicYearId: filterAY || activeAY?.id || '', isActive: true });
        }));
        await fetchAll();
        setNewRows((prev) => prev.filter((r) => r.id !== rowId));
      } catch { setNewRows((prev) => prev.map((r) => r.id === rowId ? { ...r, saving: false } : r)); }
    };
    return (
    <div className="space-y-6">
      {/* Boards */}
      <div className={card}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={heading}>Education Boards</h3>
          <button className={btnPrimary} disabled={!canManageSettings} onClick={() => openCreate('board', { code: '', name: '', description: '', isActive: true })}>+ Add Board</button>
        </div>
        {boards.length === 0 && <p className={subtext}>No boards. Add CBSE, ICSE, State Board, etc.</p>}
        <div className="space-y-2">
          {boards.map((b: any) => (
            <div key={b.id} className={`${row} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>{b.code}</span>
                <span className={badge(b.isActive)}>{b.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex gap-2">
                <button className={btnSecondary} disabled={!canManageSettings} onClick={() => openEdit('board', b)}>Edit</button>
                <button className={btnDanger} disabled={!canManageSettings} onClick={() => handleDelete('board', b.id, b.name)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mediums */}
      <div className={card}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={heading}>Language Mediums</h3>
          <button className={btnPrimary} disabled={!canManageSettings} onClick={() => openCreate('medium', { code: '', name: '', description: '', isActive: true, academicYearId: activeAY?.id || '' })}>+ Add Medium</button>
        </div>
        {mediums.length === 0 && <p className={subtext}>No mediums. Add English, Hindi, Kannada, etc.</p>}
        <div className="space-y-2">
          {mediums.map((m: any) => (
            <div key={m.id} className={`${row} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>{m.code}</span>
                <span className={badge(m.isActive)}>{m.isActive ? 'Active' : 'Inactive'}</span>
                <span className={subtext}>{m.classes?.length || 0} classes</span>
              </div>
              <div className="flex gap-2">
                <button className={btnSecondary} disabled={!canManageSettings} onClick={() => openEdit('medium', m)}>Edit</button>
                <button className={btnDanger} disabled={!canManageSettings} onClick={() => handleDelete('medium', m.id, m.name)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classes — Inline Excel Grid */}
      <div className={card}>
        <div className="flex flex-wrap justify-between items-center mb-3 gap-3">
          <h3 className={heading}>Classes</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Academic Year:</span>
            <select
              className={`px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              value={filterAY} onChange={e => setFilterAY(e.target.value)}
            >
              <option value="">All Years</option>
              {academicYears.map((ay) => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
            </select>
            {activeAY && filterAY === activeAY.id && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-gray-900">Active AY</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-xs border-collapse ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr>
                <th className={`px-3 py-1.5 text-left font-semibold border min-w-[120px] ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>
                  Class
                </th>
                {gridMediums.map((m) => (
                  <th key={m.id} className={`px-2 py-1.5 text-center font-semibold border w-24 ${isDark ? 'border-gray-500 bg-gray-700 text-blue-300' : 'border-gray-400 bg-blue-100 text-blue-800'}`}>
                    {m.name}
                  </th>
                ))}
                {gridMediums.length === 0 && (
                  <th className={`px-2 py-1.5 text-center border ${isDark ? 'border-gray-500 bg-gray-700 text-gray-500' : 'border-gray-400 bg-gray-100 text-gray-400'}`}>
                    ← Add mediums first
                  </th>
                )}
                <th className={`px-2 py-1.5 text-center border w-14 ${isDark ? 'border-gray-500 bg-gray-700' : 'border-gray-400 bg-gray-200'}`} />
              </tr>
            </thead>
            <tbody>
              {/* Existing class rows */}
              {uniqueClassNames.map((className) => (
                <tr key={className} className={`${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50'}`}>
                  <td className={`px-3 py-1 border font-medium ${isDark ? 'border-gray-600 bg-gray-800/40 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-800'}`}>
                    {className}
                  </td>
                  {gridMediums.map((m) => {
                    const entry = gridClasses.find((c) => c.name === className && c.mediumId === m.id);
                    return (
                      <td key={m.id} className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                        {entry ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => openEdit('class', entry)} title="Click to edit" className={`text-green-500 font-bold text-sm hover:text-blue-500 transition-colors`}>✓</button>
                            <button onClick={() => handleDelete('class', entry.id, entry.name)} title="Delete" className="text-red-400 hover:text-red-500 text-xs leading-none">✕</button>
                          </div>
                        ) : (
                          <button
                            disabled={!canManageSettings}
                            onClick={() => openCreate('class', { code: '', name: className, level: 'primary', mediumId: m.id, academicYearId: filterAY || activeAY?.id || '', isActive: true })}
                            title={`Add ${className} for ${m.name}`}
                            className={`text-xs px-1 py-0.5 rounded border border-dashed transition-all disabled:opacity-30 ${isDark ? 'border-gray-600 text-gray-600 hover:border-blue-500 hover:text-blue-400' : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500'}`}
                          >+</button>
                        )}
                      </td>
                    );
                  })}
                  <td className={`border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
                </tr>
              ))}

              {/* New inline rows */}
              {newRows.map((nr) => (
                <tr key={nr.id} className={isDark ? 'bg-blue-900/15' : 'bg-blue-50/80'}>
                  <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                    <input
                      autoFocus
                      value={nr.name}
                      onChange={e => setNewRows(prev => prev.map(r => r.id === nr.id ? { ...r, name: e.target.value } : r))}
                      onKeyDown={e => { if (e.key === 'Enter') saveRow(nr.id); if (e.key === 'Escape') setNewRows(prev => prev.filter(r => r.id !== nr.id)); }}
                      placeholder="e.g. Class 1"
                      className={`w-full px-2 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                    />
                  </td>
                  {gridMediums.map((m) => (
                    <td key={m.id} className={`px-1 py-1 border text-center ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                      <input
                        type="checkbox"
                        checked={nr.selectedMediums.has(m.id)}
                        onChange={e => setNewRows(prev => prev.map(r => {
                          if (r.id !== nr.id) return r;
                          const s = new Set(r.selectedMediums);
                          e.target.checked ? s.add(m.id) : s.delete(m.id);
                          return { ...r, selectedMediums: s };
                        }))}
                        className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-500"
                      />
                    </td>
                  ))}
                  <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        disabled={!nr.name.trim() || nr.selectedMediums.size === 0 || nr.saving}
                        onClick={() => saveRow(nr.id)}
                        title="Save (Enter)"
                        className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-40 transition-all"
                      >{nr.saving ? '…' : '✓'}</button>
                      <button
                        onClick={() => setNewRows(prev => prev.filter(r => r.id !== nr.id))}
                        title="Cancel (Esc)"
                        className="w-5 h-5 flex items-center justify-center rounded bg-gray-400 hover:bg-red-400 text-white text-xs font-bold transition-all"
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Add row footer */}
              <tr>
                <td colSpan={gridMediums.length + 2} className={`px-2 py-1.5 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  <button
                    disabled={!canManageSettings}
                    onClick={addNewRow}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-40 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-blue-500 text-white font-bold text-sm leading-none">+</span>
                    Add class
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sections */}
      <div className={card}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={heading}>Sections</h3>
          <button className={btnPrimary} disabled={!canManageSettings} onClick={() => openCreate('section', { code: '', name: '', classId: '', capacity: 40, roomNumber: '', isActive: true })}>+ Add Section</button>
        </div>
        {sections.length === 0 && <p className={subtext}>No sections.</p>}
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead><tr className={`border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <th className="text-left py-2 px-3">Class</th><th className="text-left py-2 px-3">Section</th><th className="text-left py-2 px-3">Code</th><th className="text-left py-2 px-3">Capacity</th><th className="text-left py-2 px-3">Room</th><th className="text-left py-2 px-3">Actions</th>
            </tr></thead>
            <tbody>
              {sections.map((s: any) => (
                <tr key={s.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-2 px-3">{s.class?.name || '—'}</td>
                  <td className="py-2 px-3">{s.name}</td>
                  <td className="py-2 px-3">{s.code}</td>
                  <td className="py-2 px-3">{s.capacity}</td>
                  <td className="py-2 px-3">{s.roomNumber || '—'}</td>
                  <td className="py-2 px-3 flex gap-1">
                    <button className={btnSecondary} disabled={!canManageSettings} onClick={() => openEdit('section', s)}>Edit</button>
                    <button className={btnDanger} disabled={!canManageSettings} onClick={() => handleDelete('section', s.id, s.name)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  // ─── Fee Structure Tab ─────────────────────────────────────────────────────
  const FeeTab = () => {
    const [filterAY, setFilterAY] = useState(activeAY?.id || '');
    const [filterBoard, setFilterBoard] = useState('');
    const [filterMedium, setFilterMedium] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [editingFee, setEditingFee] = useState<any>(null);
    const [feeForm, setFeeForm] = useState<any>({});
    // Dynamic mediums/classes loaded based on the selected academicYearId in the form
    const [modalMediums, setModalMediums] = useState<any[]>(mediums);
    const [modalClasses, setModalClasses] = useState<any[]>(classes);
    const [modalLoading, setModalLoading] = useState(false);

    // Reload mediums and classes whenever the selected academicYearId changes
    useEffect(() => {
      if (!feeForm.academicYearId) { setModalMediums([]); setModalClasses([]); return; }
      setModalLoading(true);
      Promise.all([
        mediumsApi.list({ academicYearId: feeForm.academicYearId, isActive: 'true' }),
        classesApi.list({ academicYearId: feeForm.academicYearId, isActive: 'true' }),
      ]).then(([mRes, cRes]) => {
        setModalMediums(mRes.mediums || []);
        setModalClasses(cRes.classes || []);
      }).catch(() => {
        setModalMediums([]);
        setModalClasses([]);
      }).finally(() => setModalLoading(false));
    }, [feeForm.academicYearId]);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneSource, setCloneSource] = useState('');
    const [cloneTarget, setCloneTarget] = useState('');
    const [globalConfig, setGlobalConfig] = useState({
      late_fee_per_day: getSetting('fee_config', 'late_fee_per_day', '0'),
      grace_period_days: getSetting('fee_config', 'grace_period_days', '7'),
      receipt_prefix: getSetting('fee_config', 'receipt_prefix', 'REC'),
    });

    const filteredFS = feeStructures.filter((fs: any) => {
      if (filterAY && fs.academicYearId !== filterAY) return false;
      if (filterBoard && fs.boardId !== filterBoard) return false;
      if (filterMedium && fs.mediumId !== filterMedium) return false;
      if (filterClass && fs.classId !== filterClass) return false;
      return true;
    });

    const filteredClasses = filterMedium ? classes.filter((c: any) => c.mediumId === filterMedium) : classes;

    // ── Excel Grid state & helpers ──────────────────────────────────────────
    const [newFeeRows, setNewFeeRows] = useState([]);
    const [editingCell, setEditingCell] = useState(null);
    const [addingCell, setAddingCell] = useState(null);

    const saveAddingCell = async (feeName, cls) => {
      if (!addingCell?.amount) { setAddingCell(null); return; }
      const first = feeStructures.find(fs => fs.name === feeName && (!filterAY || fs.academicYearId === filterAY));
      try {
        await feeStructuresApi.create({
          name: feeName, category: first?.category || 'tuition',
          amount: parseFloat(addingCell.amount) || 0,
          frequency: first?.frequency || 'monthly', dueDate: first?.dueDate || 1,
          lateFee: first?.lateFee || 0, applicableCategories: first?.applicableCategories || 'all',
          isActive: true, academicYearId: filterAY || activeAY?.id || '',
          mediumId: cls.mediumId, classId: cls.id,
        });
        await fetchAll();
      } catch { showToast({ type: 'error', title: 'Add failed' }); }
      setAddingCell(null);
    };

    const gridClsForFee = classes
      .filter(c => (!filterAY || c.academicYearId === filterAY) && (!filterMedium || c.mediumId === filterMedium))
      .sort((a, b) => {
        const medA = mediums.find(m => m.id === a.mediumId)?.name || '';
        const medB = mediums.find(m => m.id === b.mediumId)?.name || '';
        if (medA !== medB) return medA.localeCompare(medB);
        return a.name.localeCompare(b.name);
      });

    const mediumGroups = gridClsForFee.reduce((acc, cls) => {
      if (!acc[cls.mediumId]) {
        const med = mediums.find(m => m.id === cls.mediumId);
        acc[cls.mediumId] = { name: med?.name || '?', classes: [] };
      }
      acc[cls.mediumId].classes.push(cls);
      return acc;
    }, {});
    const medGroupList = Object.entries(mediumGroups);

    const feeRowNames = [...new Set(
      feeStructures.filter(fs => !filterAY || fs.academicYearId === filterAY).map(fs => fs.name)
    )].sort();

    const saveFeeRow = async (rowId) => {
      const nr = newFeeRows.find(r => r.id === rowId);
      if (!nr || !nr.name.trim()) return;
      const toCreate = gridClsForFee.filter(cls => parseFloat(nr.amounts[cls.id] || '0') > 0);
      if (toCreate.length === 0) return;
      setNewFeeRows(prev => prev.map(r => r.id === rowId ? { ...r, saving: true } : r));
      try {
        await Promise.all(toCreate.map(cls => feeStructuresApi.create({
          name: nr.name.trim(), category: nr.category, amount: parseFloat(nr.amounts[cls.id]),
          frequency: nr.frequency, dueDate: nr.dueDate || 1, lateFee: 0,
          applicableCategories: 'all', isActive: true,
          academicYearId: filterAY || activeAY?.id || '',
          mediumId: cls.mediumId, classId: cls.id,
        })));
        await fetchAll();
        setNewFeeRows(prev => prev.filter(r => r.id !== rowId));
      } catch { setNewFeeRows(prev => prev.map(r => r.id === rowId ? { ...r, saving: false } : r)); }
    };

    const saveCellEdit = async (fs) => {
      if (!editingCell || editingCell.fsId !== fs.id) return;
      try {
        await feeStructuresApi.update(fs.id, { ...fs, amount: parseFloat(editingCell.amount) || 0 });
        await fetchAll();
      } catch { showToast({ type: 'error', title: 'Update failed' }); }
      setEditingCell(null);
    };
    // ────────────────────────────────────────────────────────────────────────

    const openCreateFee = () => {
      setEditingFee(null);
      setFeeForm({
        name: '', category: 'tuition', amount: 0, frequency: 'monthly', dueDate: 1,
        lateFee: 0, description: '', applicableCategories: 'all', isActive: true,
        academicYearId: filterAY || activeAY?.id || '',
        boardId: filterBoard || '', mediumId: filterMedium || '', classId: filterClass || '',
      });
      setShowFeeModal(true);
    };

    const openEditFee = (fs: any) => {
      setEditingFee(fs);
      setFeeForm({ ...fs });
      setShowFeeModal(true);
    };

    const saveFee = async () => {
      setSaving(true);
      try {
        const payload = { ...feeForm };
        if (editingFee) {
          await feeStructuresApi.update(editingFee.id, payload);
          showToast({ type: 'success', title: 'Fee structure updated' });
        } else {
          await feeStructuresApi.create(payload);
          showToast({ type: 'success', title: 'Fee structure created' });
        }
        setShowFeeModal(false);
        fetchAll();
      } catch (e: any) {
        showToast({ type: 'error', title: 'Save failed', message: e.message });
      } finally { setSaving(false); }
    };

    const deleteFee = async (fs: any) => {
      if (!confirm(`Delete "${fs.name}"?`)) return;
      try {
        await feeStructuresApi.delete(fs.id);
        showToast({ type: 'success', title: 'Deleted' });
        fetchAll();
      } catch (e: any) { showToast({ type: 'error', title: 'Failed', message: e.message }); }
    };

    const handleClone = async () => {
      if (!cloneSource || !cloneTarget) return;
      setSaving(true);
      try {
        const res = await feeStructuresApi.clone(cloneSource, cloneTarget);
        showToast({ type: 'success', title: `${res.cloned} fee structures cloned` });
        setShowCloneModal(false);
        fetchAll();
      } catch (e: any) {
        showToast({ type: 'error', title: 'Clone failed', message: e.message });
      } finally { setSaving(false); }
    };

    const categories = [
      { value: 'tuition', label: 'Tuition' }, { value: 'transport', label: 'Transport' },
      { value: 'lab', label: 'Lab' }, { value: 'exam', label: 'Exam' },
      { value: 'hostel', label: 'Hostel' }, { value: 'activity', label: 'Activity' },
      { value: 'library', label: 'Library' }, { value: 'other', label: 'Other' },
    ];
    const frequencies = [
      { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' },
      { value: 'half_yearly', label: 'Half Yearly' }, { value: 'annually', label: 'Annually' },
      { value: 'one_time', label: 'One Time' },
    ];

    return (
      <div className="space-y-6">
        {/* Global Fee Config */}
        <div className={card}>
          <div className="flex justify-between items-center mb-4">
            <div><h3 className={heading}>Global Fee Settings</h3><p className={subtext}>Late fee, grace period, receipt prefix</p></div>
            <button className={btnPrimary} disabled={saving || !canManageSettings} onClick={() => saveBatchSettings('fee_config', globalConfig)}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(globalConfig).map(([key, val]) => (
              <div key={key}>
                <label className={label}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                <input className={input} value={val} onChange={e => setGlobalConfig({ ...globalConfig, [key]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>

        {/* Fee Structures — Multi-Level Excel Grid */}
        <div className={card}>
          {/* Toolbar */}
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div>
              <h3 className={heading}>Fee Structures</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Click ₹ amount to edit inline · + to add new fee type</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <select className={`px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={filterAY} onChange={e => setFilterAY(e.target.value)}>
                <option value="">All Years</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
              {activeAY && filterAY === activeAY.id && <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-gray-900">Active AY</span>}
              <select className={`px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={filterMedium} onChange={e => { setFilterMedium(e.target.value); setFilterClass(''); }}>
                <option value="">All Mediums</option>
                {mediums.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button className={`px-2 py-1 rounded border text-xs transition-all ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`} onClick={() => setShowCloneModal(true)}>📋 Clone</button>
              <button className={`px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`} onClick={openCreateFee} title="Full form with all fields">⚙ Detail</button>
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <table className={`text-xs border-collapse w-full ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <thead>
                {/* Level 1: Medium group headers */}
                <tr>
                  <th rowSpan={2} className={`px-3 py-1.5 text-left border font-semibold min-w-[130px] ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>Fee Name</th>
                  <th rowSpan={2} className={`px-2 py-1.5 text-center border font-semibold w-16 ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>Category</th>
                  <th rowSpan={2} className={`px-2 py-1.5 text-center border font-semibold w-16 ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>Freq</th>
                  {gridClsForFee.length === 0 && <th rowSpan={2} className={`px-3 py-1.5 text-center border ${isDark ? 'border-gray-500 bg-gray-700 text-gray-500' : 'border-gray-400 bg-gray-50 text-gray-400'}`}>← Select AY &amp; configure classes</th>}
                  {medGroupList.map(([medId, med]) => (
                    <th key={medId} colSpan={med.classes.length} className={`px-2 py-1.5 text-center border font-semibold ${isDark ? 'border-gray-500 bg-gray-700 text-blue-300' : 'border-gray-400 bg-blue-100 text-blue-800'}`}>
                      {med.name}
                    </th>
                  ))}
                  <th rowSpan={2} className={`px-1 py-1.5 text-center border w-10 ${isDark ? 'border-gray-500 bg-gray-700' : 'border-gray-400 bg-gray-200'}`} />
                </tr>
                {/* Level 2: Class name headers */}
                <tr>
                  {gridClsForFee.map(cls => (
                    <th key={cls.id} className={`px-2 py-1.5 text-center border font-medium w-20 ${isDark ? 'border-gray-500 bg-gray-800 text-gray-300' : 'border-gray-400 bg-gray-100 text-gray-600'}`}>
                      {cls.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Empty state */}
                {feeRowNames.length === 0 && newFeeRows.length === 0 && (
                  <tr>
                    <td colSpan={3 + gridClsForFee.length + 1} className={`px-3 py-6 text-center border ${isDark ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                      No fee structures yet. Click <strong>+ Add fee type</strong> below.
                    </td>
                  </tr>
                )}

                {/* Existing fee name rows */}
                {feeRowNames.map(feeName => {
                  const rowFs = feeStructures.filter(fs => fs.name === feeName && (!filterAY || fs.academicYearId === filterAY));
                  const first = rowFs[0];
                  return (
                    <tr key={feeName} className={`${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50'}`}>
                      <td className={`px-3 py-1 border font-medium ${isDark ? 'border-gray-600 bg-gray-800/30 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-800'}`}>{feeName}</td>
                      <td className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{first?.category}</span>
                      </td>
                      <td className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                        {first?.frequency?.replace('_', ' ')}
                      </td>
                      {gridClsForFee.map(cls => {
                        const fs = rowFs.find(f => f.classId === cls.id);
                        return (
                          <td key={cls.id} className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            {fs ? (
                              editingCell?.fsId === fs.id ? (
                                <input
                                  autoFocus type="number"
                                  value={editingCell.amount}
                                  onChange={e => setEditingCell({ ...editingCell, amount: e.target.value })}
                                  onBlur={() => saveCellEdit(fs)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveCellEdit(fs); if (e.key === 'Escape') setEditingCell(null); }}
                                  className={`w-16 px-1 py-0.5 rounded border text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingCell({ fsId: fs.id, amount: String(fs.amount) })}
                                  className={`text-xs font-semibold hover:underline ${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-700 hover:text-green-800'}`}
                                  title="Click to edit"
                                >₹{fs.amount?.toLocaleString()}</button>
                              )
                            ) : (
                              addingCell?.feeName === feeName && addingCell?.classId === cls.id ? (
                                <input
                                  autoFocus type="number"
                                  value={addingCell.amount}
                                  onChange={e => setAddingCell({ ...addingCell, amount: e.target.value })}
                                  onBlur={() => saveAddingCell(feeName, cls)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveAddingCell(feeName, cls); if (e.key === 'Escape') setAddingCell(null); }}
                                  placeholder="₹"
                                  className={`w-14 px-1 py-0.5 rounded border text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-300'}`}
                                />
                              ) : (
                                <button
                                  onClick={() => setAddingCell({ feeName, classId: cls.id, amount: '' })}
                                  title={`Add ${feeName} for ${cls.name}`}
                                  className={`text-xs px-1 rounded border border-dashed transition-all ${isDark ? 'border-gray-700 text-gray-700 hover:border-blue-600 hover:text-blue-500' : 'border-gray-300 text-gray-300 hover:border-blue-400 hover:text-blue-500'}`}
                                >+</button>
                              )
                            )}
                          </td>
                        );
                      })}
                      <td className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => openEditFee(first)} title="Full edit" className={`text-xs px-0.5 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>✎</button>
                          <button onClick={() => deleteFee(first)} title="Delete" className={`text-xs px-0.5 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* New inline rows */}
                {newFeeRows.map(nr => (
                  <tr key={nr.id} className={isDark ? 'bg-blue-900/15' : 'bg-blue-50/80'}>
                    <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                      <input autoFocus value={nr.name}
                        onChange={e => setNewFeeRows(prev => prev.map(r => r.id === nr.id ? { ...r, name: e.target.value } : r))}
                        placeholder="Fee name…"
                        className={`w-full px-1.5 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                    </td>
                    <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                      <select value={nr.category} onChange={e => setNewFeeRows(prev => prev.map(r => r.id === nr.id ? { ...r, category: e.target.value } : r))}
                        className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </td>
                    <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                      <select value={nr.frequency} onChange={e => setNewFeeRows(prev => prev.map(r => r.id === nr.id ? { ...r, frequency: e.target.value } : r))}
                        className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                        {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </td>
                    {gridClsForFee.map(cls => (
                      <td key={cls.id} className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                        <input type="number" min="0"
                          value={nr.amounts[cls.id] || ''}
                          onChange={e => setNewFeeRows(prev => prev.map(r => r.id === nr.id ? { ...r, amounts: { ...r.amounts, [cls.id]: e.target.value } } : r))}
                          placeholder="₹"
                          className={`w-16 px-1 py-0.5 rounded border text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-300'}`}
                        />
                      </td>
                    ))}
                    <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                      <div className="flex items-center justify-center gap-0.5">
                        <button disabled={!nr.name.trim() || Object.values(nr.amounts).every(a => !parseFloat(a)) || nr.saving}
                          onClick={() => saveFeeRow(nr.id)} title="Save"
                          className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-40 transition-all"
                        >{nr.saving ? '…' : '✓'}</button>
                        <button onClick={() => setNewFeeRows(prev => prev.filter(r => r.id !== nr.id))} title="Cancel"
                          className="w-5 h-5 flex items-center justify-center rounded bg-gray-400 hover:bg-red-400 text-white text-xs font-bold transition-all"
                        >✕</button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Add fee row footer */}
                <tr>
                  <td colSpan={3 + gridClsForFee.length + 1} className={`px-2 py-1.5 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                    <button disabled={!canManageSettings}
                      onClick={() => setNewFeeRows(prev => [...prev, { id: Date.now().toString(), name: '', category: 'tuition', frequency: 'monthly', dueDate: 1, amounts: {}, saving: false }])}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-40 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-blue-500 text-white font-bold text-sm leading-none">+</span>
                      Add fee type
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee Structure Create/Edit Modal */}
        <AnimatePresence>
          {showFeeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFeeModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl p-6 ${card}`} onClick={e => e.stopPropagation()}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingFee ? 'Edit' : 'Create'} Fee Structure
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={label}>Fee Name</label><input className={input} value={feeForm.name || ''} onChange={e => setFeeForm({ ...feeForm, name: e.target.value })} placeholder="e.g. Tuition Fee" /></div>
                  <div><label className={label}>Category</label><select className={input} value={feeForm.category || 'tuition'} onChange={e => setFeeForm({ ...feeForm, category: e.target.value })}>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                  <div><label className={label}>Amount (₹)</label><input className={input} type="number" value={feeForm.amount || 0} onChange={e => setFeeForm({ ...feeForm, amount: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label className={label}>Frequency</label><select className={input} value={feeForm.frequency || 'monthly'} onChange={e => setFeeForm({ ...feeForm, frequency: e.target.value })}>{frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
                  <div><label className={label}>Due Date (Day of Month)</label><input className={input} type="number" min={1} max={28} value={feeForm.dueDate || 1} onChange={e => setFeeForm({ ...feeForm, dueDate: parseInt(e.target.value) || 1 })} /></div>
                  <div><label className={label}>Late Fee (₹/day)</label><input className={input} type="number" value={feeForm.lateFee || 0} onChange={e => setFeeForm({ ...feeForm, lateFee: parseFloat(e.target.value) || 0 })} /></div>
                  <div className="md:col-span-2"><label className={label}>Description</label><input className={input} value={feeForm.description || ''} onChange={e => setFeeForm({ ...feeForm, description: e.target.value })} /></div>
                  <div><label className={label}>Academic Year *</label><select className={input} value={feeForm.academicYearId || ''} onChange={e => setFeeForm({ ...feeForm, academicYearId: e.target.value, mediumId: null, classId: null })}><option value="">Select...</option>{academicYears.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                  <div><label className={label}>Board *</label><select className={input} value={feeForm.boardId || ''} onChange={e => setFeeForm({ ...feeForm, boardId: e.target.value || null })}><option value="">Select Board...</option>{boards.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                  <div><label className={label}>Medium{modalLoading ? ' (loading...)' : ''} *</label><select className={input} value={feeForm.mediumId || ''} onChange={e => setFeeForm({ ...feeForm, mediumId: e.target.value || null, classId: null })} disabled={modalLoading}><option value="">Select Medium...</option>{modalMediums.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                  <div><label className={label}>Class{modalLoading ? ' (loading...)' : ''} *</label><select className={input} value={feeForm.classId || ''} onChange={e => setFeeForm({ ...feeForm, classId: e.target.value || null })} disabled={modalLoading}><option value="">Select Class...</option>{(feeForm.mediumId ? modalClasses.filter((c: any) => c.mediumId === feeForm.mediumId) : modalClasses).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className={label}>Applicable Categories</label><input className={input} value={feeForm.applicableCategories || 'all'} onChange={e => setFeeForm({ ...feeForm, applicableCategories: e.target.value })} placeholder="all, General, OBC, SC, ST" /></div>
                  <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={feeForm.isActive !== false} onChange={e => setFeeForm({ ...feeForm, isActive: e.target.checked })} /><span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Active</span></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className={btnPrimary} disabled={saving || !feeForm.name || !feeForm.academicYearId || !feeForm.boardId || !feeForm.mediumId || !feeForm.classId} onClick={saveFee}>{saving ? 'Saving...' : editingFee ? 'Update' : 'Create'}</button>
                  <button className={btnSecondary} onClick={() => setShowFeeModal(false)}>Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clone Modal */}
        <AnimatePresence>
          {showCloneModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCloneModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`w-full max-w-md rounded-xl p-6 ${card}`} onClick={e => e.stopPropagation()}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Clone Fee Structures</h3>
                <p className={`${subtext} mb-4`}>Copy all fee structures from one academic year to another. Amounts, categories, board/medium/class assignments will be preserved.</p>
                <div className="space-y-4">
                  <div><label className={label}>Source Academic Year</label><select className={input} value={cloneSource} onChange={e => setCloneSource(e.target.value)}><option value="">Select source...</option>{academicYears.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({feeStructures.filter((f: any) => f.academicYearId === a.id).length} structures)</option>)}</select></div>
                  <div className="text-center text-2xl">⬇️</div>
                  <div><label className={label}>Target Academic Year</label><select className={input} value={cloneTarget} onChange={e => setCloneTarget(e.target.value)}><option value="">Select target...</option>{academicYears.filter((a: any) => a.id !== cloneSource).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className={btnSecondary} onClick={() => setShowCloneModal(false)}>Cancel</button>
                  <button className={btnPrimary} disabled={!cloneSource || !cloneTarget || cloning} onClick={handleClone}>{cloning ? 'Cloning...' : 'Clone'}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ─── Timings Tab ───────────────────────────────────────────────────────────
  const TimingsTab = () => (
    <div className={card}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className={heading}>School Timings & Period Timetable</h3>
          <p className={subtext}>Define periods, breaks, and assembly timings</p>
        </div>
        <button className={btnPrimary} disabled={!canManageSettings} onClick={() => openCreate('timing', { name: '', type: 'period', startTime: '08:00', endTime: '08:45', dayOfWeek: 'all', sortOrder: timings.length, isActive: true })}>
          + Add Timing
        </button>
      </div>
      {timings.length === 0 && <p className={subtext}>No timings configured.</p>}
      <div className="space-y-2">
        {timings.map((t: any) => (
          <div key={t.id} className={`${row} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${t.type === 'period' ? 'bg-blue-100 text-blue-700' : t.type === 'break' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>{t.type}</span>
              <span className={subtext}>{t.startTime} – {t.endTime}</span>
              <span className={subtext}>({t.dayOfWeek})</span>
            </div>
            <div className="flex gap-2">
              <button className={btnSecondary} disabled={!canManageSettings} onClick={() => openEdit('timing', t)}>Edit</button>
              <button className={btnDanger} disabled={!canManageSettings} onClick={() => handleDelete('timing', t.id, t.name)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Integrations Tab (SMTP & Payment Gateways) ───────────────────────────
  const IntegrationsTab = () => {
    const [smtp, setSmtp] = useState({
      host: getSetting('smtp', 'host', ''),
      port: getSetting('smtp', 'port', '587'),
      user: getSetting('smtp', 'user', ''),
      password: getSetting('smtp', 'password', ''),
      from_email: getSetting('smtp', 'from_email', ''),
      from_name: getSetting('smtp', 'from_name', ''),
      encryption: getSetting('smtp', 'encryption', 'tls'),
    });
    const [pg, setPg] = useState({
      provider: getSetting('payment_gateway', 'provider', 'razorpay'),
      api_key: getSetting('payment_gateway', 'api_key', ''),
      api_secret: getSetting('payment_gateway', 'api_secret', ''),
      webhook_secret: getSetting('payment_gateway', 'webhook_secret', ''),
      enabled: getSetting('payment_gateway', 'enabled', 'false'),
    });
    return (
      <div className="space-y-6">
        <div className={card}>
          <div className="flex justify-between items-center mb-6">
            <div><h3 className={heading}>SMTP Configuration</h3><p className={subtext}>Email delivery settings</p></div>
            <button className={btnPrimary} disabled={saving} onClick={() => saveBatchSettings('smtp', smtp)}>{saving ? 'Saving...' : 'Save SMTP'}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(smtp).map(([key, val]) => (
              <div key={key}>
                <label className={label}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                <input className={input} type={key === 'password' ? 'password' : 'text'} value={val} onChange={e => setSmtp({ ...smtp, [key]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>
        <div className={card}>
          <div className="flex justify-between items-center mb-6">
            <div><h3 className={heading}>Payment Gateway</h3><p className={subtext}>Online payment configuration</p></div>
            <button className={btnPrimary} disabled={saving} onClick={() => saveBatchSettings('payment_gateway', pg)}>{saving ? 'Saving...' : 'Save Gateway'}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(pg).map(([key, val]) => (
              <div key={key}>
                <label className={label}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                <input className={input} type={key.includes('secret') ? 'password' : 'text'} value={val} onChange={e => setPg({ ...pg, [key]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Access Rights Tab ─────────────────────────────────────────────────────
  const AccessTab = () => {
    const [local, setLocal] = useState({
      admin_modules: getSetting('access_rights', 'admin_modules', 'all'),
      teacher_modules: getSetting('access_rights', 'teacher_modules', 'students,attendance,exams,assignments'),
      student_modules: getSetting('access_rights', 'student_modules', 'dashboard,profile,fees,exams'),
      parent_modules: getSetting('access_rights', 'parent_modules', 'dashboard,fees,attendance,exams'),
      allow_teacher_fee_collection: getSetting('access_rights', 'allow_teacher_fee_collection', 'false'),
      allow_student_self_registration: getSetting('access_rights', 'allow_student_self_registration', 'false'),
    });
    return (
      <div className={card}>
        <div className="flex justify-between items-center mb-6">
          <div><h3 className={heading}>Access Rights & Permissions</h3><p className={subtext}>Control what each role can access</p></div>
          <button className={btnPrimary} disabled={saving} onClick={() => saveBatchSettings('access_rights', local)}>{saving ? 'Saving...' : 'Save Permissions'}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(local).map(([key, val]) => (
            <div key={key}>
              <label className={label}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
              {key.includes('allow_') ? (
                <select className={input} value={val} onChange={e => setLocal({ ...local, [key]: e.target.value })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <input className={input} value={val} onChange={e => setLocal({ ...local, [key]: e.target.value })} placeholder="Comma-separated module names" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── App Settings Tab ──────────────────────────────────────────────────────
  const AppSettingsTab = () => {
    const [local, setLocal] = useState({
      attendance_auto_absent: getSetting('app_config', 'attendance_auto_absent', 'true'),
      sms_notifications: getSetting('app_config', 'sms_notifications', 'false'),
      email_notifications: getSetting('app_config', 'email_notifications', 'true'),
      push_notifications: getSetting('app_config', 'push_notifications', 'false'),
      default_language: getSetting('app_config', 'default_language', 'en'),
      date_format: getSetting('app_config', 'date_format', 'DD/MM/YYYY'),
      currency: getSetting('app_config', 'currency', 'INR'),
      currency_symbol: getSetting('app_config', 'currency_symbol', '₹'),
      pagination_size: getSetting('app_config', 'pagination_size', '25'),
      session_timeout_mins: getSetting('app_config', 'session_timeout_mins', '60'),
    });
    return (
      <div className={card}>
        <div className="flex justify-between items-center mb-6">
          <div><h3 className={heading}>Application Settings</h3><p className={subtext}>Control how the application behaves</p></div>
          <button className={btnPrimary} disabled={saving} onClick={() => saveBatchSettings('app_config', local)}>{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(local).map(([key, val]) => (
            <div key={key}>
              <label className={label}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
              {['true','false'].includes(val) ? (
                <select className={input} value={val} onChange={e => setLocal({ ...local, [key]: e.target.value })}>
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <input className={input} value={val} onChange={e => setLocal({ ...local, [key]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Modal form fields per entity ──────────────────────────────────────────
  const modalFields: Record<string, { key: string; label: string; type?: string; options?: any[] }[]> = {
    academicYear: [
      { key: 'year', label: 'Year Code (e.g. 2024-25)' },
      { key: 'name', label: 'Display Name' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
    board: [
      { key: 'code', label: 'Code (e.g. CBSE)' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
    medium: [
      { key: 'code', label: 'Code (e.g. EN)' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'academicYearId', label: 'Academic Year', type: 'select', options: academicYears.map((a: any) => ({ value: a.id, label: a.name })) },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
    class: [
      { key: 'code', label: 'Code (e.g. 1-EN)' },
      { key: 'name', label: 'Name' },
      { key: 'level', label: 'Level', type: 'select', options: LEVELS.map(l => ({ value: l.value, label: l.label })) },
      { key: 'mediumId', label: 'Medium', type: 'select', options: mediums.map((m: any) => ({ value: m.id, label: m.name })) },
      { key: 'academicYearId', label: 'Academic Year', type: 'select', options: academicYears.map((a: any) => ({ value: a.id, label: a.name })) },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
    section: [
      { key: 'code', label: 'Code (e.g. 1-EN-A)' },
      { key: 'name', label: 'Name (e.g. A)' },
      { key: 'classId', label: 'Class', type: 'select', options: classes.map((c: any) => ({ value: c.id, label: c.name })) },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'roomNumber', label: 'Room Number' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
    timing: [
      { key: 'name', label: 'Name (e.g. Period 1)' },
      { key: 'type', label: 'Type', type: 'select', options: [{ value: 'period', label: 'Period' }, { value: 'break', label: 'Break' }, { value: 'assembly', label: 'Assembly' }] },
      { key: 'startTime', label: 'Start Time', type: 'time' },
      { key: 'endTime', label: 'End Time', type: 'time' },
      { key: 'dayOfWeek', label: 'Day', type: 'select', options: ['all','mon','tue','wed','thu','fri','sat','sun'].map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })) },
      { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout currentPage="settings" title="Settings" theme={theme}>
      <div className="min-h-screen p-4 md:p-6">
        <div className="space-y-8 pb-8">
          {/* Modern Header */}
          <div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-8 shadow-lg`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings & Configuration</h1>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      {loading ? 'Loading configuration...' : canManageSettings ? 'Manage your school ERP system settings' : 'View school ERP system settings (Read-only)'}
                      {activeAY && <span className="ml-2 px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium">AY: {activeAY.name}</span>}
                      {!canManageSettings && <span className="ml-2 px-2 py-0.5 bg-amber-600/20 text-amber-400 rounded-full text-xs font-medium">👁️ Read-Only Access</span>}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={fetchAll}
                  className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  disabled={loading}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Modern Tabs */}
          <div className={`rounded-2xl border p-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
            <div className="flex flex-wrap gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : isDark 
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

        {/* Loading */}
        {loading && <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading configuration...</div>}

        {/* Tab Content */}
        {!loading && (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'school' && <SchoolDetailsTab />}
            {activeTab === 'academic' && <AcademicYearsTab />}
            {activeTab === 'structure' && <StructureTab />}
            {activeTab === 'fees' && <FeeTab />}
            {activeTab === 'timings' && <TimingsTab />}
            {activeTab === 'integrations' && <IntegrationsTab />}
            {activeTab === 'leave' && <LeaveManagementSettings theme={theme} isDark={isDark} />}
            {activeTab === 'app' && <AppSettingsTab />}
            {activeTab === 'roles' && <RolesManagement theme={theme} isDark={isDark} />}
            {activeTab === 'users' && <UsersManagement theme={theme} isDark={isDark} />}
          </motion.div>
        )}
      </div>

      {/* ─── CRUD Modal ─────────────────────────────────────────────────────── */}
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
              className={`w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`} 
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {editingItem ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {editingItem ? 'Edit' : 'Create New'} {modalEntity.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {editingItem ? 'Update the information below' : 'Fill in the details to create'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                <div className="space-y-5">
                  {(modalFields[modalEntity] || []).map(field => (
                    <div key={field.key}>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {field.label}
                        {field.type !== 'checkbox' && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'checkbox' ? (
                        <label className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${isDark ? 'border-gray-600 hover:bg-gray-700/50' : 'border-gray-300 hover:bg-gray-50'}`}>
                          <input 
                            type="checkbox" 
                            checked={!!formData[field.key]} 
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.checked })} 
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Enabled</span>
                        </label>
                      ) : field.type === 'select' ? (
                        <select 
                          className={`${input} rounded-xl`} 
                          value={formData[field.key] || ''} 
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        >
                          <option value="">Select an option...</option>
                          {field.options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input 
                          className={`${input} rounded-xl`} 
                          type={field.type || 'text'} 
                          value={formData[field.key] ?? ''} 
                          onChange={e => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })} 
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex gap-3">
                  <button 
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                    }`}
                    disabled={saving} 
                    onClick={handleSave}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editingItem ? 'Update' : 'Create'}
                      </span>
                    )}
                  </button>
                  <button 
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Copy Confirmation Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showCopyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={handleCancelCopy}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`} onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                  <svg className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Copy Data from Previous Year?
                </h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Previous academic year found: <span className="font-semibold">{previousYearForCopy?.name}</span>
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Would you like to copy the following from the previous year?
                </p>
              </div>

              <div className={`space-y-3 mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`}></div>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mediums</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-yellow-400' : 'bg-yellow-500'}`}></div>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Classes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Sections</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-red-400' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fee Structures</span>
                </div>
              </div>
              <p className={`text-xs text-center mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Note: Boards are global and shared across all years
              </p>

              <div className="flex gap-3">
                <button 
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${
                    isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  }`} 
                  disabled={saving} 
                  onClick={handleCopyWithPreviousYear}
                >
                  {saving ? 'Creating...' : 'Copy & Create'}
                </button>
                <button 
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                    isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`} 
                  disabled={saving} 
                  onClick={handleCreateFreshYear}
                >
                  {saving ? 'Creating...' : 'Create Fresh'}
                </button>
                <button 
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                    isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`} 
                  onClick={handleCancelCopy}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Student Lock Dialog (shown when activating a new AY) ────────── */}
      <AnimatePresence>
        {showLockDialog && lockDialogData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
            onClick={() => handleConfirmLock(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Lock Previous-Year Students?
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="font-bold text-orange-500">{lockDialogData.count} active student{lockDialogData.count !== 1 ? 's' : ''}</span> still belong to a previous academic year.
                </p>
                {lockDialogData.byAY.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {lockDialogData.byAY.map((r: any) => (
                      <div key={r.year} className={`flex justify-between text-xs px-3 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>AY {r.year}</span>
                        <span className="font-medium text-orange-500">{r.count} student{r.count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Locking prevents any edits or new fee assignments until they are promoted to <strong>{lockDialogData.ay.year}</strong> or marked as exit.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all transform hover:scale-105 shadow-lg"
                  disabled={lockingSaving}
                  onClick={() => handleConfirmLock(true)}
                >
                  {lockingSaving ? 'Locking...' : `🔒 Lock ${lockDialogData.count} Student${lockDialogData.count !== 1 ? 's' : ''}`}
                </button>
                <button
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'}`}
                  disabled={lockingSaving}
                  onClick={() => handleConfirmLock(false)}
                >
                  Skip for Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medium Delete with Cascading Confirmation Modal */}
      <AnimatePresence>
        {showMediumDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowMediumDeleteModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6 ${card}`} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>⚠️ Cascading Delete Confirmation</h3>
                <button onClick={() => setShowMediumDeleteModal(null)} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
              <p className={`${subtext} mb-4`}>
                Deleting medium <strong>"{showMediumDeleteModal.mediumName}"</strong> will also permanently delete:
              </p>
              <div className={`space-y-3 mb-6`}>
                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'}`}>
                  <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>Classes</span>
                  <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{showMediumDeleteModal.affectedClasses.length}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-orange-900/20 border border-orange-700/30' : 'bg-orange-50 border border-orange-200'}`}>
                  <span className={`font-medium ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Sections</span>
                  <span className={`font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{showMediumDeleteModal.affectedSections || 0}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <span className={`font-medium ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>Fee Structures</span>
                  <span className={`font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{showMediumDeleteModal.affectedFeeStructures || 0}</span>
                </div>
              </div>
              {showMediumDeleteModal.affectedClasses.length > 0 && (
                <div className={`p-3 rounded-lg mb-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Classes to be deleted:</h4>
                  <div className="flex flex-wrap gap-2">
                    {showMediumDeleteModal.affectedClasses.map((cls: any) => (
                      <span key={cls.id} className={`px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        {cls.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className={`p-3 rounded-lg mb-6 ${isDark ? 'bg-red-900/10 border border-red-700/20' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  ⚠️ This action cannot be undone. All data will be permanently deleted.
                </p>
              </div>
              <div className="flex gap-3">
                <button className={btnSecondary} onClick={() => setShowMediumDeleteModal(null)}>Cancel</button>
                <button
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'}`}
                  disabled={showMediumDeleteModal.deleting}
                  onClick={async () => {
                    setShowMediumDeleteModal({ ...showMediumDeleteModal, deleting: true });
                    try {
                      const result = await mediumsApi.delete(showMediumDeleteModal.mediumId, true);
                      showToast({ 
                        type: 'success', 
                        title: `Medium "${showMediumDeleteModal.mediumName}" deleted`,
                        message: `Also deleted: ${result.deleted?.classes || 0} classes, ${result.deleted?.sections || 0} sections, ${result.deleted?.feeStructures || 0} fee structures`
                      });
                      await fetchAll();
                      refreshSchoolConfig();
                      setShowMediumDeleteModal(null);
                    } catch (e: any) {
                      showToast({ type: 'error', title: 'Delete failed', message: e.message });
                      setShowMediumDeleteModal({ ...showMediumDeleteModal, deleting: false });
                    }
                  }}
                >
                  {showMediumDeleteModal.deleting ? 'Deleting...' : 'Delete All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </AppLayout>
  );
}
