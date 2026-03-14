// @ts-nocheck
'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface ColumnSettingsModalProps {
  columnSettings: any; resetColumns: any; setShowColumnSettings: any; showColumnSettings: any; theme: any; toggleColumn: any; visibleColumns: any;
  moveColumn?: (key: string, direction: 'up' | 'down') => void;
  reorderColumns?: (newOrder: string[]) => void;
}

export default function ColumnSettingsModal({ columnSettings, resetColumns, setShowColumnSettings, showColumnSettings, theme, toggleColumn, visibleColumns, moveColumn, reorderColumns }: ColumnSettingsModalProps) {
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
    dragOver.current = idx;
  };
  const handleDrop = () => {
    if (dragItem.current === null || dragOver.current === null || !reorderColumns) return;
    const newOrder = [...visibleColumns];
    const [moved] = newOrder.splice(dragItem.current, 1);
    newOrder.splice(dragOver.current, 0, moved);
    reorderColumns(newOrder);
    dragItem.current = null;
    dragOver.current = null;
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    dragItem.current = null;
    dragOver.current = null;
    setDragOverIdx(null);
  };
  return (
    <>
      {/* Column Settings Modal */}
      <AnimatePresence>
        {showColumnSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowColumnSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg rounded-2xl border p-6 max-h-[80vh] flex flex-col ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ⚙️ Column Settings
                </h3>
                <button
                  onClick={() => setShowColumnSettings(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  }`}
                >
                  ✕
                </button>
              </div>

              <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                Check/uncheck to show or hide. Drag ⠿ to reorder visible columns.
              </p>
              <div className="overflow-y-auto flex-1 space-y-1 pr-1 my-2">
                {visibleColumns.map((key, idx) => {
                  const column = columnSettings.availableColumns.find(c => c.key === key);
                  if (!column) return null;
                  return (
                    <div
                      key={column.key}
                      draggable={!!reorderColumns}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                        dragOverIdx === idx && dragItem.current !== idx
                          ? theme === 'dark' ? 'border-2 border-blue-500 bg-blue-900/20' : 'border-2 border-blue-400 bg-blue-50'
                          : theme === 'dark' ? 'bg-gray-800 border-2 border-transparent' : 'bg-gray-50 border-2 border-transparent'
                      }`}>
                      {reorderColumns && (
                        <span className={`mr-2 cursor-grab active:cursor-grabbing select-none text-lg ${
                          theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                        }`} title="Drag to reorder">⠿</span>
                      )}
                      <label className={`flex items-center gap-3 cursor-pointer flex-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <input type="checkbox" checked={true}
                          onChange={() => !column.fixed && toggleColumn(column.key)}
                          disabled={column.fixed}
                          className={`w-4 h-4 rounded border-gray-300 ${column.fixed ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <span className={column.fixed ? 'font-medium' : ''}>
                          {column.label}
                          {column.fixed && <span className="ml-1 text-xs opacity-60">(Required)</span>}
                        </span>
                      </label>
                      <div className="flex gap-1">
                        <button onClick={() => moveColumn && moveColumn(key, 'up')} disabled={idx === 0}
                          className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                            idx === 0 ? 'opacity-30 cursor-not-allowed' : theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                          }`}>↑</button>
                        <button onClick={() => moveColumn && moveColumn(key, 'down')} disabled={idx === visibleColumns.length - 1}
                          className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                            idx === visibleColumns.length - 1 ? 'opacity-30 cursor-not-allowed' : theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                          }`}>↓</button>
                      </div>
                    </div>
                  );
                })}
                {columnSettings.availableColumns.filter(c => !visibleColumns.includes(c.key)).length > 0 && (
                  <>
                    <p className={`text-xs px-1 pt-2 pb-1 font-medium ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>Hidden Columns</p>
                    {columnSettings.availableColumns.filter(c => !visibleColumns.includes(c.key)).map(column => (
                      <div key={column.key} className={`flex items-center px-3 py-2 rounded-lg opacity-60 ${
                        theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                      }`}>
                        <label className={`flex items-center gap-3 cursor-pointer flex-1 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          <input type="checkbox" checked={false} onChange={() => toggleColumn(column.key)}
                            className="w-4 h-4 rounded border-gray-300" />
                          <span>{column.label}</span>
                        </label>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={resetColumns}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => setShowColumnSettings(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Apply Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
