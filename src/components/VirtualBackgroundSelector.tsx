'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, Upload, X } from 'lucide-react';

interface VirtualBackgroundSelectorProps {
  onSelect: (background: string | null) => void;
  currentBackground?: string | null;
}

const DEFAULT_BACKGROUNDS = [
  { id: 'none', name: 'None', preview: null },
  { id: 'blur-light', name: 'Light Blur', preview: '/backgrounds/blur-light.jpg' },
  { id: 'blur-heavy', name: 'Heavy Blur', preview: '/backgrounds/blur-heavy.jpg' },
  { id: 'classroom', name: 'Classroom', preview: '/backgrounds/classroom.jpg' },
  { id: 'office', name: 'Office', preview: '/backgrounds/office.jpg' },
  { id: 'library', name: 'Library', preview: '/backgrounds/library.jpg' },
  { id: 'beach', name: 'Beach', preview: '/backgrounds/beach.jpg' },
  { id: 'mountains', name: 'Mountains', preview: '/backgrounds/mountains.jpg' },
];

export const VirtualBackgroundSelector: React.FC<VirtualBackgroundSelectorProps> = ({
  onSelect,
  currentBackground,
}) => {
  const [customBackgrounds, setCustomBackgrounds] = useState<Array<{ id: string; name: string; preview: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Create object URL for preview
    const preview = URL.createObjectURL(file);
    const customBg = {
      id: `custom-${Date.now()}`,
      name: file.name,
      preview,
    };

    setCustomBackgrounds(prev => [...prev, customBg]);
    setUploading(false);
  };

  const removeCustomBackground = (id: string) => {
    setCustomBackgrounds(prev => prev.filter(bg => bg.id !== id));
    if (currentBackground === id) {
      onSelect(null);
    }
  };

  const allBackgrounds = [...DEFAULT_BACKGROUNDS, ...customBackgrounds];

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Virtual Backgrounds
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {allBackgrounds.map((bg) => (
          <motion.button
            key={bg.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(bg.preview)}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
              currentBackground === bg.preview
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {bg.preview ? (
              <img
                src={bg.preview}
                alt={bg.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  No Background
                </span>
              </div>
            )}
            
            {bg.id.startsWith('custom-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomBackground(bg.id);
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-xs text-white font-medium truncate">{bg.name}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Upload Custom Background */}
      <div>
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">Upload Custom Background</span>
              </>
            )}
          </motion.div>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Recommended: 1920x1080px, JPG or PNG
        </p>
      </div>
    </div>
  );
};
