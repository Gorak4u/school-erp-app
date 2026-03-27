import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabComponentProps } from '../types';
import { Users, User, Phone, Mail, Briefcase, MapPin, AlertCircle, CheckCircle, Sparkles, Shield, Heart, Building, GraduationCap } from 'lucide-react';

const ParentsInfoTab: React.FC<TabComponentProps> = ({
  formData,
  onChange,
  errors,
  theme,
  getInputClass,
  getTextClass
}) => {
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Consistent input class for all tabs
  const consistentInputClass = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  // Field renderer with enhanced validation
  const renderField = (field: {
    name: keyof typeof formData;
    label: string;
    type: 'text' | 'email' | 'tel';
    placeholder?: string;
    required?: boolean;
    icon?: React.ComponentType<any>;
  }, sectionIndex: number, fieldIndex: number) => {
    const hasError = errors[field.name];
    const isFilled = formData[field.name];
    const Icon = field.icon || User;

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
          <input
            type={field.type}
            value={formData[field.name] as string || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
              hasError ? 'border-red-500 focus:border-red-500' :
              isFilled ? 'border-green-500 focus:border-green-500' :
              'border-gray-300 focus:border-blue-500'
            }`}
          />

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
      {/* Father Information */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          <User className="w-3 h-3" />
          Father
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'fatherName',
            label: "Father's Name",
            required: true,
            type: 'text',
            placeholder: "Father's full name",
            icon: User
          }, 0, 0)}
          {renderField({
            name: 'fatherPhone',
            label: "Father's Phone",
            type: 'tel',
            placeholder: "Father's phone number",
            icon: Phone
          }, 0, 1)}
          {renderField({
            name: 'fatherEmail',
            label: "Father's Email",
            type: 'email',
            placeholder: "Father's email address",
            icon: Mail
          }, 0, 2)}
          {renderField({
            name: 'fatherOccupation',
            label: "Father's Occupation",
            type: 'text',
            placeholder: "Father's occupation",
            icon: Briefcase
          }, 0, 3)}
        </div>
      </div>

      {/* Mother Information */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-purple-400' : 'text-purple-600'
        }`}>
          <Heart className="w-3 h-3" />
          Mother
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'motherName',
            label: "Mother's Name",
            required: true,
            type: 'text',
            placeholder: "Mother's full name",
            icon: User
          }, 1, 0)}
          {renderField({
            name: 'motherPhone',
            label: "Mother's Phone",
            type: 'tel',
            placeholder: "Mother's phone number",
            icon: Phone
          }, 1, 1)}
          {renderField({
            name: 'motherEmail',
            label: "Mother's Email",
            type: 'email',
            placeholder: "Mother's email address",
            icon: Mail
          }, 1, 2)}
          {renderField({
            name: 'motherOccupation',
            label: "Mother's Occupation",
            type: 'text',
            placeholder: "Mother's occupation",
            icon: Briefcase
          }, 1, 3)}
        </div>
      </div>

          </div>
  );
};

export default ParentsInfoTab;
