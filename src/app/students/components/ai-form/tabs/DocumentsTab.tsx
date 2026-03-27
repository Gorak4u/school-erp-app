import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle, CheckCircle, Sparkles, Camera, File, Shield, Award, Image, FolderOpen } from 'lucide-react';
import { TabComponentProps } from '../types';

const DocumentsTab: React.FC<TabComponentProps> = ({
  formData,
  onChange,
  errors,
  theme,
  getInputClass,
  getTextClass
}) => {
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleDocumentToggle = (docType: keyof typeof formData.documents) => {
    onChange('documents', {
      ...formData.documents,
      [docType]: !formData.documents[docType]
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange('photo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const documentOptions = [
    { key: 'birthCertificate' as keyof typeof formData.documents, label: 'Birth Certificate', icon: FileText },
    { key: 'aadharCard' as keyof typeof formData.documents, label: 'Aadhar Card', icon: Shield },
    { key: 'transferCertificate' as keyof typeof formData.documents, label: 'Transfer Certificate', icon: File },
    { key: 'medicalCertificate' as keyof typeof formData.documents, label: 'Medical Certificate', icon: Shield },
    { key: 'passportPhoto' as keyof typeof formData.documents, label: 'Passport Photo', icon: Camera },
    { key: 'marksheet' as keyof typeof formData.documents, label: 'Previous Marksheet', icon: Award },
    { key: 'casteCertificate' as keyof typeof formData.documents, label: 'Caste Certificate', icon: FileText },
    { key: 'incomeCertificate' as keyof typeof formData.documents, label: 'Income Certificate', icon: Shield },
  ];

  // Document toggle renderer
  const renderDocumentToggle = (doc: typeof documentOptions[0], index: number) => {
    const isChecked = formData.documents[doc.key];
    const Icon = doc.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        className="relative"
      >
        <motion.button
          type="button"
          onClick={() => handleDocumentToggle(doc.key)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full p-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
            isChecked
              ? isDark 
                ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/50 shadow-lg'
                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500/50 shadow-md'
              : isDark
                ? 'bg-slate-800/50 border-slate-600/50 hover:border-slate-500/50'
                : 'bg-white border-gray-300/50 hover:border-gray-400/50'
          }`}
        >
          <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 ${
            isChecked
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-600'
          }`}>
            {isChecked ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <Check className="w-3 h-3" />
              </motion.div>
            ) : (
              <Icon className="w-3 h-3" />
            )}
          </div>
          
          <span className={`text-sm font-medium transition-colors duration-300 ${
            isChecked
              ? isDark ? 'text-blue-300' : 'text-blue-700'
              : isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {doc.label}
          </span>

          {isChecked && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-auto"
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {/* Student Photo */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          <Camera className="w-3 h-3" />
          Student Photo
        </h4>
        <div className="flex flex-col items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            {formData.photo ? (
              <div className="relative">
                <img
                  src={formData.photo}
                  alt="Student photo"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500 shadow-lg"
                />
                <motion.button
                  type="button"
                  onClick={() => onChange('photo', '')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 shadow-lg"
                >
                  ×
                </motion.button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-400 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <Camera className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </motion.div>
          
          <motion.label
            htmlFor="photo-upload"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
              isDark
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md'
            }`}
          >
            {formData.photo ? 'Change Photo' : 'Upload Photo'}
          </motion.label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Documents Checklist */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-purple-400' : 'text-purple-600'
        }`}>
          <FolderOpen className="w-3 h-3" />
          Documents
        </h4>
        <div className="space-y-1.5">
          {documentOptions.map((doc, index) => (
            <div key={doc.key}>
              {renderDocumentToggle(doc, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;
