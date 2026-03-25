'use client';

import React, { useState, useMemo } from 'react';
import { showToast } from '../utils';
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
  card: string;
  heading: string;
  btnPrimary: string;
  btnSecondary: string;
  btnDanger: string;
  input: string;
  label: string;
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
  card,
  heading,
  btnPrimary,
  btnSecondary,
  btnDanger,
  input,
  label,
}) => {
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
      showToast({ type: 'success', title: 'Board updated' });
    } catch {
      showToast({ type: 'error', title: 'Failed to update board' });
    } finally {
      setSavingBoards(false);
    }
  };

  const deleteBoardRow = async (board: Board) => {
    // Use the main handleDelete function to get cascade delete functionality
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
      showToast({ type: 'success', title: 'Medium updated' });
    } catch {
      showToast({ type: 'error', title: 'Failed to update medium' });
    } finally {
      setSavingMediums(false);
    }
  };

  const deleteMediumRow = async (medium: Medium) => {
    // Use the main handleDelete function to get cascade delete functionality
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
    } catch {
      setNewRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: false } : r));
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
      showToast({ type: 'success', title: 'Class updated successfully' });
    } catch {
      showToast({ type: 'error', title: 'Failed to update class' });
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
      showToast({ type: 'success', title: 'Class row deleted' });
    } catch {
      showToast({ type: 'error', title: 'Failed to delete class row' });
    } finally {
      setSavingClasses(false);
    }
  };

  const bulkSaveClasses = async () => {
    console.log('Bulk save button clicked!');
    if (!canManageSettings) {
      console.log('Cannot manage settings, returning');
      return;
    }
    setSavingClasses(true);
    try {
      const promises: Promise<any>[] = [];
      console.log('Bulk save - newRows:', newRows);
      
      for (const nr of newRows) {
        console.log('Processing row:', nr);
        if (nr.name.trim()) {
          const selectedMediums = nr.selectedMediums || new Set();
          console.log('Selected mediums for row:', selectedMediums);
          const toCreate = gridMediums.filter((m: Medium) => selectedMediums.has(m.id));
          console.log('Mediums to create:', toCreate);
          
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
      
      console.log('Total promises:', promises.length);
      if (promises.length > 0) {
        await Promise.all(promises);
        showToast({ type: 'success', title: 'Classes saved successfully' });
        await fetchAll();
        setNewRows([]);
      } else {
        showToast({ type: 'warning', title: 'No classes to save', message: 'Please add class names and select at least one medium for each.' });
      }
    } catch (e: any) {
      console.error('Bulk save error:', e);
      showToast({ type: 'error', title: 'Failed to save classes', message: e.message });
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
  React.useEffect(() => {
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
    } catch {
      setSectionRows(prev => prev.map((r: any) => r.id === rowId ? { ...r, saving: false } : r));
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
      showToast({ type: 'success', title: 'Section updated successfully' });
    } catch {
      showToast({ type: 'error', title: 'Failed to update section' });
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
      showToast({ type: 'success', title: 'Section row deleted' });
    } catch {
      showToast({ type: 'error', title: 'Failed to delete section row' });
    } finally {
      setSavingSections(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>School Structure</h3>
            <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{boards.length} boards • {mediums.length} mediums • {classes.length} classes • {sections.length} sections</p>
          </div>
        </div>
      </div>

      {/* Boards - Compact Card Grid */}
      <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Boards</h3>
          <button 
            className={`px-2 py-1 rounded text-[10px] font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            disabled={!canManageSettings} 
            onClick={() => openCreate('board', { name: '', code: '', description: '', isActive: true })}
          >
            + Add
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {boards.map((board: Board) => (
            <div key={board.id} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-start mb-2">
                {editingBoard?.id === board.id ? (
                  <div className="flex-1 space-y-2">
                    <input 
                      className={input} 
                      value={editingBoard.name} 
                      onChange={e => setEditingBoard({ ...editingBoard, name: e.target.value })} 
                      placeholder="Board name"
                    />
                    <input 
                      className={input} 
                      value={editingBoard.code} 
                      onChange={e => setEditingBoard({ ...editingBoard, code: e.target.value })} 
                      placeholder="Code"
                    />
                    <div className="flex gap-2">
                      <button 
                        className={`${btnPrimary} text-xs px-3 py-1`} 
                        disabled={!editingBoard.name.trim() || savingBoards}
                        onClick={() => saveBoardRowEdit(board)}
                      >
                        ✓
                      </button>
                      <button 
                        className={`${btnSecondary} text-xs px-3 py-1`}
                        onClick={() => setEditingBoard(null)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{board.name}</h4>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{board.code}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        className={`${btnSecondary} text-xs px-2 py-1`}
                        onClick={() => setEditingBoard(board)}
                      >
                        ✎
                      </button>
                      <button 
                        className={`${btnDanger} text-xs px-2 py-1`}
                        onClick={() => deleteBoardRow(board)}
                      >
                        🗑
                      </button>
                    </div>
                  </>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{board.description || 'No description'}</p>
            </div>
          ))}
          {boards.length === 0 && (
            <div className={`col-span-full text-center py-8 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
              No boards configured yet
            </div>
          )}
        </div>
      </div>

      {/* Mediums */}
      <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mediums</h3>
          <button 
            className={`px-2 py-1 rounded text-[10px] font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            disabled={!canManageSettings || !activeAY} 
            onClick={() => openCreate('medium', { name: '', code: '', academicYearId: activeAY?.id, isActive: true })}
          >
            + Add
          </button>
        </div>
        {!activeAY && (
          <div className={`mb-2 p-2 rounded text-[10px] ${isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
            ⚠️ Create academic year first
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {mediums.map((medium: Medium) => (
            <div key={medium.id} className={`p-2.5 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-start">
                {editingMedium?.id === medium.id ? (
                  <div className="flex-1 space-y-1.5">
                    <input 
                      className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      value={editingMedium.name} 
                      onChange={e => setEditingMedium({ ...editingMedium, name: e.target.value })} 
                      placeholder="Name"
                    />
                    <input 
                      className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      value={editingMedium.code} 
                      onChange={e => setEditingMedium({ ...editingMedium, code: e.target.value })} 
                      placeholder="Code"
                    />
                    <div className="flex gap-1">
                      <button 
                        className={`flex-1 px-2 py-1 rounded text-[10px] ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                        disabled={!editingMedium.name.trim() || savingMediums}
                        onClick={() => saveMediumRowEdit(medium)}
                      >
                        ✓
                      </button>
                      <button 
                        className={`flex-1 px-2 py-1 rounded text-[10px] ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} text-white`}
                        onClick={() => setEditingMedium(null)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0">
                      <h4 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{medium.name}</h4>
                      <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{medium.code}</p>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button 
                        className={`p-1 rounded ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                        onClick={() => setEditingMedium(medium)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        className={`p-1 rounded ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                        onClick={() => deleteMediumRow(medium)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          {mediums.length === 0 && (
            <div className={`col-span-full text-center py-4 rounded-lg border border-dashed text-xs ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
              No mediums
            </div>
          )}
        </div>
      </div>

      {/* Classes - Compact */}
      <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Classes</h3>
          <div className="flex items-center gap-1.5">
            <select
              className={`px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              value={selectedMediumAY}
              onChange={e => setSelectedMediumAY(e.target.value)}
            >
              <option value="">All Years</option>
              {academicYears.map((ay: AcademicYear) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
          </div>
        </div>
        {!activeAY && (
          <div className={`mb-2 p-2 rounded text-[10px] ${isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
            ⚠️ Create academic year first
          </div>
        )}

        <div className="overflow-x-auto">
          <table className={`w-full text-sm border-collapse ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr>
                <th className={`px-4 py-2 text-left font-semibold border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}>Class Name</th>
                <th className={`px-4 py-2 text-left font-semibold border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}>Level</th>
                {gridMediums.map((m: Medium) => (
                  <th key={m.id} className={`px-4 py-2 text-center font-semibold border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}>
                    {m.name}
                  </th>
                ))}
                <th className={`px-4 py-2 text-center border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`} />
              </tr>
            </thead>
            <tbody>
              {/* Existing Class Rows */}
              {[...new Set(classes.filter((c: Class) => !selectedMediumAY || c.academicYearId === selectedMediumAY).map((c: Class) => c.name))].sort().map((className: string) => {
                const rowClasses = classes.filter((c: Class) => c.name === className && (!selectedMediumAY || c.academicYearId === selectedMediumAY));
                const first = rowClasses[0];
                const isEditingRow = editingClassRow?.oldName === className;
                return (
                  <tr key={className} className={`${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-2 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      {isEditingRow ? (
                        <input
                          autoFocus
                          value={editingClassRow.name}
                          onChange={e => setEditingClassRow({ ...editingClassRow, name: e.target.value })}
                          className={input}
                        />
                      ) : (
                        <span className="font-medium">{className}</span>
                      )}
                    </td>
                    <td className={`px-4 py-2 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      {isEditingRow ? (
                        <select
                          value={editingClassRow.level || 'primary'}
                          onChange={e => setEditingClassRow({ ...editingClassRow, level: e.target.value })}
                          className={`px-2 py-1 rounded text-xs border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}
                        >
                          {LEVELS.map((l: any) => (
                          <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          {first?.level}
                        </span>
                      )}
                    </td>
                    {gridMediums.map((m: Medium) => {
                      const cls = rowClasses.find((c: Class) => c.mediumId === m.id);
                      return (
                        <td key={m.id} className={`px-4 py-2 border text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
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
                                className="w-4 h-4 rounded accent-blue-500"
                              />
                            </div>
                          ) : cls ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${cls.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                              <button onClick={() => openEdit('class', cls)} className="text-blue-500 hover:text-blue-600">✎</button>
                            </div>
                          ) : (
                            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-4 py-2 border text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      {isEditingRow ? (
                        <div className="flex gap-1 justify-center">
                          <button 
                            onClick={() => saveClassRowEdit(className)}
                            disabled={!editingClassRow.name.trim() || savingClasses}
                            className={`${btnPrimary} text-xs px-2 py-1`}
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => setEditingClassRow(null)}
                            className={`${btnSecondary} text-xs px-2 py-1`}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button 
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
                            className={`${btnSecondary} text-xs px-2 py-1`}
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => deleteClassRow(className)}
                            className={`${btnDanger} text-xs px-2 py-1`}
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* New Draft Rows */}
              {newRows.map((row: any) => (
                <tr key={row.id} className={isDark ? 'bg-blue-900/10' : 'bg-blue-50'}>
                  <td className={`px-4 py-2 border ${isDark ? 'border-blue-800' : 'border-blue-200'}`}>
                    <input
                      autoFocus
                      value={row.name || ''}
                      onChange={e => handleDraftChange(row.id, 'name', e.target.value)}
                      placeholder="e.g. Class 1"
                      className={input}
                    />
                  </td>
                  <td className={`px-4 py-2 border ${isDark ? 'border-blue-800' : 'border-blue-200'}`}>
                    <select
                      value={row.level || 'primary'}
                      onChange={e => handleDraftChange(row.id, 'level', e.target.value)}
                      className={`${input} py-1`}
                    >
                      {LEVELS.map((l: any) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </td>
                  {gridMediums.map((m: Medium) => (
                    <td key={m.id} className={`px-4 py-2 border text-center ${isDark ? 'border-blue-800' : 'border-blue-200'}`}>
                      <input
                        type="checkbox"
                        checked={(row.selectedMediums || new Set()).has(m.id)}
                        onChange={() => toggleMedium(row.id, m.id)}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                    </td>
                  ))}
                  <td className={`px-4 py-2 border ${isDark ? 'border-blue-800' : 'border-blue-200'}`}>
                    <div className="flex gap-1 justify-center">
                      <button
                        disabled={!row.name?.trim() || (row.selectedMediums || new Set()).size === 0}
                        onClick={() => saveRow(row.id)}
                        className={`${btnPrimary} text-xs px-2 py-1 disabled:opacity-50`}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setNewRows(prev => prev.filter((r: any) => r.id !== row.id))}
                        className={`${btnSecondary} text-xs px-2 py-1`}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Action buttons row */}
              <tr>
                <td colSpan={gridMediums.length + 3} className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <button
                      disabled={!canManageSettings}
                      onClick={addNewRow}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-all disabled:opacity-40 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-blue-500 text-white font-bold text-sm leading-none">+</span>
                      Add class
                    </button>
                    <button 
                      className={btnPrimary} 
                      disabled={!canManageSettings || savingClasses || newRows.length === 0}
                      onClick={() => {
                        console.log('Button clicked! canManageSettings:', canManageSettings, 'savingClasses:', savingClasses, 'newRows.length:', newRows.length);
                        bulkSaveClasses();
                      }}
                    >
                      {savingClasses ? 'Saving...' : '💾 Bulk Save Classes'}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sections — 2D Excel Grid */}
      <div className={card}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={heading}>Sections</h3>
          <div className="flex items-center gap-2">
            <select
              className={`px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              value={selectedSectionAY} 
              onChange={e => setSelectedSectionAY(e.target.value)}
            >
              <option value="">All Years</option>
              {academicYears.map((ay: AcademicYear) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
            <select
              className={`px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              value={filterSectionMedium} 
              onChange={e => setFilterSectionMedium(e.target.value)}
            >
              <option value="">All Mediums</option>
              {gridMediums.map((m: Medium) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className={`w-full text-xs border-collapse ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr>
                <th className={`px-3 py-1.5 text-left font-semibold border min-w-[120px] ${isDark ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-400 bg-gray-200 text-gray-700'}`}>
                  Section Name
                </th>
                {sectionGridClasses.map((cls: Class) => (
                  <th key={cls.id} className={`px-2 py-1.5 text-center font-semibold border w-24 ${isDark ? 'border-gray-500 bg-gray-700 text-green-300' : 'border-gray-400 bg-green-100 text-green-800'}`}>
                    {cls.name}
                  </th>
                ))}
                {sectionGridClasses.length === 0 && (
                  <th className={`px-2 py-1.5 text-center border ${isDark ? 'border-gray-500 bg-gray-700 text-gray-500' : 'border-gray-400 bg-gray-100 text-gray-400'}`}>
                    ← Add classes first
                  </th>
                )}
                <th className={`px-2 py-1.5 text-center border w-14 ${isDark ? 'border-gray-500 bg-gray-700' : 'border-gray-400 bg-gray-200'}`} />
              </tr>
            </thead>
            <tbody>
              {/* Existing Section Rows */}
              {uniqueSectionNames.map((sectionName: string) => {
                const isEditingRow = editingSectionRow?.oldName === sectionName;
                return (
                <tr key={sectionName} className={`${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50'}`}>
                  <td className={`px-3 py-1 border font-medium ${isDark ? 'border-gray-600 bg-gray-800/40 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-800'}`}>
                    {isEditingRow ? (
                      <input
                        autoFocus
                        value={editingSectionRow?.name || ''}
                        onChange={e => editingSectionRow && setEditingSectionRow({ ...editingSectionRow, name: e.target.value })}
                        className={`w-full px-1 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    ) : (
                      sectionName
                    )}
                  </td>
                  {sectionGridClasses.map((cls: Class) => {
                    const section = sections.find((s: Section) => s.name === sectionName && s.classId === cls.id);
                    return (
                      <td key={cls.id} className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
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
                              onToggle={() => toggleEditingSectionClass(cls.id)}
                              className="w-4 h-4 rounded accent-blue-500"
                            />
                          </div>
                        ) : section ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => openEdit('section', section)} title="Edit details" className={`text-blue-500 font-bold text-sm hover:text-blue-600 transition-colors px-1`}>✎</button>
                            <button onClick={() => handleDelete('section', section.id, section.name)} title="Delete cell section" className="text-red-400 hover:text-red-500 text-xs leading-none px-1">✕</button>
                          </div>
                        ) : (
                          <button
                            disabled={!canManageSettings}
                            onClick={() => {
                              if (!cls.id) {
                                console.error('Class ID is missing:', cls);
                                showToast({ type: 'error', title: 'Error', message: 'Class ID is missing' });
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
                                showToast({ type: 'error', title: 'Failed to add section', message: e.message });
                              });
                            }}
                            title={`Add ${sectionName} to ${cls.name}`}
                            className={`text-xs px-1 py-0.5 rounded border border-dashed transition-all disabled:opacity-30 ${isDark ? 'border-gray-600 text-gray-600 hover:border-green-500 hover:text-green-400' : 'border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500'}`}
                          >+</button>
                        )}
                      </td>
                    );
                  })}
                  <td className={`px-1 py-1 border text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {isEditingRow ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => saveSectionRowEdit(sectionName)} disabled={!editingSectionRow?.name?.trim() || savingSections} title="Save Row" className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-40 transition-all">✓</button>
                        <button onClick={() => setEditingSectionRow(null)} title="Cancel" className="w-5 h-5 flex items-center justify-center rounded bg-gray-400 hover:bg-gray-500 text-white text-xs font-bold transition-all">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => {
  const rowSections = sections.filter((s: Section) => s.name === sectionName && (!selectedSectionAY || s.academicYearId === selectedSectionAY));
  const currentClassIds = rowSections.map((s: Section) => s.classId);
  setEditingSectionRow({ 
    oldName: sectionName, 
    name: sectionName, 
    selectedClasses: currentClassIds
  });
}} title="Rename Row" className={`text-xs px-0.5 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>✎</button>
                        <button onClick={() => deleteSectionRow(sectionName)} title="Delete Row" className={`text-xs px-0.5 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}>✕</button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}

              {/* New Draft Rows */}
              {sectionRows.map((row: any) => {
                const draft: any = (sectionDrafts as any)[row.id];
                return (
                  <tr key={row.id} className={isDark ? 'bg-green-900/15' : 'bg-green-50/80'}>
                    <td className={`px-1 py-1 border ${isDark ? 'border-green-700' : 'border-green-300'}`}>
                      <input
                        autoFocus
                        value={draft?.name || ''}
                        onChange={e => handleSectionDraftChange(row.id, 'name', e.target.value)}
                        placeholder="e.g. A, B, C"
                        className={`w-full px-2 py-0.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-green-400 ${isDark ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                    </td>
                    {sectionGridClasses.map((cls: Class) => (
                      <td key={cls.id} className={`px-1 py-1 border text-center ${isDark ? 'border-green-700' : 'border-green-300'}`}>
                        <input
                          type="checkbox"
                          checked={draft?.selectedClasses?.has(cls.id) || false}
                          onChange={() => toggleSectionClass(row.id, cls.id)}
                          className="w-3.5 h-3.5 rounded cursor-pointer accent-green-500"
                        />
                      </td>
                    ))}
                    <td className={`px-1 py-1 border ${isDark ? 'border-green-700' : 'border-green-300'}`}>
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          disabled={!draft?.name?.trim() || draft?.selectedClasses?.size === 0}
                          onClick={() => saveSectionRow(row.id)}
                          title="Save"
                          className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-40 transition-all"
                        >✓</button>
                        <button
                          onClick={() => {
                            setSectionRows(prev => prev.filter((r: any) => r.id !== row.id));
                            setSectionDrafts(prev => {
                              const newDrafts = { ...prev };
                              delete (newDrafts as any)[row.id];
                              return newDrafts;
                            });
                          }}
                          title="Cancel"
                          className="w-5 h-5 flex items-center justify-center rounded bg-gray-400 hover:bg-red-400 text-white text-xs font-bold transition-all"
                        >✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Action buttons row */}
              <tr>
                <td colSpan={sectionGridClasses.length + 2} className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <button 
                      className={btnSecondary} 
                      disabled={!canManageSettings} 
                      onClick={addSectionRow}
                    >
                      + Add Section
                    </button>
                    <button 
                      className={btnPrimary} 
                      disabled={!canManageSettings || savingSections || (sectionRows.length === 0 && Object.keys(sectionDrafts).length === 0)} 
                      onClick={() => {
                        const promises = sectionRows.map((row: any) => saveSectionRow(row.id));
                        Promise.all(promises).then(() => {
                          showToast({ type: 'success', title: 'Sections saved successfully' });
                        });
                      }}
                    >
                      {savingSections ? 'Saving...' : '💾 Bulk Save'}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
