import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabComponentProps } from '../types';
import { User, Calendar, Heart, Globe, MapPin, Hash, Fingerprint, AlertCircle, CheckCircle, Sparkles, Star, Shield, Award } from 'lucide-react';

const PersonalInfoTab: React.FC<TabComponentProps> = ({
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

  const sections = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: User,
      color: 'blue',
      fields: [
        { name: 'name', label: 'Full Name', required: true, type: 'text', placeholder: 'Enter student\'s full name' },
        { name: 'dateOfBirth', label: 'Date of Birth', required: true, type: 'date' },
        { name: 'gender', label: 'Gender', required: true, type: 'select', options: ['Male', 'Female', 'Other'] },
        { name: 'bloodGroup', label: 'Blood Group', required: false, type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }
      ]
    },
    {
      id: 'demographic',
      title: 'Demographic Details',
      icon: Globe,
      color: 'purple',
      fields: [
        { name: 'placeOfBirth', label: 'Place of Birth', required: false, type: 'text', placeholder: 'Enter place of birth' },
        { name: 'nationality', label: 'Nationality', required: false, type: 'text', placeholder: 'Enter nationality' },
        { name: 'religion', label: 'Religion', required: false, type: 'select', options: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'] },
        { name: 'category', label: 'Category', required: false, type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'] },
        { name: 'motherTongue', label: 'Mother Tongue', required: false, type: 'text', placeholder: 'Enter mother tongue' }
      ]
    },
    {
      id: 'additional',
      title: 'Additional Information',
      icon: Shield,
      color: 'green',
      fields: [
        { name: 'stsId', label: 'STS ID', required: false, type: 'text', placeholder: 'Student Tracking System ID' },
        { name: 'aadharNumber', label: 'Aadhar Number', required: false, type: 'text', placeholder: '12-digit Aadhar number', maxLength: 12 }
      ]
    }
  ];

  const getSectionGradient = (color: string) => {
    const gradients = {
      blue: 'from-blue-500 to-cyan-500',
      purple: 'from-purple-500 to-pink-500',
      green: 'from-green-500 to-emerald-500'
    };
    return gradients[color as keyof typeof gradients] || 'from-gray-500 to-gray-600';
  };

  const getSectionBg = (color: string) => {
    const backgrounds = {
      blue: isDark ? 'from-blue-900/20 to-cyan-900/20' : 'from-blue-50 to-cyan-50',
      purple: isDark ? 'from-purple-900/20 to-pink-900/20' : 'from-purple-50 to-pink-50',
      green: isDark ? 'from-green-900/20 to-emerald-900/20' : 'from-green-50 to-emerald-50'
    };
    return backgrounds[color as keyof typeof backgrounds] || 'from-gray-50 to-gray-100';
  };

  const renderField = (field: any, sectionIndex: number, fieldIndex: number) => {
    const hasError = errors[field.name];
    const isFilled = formData[field.name as keyof typeof formData];
    const Icon = field.name === 'name' ? User : 
                field.name === 'dateOfBirth' ? Calendar :
                field.name === 'bloodGroup' ? Heart :
                field.name === 'placeOfBirth' ? MapPin :
                field.name === 'nationality' || field.name === 'motherTongue' ? Globe :
                field.name === 'aadharNumber' ? Fingerprint : Hash;

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
              value={formData[field.name as keyof typeof formData] as string || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
                hasError ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                'border-gray-300 focus:border-blue-500'
              }`}
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={formData[field.name as keyof typeof formData] as string || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
                hasError ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
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

        {/* Ultra-Compact Label */}
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

        {/* Ultra-Compact Error Message */}
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
      {/* Basic Information */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          <User className="w-3 h-3" />
          Basic Info
        </h4>
        <div className="space-y-2">
          {renderField({ name: 'name', label: 'Full Name', required: true, type: 'text', placeholder: 'Enter student\'s full name' }, 0, 0)}
          {renderField({ name: 'dateOfBirth', label: 'Date of Birth', required: true, type: 'date' }, 0, 1)}
          {renderField({ name: 'gender', label: 'Gender', required: true, type: 'select', options: ['Male', 'Female', 'Other'] }, 0, 2)}
          {renderField({ name: 'bloodGroup', label: 'Blood Group', required: false, type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }, 0, 3)}
        </div>
      </div>

      {/* Demographic Information */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-purple-400' : 'text-purple-600'
        }`}>
          <Globe className="w-3 h-3" />
          Demographics
        </h4>
        <div className="space-y-2">
          {renderField({ name: 'placeOfBirth', label: 'Place of Birth', required: false, type: 'text', placeholder: 'Enter place of birth' }, 1, 0)}
          {renderField({ name: 'nationality', label: 'Nationality', required: false, type: 'text', placeholder: 'Enter nationality' }, 1, 1)}
          {renderField({ name: 'religion', label: 'Religion', required: false, type: 'select', options: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'] }, 1, 2)}
          {renderField({ name: 'category', label: 'Category', required: false, type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'] }, 1, 3)}
          {renderField({ name: 'motherTongue', label: 'Mother Tongue', required: false, type: 'text', placeholder: 'Enter mother tongue' }, 1, 4)}
        </div>
      </div>

      {/* Additional Information */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/30' 
          : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-green-400' : 'text-green-600'
        }`}>
          <Shield className="w-3 h-3" />
          Additional
        </h4>
        <div className="space-y-2">
          {renderField({ name: 'stsId', label: 'STS ID', required: false, type: 'text', placeholder: 'Student Tracking System ID' }, 2, 0)}
          {renderField({ name: 'aadharNumber', label: 'Aadhar Number', required: false, type: 'text', placeholder: '12-digit Aadhar number', maxLength: 12 }, 2, 1)}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
