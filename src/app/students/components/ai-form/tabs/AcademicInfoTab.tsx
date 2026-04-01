import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabComponentProps } from '../types';
import { GraduationCap, BookOpen, Award, Target, Calendar, Clock, AlertCircle, CheckCircle, Sparkles, School, Trophy, Star } from 'lucide-react';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

const AcademicInfoTab: React.FC<TabComponentProps> = ({
  formData,
  onChange,
  errors,
  theme,
  getInputClass,
  getTextClass
}) => {
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Consistent input class for all tabs (matching ContactInfoTab)
  const consistentInputClass = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  
  // Use school config context for dropdown data
  const { boards, mediums, classes, sections, loading: configLoading } = useSchoolConfig();

  // Auto-generate admission number and date on component mount if not already set
  const [hasGenerated, setHasGenerated] = useState(false);
  
  useEffect(() => {
    // Only run once on component mount
    if (!hasGenerated) {
      // Auto-generate admission number if not set
      // Format: YYYY#### e.g., "20250001", "20250002" (matching API format)
      if (!formData.admissionNo) {
        const currentYear = new Date().getFullYear();
        const sequence = Math.floor(1000 + Math.random() * 9000);
        const generatedAdmissionNo = `${currentYear}${sequence}`;
        onChange('admissionNo', generatedAdmissionNo);
      }

      // Auto-generate admission date if not set (default to today)
      if (!formData.admissionDate) {
        const today = new Date().toISOString().split('T')[0];
        onChange('admissionDate', today);
      }
      
      setHasGenerated(true);
    }
  }, [hasGenerated, formData.admissionNo, formData.admissionDate, onChange]);

  // Transform raw data to expected format for renderField
  const transformedBoards = boards.map(board => ({ id: board.id, name: board.name }));
  const transformedMediums = mediums.map(medium => ({ id: medium.id, name: medium.name }));
  const transformedClasses = classes.map(cls => ({ id: cls.id, name: cls.name }));
  const transformedSections = sections.map(section => ({ id: section.id, name: section.name }));
  const loading = configLoading;

  // Filter options based on selections (using original data)
  // For now, show all mediums since boards don't filter by academic year
  const filteredMediums = transformedMediums;
  const filteredClasses = transformedClasses.filter(cls => {
    const original = classes.find(c => c.id === cls.id);
    return original ? original.mediumId === formData.mediumId : false;
  });
  const filteredSections = transformedSections.filter(section => {
    const original = sections.find(s => s.id === section.id);
    return original ? original.classId === formData.classId : false;
  });

  // Handle cascaded changes
  const handleBoardChange = (boardId: string) => {
    onChange('boardId', boardId);
    // Also set the display name
    const selectedBoard = boards.find(b => b.id === boardId);
    if (selectedBoard) {
      onChange('board', selectedBoard.name);
    }
    // Reset dependent fields
    onChange('mediumId', '');
    onChange('languageMedium', '');
    onChange('classId', '');
    onChange('class', '');
    onChange('sectionId', '');
    onChange('section', '');
  };

  const handleMediumChange = (mediumId: string) => {
    onChange('mediumId', mediumId);
    // Also set the display name
    const selectedMedium = mediums.find(m => m.id === mediumId);
    if (selectedMedium) {
      onChange('languageMedium', selectedMedium.name);
    }
    // Reset dependent fields
    onChange('classId', '');
    onChange('class', '');
    onChange('sectionId', '');
    onChange('section', '');
  };

  const handleClassChange = (classId: string) => {
    onChange('classId', classId);
    // Also set the display name
    const selectedClass = classes.find(c => c.id === classId);
    if (selectedClass) {
      onChange('class', selectedClass.name);
    }
    // Reset dependent field
    onChange('sectionId', '');
    onChange('section', '');
  };

  const handleSectionChange = (sectionId: string) => {
    onChange('sectionId', sectionId);
    // Also set the display name
    const selectedSection = sections.find(s => s.id === sectionId);
    if (selectedSection) {
      onChange('section', selectedSection.name);
    }
  };

  // Field renderer with enhanced validation
  const renderField = (field: {
    name: keyof typeof formData;
    label: string;
    type: 'text' | 'date' | 'select';
    placeholder?: string;
    required?: boolean;
    options?: Array<{ id: string; name: string }>;
    disabled?: boolean;
    icon?: React.ComponentType<any>;
    onChange?: (value: string) => void;
  }, sectionIndex: number, fieldIndex: number) => {
    const hasError = errors[field.name];
    const isFilled = formData[field.name];
    const Icon = field.icon || GraduationCap;

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: fieldIndex * 0.03 }}
        className="relative"
      >
        <div className="relative group">
          {/* Field Icon */}
          <div className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-10`}>
            <Icon className={`w-3 h-3 transition-colors duration-200 ${
              hasError ? 'text-red-500' : 
              isFilled ? 'text-green-500' : 
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>

          {/* Input Field */}
          {field.type === 'select' ? (
            <select
              value={formData[field.name] as string || ''}
              onChange={(e) => field.onChange ? field.onChange(e.target.value) : onChange(field.name, e.target.value)}
              disabled={field.disabled}
              className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
                hasError ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                field.disabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed' :
                'border-gray-300 focus:border-blue-500'
              }`}
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((option) => (
                <option key={`${field.name}-${option.id}-${option.name}`} value={option.id}>{option.name}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={formData[field.name] as string || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
                hasError ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                field.disabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60' :
                'border-gray-300 focus:border-blue-500'
              }`}
            />
          )}

          {/* Validation Indicator */}
          <AnimatePresence>
            {isFilled && !hasError && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute right-1.5 top-1/2 transform -translate-y-1/2"
              >
                <CheckCircle className="w-3 h-3 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Required Indicator */}
          {field.required && !isFilled && (
            <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* Label */}
        <div className="flex items-center gap-1 mt-0.5 mb-0.5">
          <label className={`text-sm font-medium transition-colors duration-200 ${
            hasError ? 'text-red-500' : 
            isFilled ? 'text-green-500' : 
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {isFilled && !hasError && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-0.5"
            >
              <Sparkles className="w-2 h-2 text-green-500" />
            </motion.div>
          )}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex items-center gap-0.5 mt-0.5"
            >
              <AlertCircle className="w-2.5 h-2.5 text-red-500" />
              <span className="text-xs text-red-500">{errors[field.name]}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {/* Admission Details */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          <GraduationCap className="w-3 h-3" />
          Admission
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'admissionNo',
            label: 'Admission Number',
            required: true,
            type: 'text',
            placeholder: 'Format: YYYY#### (e.g., 20250001)',
            icon: Award,
            disabled: true // Auto-generated field
          }, 0, 0)}
          {renderField({
            name: 'admissionDate',
            label: 'Admission Date',
            required: true,
            type: 'date',
            icon: Calendar,
            disabled: true // Auto-generated field
          }, 0, 1)}
        </div>
      </div>

      {/* Educational Board */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-purple-400' : 'text-purple-600'
        }`}>
          <School className="w-3 h-3" />
          Board & Medium
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="ml-auto w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full"
            />
          )}
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'boardId',
            label: 'Board',
            type: 'select',
            placeholder: 'Select Board',
            options: transformedBoards,
            required: true,
            onChange: handleBoardChange,
            icon: School
          }, 1, 0)}
          {renderField({
            name: 'mediumId',
            label: 'Language Medium',
            type: 'select',
            placeholder: 'Select Medium',
            options: filteredMediums,
            disabled: !formData.boardId,
            onChange: handleMediumChange,
            icon: BookOpen
          }, 1, 1)}
        </div>
      </div>

      {/* Class Assignment */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/30' 
          : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-green-400' : 'text-green-600'
        }`}>
          <Target className="w-3 h-3" />
          Class Assignment
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'classId',
            label: 'Class',
            type: 'select',
            placeholder: 'Select Class',
            options: filteredClasses,
            disabled: !formData.mediumId,
            onChange: handleClassChange,
            icon: Target
          }, 2, 0)}
          {renderField({
            name: 'sectionId',
            label: 'Section',
            type: 'select',
            placeholder: 'Select Section',
            options: filteredSections,
            disabled: !formData.classId,
            onChange: handleSectionChange,
            icon: Trophy
          }, 2, 1)}
        </div>
      </div>

      {/* Roll Number */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          <GraduationCap className="w-3 h-3" />
          Roll Number
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'rollNumber',
            label: 'Roll Number',
            type: 'text',
            placeholder: 'Assign roll number',
            icon: Award
          }, 3, 0)}
        </div>
      </div>

      {/* Previous School */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-purple-400' : 'text-purple-600'
        }`}>
          <School className="w-3 h-3" />
          Previous School
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'previousSchool',
            label: 'Previous School',
            type: 'text',
            placeholder: 'Previous school name',
            icon: School
          }, 4, 0)}
        </div>
      </div>

      {/* Previous Class */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/30' 
          : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-green-400' : 'text-green-600'
        }`}>
          <Target className="w-3 h-3" />
          Previous Class
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'previousClass',
            label: 'Previous Class',
            type: 'text',
            placeholder: 'Previous class/grade',
            icon: Target
          }, 5, 0)}
        </div>
      </div>
    </div>
  );
};

export default AcademicInfoTab;
