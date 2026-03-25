'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { showToast } from '../utils';
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
  card: string;
  heading: string;
  subtext: string;
  btnPrimary: string;
  input: string;
  label: string;
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
  card,
  heading,
  subtext,
  btnPrimary,
  input,
  label,
}) => {
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
      showToast({ type: 'success', title: 'Fee row updated' });
    } catch {
      showToast({ type: 'error', title: 'Failed to update fee row' });
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
      showToast({ type: 'success', title: 'Fee row deleted' });
    } catch {
      showToast({ type: 'error', title: 'Failed to delete fee row' });
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
    } catch { showToast({ type: 'error', title: 'Update failed' }); }
    setEditingCell(null);
  };

  const bulkSaveFees = async () => {
    console.log('Bulk save clicked! newFeeRows length:', newFeeRows.length);
    console.log('editingCell:', editingCell);
    console.log('canManageSettings:', canManageSettings);
    console.log('savingFees:', savingFees);
    
    if (!canManageSettings) return;
    setSavingFees(true);
    try {
      const promises = [];
      
      // Save edited cell first
      if (editingCell && (editingCell as any).fsId && (editingCell as any).amount) {
        console.log('Saving edited cell:', editingCell);
        const fs = feeStructures.find(f => f.id === (editingCell as any).fsId);
        if (fs) {
          promises.push(feeStructuresApi.update(fs.id, { ...fs, amount: parseFloat((editingCell as any).amount) || 0 }));
        }
      }
      
      // Save all new fee rows
      for (const nr of newFeeRows as any[]) {
        console.log('Processing new fee row:', nr);
        if (nr.name.trim()) {
          const toCreate = gridClsForFee.filter(cls => parseFloat(nr.amounts[cls.id] || '0') > 0);
          console.log('Classes to create for:', nr.name, toCreate.length);
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
        showToast({ type: 'success', title: 'Fee structures saved successfully' });
        await fetchAll();
        setNewFeeRows([]);
        setEditingCell(null); // Clear editing cell after save
      } else {
        showToast({ type: 'info', title: 'No fees to save', message: 'Add some fee amounts first' });
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Failed to save fee structures', message: e.message });
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
        showToast({ type: 'success', title: 'Fee structure updated' });
      } else {
        await feeStructuresApi.create(payload);
        showToast({ type: 'success', title: 'Fee structure created' });
      }
      setShowFeeModal(false);
      fetchAll();
    } catch (e: any) {
      showToast({ type: 'error', title: 'Save failed', message: e.message });
    }
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
    try {
      const res = await feeStructuresApi.clone(cloneSource, cloneTarget);
      showToast({ type: 'success', title: `${(res as any).cloned} fee structures cloned` });
      setShowCloneModal(false);
      fetchAll();
    } catch (e: any) {
      showToast({ type: 'error', title: 'Clone failed', message: e.message });
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
                {gridClsForFee.length === 0 && <th rowSpan={2} className={`px-3 py-1.5 text-center border ${isDark ? 'border-gray-500 bg-gray-700 text-gray-500' : 'border-gray-400 bg-gray-50 text-gray-400'}`}>← Select AY & configure classes</th>}
                {medGroupList.map(([medId, med]: any) => (
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
                const isEditingRow = editingFeeRow?.oldName === feeName;
                return (
                  <tr key={feeName} className={`${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50'}`}>
                    <td className={`px-3 py-1 border font-medium ${isDark ? 'border-gray-600 bg-gray-800/30 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-800'}`}>
                      {isEditingRow ? (
                        <input
                          autoFocus
                          value={editingFeeRow.name}
                          onChange={e => setEditingFeeRow({ ...editingFeeRow, name: e.target.value })}
                          className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        feeName
                      )}
                    </td>
                    <td className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      {isEditingRow ? (
                        <select value={editingFeeRow.category} onChange={e => setEditingFeeRow({ ...editingFeeRow, category: e.target.value })} className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{first?.category}</span>
                      )}
                    </td>
                    <td className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                      {isEditingRow ? (
                        <select value={editingFeeRow.frequency} onChange={e => setEditingFeeRow({ ...editingFeeRow, frequency: e.target.value })} className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                          {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      ) : (
                        first?.frequency?.replace('_', ' ')
                      )}
                    </td>
                    {gridClsForFee.map(cls => {
                      const fs = rowFs.find(f => f.classId === cls.id);
                      return (
                        <td key={cls.id} className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                          {fs ? (
                            (editingCell as any)?.fsId === fs.id ? (
                              <input
                                autoFocus type="number"
                                value={(editingCell as any).amount}
                                onChange={e => setEditingCell({ ...(editingCell as any), amount: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') saveCellEdit(fs); if (e.key === 'Escape') setEditingCell(null); }}
                                className={`w-16 px-1 py-0.5 rounded border text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                              />
                            ) : (
                              <div className="group flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setEditingCell({ fsId: fs.id, amount: String(fs.amount) } as any)}
                                  className={`text-xs font-semibold hover:underline ${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-700 hover:text-green-800'}`}
                                  title="Edit cell amount"
                                >₹{fs.amount?.toLocaleString()}</button>
                                <button onClick={() => deleteFee(fs)} className="opacity-0 group-hover:opacity-100 text-red-500 text-[10px] hover:bg-red-500/20 rounded px-1 transition-all" title="Delete cell fee">✕</button>
                              </div>
                            )
                          ) : (
                            (addingCell as any)?.feeName === feeName && (addingCell as any)?.classId === cls.id ? (
                              <input
                                autoFocus type="number"
                                value={(addingCell as any).amount}
                                onChange={e => setAddingCell({ ...(addingCell as any), amount: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') saveAddingCell(feeName, cls); if (e.key === 'Escape') setAddingCell(null); }}
                                placeholder="₹"
                                className={`w-14 px-1 py-0.5 rounded border text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-300'}`}
                              />
                            ) : (
                              <button
                                onClick={() => setAddingCell({ feeName, classId: cls.id, amount: '' } as any)}
                                title={`Add ${feeName} for ${cls.name}`}
                                className={`text-xs px-1 rounded border border-dashed transition-all ${isDark ? 'border-gray-700 text-gray-700 hover:border-blue-600 hover:text-blue-500' : 'border-gray-300 text-gray-300 hover:border-blue-400 hover:text-blue-500'}`}
                              >+</button>
                            )
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      {isEditingRow ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => saveFeeRowEdit(feeName)} disabled={!editingFeeRow.name.trim() || savingFees} title="Save Row" className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-40 transition-all">✓</button>
                          <button onClick={() => setEditingFeeRow(null)} title="Cancel" className="w-5 h-5 flex items-center justify-center rounded bg-gray-400 hover:bg-gray-500 text-white text-xs font-bold transition-all">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => setEditingFeeRow({ oldName: feeName, name: feeName, category: first?.category || 'tuition', frequency: first?.frequency || 'monthly' })} title="Edit Row" className={`text-xs px-0.5 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>✎</button>
                          <button onClick={() => deleteFeeRow(feeName)} title="Delete Row" className={`text-xs px-0.5 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}>✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* New inline rows */}
              {(newFeeRows as any).map((nr: any) => (
                <tr key={nr.id} className={isDark ? 'bg-blue-900/15' : 'bg-blue-50/80'}>
                  <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                    <input autoFocus value={nr.name}
                      onChange={e => setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === nr.id ? { ...r, name: e.target.value } : r))}
                      placeholder="Fee name…"
                      className={`w-full px-1.5 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                    />
                  </td>
                  <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                    <select value={nr.category} onChange={e => setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === nr.id ? { ...r, category: e.target.value } : r))}
                      className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </td>
                  <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                    <select value={nr.frequency} onChange={e => setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === nr.id ? { ...r, frequency: e.target.value } : r))}
                      className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </td>
                  {gridClsForFee.map(cls => (
                    <td key={cls.id} className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                      <input type="number" min="0"
                        value={nr.amounts[cls.id] || ''}
                        onChange={e => setNewFeeRows((prev: any) => (prev as any).map((r: any) => r.id === nr.id ? { ...r, amounts: { ...r.amounts, [cls.id]: e.target.value } } : r))}
                        placeholder="₹"
                        className={`w-16 px-1 py-0.5 rounded border text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-300'}`}
                      />
                    </td>
                  ))}
                  <td className={`px-1 py-1 border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                    <div className="flex items-center justify-center gap-0.5">
                      <button disabled={!nr.name.trim() || Object.values(nr.amounts).every((a: any) => !parseFloat(a)) || nr.saving}
                        onClick={() => saveFeeRow(nr.id)} title="Save"
                        className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-40 transition-all"
                      >{nr.saving ? '…' : '✓'}</button>
                      <button onClick={() => setNewFeeRows((prev: any) => (prev as any).filter((r: any) => r.id !== nr.id))} title="Cancel"
                        className="w-5 h-5 flex items-center justify-center rounded bg-gray-400 hover:bg-red-400 text-white text-xs font-bold transition-all"
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Action buttons row */}
              <tr>
                <td colSpan={3 + gridClsForFee.length + 1} className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <button disabled={!canManageSettings}
                      onClick={() => (setNewFeeRows as any)((prev: any) => [...(prev as any), { id: Date.now().toString(), name: '', category: 'tuition', frequency: 'monthly', dueDate: 1, amounts: {}, saving: false }])}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-40 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-blue-500 text-white font-bold text-sm leading-none">+</span>
                      Add fee type
                    </button>
                    <button 
                      className={btnPrimary} 
                      disabled={!canManageSettings || savingFees || (newFeeRows.length === 0 && !editingCell)} 
                      onClick={() => {
                        console.log('Bulk save button clicked!');
                        bulkSaveFees();
                      }}
                    >
                      {savingFees ? 'Saving...' : '💾 Bulk Save'}
                    </button>
                  </div>
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
                <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} onClick={() => setShowFeeModal(false)}>Cancel</button>
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
                <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} onClick={() => setShowCloneModal(false)}>Cancel</button>
                <button className={btnPrimary} disabled={!cloneSource || !cloneTarget || saving} onClick={handleClone}>{saving ? 'Cloning...' : 'Clone'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
