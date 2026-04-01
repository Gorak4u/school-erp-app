'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/lib/toastUtils';
import { LEVELS } from '../constants';
import { Board, Medium, Class, Section, AcademicYear } from '../types';

interface StructureTabProps {
  isDark: boolean;
  canManageSettings: boolean;
  boards: Board[];
  mediums: Medium[];
  classes: Class[];
  sections: Section[];
  academicYears: AcademicYear[];
  activeAY: AcademicYear | null;
  openCreate: (type: string, initialData: any) => void;
  openEdit: (type: string, data: any) => void;
  handleDelete: (entity: string, id: string, name: string) => void;
  fetchAll: () => void;
  boardsApi: any;
  mediumsApi: any;
  classesApi: any;
  sectionsApi: any;
  searchQuery?: string;
}

export const StructureTab: React.FC<StructureTabProps> = ({
  isDark,
  canManageSettings,
  boards,
  mediums,
  classes,
  sections,
  academicYears,
  activeAY,
  openCreate,
  openEdit,
  handleDelete,
  fetchAll,
  boardsApi,
  mediumsApi,
  classesApi,
  sectionsApi,
  searchQuery,
}) => {
  // Filter classes based on search query
  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    
    const query = searchQuery.toLowerCase();
    return classes.filter(cls => 
      cls.name.toLowerCase().includes(query) ||
      cls.code.toLowerCase().includes(query) ||
      cls.level.toString().includes(query)
    );
  }, [classes, searchQuery]);

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

  // ─── Boards ─────────────────────────────────────────────────────────────────
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [savingBoards, setSavingBoards] = useState(false);

  const saveBoardRowEdit = async (board: Board) => {
    if (!editingBoard?.name.trim()) return;
    setSavingBoards(true);
    try {
      await boardsApi.update(board.id, { ...board, name: editingBoard.name.trim(), code: editingBoard.code.trim() });
      await fetchAll();
      setEditingBoard(null);
      showSuccessToast('Success', 'Board updated successfully');
    } catch {
      showErrorToast('Error', 'Failed to update board');
    } finally {
      setSavingBoards(false);
    }
  };

  const deleteBoardRow = async (board: Board) => {
    handleDelete('board', board.id, board.name);
  };

  // ─── Mediums ────────────────────────────────────────────────────────────────
  const [editingMedium, setEditingMedium] = useState<Medium | null>(null);
  const [savingMediums, setSavingMediums] = useState(false);
  const [selectedMediumAY, setSelectedMediumAY] = useState<string>(activeAY?.id || '');

  const saveMediumRowEdit = async (medium: Medium) => {
    if (!editingMedium?.name.trim()) return;
    setSavingMediums(true);
    try {
      await mediumsApi.update(medium.id, { ...medium, name: editingMedium.name.trim(), code: editingMedium.code.trim() });
      await fetchAll();
      setEditingMedium(null);
      showSuccessToast('Success', 'Medium updated successfully');
    } catch {
      showErrorToast('Error', 'Failed to update medium');
    } finally {
      setSavingMediums(false);
    }
  };

  const deleteMediumRow = async (medium: Medium) => {
    handleDelete('medium', medium.id, medium.name);
  };

  // ─── Classes — 2D Excel Grid ────────────────────────────────────────────────
  const gridMediums = useMemo(() => {
    return selectedMediumAY 
      ? mediums.filter((m: Medium) => m.academicYearId === selectedMediumAY)
      : mediums;
  }, [mediums, selectedMediumAY]);

  const [newRows, setNewRows] = useState<any[]>([]);
  const [editingClassRow, setEditingClassRow] = useState<{ oldName: string, name: string, selectedMediums?: string[], level?: string } | null>(null);
  const [savingClasses, setSavingClasses] = useState(false);

  const addNewRow = () => {
    const id = Date.now().toString();
    setNewRows(prev => [...prev, { id, name: '', level: 'primary', selectedMediums: new Set(), amounts: {} }]);
  };

  const handleDraftChange = (rowId: string, field: string, value: any) => {
    setNewRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  const toggleMedium = (rowId: string, mediumId: string) => {
    setNewRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const selected = new Set(r.selectedMediums || []);
      if (selected.has(mediumId)) selected.delete(mediumId);
      else selected.add(mediumId);
      return { ...r, selectedMediums: selected };
    }));
  };

  const saveRow = async (rowId: string) => {
    const nr = newRows.find((r: any) => r.id === rowId);
    if (!nr || !nr.name.trim()) return;
    const toCreate = gridMediums.filter((m: Medium) => (nr.selectedMediums || new Set()).has(m.id));
    if (toCreate.length === 0) return;
    setNewRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: true } : r));
    try {
      await Promise.all(toCreate.map((m: Medium) => classesApi.create({
        name: nr.name.trim(),
        code: `${m.code}-${nr.name}`.toUpperCase(),
        level: nr.level,
        isActive: true,
        academicYearId: selectedMediumAY || activeAY?.id || '',
        mediumId: m.id,
      })));
      await fetchAll();
      setNewRows(prev => prev.filter((r: any) => r.id !== rowId));
      showSuccessToast('Success', 'Class created successfully');
    } catch {
      setNewRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: false } : r));
      showErrorToast('Error', 'Failed to create class');
    }
  };

  const saveClassRowEdit = async (oldName: string) => {
    if (!editingClassRow?.name.trim()) return;
    const rowClasses = classes.filter((c: Class) => c.name === oldName && (!selectedMediumAY || c.academicYearId === selectedMediumAY));
    setSavingClasses(true);
    try {
      // Handle medium changes
      if (editingClassRow.selectedMediums) {
        // Get all current mediums for this class name
        const currentMediumIds = new Set(rowClasses.map((c: Class) => c.mediumId));
        const selectedMediumIds = new Set(editingClassRow.selectedMediums);
        
        // Find mediums to add (selected but not current)
        const mediumsToAdd = editingClassRow.selectedMediums.filter(id => !currentMediumIds.has(id));
        
        // Find mediums to remove (current but not selected)
        const mediumsToRemove = rowClasses.filter((c: Class) => !selectedMediumIds.has(c.mediumId));
        
        // Add new class-medium associations
        if (mediumsToAdd.length > 0) {
          await Promise.all(mediumsToAdd.map((mediumId: string) => {
            const medium = mediums.find((m: Medium) => m.id === mediumId);
            return classesApi.create({
              name: editingClassRow.name.trim(),
              code: `${medium?.code}-${editingClassRow.name}`.toUpperCase(),
              level: editingClassRow.level || 'primary',
              isActive: true,
              academicYearId: selectedMediumAY || activeAY?.id || '',
              mediumId: mediumId,
            });
          }));
        }
        
        // Remove class-medium associations
        if (mediumsToRemove.length > 0) {
          await Promise.all(mediumsToRemove.map((c: Class) => classesApi.delete(c.id)));
        }
        
        // Update name and level for existing classes (if name or level changed)
        if (editingClassRow.name.trim() !== oldName || editingClassRow.level) {
          const remainingClasses = rowClasses.filter((c: Class) => selectedMediumIds.has(c.mediumId));
          if (remainingClasses.length > 0) {
            await Promise.all(remainingClasses.map((c: Class) => 
              classesApi.update(c.id, { 
                ...c, 
                name: editingClassRow.name.trim(),
                level: editingClassRow.level || c.level
              })
            ));
          }
        }
      } else {
        // Just update name and level if no medium changes
        await Promise.all(rowClasses.map((c: Class) => 
          classesApi.update(c.id, { 
            ...c, 
            name: editingClassRow.name.trim(),
            level: editingClassRow.level || c.level
          })
        ));
      }
      
      await fetchAll();
      setEditingClassRow(null);
      showSuccessToast('Success', 'Class updated successfully');
    } catch {
      showErrorToast('Error', 'Failed to update class');
    } finally {
      setSavingClasses(false);
    }
  };

  const deleteClassRow = async (className: string) => {
    if (!confirm(`Delete all classes for "${className}"?`)) return;
    const rowClasses = classes.filter((c: Class) => c.name === className && (!selectedMediumAY || c.academicYearId === selectedMediumAY));
    setSavingClasses(true);
    try {
      await Promise.all(rowClasses.map((c: Class) => classesApi.delete(c.id)));
      await fetchAll();
      showSuccessToast('Success', 'Class row deleted');
    } catch {
      showErrorToast('Error', 'Failed to delete class row');
    } finally {
      setSavingClasses(false);
    }
  };

  const bulkSaveClasses = async () => {
    if (!canManageSettings) return;
    setSavingClasses(true);
    try {
      const promises: Promise<any>[] = [];
      
      for (const nr of newRows) {
        if (nr.name.trim()) {
          const selectedMediums = nr.selectedMediums || new Set();
          const toCreate = gridMediums.filter((m: Medium) => selectedMediums.has(m.id));
          
          for (const m of toCreate) {
            promises.push(classesApi.create({
              name: nr.name.trim(),
              code: `${m.code}-${nr.name}`.toUpperCase(),
              level: nr.level,
              isActive: true,
              academicYearId: selectedMediumAY || activeAY?.id || '',
              mediumId: m.id,
            }));
          }
        }
      }
      
      if (promises.length > 0) {
        await Promise.all(promises);
        showSuccessToast('Success', 'Classes saved successfully');
        await fetchAll();
        setNewRows([]);
      } else {
        showWarningToast('No classes to save', 'Please add class names and select at least one medium for each');
      }
    } catch (e: any) {
      console.error('Bulk save error:', e);
      showErrorToast('Failed to save classes', e.message);
    } finally {
      setSavingClasses(false);
    }
  };

  // ─── Sections — 2D Excel Grid ─────────────────────────────────────────────
  const [filterSectionMedium, setFilterSectionMedium] = useState<string>('');
  const [selectedSectionAY, setSelectedSectionAY] = useState<string>('');
  const [sectionRows, setSectionRows] = useState<any[]>([]);
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, any>>({});
  const [editingSectionRow, setEditingSectionRow] = useState<{ oldName: string, name: string, selectedClasses?: string[] } | null>(null);
  const [savingSections, setSavingSections] = useState(false);

  // Set default academic year when activeAY is available
  useEffect(() => {
    if (activeAY?.id && !selectedSectionAY) {
      setSelectedSectionAY(activeAY.id);
    }
  }, [activeAY, selectedSectionAY]);

  const sectionGridClasses = useMemo(() => {
    let filteredClasses = filterSectionMedium 
      ? classes.filter((c: Class) => c.mediumId === filterSectionMedium)
      : classes;
    
    if (selectedSectionAY) {
      filteredClasses = filteredClasses.filter((c: Class) => c.academicYearId === selectedSectionAY);
    }
    
    return filteredClasses;
  }, [classes, filterSectionMedium, selectedSectionAY]);

  const uniqueSectionNames = useMemo(() => {
    const names = new Set(sections.map((s: Section) => s.name));
    return Array.from(names).sort();
  }, [sections]);

  const addSectionRow = () => {
    const id = Date.now().toString();
    setSectionRows(prev => [...prev, { id }]);
    setSectionDrafts(prev => ({ ...prev, [id]: { name: '', selectedClasses: new Set() } }));
  };

  const handleSectionDraftChange = (rowId: string, field: string, value: any) => {
    setSectionDrafts(prev => ({ ...prev, [rowId]: { ...prev[rowId], [field]: value } }));
  };

  const toggleSectionClass = (rowId: string, classId: string) => {
    setSectionDrafts(prev => {
      const draft = prev[rowId] || { selectedClasses: new Set() };
      const selected = new Set(draft.selectedClasses);
      if (selected.has(classId)) selected.delete(classId);
      else selected.add(classId);
      return { ...prev, [rowId]: { ...draft, selectedClasses: selected } };
    });
  };

  const saveSectionRow = async (rowId: string) => {
    const draft = sectionDrafts[rowId];
    if (!draft?.name?.trim() || draft?.selectedClasses?.size === 0) return;
    setSectionRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: true } : r));
    try {
      const toCreate = sectionGridClasses.filter((c: Class) => draft.selectedClasses.has(c.id));
      await Promise.all(toCreate.map((c: Class) => sectionsApi.create({
        name: draft.name.trim(),
        code: `${c.code || 'CLASS'}-${draft.name.trim()}`.toUpperCase(),
        classId: c.id,
        isActive: true,
      })));
      await fetchAll();
      setSectionRows(prev => prev.filter((r: any) => r.id !== rowId));
      setSectionDrafts(prev => {
        const { [rowId]: _, ...rest } = prev;
        return rest;
      });
      showSuccessToast('Success', 'Section created successfully');
    } catch {
      setSectionRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: false } : r));
      showErrorToast('Error', 'Failed to create section');
    }
  };

  const saveSectionRowEdit = async (oldName: string) => {
    if (!editingSectionRow?.name.trim()) return;
    const rowSections = sections.filter((s: Section) => s.name === oldName && (!selectedSectionAY || s.academicYearId === selectedSectionAY));
    setSavingSections(true);
    try {
      // Handle class changes
      if (editingSectionRow.selectedClasses) {
        // Get all current classes for this section name
        const currentClassIds = new Set(rowSections.map((s: Section) => s.classId));
        const selectedClassIds = new Set(editingSectionRow.selectedClasses);
        
        // Find classes to add (selected but not current)
        const classesToAdd = editingSectionRow.selectedClasses.filter(id => !currentClassIds.has(id));
        
        // Find classes to remove (current but not selected)
        const classesToRemove = rowSections.filter((s: Section) => !selectedClassIds.has(s.classId));
        
        // Add new section-class associations
        if (classesToAdd.length > 0) {
          await Promise.all(classesToAdd.map((classId: string) => {
            const cls = sectionGridClasses.find((c: Class) => c.id === classId);
            return sectionsApi.create({
              name: editingSectionRow.name.trim(),
              code: `${cls?.code || 'CLASS'}-${editingSectionRow.name}`.toUpperCase(),
              classId: classId,
              academicYearId: selectedSectionAY || cls?.academicYearId || activeAY?.id || '',
              isActive: true,
            });
          }));
        }
        
        // Remove section-class associations
        if (classesToRemove.length > 0) {
          await Promise.all(classesToRemove.map((s: Section) => sectionsApi.delete(s.id)));
        }
        
        // Update name for existing sections (if name changed)
        if (editingSectionRow.name.trim() !== oldName) {
          const remainingSections = rowSections.filter((s: Section) => selectedClassIds.has(s.classId));
          if (remainingSections.length > 0) {
            await Promise.all(remainingSections.map((s: Section) => 
              sectionsApi.update(s.id, { ...s, name: editingSectionRow.name.trim() })
            ));
          }
        }
      } else {
        // Just update name if no class changes
        await Promise.all(rowSections.map((s: Section) => sectionsApi.update(s.id, { ...s, name: editingSectionRow.name.trim() })));
      }
      
      await fetchAll();
      setEditingSectionRow(null);
      showSuccessToast('Success', 'Section updated successfully');
    } catch {
      showErrorToast('Error', 'Failed to update section');
    } finally {
      setSavingSections(false);
    }
  };

  const toggleEditingSectionClass = (classId: string) => {
    if (!editingSectionRow) return;
    const selectedClasses = editingSectionRow.selectedClasses || [];
    if (selectedClasses.includes(classId)) {
      setEditingSectionRow({ ...editingSectionRow, selectedClasses: selectedClasses.filter(id => id !== classId) });
    } else {
      setEditingSectionRow({ ...editingSectionRow, selectedClasses: [...selectedClasses, classId] });
    }
  };

  const deleteSectionRow = async (sectionName: string) => {
    if (!confirm(`Delete all sections for "${sectionName}"?`)) return;
    const rowSections = sections.filter((s: Section) => s.name === sectionName);
    setSavingSections(true);
    try {
      await Promise.all(rowSections.map((s: Section) => sectionsApi.delete(s.id)));
      await fetchAll();
      showSuccessToast('Success', 'Section row deleted');
    } catch {
      showErrorToast('Error', 'Failed to delete section row');
    } finally {
      setSavingSections(false);
    }
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </motion.div>
              
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r ${theme.gradients.primary} bg-clip-text text-transparent`}>
                  Advanced School Structure
                </h1>
                <p className={`text-sm ${theme.text.secondary} mt-1`}>
                  Manage boards, mediums, classes, and sections • {boards.length} boards • {mediums.length} mediums • {classes.length} classes • {sections.length} sections
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
                  Export Structure
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Boards - Advanced Card Grid */}
      <motion.div
        variants={itemVariants}
        className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Educational Boards</h3>
            <p className={`text-sm ${theme.text.secondary} mt-1`}>Manage examination boards and educational standards</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all`}
            disabled={!canManageSettings}
            onClick={() => openCreate('board', { name: '', code: '', description: '', isActive: true })}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Board
            </span>
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board: Board, index) => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.card} p-6 shadow-sm hover:shadow-lg transition-all`}
            >
              {editingBoard?.id === board.id ? (
                <div className="space-y-4">
                  <input 
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${theme.input}`}
                    value={editingBoard.name} 
                    onChange={e => setEditingBoard({ ...editingBoard, name: e.target.value })} 
                    placeholder="Board name"
                  />
                  <input 
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${theme.input}`}
                    value={editingBoard.code} 
                    onChange={e => setEditingBoard({ ...editingBoard, code: e.target.value })} 
                    placeholder="Code"
                  />
                  <div className="flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all`}
                      disabled={!editingBoard.name.trim() || savingBoards}
                      onClick={() => saveBoardRowEdit(board)}
                    >
                      Save
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium ${theme.hover} ${theme.text.primary} border ${theme.border} transition-all`}
                      onClick={() => setEditingBoard(null)}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className={`font-semibold ${theme.text.primary}`}>{board.name}</h4>
                      <p className={`text-sm ${theme.text.secondary} mt-1`}>{board.code}</p>
                    </div>
                    <div className="flex gap-1">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-2 rounded-lg ${theme.hover} ${theme.text.secondary} transition-all`}
                        onClick={() => setEditingBoard(board)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-2 rounded-lg ${theme.hover} text-red-400 transition-all`}
                        onClick={() => deleteBoardRow(board)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                  <p className={`text-sm ${theme.text.secondary}`}>{board.description || 'No description available'}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${board.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs ${theme.text.muted}`}>
                      {board.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          ))}
          
          {boards.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`col-span-full text-center py-12 rounded-2xl border-2 border-dashed ${theme.border} ${theme.card}`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>No Boards Configured</h3>
              <p className={`text-sm ${theme.text.secondary} mb-4`}>Start by adding your first educational board</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all`}
                onClick={() => openCreate('board', { name: '', code: '', description: '', isActive: true })}
              >
                Add Your First Board
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Mediums - Advanced Card Grid */}
      <motion.div
        variants={itemVariants}
        className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Mediums of Instruction</h3>
            <p className={`text-sm ${theme.text.secondary} mt-1`}>Manage language mediums and teaching methods</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${theme.input}`}
              value={selectedMediumAY}
              onChange={e => setSelectedMediumAY(e.target.value)}
            >
              <option value="">All Academic Years</option>
              {academicYears.map((ay: AcademicYear) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all`}
              disabled={!canManageSettings || !activeAY}
              onClick={() => openCreate('medium', { name: '', code: '', academicYearId: activeAY?.id, isActive: true })}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Medium
              </span>
            </motion.button>
          </div>
        </div>
        
        {!activeAY && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-xl border-l-4 bg-gradient-to-r ${theme.gradients.warning} bg-opacity-10 border-orange-500`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className={`text-sm font-medium ${theme.text.primary}`}>Create an academic year first to add mediums</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mediums.map((medium: Medium, index) => (
            <motion.div
              key={medium.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.card} p-5 shadow-sm hover:shadow-lg transition-all`}
            >
              {editingMedium?.id === medium.id ? (
                <div className="space-y-3">
                  <input 
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${theme.input}`}
                    value={editingMedium.name} 
                    onChange={e => setEditingMedium({ ...editingMedium, name: e.target.value })} 
                    placeholder="Medium name"
                  />
                  <input 
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${theme.input}`}
                    value={editingMedium.code} 
                    onChange={e => setEditingMedium({ ...editingMedium, code: e.target.value })} 
                    placeholder="Code"
                  />
                  <div className="flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all`}
                      disabled={!editingMedium.name.trim() || savingMediums}
                      onClick={() => saveMediumRowEdit(medium)}
                    >
                      Save
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium ${theme.hover} ${theme.text.primary} border ${theme.border} transition-all`}
                      onClick={() => setEditingMedium(null)}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-semibold ${theme.text.primary} truncate`}>{medium.name}</h4>
                      <p className={`text-sm ${theme.text.secondary}`}>{medium.code}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-2 rounded-lg ${theme.hover} ${theme.text.secondary} transition-all`}
                        onClick={() => setEditingMedium(medium)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-2 rounded-lg ${theme.hover} text-red-400 transition-all`}
                        onClick={() => deleteMediumRow(medium)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${medium.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs ${theme.text.muted}`}>
                      {medium.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          ))}
          
          {mediums.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`col-span-full text-center py-12 rounded-2xl border-2 border-dashed ${theme.border} ${theme.card}`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>No Mediums Configured</h3>
              <p className={`text-sm ${theme.text.secondary} mb-4`}>Add instruction mediums for your academic programs</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Classes - Advanced Excel-like Grid */}
      <motion.div
        variants={itemVariants}
        className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Class Management</h3>
            <p className={`text-sm ${theme.text.secondary} mt-1`}>Excel-like interface for bulk class creation and management</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all ${theme.input}`}
              value={selectedMediumAY}
              onChange={e => setSelectedMediumAY(e.target.value)}
            >
              <option value="">All Academic Years</option>
              {academicYears.map((ay: AcademicYear) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all`}
              disabled={!canManageSettings}
              onClick={addNewRow}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Class Row
              </span>
            </motion.button>
          </div>
        </div>

        {!activeAY && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-xl border-l-4 bg-gradient-to-r ${theme.gradients.warning} bg-opacity-10 border-orange-500`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className={`text-sm font-medium ${theme.text.primary}`}>Create an academic year first to manage classes</p>
            </div>
          </motion.div>
        )}

        <div className="overflow-x-auto">
          <table className={`w-full text-sm border-collapse ${theme.text.primary}`}>
            <thead>
              <tr>
                <th className={`px-4 py-3 text-left font-semibold border ${theme.border} ${theme.card}`}>Class Name</th>
                <th className={`px-4 py-3 text-left font-semibold border ${theme.border} ${theme.card}`}>Level</th>
                {gridMediums.map((m: Medium) => (
                  <th key={m.id} className={`px-4 py-3 text-center font-semibold border ${theme.border} ${theme.card}`}>
                    <div className="flex items-center justify-center gap-2">
                      <span>{m.name}</span>
                      <div className={`w-2 h-2 rounded-full ${m.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </th>
                ))}
                <th className={`px-4 py-3 text-center border ${theme.border} ${theme.card}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Existing Class Rows */}
              {[...new Set(filteredClasses.filter((c: Class) => !selectedMediumAY || c.academicYearId === selectedMediumAY).map((c: Class) => c.name))].sort().map((className: string) => {
                const rowClasses = filteredClasses.filter((c: Class) => c.name === className && (!selectedMediumAY || c.academicYearId === selectedMediumAY));
                const first = rowClasses[0];
                const isEditingRow = editingClassRow?.oldName === className;
                return (
                  <motion.tr 
                    key={className} 
                    className={`${theme.hover} transition-colors`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <td className={`px-4 py-3 border ${theme.border}`}>
                      {isEditingRow ? (
                        <input
                          autoFocus
                          value={editingClassRow.name}
                          onChange={e => setEditingClassRow({ ...editingClassRow, name: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all ${theme.input}`}
                        />
                      ) : (
                        <span className="font-medium">{className}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 border ${theme.border}`}>
                      {isEditingRow ? (
                        <select
                          value={editingClassRow.level || 'primary'}
                          onChange={e => setEditingClassRow({ ...editingClassRow, level: e.target.value })}
                          className={`px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all ${theme.input}`}
                        >
                          {LEVELS.map((l: any) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          {first?.level}
                        </span>
                      )}
                    </td>
                    {gridMediums.map((m: Medium) => {
                      const cls = rowClasses.find((c: Class) => c.mediumId === m.id);
                      return (
                        <td key={m.id} className={`px-4 py-3 border ${theme.border} text-center`}>
                          {isEditingRow ? (
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={editingClassRow.selectedMediums?.includes(m.id) || false}
                                onChange={e => {
                                  const selectedMediums = editingClassRow.selectedMediums || [];
                                  if (e.target.checked) {
                                    setEditingClassRow({ ...editingClassRow, selectedMediums: [...selectedMediums, m.id] });
                                  } else {
                                    setEditingClassRow({ ...editingClassRow, selectedMediums: selectedMediums.filter(id => id !== m.id) });
                                  }
                                }}
                                className="w-4 h-4 rounded text-green-500 focus:ring-green-500"
                              />
                            </div>
                          ) : cls ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${cls.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => openEdit('class', cls)} 
                                className={`p-1 rounded ${theme.hover} text-blue-500 transition-all`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </motion.button>
                            </div>
                          ) : (
                            <span className={theme.text.muted}>-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-4 py-3 border ${theme.border} text-center`}>
                      {isEditingRow ? (
                        <div className="flex gap-2 justify-center">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => saveClassRowEdit(className)}
                            disabled={!editingClassRow.name.trim() || savingClasses}
                            className={`p-2 rounded-lg bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingClassRow(null)}
                            className={`p-2 rounded-lg ${theme.hover} ${theme.text.primary} border ${theme.border} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const rowClasses = classes.filter((c: Class) => c.name === className && (!selectedMediumAY || c.academicYearId === selectedMediumAY));
                              const currentMediumIds = rowClasses.map((c: Class) => c.mediumId);
                              const first = rowClasses[0];
                              setEditingClassRow({ 
                                oldName: className, 
                                name: className, 
                                selectedMediums: currentMediumIds,
                                level: first?.level || 'primary'
                              });
                            }}
                            className={`p-2 rounded-lg ${theme.hover} ${theme.text.primary} border ${theme.border} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteClassRow(className)}
                            className={`p-2 rounded-lg ${theme.hover} text-red-400 transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}

              {/* New Draft Rows */}
              {newRows.map((row: any, index) => (
                <motion.tr 
                  key={row.id} 
                  className={`${isDark ? 'bg-green-900/15' : 'bg-green-50/80'} transition-colors`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className={`px-4 py-3 border ${isDark ? 'border-green-700' : 'border-green-300'}`}>
                    <input
                      autoFocus
                      value={row.name || ''}
                      onChange={e => handleDraftChange(row.id, 'name', e.target.value)}
                      placeholder="e.g. Class 1"
                      className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all ${theme.input}`}
                    />
                  </td>
                  <td className={`px-4 py-3 border ${isDark ? 'border-green-700' : 'border-green-300'}`}>
                    <select
                      value={row.level || 'primary'}
                      onChange={e => handleDraftChange(row.id, 'level', e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all ${theme.input}`}
                    >
                      {LEVELS.map((l: any) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </td>
                  {gridMediums.map((m: Medium) => (
                    <td key={m.id} className={`px-4 py-3 border ${isDark ? 'border-green-700' : 'border-green-300'} text-center`}>
                      <input
                        type="checkbox"
                        checked={(row.selectedMediums || new Set()).has(m.id)}
                        onChange={() => toggleMedium(row.id, m.id)}
                        className="w-4 h-4 rounded text-green-500 focus:ring-green-500"
                      />
                    </td>
                  ))}
                  <td className={`px-4 py-3 border ${isDark ? 'border-green-700' : 'border-green-300'}`}>
                    <div className="flex gap-2 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={!row.name?.trim() || (row.selectedMediums || new Set()).size === 0}
                        onClick={() => saveRow(row.id)}
                        className={`p-2 rounded-lg bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNewRows(prev => prev.filter((r: any) => r.id !== row.id))}
                        className={`p-2 rounded-lg ${theme.hover} ${theme.text.primary} border ${theme.border} transition-all`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}

              {/* Action buttons row */}
              <tr>
                <td colSpan={gridMediums.length + 3} className={`px-4 py-4 border-t ${theme.border} ${theme.card}`}>
                  <div className="flex items-center justify-between gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!canManageSettings}
                      onClick={addNewRow}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 ${theme.hover} ${theme.text.primary} border ${theme.border}`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-gradient-to-r ${theme.gradients.success} text-white font-bold text-sm">+</span>
                      Add Class Row
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
                      disabled={!canManageSettings || savingClasses || newRows.length === 0}
                      onClick={bulkSaveClasses}
                    >
                      <span className="flex items-center gap-2">
                        {savingClasses ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4"
                            >
                              <svg fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </motion.div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                            </svg>
                            Bulk Save Classes
                          </>
                        )}
                      </span>
                    </motion.button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Sections — Advanced Excel Grid */}
      <motion.div
        variants={itemVariants}
        className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Section Management</h3>
            <p className={`text-sm ${theme.text.secondary} mt-1`}>Advanced section assignment and management system</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${theme.input}`}
              value={selectedSectionAY} 
              onChange={e => setSelectedSectionAY(e.target.value)}
            >
              <option value="">All Academic Years</option>
              {academicYears.map((ay: AcademicYear) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
            <select
              className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${theme.input}`}
              value={filterSectionMedium} 
              onChange={e => setFilterSectionMedium(e.target.value)}
            >
              <option value="">All Mediums</option>
              {gridMediums.map((m: Medium) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.secondary} text-white shadow-lg hover:shadow-xl transition-all`}
              disabled={!canManageSettings}
              onClick={addSectionRow}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Section
              </span>
            </motion.button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className={`w-full text-xs border-collapse ${theme.text.primary}`}>
            <thead>
              <tr>
                <th className={`px-4 py-3 text-left font-semibold border min-w-[150px] ${theme.border} ${theme.card}`}>
                  Section Name
                </th>
                {sectionGridClasses.map((cls: Class) => (
                  <th key={cls.id} className={`px-3 py-3 text-center font-semibold border w-32 ${theme.border} ${theme.card}`}>
                    <div className="flex flex-col items-center gap-1">
                      <span>{cls.name}</span>
                      <div className={`w-2 h-2 rounded-full ${cls.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </th>
                ))}
                {sectionGridClasses.length === 0 && (
                  <th className={`px-3 py-3 text-center border ${theme.border} ${theme.card} ${theme.text.muted}`}>
                    ← Add classes first
                  </th>
                )}
                <th className={`px-3 py-3 text-center border w-20 ${theme.border} ${theme.card}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Existing Section Rows */}
              {uniqueSectionNames.map((sectionName: string, index) => {
                const isEditingRow = editingSectionRow?.oldName === sectionName;
                return (
                  <motion.tr 
                    key={sectionName} 
                    className={`${theme.hover} transition-colors`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className={`px-4 py-3 border font-medium ${theme.border} ${theme.card}`}>
                      {isEditingRow ? (
                        <input
                          autoFocus
                          value={editingSectionRow?.name || ''}
                          onChange={e => editingSectionRow && setEditingSectionRow({ ...editingSectionRow, name: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${theme.input}`}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{sectionName}</span>
                          <div className={`w-2 h-2 rounded-full bg-purple-500`}></div>
                        </div>
                      )}
                    </td>
                    {sectionGridClasses.map((cls: Class) => {
                      const section = sections.find((s: Section) => s.name === sectionName && s.classId === cls.id);
                      return (
                        <td key={cls.id} className={`px-3 py-3 border text-center ${theme.border}`}>
                          {isEditingRow ? (
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={editingSectionRow.selectedClasses?.includes(cls.id) || false}
                                onChange={e => {
                                  const selectedClasses = editingSectionRow.selectedClasses || [];
                                  if (e.target.checked) {
                                    setEditingSectionRow({ ...editingSectionRow, selectedClasses: [...selectedClasses, cls.id] });
                                  } else {
                                    setEditingSectionRow({ ...editingSectionRow, selectedClasses: selectedClasses.filter(id => id !== cls.id) });
                                  }
                                }}
                                className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500"
                              />
                            </div>
                          ) : section ? (
                            <div className="flex items-center justify-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${section.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => openEdit('section', section)} 
                                title="Edit details" 
                                className={`p-1 rounded ${theme.hover} text-blue-500 transition-all`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete('section', section.id, section.name)} 
                                title="Delete cell section" 
                                className={`p-1 rounded ${theme.hover} text-red-400 transition-all`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </motion.button>
                            </div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={!canManageSettings}
                              onClick={() => {
                                if (!cls.id) {
                                  console.error('Class ID is missing:', cls);
                                  showErrorToast('Error', 'Class ID is missing');
                                  return;
                                }
                                
                                const classCode = cls.code || `CLASS${cls.id.slice(-4)}`;
                                const sectionData = {
                                  name: sectionName,
                                  code: `${classCode}-${sectionName}`.toUpperCase(),
                                  classId: cls.id,
                                  academicYearId: selectedSectionAY || cls.academicYearId || activeAY?.id || '',
                                  isActive: true,
                                };
                                
                                // Try direct fetch call
                                fetch('/api/school-structure/sections', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(sectionData)
                                }).then(r => r.json()).then(() => fetchAll()).catch((e: any) => {
                                  console.error('Direct fetch error:', e);
                                  showErrorToast('Failed to add section', e.message);
                                });
                              }}
                              title={`Add ${sectionName} to ${cls.name}`}
                              className={`p-1 rounded border border-dashed transition-all disabled:opacity-30 ${theme.border} ${theme.text.muted} hover:border-purple-500 hover:text-purple-500`}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </motion.button>
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-3 border text-center ${theme.border}`}>
                      {isEditingRow ? (
                        <div className="flex items-center justify-center gap-1">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => saveSectionRowEdit(sectionName)} 
                            disabled={!editingSectionRow?.name?.trim() || savingSections} 
                            title="Save Row" 
                            className={`w-6 h-6 flex items-center justify-center rounded bg-gradient-to-r ${theme.gradients.success} text-white text-xs font-bold disabled:opacity-40 transition-all`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingSectionRow(null)} 
                            title="Cancel" 
                            className={`w-6 h-6 flex items-center justify-center rounded ${theme.hover} ${theme.text.primary} border ${theme.border} text-xs font-bold transition-all`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const rowSections = sections.filter((s: Section) => s.name === sectionName && (!selectedSectionAY || s.academicYearId === selectedSectionAY));
                              const currentClassIds = rowSections.map((s: Section) => s.classId);
                              setEditingSectionRow({ 
                                oldName: sectionName, 
                                name: sectionName, 
                                selectedClasses: currentClassIds
                              });
                            }} 
                            title="Rename Row" 
                            className={`p-1 rounded ${theme.hover} ${theme.text.primary} transition-all`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteSectionRow(sectionName)} 
                            title="Delete Row" 
                            className={`p-1 rounded ${theme.hover} text-red-400 transition-all`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}

              {/* New Draft Rows */}
              {sectionRows.map((row: any, index) => {
                const draft: any = sectionDrafts[row.id];
                return (
                  <motion.tr 
                    key={row.id} 
                    className={`${isDark ? 'bg-purple-900/15' : 'bg-purple-50/80'} transition-colors`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className={`px-3 py-3 border ${isDark ? 'border-purple-700' : 'border-purple-300'}`}>
                      <input
                        autoFocus
                        value={draft?.name || ''}
                        onChange={e => handleSectionDraftChange(row.id, 'name', e.target.value)}
                        placeholder="e.g. A, B, C"
                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${theme.input}`}
                      />
                    </td>
                    {sectionGridClasses.map((cls: Class) => (
                      <td key={cls.id} className={`px-3 py-3 border text-center ${isDark ? 'border-purple-700' : 'border-purple-300'}`}>
                        <input
                          type="checkbox"
                          checked={draft?.selectedClasses?.has(cls.id) || false}
                          onChange={() => toggleSectionClass(row.id, cls.id)}
                          className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500"
                        />
                      </td>
                    ))}
                    <td className={`px-3 py-3 border ${isDark ? 'border-purple-700' : 'border-purple-300'}`}>
                      <div className="flex items-center justify-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={!draft?.name?.trim() || draft?.selectedClasses?.size === 0}
                          onClick={() => saveSectionRow(row.id)}
                          title="Save"
                          className={`w-6 h-6 flex items-center justify-center rounded bg-gradient-to-r ${theme.gradients.secondary} text-white text-xs font-bold disabled:opacity-40 transition-all`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSectionRows(prev => prev.filter((r: any) => r.id !== row.id));
                            setSectionDrafts(prev => {
                              const newDrafts = { ...prev };
                              delete newDrafts[row.id];
                              return newDrafts;
                            });
                          }}
                          title="Cancel"
                          className={`w-6 h-6 flex items-center justify-center rounded ${theme.hover} ${theme.text.primary} border ${theme.border} text-xs font-bold transition-all`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {/* Action buttons row */}
              <tr>
                <td colSpan={sectionGridClasses.length + 2} className={`px-4 py-4 border-t ${theme.border} ${theme.card}`}>
                  <div className="flex items-center justify-between gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${theme.hover} ${theme.text.primary} border ${theme.border}`}
                      disabled={!canManageSettings}
                      onClick={addSectionRow}
                    >
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-gradient-to-r ${theme.gradients.secondary} text-white font-bold text-sm">+</span>
                      Add Section Row
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.secondary} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
                      disabled={!canManageSettings || savingSections || (sectionRows.length === 0 && Object.keys(sectionDrafts).length === 0)} 
                      onClick={() => {
                        const promises = sectionRows.map((row: any) => saveSectionRow(row.id));
                        Promise.all(promises).then(() => {
                          showSuccessToast('Success', 'Sections saved successfully');
                        });
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {savingSections ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4"
                            >
                              <svg fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </motion.div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                            </svg>
                            Bulk Save Sections
                          </>
                        )}
                      </span>
                    </motion.button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
