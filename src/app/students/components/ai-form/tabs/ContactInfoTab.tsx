import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabComponentProps } from '../types';
import { Phone, Mail, MapPin, Home, Globe, Building, MessageSquare, AlertCircle, CheckCircle, Sparkles, Navigation, Wifi, Shield } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
];

// Validation utilities
const digitsOnly = (value: string | undefined | null) => (value || '').replace(/\D/g, '');
const isPhoneValid = (value: string | undefined | null) => {
  if (!value) return { isValid: false, message: 'Phone number is required' };
  const digits = digitsOnly(value);
  return { 
    isValid: digits.length >= 10 && digits.length <= 15, 
    message: digits.length >= 10 && digits.length <= 15 ? undefined : 'Phone must be 10-15 digits'
  };
};
const isPinValid = (value: string | undefined | null) => {
  if (!value) return { isValid: true };
  const digits = digitsOnly(value);
  return { 
    isValid: digits.length === 6, 
    message: digits.length === 6 ? undefined : 'PIN must be exactly 6 digits'
  };
};

const ContactInfoTab: React.FC<TabComponentProps> = ({
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
    type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
    placeholder?: string;
    required?: boolean;
    options?: string[];
    maxLength?: number;
    rows?: number;
    icon?: React.ComponentType<any>;
    validation?: (value: string) => { isValid: boolean; message?: string | undefined };
  }, sectionIndex: number, fieldIndex: number) => {
    const hasError = errors[field.name];
    const isFilled = formData[field.name];
    const Icon = field.icon || Phone;
    
    // Validation
    let validationResult: { isValid: boolean; message?: string } = { isValid: true };
    if (field.validation && isFilled) {
      validationResult = field.validation(isFilled as string);
    }

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
              hasError || !validationResult.isValid ? 'text-red-500' : 
              isFilled ? 'text-green-500' : 
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>

          {/* Input Field */}
          {field.type === 'select' ? (
            <select
              value={formData[field.name] as string || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
                hasError || !validationResult.isValid ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                'border-gray-300 focus:border-blue-500'
              }`}
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={formData[field.name] as string || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              rows={field.rows || 2}
              className={`${getInputClass()} pl-7 pr-6 text-sm py-1.5 transition-all duration-200 resize-none ${
                hasError || !validationResult.isValid ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                'border-gray-300 focus:border-blue-500'
              }`}
            />
          ) : (
            <input
              type={field.type}
              value={formData[field.name] as string || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
                hasError || !validationResult.isValid ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                'border-gray-300 focus:border-blue-500'
              }`}
            />
          )}

          {/* Validation Indicator */}
          <AnimatePresence>
            {isFilled && !hasError && validationResult.isValid && (
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
            hasError || !validationResult.isValid ? 'text-red-500' : 
            isFilled ? 'text-green-500' : 
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {isFilled && !hasError && validationResult.isValid && (
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
          {(hasError || !validationResult.isValid) && (
            <motion.div
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex items-center gap-0.5 mt-0.5"
            >
              <AlertCircle className="w-2.5 h-2.5 text-red-500" />
              <span className="text-xs text-red-500">
                {errors[field.name] || validationResult.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {/* Primary Contact */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          <Phone className="w-3 h-3" />
          Primary Contact
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'phone',
            label: 'Phone Number',
            required: true,
            type: 'tel',
            placeholder: '10-digit mobile',
            maxLength: 15,
            icon: Phone,
            validation: isPhoneValid
          }, 0, 0)}
          {renderField({
            name: 'email',
            label: 'Email Address',
            required: false,
            type: 'email',
            placeholder: 'Email address (optional)',
            icon: Mail
          }, 0, 1)}
        </div>
      </div>

      {/* Address Information */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-purple-400' : 'text-purple-600'
        }`}>
          <Home className="w-3 h-3" />
          Address
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'address',
            label: 'Current Address',
            type: 'textarea',
            placeholder: 'Street, area, city',
            rows: 2,
            icon: Home
          }, 1, 0)}
          {renderField({
            name: 'city',
            label: 'City',
            type: 'text',
            placeholder: 'City',
            icon: Building
          }, 1, 1)}
        </div>
      </div>

      {/* Location Details */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/30' 
          : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-green-400' : 'text-green-600'
        }`}>
          <MapPin className="w-3 h-3" />
          Location
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'state',
            label: 'State',
            type: 'select',
            placeholder: 'Select state',
            options: INDIAN_STATES,
            icon: MapPin
          }, 2, 0)}
          {renderField({
            name: 'pincode',
            label: 'PIN Code',
            type: 'text',
            placeholder: '6-digit PIN',
            maxLength: 6,
            icon: Navigation,
            validation: isPinValid
          }, 2, 1)}
          {renderField({
            name: 'nationality',
            label: 'Country/Nationality',
            type: 'text',
            placeholder: 'Country',
            icon: Globe
          }, 2, 2)}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700/30' 
          : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-orange-400' : 'text-orange-600'
        }`}>
          <Shield className="w-3 h-3" />
          Emergency
        </h4>
        <div className="space-y-2">
          {renderField({
            name: 'emergencyContact',
            label: 'Emergency Contact',
            type: 'tel',
            placeholder: 'Parent/guardian phone',
            maxLength: 15,
            icon: Shield,
            validation: isPhoneValid
          }, 3, 0)}
        </div>
      </div>
    </div>
  );
};

export default ContactInfoTab;
