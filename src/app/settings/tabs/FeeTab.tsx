'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/lib/toastUtils';
import { AcademicYear, FeeStructure } from '../types';

interface FeeTabProps {
  isDark: boolean;
  canManageSettings: boolean;
  academicYears: AcademicYear[];
  activeAY: AcademicYear | null;
  boards: any[];
  mediums: any[];
  classes: any[];
  feeStructures: FeeStructure[];
  feeStructuresApi: any;
  saveBatchSettings: (category: string, settings: Record<string, string>) => void;
  getSetting: (category: string, key: string, defaultValue: string) => string;
  saving: boolean;
  fetchAll: () => void;
}

export const FeeTab: React.FC<FeeTabProps> = ({
  isDark,
  canManageSettings,
  academicYears,
  activeAY,
  boards,
  mediums,
  classes,
  feeStructures,
  feeStructuresApi,
  saveBatchSettings,
  getSetting,
  saving,
  fetchAll,
}) => {
  // Centralized theme object
  const theme = useMemo(() => ({
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      muted: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    card: isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200',
    input: isDark 
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
    gradients: {
      primary: 'from-indigo-500 to-purple-600',
      secondary: 'from-blue-500 to-cyan-600',
      success: 'from-green-500 to-emerald-600',
      warning: 'from-orange-500 to-red-600',
    }
  }), [isDark]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

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
      fetch(`/api/school-structure/mediums?academicYearId=${feeForm.academicYearId}&isActive=true`).then(r => r.json()),
      fetch(`/api/school-structure/classes?academicYearId=${feeForm.academicYearId}&isActive=true`).then(r => r.json()),
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

  const filteredFS = feeStructures.filter((fs: FeeStructure) => {
    if (filterAY && fs.academicYearId !== filterAY) return false;
    if (filterBoard && (fs as any).boardId !== filterBoard) return false;
    if (filterMedium && fs.mediumId !== filterMedium) return false;
    if (filterClass && fs.classId !== filterClass) return false;
    return true;
  });

  const filteredClasses = filterMedium ? classes.filter((c: any) => c.mediumId === filterMedium) : classes;

  // ── Excel Grid state & helpers ──────────────────────────────────────────
  const [newFeeRows, setNewFeeRows] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [addingCell, setAddingCell] = useState(null);
  const [editingFeeRow, setEditingFeeRow] = useState<{ oldName: string, name: string, category: string, frequency: string } | null>(null);
  const [savingFees, setSavingFees] = useState(false);

  const saveFeeRowEdit = async (oldName: string) => {
    if (!editingFeeRow || !editingFeeRow.name.trim()) return;
    const rowFs = feeStructures.filter(fs => fs.name === oldName && (!filterAY || fs.academicYearId === filterAY));
    setSavingFees(true);
    try {
      await Promise.all(rowFs.map(fs => feeStructuresApi.update(fs.id, { 
        ...fs, 
        name: editingFeeRow.name.trim(),
        category: editingFeeRow.category,
        frequency: editingFeeRow.frequency
      } as any)));
      await fetchAll();
      setEditingFeeRow(null);
      showSuccessToast('Success', 'Fee row updated');
    } catch {
      showErrorToast('Failed', 'Failed to update fee row');
    } finally {
      setSavingFees(false);
    }
  };

  const deleteFeeRow = async (feeName: string) => {
    if (!confirm(`Delete all fee structures for "${feeName}"?`)) return;
    const rowFs = feeStructures.filter(fs => fs.name === feeName && (!filterAY || fs.academicYearId === filterAY));
    setSavingFees(true);
    try {
      await Promise.all(rowFs.map(fs => feeStructuresApi.delete(fs.id)));
      await fetchAll();
      showSuccessToast('Success', 'Fee row deleted');
    } catch {
      showErrorToast('Failed', 'Failed to delete fee row');
    } finally {
      setSavingFees(false);
    }
  };

  const saveAddingCell = async (feeName: string, cls: any) => {
    if (!(addingCell as any)?.amount) { setAddingCell(null); return; }
    const first = feeStructures.find(fs => fs.name === feeName && (!filterAY || fs.academicYearId === filterAY));
    try {
      await feeStructuresApi.create({
        name: feeName, category: first?.category || 'tuition',
        amount: parseFloat((addingCell as any).amount) || 0,
        frequency: first?.frequency || 'monthly', dueDate: first?.dueDate || 1,
        lateFee: first?.lateFee || 0, applicableCategories: first?.applicableCategories || 'all',
        isActive: true, academicYearId: filterAY || activeAY?.id || '',
        mediumId: cls.mediumId, classId: cls.id,
      } as any);
      await fetchAll();
    } catch { showErrorToast('Failed', 'Add failed'); }
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

  const mediumGroups = gridClsForFee.reduce((acc: any, cls) => {
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

  const saveFeeRow = async (rowId: any) => {
    const nr = (newFeeRows as any).find((r: any) => r.id === rowId);
    if (!nr || !nr.name.trim()) return;
    const toCreate = gridClsForFee.filter(cls => parseFloat(nr.amounts[cls.id] || '0') > 0);
    if (toCreate.length === 0) return;
    setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === rowId ? { ...r, saving: true } : r));
    try {
      await Promise.all(toCreate.map(cls => feeStructuresApi.create({
        name: nr.name.trim(), category: nr.category, amount: parseFloat(nr.amounts[cls.id]),
        frequency: nr.frequency, dueDate: nr.dueDate || 1, lateFee: 0,
        applicableCategories: 'all', isActive: true,
        academicYearId: filterAY || activeAY?.id || '',
        mediumId: cls.mediumId, classId: cls.id,
      } as any)));
      await fetchAll();
      setNewFeeRows((prev: any) => (prev as any).filter((r: any) => r.id !== rowId));
    } catch { setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === rowId ? { ...r, saving: false } : r)); }
  };

  const saveCellEdit = async (fs: any) => {
    if (!(editingCell as any) || (editingCell as any).fsId !== fs.id) return;
    try {
      await feeStructuresApi.update(fs.id, { ...fs, amount: parseFloat((editingCell as any).amount) || 0 });
      await fetchAll();
    } catch { showErrorToast('Failed', 'Update failed'); }
    setEditingCell(null);
  };

  const bulkSaveFees = async () => {
    if (!canManageSettings) return;
    setSavingFees(true);
    try {
      const promises = [];
      
      // Save edited cell first
      if (editingCell && (editingCell as any).fsId && (editingCell as any).amount) {
        const fs = feeStructures.find(f => f.id === (editingCell as any).fsId);
        if (fs) {
          promises.push(feeStructuresApi.update(fs.id, { ...fs, amount: parseFloat((editingCell as any).amount) || 0 }));
        }
      }
      
      // Save all new fee rows
      for (const nr of newFeeRows as any[]) {
        if (nr.name.trim()) {
          const toCreate = gridClsForFee.filter(cls => parseFloat(nr.amounts[cls.id] || '0') > 0);
          for (const cls of toCreate) {
            promises.push(feeStructuresApi.create({
              name: nr.name.trim(),
              category: nr.category,
              amount: parseFloat(nr.amounts[cls.id]),
              frequency: nr.frequency,
              dueDate: nr.dueDate || 1,
              lateFee: 0,
              applicableCategories: 'all',
              isActive: true,
              academicYearId: filterAY || activeAY?.id || '',
              mediumId: cls.mediumId,
              classId: cls.id,
            } as any));
          }
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        showSuccessToast('Success', 'Fee structures saved successfully');
        await fetchAll();
        setNewFeeRows([]);
        setEditingCell(null);
      } else {
        showWarningToast('No fees to save', 'Add some fee amounts first');
      }
    } catch (e: any) {
      showErrorToast('Failed', 'Failed to save fee structures');
    } finally {
      setSavingFees(false);
    }
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
    try {
      const payload = { ...feeForm };
      if (editingFee) {
        await feeStructuresApi.update(editingFee.id, payload);
        showSuccessToast('Success', 'Fee structure updated');
      } else {
        await feeStructuresApi.create(payload);
        showSuccessToast('Success', 'Fee structure created');
      }
      setShowFeeModal(false);
      fetchAll();
    } catch (e: any) {
      showErrorToast('Failed', 'Save failed');
    }
  };

  const deleteFee = async (fs: any) => {
    if (!confirm(`Delete "${fs.name}"?`)) return;
    try {
      await feeStructuresApi.delete(fs.id);
      showSuccessToast('Success', 'Deleted');
      fetchAll();
    } catch (e: any) { 
      showErrorToast('Failed', 'Failed'); 
    }
  };

  const handleClone = async () => {
    if (!cloneSource || !cloneTarget) return;
    try {
      const res = await feeStructuresApi.clone(cloneSource, cloneTarget);
      showSuccessToast('Success', `${(res as any).cloned} fee structures cloned`);
      setShowCloneModal(false);
      fetchAll();
    } catch (e: any) {
      showErrorToast('Failed', 'Clone failed');
    }
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Beautiful Header Section */}
      <motion.div
        variants={itemVariants}
        className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} shadow-lg`}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradients.primary} opacity-10`}></div>
        
        {/* Content */}
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Animated Icon Container */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${theme.gradients.primary} shadow-lg`}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r ${theme.gradients.primary} bg-clip-text text-transparent`}>
                  Advanced Fee Structure Management
                </h1>
                <p className={`text-sm ${theme.text.secondary} mt-1`}>
                  Comprehensive fee configuration • {filteredFS.length} structures • {academicYears.length} academic years
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.secondary} text-white shadow-lg hover:shadow-xl transition-all`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Fee Structure
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Global Fee Configuration */}
      <motion.div
        variants={itemVariants}
        className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.card} shadow-lg`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-bold ${theme.text.primary}`}>Global Fee Configuration</h2>
              <p className={`text-sm ${theme.text.secondary} mt-1`}>Late fees, grace periods, and receipt settings</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={saving || !canManageSettings}
              onClick={() => saveBatchSettings('fee_config', globalConfig)}
              className={`px-6 py-3 rounded-xl font-medium bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(globalConfig).map(([key, val], index) => (
              <motion.div
                key={key}
                variants={itemVariants}
                className={`p-4 rounded-xl border ${theme.border} ${theme.hover} transition-all`}
              >
                <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  value={val}
                  onChange={e => setGlobalConfig({ ...globalConfig, [key]: e.target.value })}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Advanced Fee Structures Grid */}
      <motion.div
        variants={itemVariants}
        className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.card} shadow-lg`}
      >
        <div className="p-6">
          {/* Toolbar */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h2 className={`text-xl font-bold ${theme.text.primary}`}>Fee Structures Matrix</h2>
              <p className={`text-sm ${theme.text.secondary} mt-1`}>Click amounts to edit • + to add new • Real-time updates</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <motion.select
                whileHover={{ scale: 1.02 }}
                className={`px-4 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                value={filterAY}
                onChange={e => setFilterAY(e.target.value)}
              >
                <option value="">All Academic Years</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </motion.select>
              {activeAY && filterAY === activeAY.id && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                >
                  Active AY
                </motion.span>
              )}
              <motion.select
                whileHover={{ scale: 1.02 }}
                className={`px-4 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                value={filterMedium}
                onChange={e => { setFilterMedium(e.target.value); setFilterClass(''); }}
              >
                <option value="">All Mediums</option>
                {mediums.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </motion.select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCloneModal(true)}
                className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.text.secondary} hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Clone
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateFee}
                className={`px-4 py-2 rounded-lg bg-gradient-to-r ${theme.gradients.secondary} text-white shadow-lg hover:shadow-xl transition-all`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Advanced
                </span>
              </motion.button>
            </div>
          </div>

          {/* Advanced Grid */}
          <div className="overflow-x-auto">
            <table className={`w-full text-sm border-collapse ${theme.text.secondary}`}>
              <thead>
                {/* Level 1: Medium group headers */}
                <tr>
                  <th rowSpan={2} className={`px-4 py-3 text-left border font-semibold min-w-[150px] ${theme.border} ${theme.card} ${theme.text.primary}`}>Fee Name</th>
                  <th rowSpan={2} className={`px-3 py-3 text-center border font-semibold w-20 ${theme.border} ${theme.card} ${theme.text.primary}`}>Category</th>
                  <th rowSpan={2} className={`px-3 py-3 text-center border font-semibold w-20 ${theme.border} ${theme.card} ${theme.text.primary}`}>Frequency</th>
                  {gridClsForFee.length === 0 && (
                    <th rowSpan={2} className={`px-4 py-3 text-center border ${theme.border} ${theme.card} ${theme.text.muted}`}>
                      ← Select Academic Year & Configure Classes
                    </th>
                  )}
                  {medGroupList.map(([medId, med]: any) => (
                    <th key={medId} colSpan={med.classes.length} className={`px-3 py-3 text-center border font-semibold ${theme.border} ${theme.card} text-blue-600`}>
                      {med.name}
                    </th>
                  ))}
                  <th rowSpan={2} className={`px-2 py-3 text-center border w-12 ${theme.border} ${theme.card}`} />
                </tr>
                {/* Level 2: Class name headers */}
                <tr>
                  {gridClsForFee.map(cls => (
                    <th key={cls.id} className={`px-3 py-2 text-center border font-medium w-24 ${theme.border} ${theme.card} ${theme.text.secondary}`}>
                      {cls.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Empty state */}
                {feeRowNames.length === 0 && newFeeRows.length === 0 && (
                  <tr>
                    <td colSpan={3 + gridClsForFee.length + 1} className={`px-6 py-8 text-center border ${theme.border} ${theme.text.muted}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="text-lg font-medium">No fee structures configured yet</div>
                        <div className="text-sm">Click <strong>+ Add Fee Type</strong> below to get started</div>
                      </motion.div>
                    </td>
                  </tr>
                )}

                {/* Existing fee name rows */}
                {feeRowNames.map(feeName => {
                  const rowFs = feeStructures.filter(fs => fs.name === feeName && (!filterAY || fs.academicYearId === filterAY));
                  const first = rowFs[0];
                  const isEditingRow = editingFeeRow?.oldName === feeName;
                  return (
                    <motion.tr
                      key={feeName}
                      variants={itemVariants}
                      className={`${theme.hover} transition-all`}
                    >
                      <td className={`px-4 py-2 border font-medium ${theme.border} ${theme.card} ${theme.text.primary}`}>
                        {isEditingRow ? (
                          <motion.input
                            autoFocus
                            whileFocus={{ scale: 1.02 }}
                            value={editingFeeRow.name}
                            onChange={e => setEditingFeeRow({ ...editingFeeRow, name: e.target.value })}
                            className={`w-full px-2 py-1 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                          />
                        ) : (
                          <span className="font-semibold">{feeName}</span>
                        )}
                      </td>
                      <td className={`px-2 py-2 border text-center ${theme.border}`}>
                        {isEditingRow ? (
                          <motion.select
                            whileFocus={{ scale: 1.02 }}
                            value={editingFeeRow.category}
                            onChange={e => setEditingFeeRow({ ...editingFeeRow, category: e.target.value })}
                            className={`w-full px-2 py-1 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                          >
                            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </motion.select>
                        ) : (
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white`}
                          >
                            {first?.category}
                          </motion.span>
                        )}
                      </td>
                      <td className={`px-2 py-2 border text-center ${theme.border} ${theme.text.secondary}`}>
                        {isEditingRow ? (
                          <motion.select
                            whileFocus={{ scale: 1.02 }}
                            value={editingFeeRow.frequency}
                            onChange={e => setEditingFeeRow({ ...editingFeeRow, frequency: e.target.value })}
                            className={`w-full px-2 py-1 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                          >
                            {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </motion.select>
                        ) : (
                          <span className="text-xs">{first?.frequency?.replace('_', ' ')}</span>
                        )}
                      </td>
                      {gridClsForFee.map(cls => {
                        const fs = rowFs.find(f => f.classId === cls.id);
                        return (
                          <td key={cls.id} className={`px-2 py-2 border text-center ${theme.border}`}>
                            {fs ? (
                              (editingCell as any)?.fsId === fs.id ? (
                                <motion.input
                                  autoFocus
                                  type="number"
                                  whileFocus={{ scale: 1.05 }}
                                  value={(editingCell as any).amount}
                                  onChange={e => setEditingCell({ ...(editingCell as any), amount: e.target.value })}
                                  onKeyDown={e => { if (e.key === 'Enter') saveCellEdit(fs); if (e.key === 'Escape') setEditingCell(null); }}
                                  className={`w-20 px-2 py-1 rounded-lg border ${theme.input} text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                                />
                              ) : (
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  className="group flex items-center justify-center gap-2"
                                >
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setEditingCell({ fsId: fs.id, amount: String(fs.amount) } as any)}
                                    className={`text-sm font-bold hover:underline bg-gradient-to-r from-green-500 to-emerald-500 text-transparent bg-clip-text`}
                                    title="Edit cell amount"
                                  >
                                    ₹{fs.amount?.toLocaleString()}
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => deleteFee(fs)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 text-xs hover:bg-red-500/20 rounded px-1 transition-all"
                                    title="Delete cell fee"
                                  >
                                    ✕
                                  </motion.button>
                                </motion.div>
                              )
                            ) : (
                              (addingCell as any)?.feeName === feeName && (addingCell as any)?.classId === cls.id ? (
                                <motion.input
                                  autoFocus
                                  type="number"
                                  whileFocus={{ scale: 1.05 }}
                                  value={(addingCell as any).amount}
                                  onChange={e => setAddingCell({ ...(addingCell as any), amount: e.target.value })}
                                  onKeyDown={e => { if (e.key === 'Enter') saveAddingCell(feeName, cls); if (e.key === 'Escape') setAddingCell(null); }}
                                  placeholder="₹"
                                  className={`w-18 px-2 py-1 rounded-lg border ${theme.input} text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                                />
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setAddingCell({ feeName, classId: cls.id, amount: '' } as any)}
                                  title={`Add ${feeName} for ${cls.name}`}
                                  className={`px-2 py-1 rounded-lg border border-dashed ${theme.border} ${theme.text.muted} hover:border-blue-500 hover:text-blue-500 transition-all`}
                                >
                                  +
                                </motion.button>
                              )
                            )}
                          </td>
                        );
                      })}
                      <td className={`px-2 py-2 border text-center ${theme.border}`}>
                        {isEditingRow ? (
                          <div className="flex items-center justify-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => saveFeeRowEdit(feeName)}
                              disabled={!editingFeeRow.name.trim() || savingFees}
                              title="Save Row"
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold disabled:opacity-40 transition-all"
                            >
                              ✓
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingFeeRow(null)}
                              title="Cancel"
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-bold transition-all"
                            >
                              ✕
                            </motion.button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingFeeRow({ oldName: feeName, name: feeName, category: first?.category || 'tuition', frequency: first?.frequency || 'monthly' })}
                              title="Edit Row"
                              className="text-blue-500 hover:text-blue-600 transition-colors"
                            >
                              ✎
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteFeeRow(feeName)}
                              title="Delete Row"
                              className="text-red-500 hover:text-red-600 transition-colors"
                            >
                              ✕
                            </motion.button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}

                {/* New inline rows */}
                {(newFeeRows as any).map((nr: any) => (
                  <motion.tr
                    key={nr.id}
                    variants={itemVariants}
                    className={`bg-gradient-to-r ${isDark ? 'from-blue-900/20 to-cyan-900/20' : 'from-blue-50/80 to-cyan-50/80'} transition-all`}
                  >
                    <td className={`px-2 py-2 border ${theme.border}`}>
                      <motion.input
                        autoFocus
                        whileFocus={{ scale: 1.02 }}
                        value={nr.name}
                        onChange={e => setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === nr.id ? { ...r, name: e.target.value } : r))}
                        placeholder="Fee name…"
                        className={`w-full px-2 py-1 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                      />
                    </td>
                    <td className={`px-2 py-2 border ${theme.border}`}>
                      <motion.select
                        whileFocus={{ scale: 1.02 }}
                        value={nr.category}
                        onChange={e => setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === nr.id ? { ...r, category: e.target.value } : r))}
                        className={`w-full px-2 py-1 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                      >
                        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </motion.select>
                    </td>
                    <td className={`px-2 py-2 border ${theme.border}`}>
                      <motion.select
                        whileFocus={{ scale: 1.02 }}
                        value={nr.frequency}
                        onChange={e => setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === nr.id ? { ...r, frequency: e.target.value } : r))}
                        className={`w-full px-2 py-1 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                      >
                        {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </motion.select>
                    </td>
                    {gridClsForFee.map(cls => (
                      <td key={cls.id} className={`px-2 py-2 border ${theme.border}`}>
                        <motion.input
                          type="number"
                          min="0"
                          whileFocus={{ scale: 1.02 }}
                          value={nr.amounts[cls.id] || ''}
                          onChange={e => setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === nr.id ? { ...r, amounts: { ...r.amounts, [cls.id]: e.target.value } } : r))}
                          placeholder="₹"
                          className={`w-20 px-2 py-1 rounded-lg border ${theme.input} text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                        />
                      </td>
                    ))}
                    <td className={`px-2 py-2 border ${theme.border}`}>
                      <div className="flex items-center justify-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={!nr.name.trim() || Object.values(nr.amounts).every((a: any) => !parseFloat(a)) || nr.saving}
                          onClick={() => saveFeeRow(nr.id)}
                          title="Save"
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold disabled:opacity-40 transition-all"
                        >
                          {nr.saving ? '…' : '✓'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setNewFeeRows((prev: any) => (prev as any).filter((r: any) => r.id !== nr.id))}
                          title="Cancel"
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-gradient-to-r from-gray-500 to-red-500 text-white text-xs font-bold transition-all"
                        >
                          ✕
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {/* Action buttons row */}
                <tr>
                  <td colSpan={3 + gridClsForFee.length + 1} className={`px-6 py-4 border-t ${theme.border} ${theme.card}`}>
                    <div className="flex items-center justify-between gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!canManageSettings}
                        onClick={() => (setNewFeeRows as any)((prev: any) => [...(prev as any), { id: Date.now().toString(), name: '', category: 'tuition', frequency: 'monthly', dueDate: 1, amounts: {}, saving: false }])}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <motion.div
                          animate={{ rotate: [0, 180] }}
                          transition={{ duration: 0.3 }}
                          className="w-5 h-5 flex items-center justify-center rounded bg-white/20 font-bold text-sm"
                        >
                          +
                        </motion.div>
                        Add Fee Type
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-6 py-3 rounded-lg font-medium bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={!canManageSettings || savingFees || (newFeeRows.length === 0 && !editingCell)}
                        onClick={bulkSaveFees}
                      >
                        {savingFees ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                            </svg>
                            Bulk Save All Changes
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Advanced Fee Structure Modal */}
      <AnimatePresence>
        {showFeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFeeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 ${theme.card} shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${theme.text.primary}`}>
                  {editingFee ? 'Edit Fee Structure' : 'Create New Fee Structure'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFeeModal(false)}
                  className={`w-8 h-8 rounded-full ${theme.hover} ${theme.text.secondary} hover:text-red-500 transition-all`}
                >
                  ✕
                </motion.button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Fee Name</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.name || ''}
                    onChange={e => setFeeForm({ ...feeForm, name: e.target.value })}
                    placeholder="e.g. Tuition Fee"
                  />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Category</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.category || 'tuition'}
                    onChange={e => setFeeForm({ ...feeForm, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </motion.select>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Amount (₹)</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="number"
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.amount || 0}
                    onChange={e => setFeeForm({ ...feeForm, amount: parseFloat(e.target.value) || 0 })}
                  />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Frequency</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.frequency || 'monthly'}
                    onChange={e => setFeeForm({ ...feeForm, frequency: e.target.value })}
                  >
                    {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </motion.select>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Due Date (Day of Month)</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="number"
                    min={1}
                    max={28}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.dueDate || 1}
                    onChange={e => setFeeForm({ ...feeForm, dueDate: parseInt(e.target.value) || 1 })}
                  />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Late Fee (₹/day)</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="number"
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.lateFee || 0}
                    onChange={e => setFeeForm({ ...feeForm, lateFee: parseFloat(e.target.value) || 0 })}
                  />
                </motion.div>
                
                <motion.div variants={itemVariants} className="md:col-span-2">
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Description</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.description || ''}
                    onChange={e => setFeeForm({ ...feeForm, description: e.target.value })}
                  />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Academic Year *</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.academicYearId || ''}
                    onChange={e => setFeeForm({ ...feeForm, academicYearId: e.target.value, mediumId: null, classId: null })}
                  >
                    <option value="">Select...</option>
                    {academicYears.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </motion.select>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Board *</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.boardId || ''}
                    onChange={e => setFeeForm({ ...feeForm, boardId: e.target.value || null })}
                  >
                    <option value="">Select Board...</option>
                    {boards.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </motion.select>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Medium{modalLoading ? ' (loading...)' : ''} *</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.mediumId || ''}
                    onChange={e => setFeeForm({ ...feeForm, mediumId: e.target.value || null, classId: null })}
                    disabled={modalLoading}
                  >
                    <option value="">Select Medium...</option>
                    {modalMediums.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </motion.select>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Class{modalLoading ? ' (loading...)' : ''} *</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.classId || ''}
                    onChange={e => setFeeForm({ ...feeForm, classId: e.target.value || null })}
                    disabled={modalLoading}
                  >
                    <option value="">Select Class...</option>
                    {(feeForm.mediumId ? modalClasses.filter((c: any) => c.mediumId === feeForm.mediumId) : modalClasses).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </motion.select>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Applicable Categories</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={feeForm.applicableCategories || 'all'}
                    onChange={e => setFeeForm({ ...feeForm, applicableCategories: e.target.value })}
                    placeholder="all, General, OBC, SC, ST"
                  />
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex items-center gap-3 pt-6">
                  <motion.input
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="checkbox"
                    checked={feeForm.isActive !== false}
                    onChange={e => setFeeForm({ ...feeForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={theme.text.primary}>Active</span>
                </motion.div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={saving || !feeForm.name || !feeForm.academicYearId || !feeForm.boardId || !feeForm.mediumId || !feeForm.classId}
                  onClick={saveFee}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Saving...
                    </span>
                  ) : (
                    editingFee ? 'Update Fee Structure' : 'Create Fee Structure'
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-6 py-3 rounded-lg font-medium ${theme.hover} ${theme.text.secondary} transition-all`}
                  onClick={() => setShowFeeModal(false)}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clone Modal */}
      <AnimatePresence>
        {showCloneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCloneModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-2xl p-8 ${theme.card} shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${theme.text.primary}`}>Clone Fee Structures</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCloneModal(false)}
                  className={`w-8 h-8 rounded-full ${theme.hover} ${theme.text.secondary} hover:text-red-500 transition-all`}
                >
                  ✕
                </motion.button>
              </div>
              
              <p className={`${theme.text.secondary} mb-6`}>
                Copy all fee structures from one academic year to another. Amounts, categories, and assignments will be preserved.
              </p>
              
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Source Academic Year</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={cloneSource}
                    onChange={e => setCloneSource(e.target.value)}
                  >
                    <option value="">Select source...</option>
                    {academicYears.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({feeStructures.filter((f: any) => f.academicYearId === a.id).length} structures)
                      </option>
                    ))}
                  </motion.select>
                </motion.div>
                
                <div className="text-center text-2xl">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ⬇️
                  </motion.div>
                </div>
                
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium ${theme.text.secondary} mb-2`}>Target Academic Year</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={cloneTarget}
                    onChange={e => setCloneTarget(e.target.value)}
                  >
                    <option value="">Select target...</option>
                    {academicYears.filter((a: any) => a.id !== cloneSource).map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </motion.select>
                </motion.div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium ${theme.hover} ${theme.text.secondary} transition-all`}
                  onClick={() => setShowCloneModal(false)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={!cloneSource || !cloneTarget || saving}
                  onClick={handleClone}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Cloning...
                    </span>
                  ) : (
                    'Clone Structures'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
