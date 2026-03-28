'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_PRESETS, generateThemeFromPreset, generateCustomTheme, generateAutoTheme, type SchoolTheme, type ThemePreset } from '@/lib/school-theme';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toastUtils';

interface ThemeManagerProps {
  schoolId: string;
  onThemeChange?: (theme: SchoolTheme) => void;
}

export default function ThemeManager({ schoolId, onThemeChange }: ThemeManagerProps) {
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === 'dark';
  
  const [currentTheme, setCurrentTheme] = useState<SchoolTheme | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customColors, setCustomColors] = useState({
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#60a5fa',
    background: '#0f172a',
    text: '#ffffff'
  });
  const [themeType, setThemeType] = useState<'auto' | 'preset' | 'custom'>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [previewMode, setPreviewMode] = useState(false);

  // CSS classes - Compact
  const card = `rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`;
  const input = `w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-[11px] font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const btnPrimary = `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const btnSecondary = `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const themeTile = `p-2 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${isDark ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'}`;
  const themeTileSelected = `p-2 rounded-lg border-2 transition-all cursor-pointer ring-2 ring-blue-200 border-blue-500`;

  // Load current theme
  useEffect(() => {
    loadCurrentTheme();
  }, []);

  const loadCurrentTheme = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/school-theme');
      if (response.ok) {
        const data = await response.json();
        const themeData = data.theme;
        
        if (themeData) {
          if (themeData.themeType) {
            setThemeType(themeData.themeType);
            if (themeData.themeType === 'preset' && themeData.presetId) {
              setSelectedPreset(themeData.presetId);
            } else if (themeData.themeType === 'custom' && themeData.colors) {
              setCustomColors(themeData.colors);
            }
          }
          setCurrentTheme(themeData as SchoolTheme);
        }
      } else {
        console.warn('Theme settings not available, using defaults');
      }
    } catch (error) {
      console.warn('Failed to load theme settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async () => {
    setIsLoading(true);
    try {
      let themeToSave: Partial<SchoolTheme> = { themeType };
      
      if (themeType === 'preset' && selectedPreset) {
        const preset = THEME_PRESETS.find(p => p.id === selectedPreset);
        if (preset) {
          themeToSave = {
            ...generateThemeFromPreset(preset),
            themeType: 'preset',
            presetId: selectedPreset
          };
        }
      } else if (themeType === 'custom') {
        themeToSave = {
          ...generateCustomTheme(customColors),
          themeType: 'custom',
          colors: customColors
        };
      }
      
      // Convert theme object to string for storage
      const themeString = JSON.stringify(themeToSave);
      
      const response = await fetch('/api/school-structure/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: 'theme',
          settings: {
            theme: themeString
          }
        })
      });
      
      if (response.ok) {
        setCurrentTheme(themeToSave as SchoolTheme);
        onThemeChange?.(themeToSave as SchoolTheme);
        // Show success message
        showToast('success', 'Theme Saved', 'Theme saved successfully!');
      } else {
        console.warn('Failed to save theme settings');
        showToast('error', 'Save Failed', 'Failed to save theme. Please try again.');
      }
    } catch (error) {
      console.warn('Error saving theme:', error);
      showToast('error', 'Error', 'Error saving theme. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    setThemeType('preset');
    
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (preset && previewMode) {
      onThemeChange?.(generateThemeFromPreset(preset));
    }
  };

  const handleColorChange = (colorKey: keyof typeof customColors, value: string) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    
    if (previewMode && themeType === 'custom') {
      onThemeChange?.(generateCustomTheme(newColors));
    }
  };

  const PreviewCard = ({ theme, title }: { theme: SchoolTheme; title: string }) => (
    <div className="p-3 rounded-lg border border-dashed border-gray-300">
      <div className="text-xs font-medium mb-2 text-gray-600">{title}</div>
      <div className="space-y-2">
        <div 
          className="p-2 rounded text-white text-center text-xs"
          style={{
            background: theme.gradient,
            borderColor: theme.primaryColor,
            borderWidth: '1px'
          }}
        >
          <div className="font-bold">Login Preview</div>
          <div className="text-[10px] opacity-90 mt-0.5">See your theme in action</div>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.primaryColor }} title="Primary" />
          <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.secondaryColor }} title="Secondary" />
          <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.accentColor }} title="Accent" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Theme Customization
          </h3>
          <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Customize your school's login page appearance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={previewMode}
              onChange={(e) => setPreviewMode(e.target.checked)}
              className="rounded"
            />
            <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Live Preview
            </span>
          </label>
        </div>
      </div>

      {/* Theme Type Selection */}
      <div className={card}>
        <div className="p-3">
          <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Theme Type
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'auto', label: 'Auto', desc: 'From school name' },
              { value: 'preset', label: 'Preset', desc: 'Templates' },
              { value: 'custom', label: 'Custom', desc: 'Design your own' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setThemeType(type.value as any)}
                className={`p-2 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${
                  themeType === type.value
                    ? themeTileSelected
                    : themeTile
                }`}
              >
                <div className={`font-medium text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {type.label}
                </div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {type.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Themes */}
      {themeType === 'preset' && (
        <div className={card}>
          <div className="p-3">
            <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Choose Theme
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`p-2 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${
                    selectedPreset === preset.id
                      ? themeTileSelected
                      : themeTile
                  }`}
                >
                  <div 
                    className="h-6 rounded mb-1.5"
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.primary} 0%, ${preset.colors.secondary} 100%)`
                    }}
                  />
                  <div className={`text-[10px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Colors */}
      {themeType === 'custom' && (
        <div className={card}>
          <div className="p-3">
            <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Custom Colors
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(customColors).map(([key, value]) => (
                <div key={key}>
                  <label className={label}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof typeof customColors, e.target.value)}
                      className="h-8 w-12 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof typeof customColors, e.target.value)}
                      className={input}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewMode && (
        <div className={card}>
          <div className="p-3">
            <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Live Preview
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {themeType === 'preset' && selectedPreset && (() => {
                const preset = THEME_PRESETS.find(p => p.id === selectedPreset);
                return preset ? (
                  <PreviewCard theme={generateThemeFromPreset(preset)} title="Selected Theme" />
                ) : null;
              })()}
              {themeType === 'custom' && (
                <PreviewCard theme={generateCustomTheme(customColors)} title="Custom Theme" />
              )}
              {themeType === 'auto' && (
                <PreviewCard theme={generateAutoTheme('Demo School')} title="Auto Theme" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button className={btnSecondary} onClick={loadCurrentTheme}>
          Reset
        </button>
        <button className={btnPrimary} onClick={saveTheme} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Theme'}
        </button>
      </div>
    </div>
  );
}
