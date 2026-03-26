'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, X, Zap } from 'lucide-react';

interface AIDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode; description?: string }[];
  placeholder?: string;
  theme?: 'dark' | 'light';
  getCardClass?: () => string;
  getInputClass?: () => string;
  getBtnClass?: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass?: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
  searchable?: boolean;
  aiSuggestions?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function AIDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  theme = 'dark',
  getCardClass,
  getInputClass,
  getBtnClass,
  getTextClass,
  searchable = false,
  aiSuggestions = true,
  disabled = false,
  className = ''
}: AIDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiRecommended, setAiRecommended] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const cardClass = getCardClass?.() || (isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200');
  const inputClass = getInputClass?.() || (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900');
  const primaryTextClass = getTextClass?.('primary') || (isDark ? 'text-white' : 'text-gray-900');
  const secondaryTextClass = getTextClass?.('secondary') || (isDark ? 'text-gray-400' : 'text-gray-600');
  const accentTextClass = getTextClass?.('accent') || (isDark ? 'text-blue-400' : 'text-blue-600');

  // AI-powered suggestions based on usage patterns
  useEffect(() => {
    if (aiSuggestions && options.length > 0) {
      // Simulate AI recommendations based on common patterns
      const recommendations = options
        .filter(opt => 
          opt.value.includes('active') || 
          opt.value.includes('all') || 
          opt.label.toLowerCase().includes('class') ||
          opt.value === 'all'
        )
        .slice(0, 3)
        .map(opt => opt.value);
      setAiRecommended(recommendations);
    }
  }, [options, aiSuggestions]);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Trigger */}
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl border-2 text-left
          flex items-center justify-between gap-3
          transition-all duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen 
            ? 'border-blue-500/50 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10' 
            : 'border-gray-500/30 hover:border-gray-500/50'
          }
          ${cardClass}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption?.icon && (
            <div className="flex-shrink-0">
              {selectedOption.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className={`font-medium truncate ${primaryTextClass}`}>
              {selectedOption?.label || placeholder}
            </div>
            {selectedOption?.description && (
              <div className={`text-xs truncate ${secondaryTextClass}`}>
                {selectedOption.description}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {aiRecommended.includes(value) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
            >
              <Zap className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-bold text-purple-600">Smart</span>
            </motion.div>
          )}
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${secondaryTextClass} ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </motion.button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute z-50 w-full mt-2 rounded-xl border-2 shadow-2xl
              max-h-64 overflow-hidden
              ${cardClass}
              border-gray-500/30
              backdrop-blur-sm
            `}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-3 border-b border-gray-500/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`
                      w-full pl-10 pr-4 py-2 rounded-lg border
                      ${inputClass}
                      border-gray-500/30 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                    `}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Smart Suggestions Header */}
            {aiSuggestions && aiRecommended.length > 0 && !searchTerm && (
              <div className="px-3 py-2 border-b border-gray-500/20">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  <span className={`text-xs font-bold ${accentTextClass}`}>Smart Recommended</span>
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center">
                  <div className={`text-sm ${secondaryTextClass}`}>
                    No options found
                  </div>
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isRecommended = aiRecommended.includes(option.value);
                  const isSelected = option.value === value;
                  
                  return (
                    <motion.button
                      key={option.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`
                        w-full px-3 py-2.5 text-left
                        flex items-center gap-3
                        transition-all duration-200
                        hover:bg-gradient-to-r
                        ${isSelected 
                          ? 'bg-blue-500/20 border-l-4 border-blue-500' 
                          : 'hover:from-blue-500/10 hover:to-purple-500/10'
                        }
                      `}
                    >
                      {option.icon && (
                        <div className="flex-shrink-0">
                          {option.icon}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${primaryTextClass}`}>
                          {option.label}
                        </div>
                        {option.description && (
                          <div className={`text-xs truncate ${secondaryTextClass}`}>
                            {option.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isRecommended && !isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3 text-blue-500" />
                          </motion.div>
                        )}
                        
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* AI Footer */}
            {aiSuggestions && (
              <div className="px-3 py-2 border-t border-gray-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-purple-500" />
                    <span className={`text-xs ${secondaryTextClass}`}>AI Enhanced</span>
                  </div>
                  <span className={`text-xs ${secondaryTextClass}`}>
                    {filteredOptions.length} options
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
