import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { StudentFormData, AIInsights } from '../types';

interface FormPreviewModalProps {
  show: boolean;
  onClose: () => void;
  formData: StudentFormData;
  aiInsights: AIInsights;
  theme: string;
  cardClass: string;
  onSubmit?: (e: React.FormEvent) => Promise<void>;
  isSubmitting?: boolean;
}

const FormPreviewModal: React.FC<FormPreviewModalProps> = ({
  show,
  onClose,
  formData,
  aiInsights,
  theme,
  cardClass,
  onSubmit,
  isSubmitting = false
}) => {
  const isDark = theme === 'dark';

  const previewData = {
    ...formData,
    aiInsights,
    submittedAt: new Date().toISOString()
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-60 flex items-center justify-center p-4 ${
        isDark ? 'bg-black/80' : 'bg-black/60'
      } backdrop-blur-sm`}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl ${cardClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Application Preview
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div id="admission-preview-print" className={`rounded-2xl border p-6 space-y-6 ${
            isDark ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-white'
          }`}>
            {/* School Header */}
            <div className={`rounded-2xl p-6 ${
              isDark ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 object-contain rounded-2xl bg-white/10 p-2 flex items-center justify-center">
                  <span className="text-2xl font-bold">SCH</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">School Name</h3>
                  <p className="text-sm opacity-90">Student Admission Preview</p>
                </div>
              </div>
            </div>

            {/* Student Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-4 ${
                isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <h4 className="font-bold mb-3">Student Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Name</span>
                    <span className="font-medium text-right">{previewData.name || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Admission No</span>
                    <span className="font-medium text-right">{previewData.admissionNo || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Class</span>
                    <span className="font-medium text-right">{previewData.classId || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Section</span>
                    <span className="font-medium text-right">{previewData.sectionId || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Date of Birth</span>
                    <span className="font-medium text-right">{previewData.dateOfBirth || '—'}</span>
                  </div>
                </div>
              </div>
              <div className={`rounded-2xl border p-4 ${
                isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <h4 className="font-bold mb-3">Contact & Family</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Student Email</span>
                    <span className="font-medium text-right">{previewData.email || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Student Phone</span>
                    <span className="font-medium text-right">{previewData.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Father</span>
                    <span className="font-medium text-right">{previewData.fatherName || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Mother</span>
                    <span className="font-medium text-right">{previewData.motherName || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Address</span>
                    <span className="font-medium text-right">{previewData.address || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Summary */}
            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
            }`}>
              <div className={`px-4 py-3 border-b font-bold ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}>Fee Summary</div>
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Fees:</span>
                    <span className="font-semibold">To be calculated</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Discount:</span>
                    <span className="font-semibold text-green-600">—</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">Final Amount:</span>
                    <span className="font-bold text-blue-600">To be calculated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {aiInsights.confidence > 0 && (
              <div className={`rounded-2xl border p-4 ${
                isDark ? 'border-blue-800 bg-blue-950/40' : 'border-blue-200 bg-blue-50'
              }`}>
                <h4 className="font-bold mb-3">AI Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Confidence Score:</span>
                    <span className="font-semibold">{aiInsights.confidence.toFixed(1)}%</span>
                  </div>
                  {aiInsights.suggestions.length > 0 && (
                    <div className="mt-3">
                      <span className={`font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>Suggestions:</span>
                      <ul className="mt-1 space-y-1">
                        {aiInsights.suggestions.map((suggestion, index) => (
                          <li key={index} className={`ml-4 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => window.print()} 
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-white'
              }`}
            >
              Print Preview
            </button>
            <button 
              type="button" 
              onClick={() => alert('PDF download functionality to be implemented')} 
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-white'
              }`}
            >
              Save PDF
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-white'
              }`}
            >
              Edit
            </button>
            <button 
              type="button" 
              onClick={onSubmit}
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all ${
                isSubmitting 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Admission'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FormPreviewModal;
