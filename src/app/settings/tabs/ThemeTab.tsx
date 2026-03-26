'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';
import { THEME_PRESETS, generateThemeFromPreset, generateCustomTheme, generateAutoTheme, type SchoolTheme, type ThemePreset } from '@/lib/school-theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeTabProps {
  isDark: boolean;
}

export const ThemeTab: React.FC<ThemeTabProps> = ({ isDark }) => {
  const { theme: appTheme, setTheme: setAppTheme } = useTheme();
  
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
  const [previewMode, setPreviewMode] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [borderRadius, setBorderRadius] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [buttonStyle, setButtonStyle] = useState<'rounded' | 'square' | 'pill'>('rounded');

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
      primary: 'from-pink-500 to-rose-600',
      secondary: 'from-purple-500 to-indigo-600',
      success: 'from-green-500 to-emerald-600',
      warning: 'from-orange-500 to-red-600',
    }
  }), [isDark]);

  // Load current theme
  const loadCurrentTheme = useCallback(async () => {
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
          if (themeData.fontFamily) setFontFamily(themeData.fontFamily);
          if (themeData.borderRadius) setBorderRadius(themeData.borderRadius);
          if (themeData.buttonStyle) setButtonStyle(themeData.buttonStyle);
          setCurrentTheme(themeData as SchoolTheme);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCurrentTheme(); }, [loadCurrentTheme]);

  const saveTheme = useCallback(async () => {
    setIsLoading(true);
    try {
      let themeToSave: Partial<SchoolTheme> = { 
        themeType,
        fontFamily,
        borderRadius,
        buttonStyle
      };
      
      if (themeType === 'preset' && selectedPreset) {
        const preset = THEME_PRESETS.find(p => p.id === selectedPreset);
        if (preset) {
          themeToSave = {
            ...generateThemeFromPreset(preset),
            themeType: 'preset',
            presetId: selectedPreset,
            fontFamily,
            borderRadius,
            buttonStyle
          };
        }
      } else if (themeType === 'custom') {
        themeToSave = {
          ...generateCustomTheme(customColors),
          themeType: 'custom',
          colors: customColors,
          fontFamily,
          borderRadius,
          buttonStyle
        };
      }
      
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
        showSuccessToast('Success', 'Theme saved successfully!');
      } else {
        showErrorToast('Error', 'Failed to save theme. Please try again.');
      }
    } catch (error) {
      showErrorToast('Error', 'Error saving theme. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [themeType, selectedPreset, customColors, fontFamily, borderRadius, buttonStyle]);

  const handlePresetSelect = useCallback((presetId: string) => {
    setSelectedPreset(presetId);
    setThemeType('preset');
    
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (preset && previewMode) {
      const newTheme = generateThemeFromPreset(preset);
      // Apply theme preview
      document.documentElement.style.setProperty('--primary-color', newTheme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', newTheme.secondaryColor);
      document.documentElement.style.setProperty('--accent-color', newTheme.accentColor);
    }
  }, [previewMode]);

  const handleColorChange = useCallback((colorKey: keyof typeof customColors, value: string) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    
    if (previewMode && themeType === 'custom') {
      const newTheme = generateCustomTheme(newColors);
      // Apply theme preview
      document.documentElement.style.setProperty('--primary-color', newTheme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', newTheme.secondaryColor);
      document.documentElement.style.setProperty('--accent-color', newTheme.accentColor);
    }
  }, [previewMode, themeType, customColors]);

  const resetTheme = useCallback(() => {
    setThemeType('auto');
    setSelectedPreset('');
    setCustomColors({
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#60a5fa',
      background: '#0f172a',
      text: '#ffffff'
    });
    setFontFamily('Inter');
    setBorderRadius('md');
    setButtonStyle('rounded');
    loadCurrentTheme();
  }, [loadCurrentTheme]);

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

  const PreviewCard = useCallback(({ theme: previewTheme, title }: { theme: SchoolTheme; title: string }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-2xl border ${theme.border} ${theme.card}`}
    >
      <div className={`text-sm font-semibold mb-3 ${theme.text.primary}`}>{title}</div>
      <div className="space-y-3">
        <div 
          className="p-3 rounded-xl text-white text-center shadow-lg"
          style={{
            background: previewTheme.gradient,
            borderColor: previewTheme.primaryColor,
            borderWidth: '1px'
          }}
        >
          <div className="font-bold text-base">Login Preview</div>
          <div className="text-xs opacity-90 mt-1">See your theme in action</div>
        </div>
        <div className="flex gap-2">
          <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: previewTheme.primaryColor }} title="Primary" />
          <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: previewTheme.secondaryColor }} title="Secondary" />
          <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: previewTheme.accentColor }} title="Accent" />
        </div>
      </div>
    </motion.div>
  ), [theme]);

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </motion.div>
              
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r ${theme.gradients.primary} bg-clip-text text-transparent`}>
                  Advanced Appearance & Branding
                </h1>
                <p className={`text-sm ${theme.text.secondary} mt-1`}>
                  Customize your school's visual identity and user experience
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Live Preview Toggle */}
              <motion.label
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={previewMode}
                  onChange={(e) => setPreviewMode(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                />
                <span className={`text-sm font-medium ${theme.text.primary}`}>
                  Live Preview
                </span>
              </motion.label>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.secondary} text-white shadow-lg hover:shadow-xl transition-all`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {showAdvancedSettings ? 'Simple' : 'Advanced'}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading ? (
        <motion.div
          variants={itemVariants}
          className={`text-center py-12 rounded-2xl border border-dashed ${theme.border} ${theme.card}`}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`mx-auto h-12 w-12 ${isDark ? 'text-pink-400' : 'text-pink-500'}`}
          >
            <svg fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
          <p className={`mt-4 text-sm font-medium ${theme.text.secondary}`}>Loading theme settings...</p>
        </motion.div>
      ) : (
        <>
          {/* Theme Type Selection */}
          <motion.div
            variants={itemVariants}
            className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
          >
            <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Theme Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  value: 'auto', 
                  label: 'Auto Theme', 
                  desc: 'Automatically generated from school name',
                  icon: '🎨',
                  gradient: 'from-blue-500 to-cyan-600'
                },
                { 
                  value: 'preset', 
                  label: 'Preset Themes', 
                  desc: 'Choose from professionally designed templates',
                  icon: '🎭',
                  gradient: 'from-purple-500 to-pink-600'
                },
                { 
                  value: 'custom', 
                  label: 'Custom Design', 
                  desc: 'Create your own unique color scheme',
                  icon: '🎯',
                  gradient: 'from-green-500 to-emerald-600'
                }
              ].map((type, index) => (
                <motion.button
                  key={type.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => setThemeType(type.value as any)}
                  className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                    themeType === type.value
                      ? 'border-pink-500 shadow-xl'
                      : `${theme.border} ${theme.hover}`
                  }`}
                >
                  {themeType === type.value && (
                    <motion.div
                      layoutId="activeTheme"
                      className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-10`}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <h4 className={`font-semibold ${theme.text.primary}`}>{type.label}</h4>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>{type.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Preset Themes */}
          {themeType === 'preset' && (
            <motion.div
              variants={itemVariants}
              className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
            >
              <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Choose Theme</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {THEME_PRESETS.map((preset, index) => (
                  <motion.button
                    key={preset.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                      selectedPreset === preset.id
                        ? 'border-pink-500 shadow-xl'
                        : `${theme.border} ${theme.hover}`
                    }`}
                  >
                    {selectedPreset === preset.id && (
                      <motion.div
                        layoutId="selectedPreset"
                        className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 opacity-10"
                      />
                    )}
                    <div className="relative z-10">
                      <div 
                        className="h-8 rounded-xl mb-3 shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${preset.colors.primary} 0%, ${preset.colors.secondary} 100%)`
                        }}
                      />
                      <h4 className={`font-semibold text-sm ${theme.text.primary}`}>
                        {preset.name}
                      </h4>
                      <p className={`text-xs ${theme.text.secondary} mt-1`}>
                        {preset.description}
                      </p>
                      <div className="flex gap-1.5 mt-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: preset.colors.primary }} />
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: preset.colors.secondary }} />
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: preset.colors.accent }} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Custom Colors */}
          {themeType === 'custom' && (
            <motion.div
              variants={itemVariants}
              className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
            >
              <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Custom Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(customColors).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <label className={`block text-sm font-medium ${theme.text.primary}`}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key as keyof typeof customColors, e.target.value)}
                          className="w-16 h-16 rounded-xl border-2 cursor-pointer"
                          style={{ borderColor: value }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 bg-white shadow-sm" style={{ backgroundColor: value }} />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleColorChange(key as keyof typeof customColors, e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${theme.input}`}
                          placeholder="#000000"
                        />
                        <div className={`text-xs ${theme.text.secondary} mt-1`}>{value}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Advanced Settings */}
          <AnimatePresence>
            {showAdvancedSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
              >
                <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Advanced Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${theme.text.primary}`}>Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${theme.input}`}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Montserrat">Montserrat</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${theme.text.primary}`}>Border Radius</label>
                    <select
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${theme.input}`}
                    >
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${theme.text.primary}`}>Button Style</label>
                    <select
                      value={buttonStyle}
                      onChange={(e) => setButtonStyle(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${theme.input}`}
                    >
                      <option value="rounded">Rounded</option>
                      <option value="square">Square</option>
                      <option value="pill">Pill</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Preview */}
          {previewMode && (
            <motion.div
              variants={itemVariants}
              className={`rounded-2xl border ${theme.border} ${theme.bg} shadow-lg p-6`}
            >
              <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Live Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex justify-end gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetTheme}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${theme.hover} ${theme.text.primary} border ${theme.border}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveTheme}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="flex items-center gap-2">
                {isLoading ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Theme
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};
