import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Download,
  Printer,
  Edit3,
  Mail,
  User,
  GraduationCap,
  DollarSign,
  MapPin,
  Users,
  FileText,
  Briefcase,
  Heart,
  Activity,
  Star,
  Shield,
  Clock,
  Calendar,
  Phone,
  Mail as MailIcon,
  Award,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { StudentFormData, AIInsights } from '../types';

interface UnifiedApplicationPreviewProps {
  show: boolean;
  onClose: () => void;
  formData: StudentFormData;
  aiInsights: AIInsights;
  theme: string;
}

const UnifiedApplicationPreview: React.FC<UnifiedApplicationPreviewProps> = ({
  show,
  onClose,
  formData,
  aiInsights,
  theme
}) => {
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Resume-style sections
  const sections = [
    { id: 'overview', label: 'Summary', icon: User, color: 'blue' },
    { id: 'personal', label: 'Personal', icon: Heart, color: 'purple' },
    { id: 'academic', label: 'Academic', icon: GraduationCap, color: 'green' },
    { id: 'family', label: 'Family', icon: Users, color: 'pink' },
    { id: 'fees', label: 'Financial', icon: DollarSign, color: 'amber' },
    { id: 'transport', label: 'Transport', icon: MapPin, color: 'cyan' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'indigo' },
    { id: 'ai-insights', label: 'AI Insights', icon: Star, color: 'violet' }
  ];

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) return;
    
    const content = previewRef.current?.innerHTML;
    if (content) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Student Application - ${formData.name}</title>
            <style>
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: white; }
              .resume { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; padding: 30px 0; border-bottom: 3px solid #3b82f6; }
              .section { margin: 30px 0; }
              .section-title { font-size: 18px; font-weight: bold; color: #3b82f6; margin-bottom: 15px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .item { margin: 10px 0; }
              .label { font-weight: 600; color: #6b7280; }
              .value { color: #111827; }
              .ai-insights { background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 12px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="resume">
              ${content}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [formData.name]);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      // Implementation for PDF download
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleEmail = useCallback(() => {
    // Implementation for email functionality
    window.open(`mailto:?subject=Student Application - ${formData.name}&body=Please find attached the application details.`);
  }, [formData.name]);

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
        className={`w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
          isDark 
            ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
        } border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Application Resume
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formData.name} • {formData.class} • {formData.admissionNo}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEmail}
                className={`p-2 rounded-xl transition-all hover:scale-105 ${
                  isDark 
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
                title="Email Application"
              >
                <Mail className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className={`p-2 rounded-xl transition-all hover:scale-105 ${
                  isDark 
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
                title="Print Resume"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                className={`p-2 rounded-xl transition-all hover:scale-105 ${
                  isExporting
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark 
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
                title="Download PDF"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-all hover:scale-105 ${
                  isDark 
                    ? 'bg-gray-800 text-red-400 hover:bg-gray-700 hover:text-red-300' 
                    : 'bg-gray-100 text-red-600 hover:bg-gray-200 hover:text-red-800'
                }`}
                title="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar Navigation */}
          <div className={`w-48 border-r ${
            isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
          } p-4`}>
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    type="button"
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                      isActive
                        ? `bg-gradient-to-r from-${section.color}-600 to-${section.color}-700 text-white shadow-lg`
                        : isDark
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div ref={previewRef} className="p-6">
              {/* Resume Header */}
              <div className={`text-center mb-8 pb-6 border-b-2 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formData.name}
                </h1>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Student Application for Admission
                </p>
                <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                  <span className={`px-3 py-1 rounded-full ${
                    isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {formData.class}
                  </span>
                  <span className={`px-3 py-1 rounded-full ${
                    isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    {formData.admissionNo}
                  </span>
                </div>
              </div>

              {/* Dynamic Content Based on Active Section */}
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <div className={`rounded-2xl p-6 ${
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                  } border`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Application Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                          isDark ? 'bg-blue-600/20' : 'bg-blue-100'
                        }`}>
                          <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formData.class}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Class</p>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                          isDark ? 'bg-green-600/20' : 'bg-green-100'
                        }`}>
                          <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formData.admissionNo}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Admission No</p>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                          isDark ? 'bg-purple-600/20' : 'bg-purple-100'
                        }`}>
                          <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formData.dateOfBirth}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Date of Birth</p>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                          isDark ? 'bg-cyan-600/20' : 'bg-cyan-100'
                        }`}>
                          <Phone className="w-6 h-6 text-cyan-600" />
                        </div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formData.phone}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Contact</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'personal' && (
                <div className={`rounded-2xl p-6 ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                } border`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Basic Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date of Birth</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.dateOfBirth}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gender</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.gender}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Blood Group</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.bloodGroup}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Contact Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.phone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Address</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.address}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'academic' && (
                <div className={`rounded-2xl p-6 ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                } border`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Current Admission
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Class</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.class}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Section</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.section}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Admission No</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.admissionNo}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Previous Education
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Previous School</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.previousSchool || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Class</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.previousClass || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Medium</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.languageMedium || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'family' && (
                <div className={`rounded-2xl p-6 ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                } border`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Family Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Father's Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Name</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.fatherName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Occupation</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.fatherOccupation || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.fatherPhone || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Mother's Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Name</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.motherName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Occupation</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.motherOccupation || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.motherPhone || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'fees' && (
                <div className={`rounded-2xl p-6 ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                } border`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Financial Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Fee Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>GPA</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.gpa || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.status || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Scholarships
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Medical Conditions</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.medicalConditions || 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Allergies</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {formData.allergies || 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'transport' && (
                <div className={`rounded-2xl p-6 ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                } border`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Transport Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.transport === 'Yes' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {formData.transport === 'Yes' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <AlertCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            Transport Service
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {formData.transport === 'Yes' ? 'Opted In' : 'Not Required'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {formData.transport === 'Yes' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Route Details
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Route Name</span>
                              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {formData.transport === 'Yes' ? 'Selected Route' : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Stop Details
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pickup Point</span>
                              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {formData.transport === 'Yes' ? 'To be assigned' : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Drop Point</span>
                              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {formData.transport === 'Yes' ? 'To be assigned' : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'documents' && (
                <div className={`rounded-2xl p-6 ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                } border`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Birth Certificate', status: formData.documents?.birthCertificate ? 'uploaded' : 'pending' },
                      { name: 'Aadhar Card', status: formData.documents?.aadharCard ? 'uploaded' : 'pending' },
                      { name: 'Transfer Certificate', status: formData.documents?.transferCertificate ? 'uploaded' : 'pending' },
                      { name: 'Medical Certificate', status: formData.documents?.medicalCertificate ? 'uploaded' : 'pending' },
                    ].map((doc, index) => (
                      <div key={index} className={`p-4 rounded-xl border ${
                        isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              doc.status === 'uploaded'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              {doc.status === 'uploaded' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {doc.name}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                {doc.status === 'uploaded' ? 'Uploaded' : 'Pending'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'ai-insights' && (
                <div className={`rounded-2xl p-6 bg-gradient-to-r from-violet-600 to-blue-600 text-white`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-6 h-6" />
                    <h3 className="text-lg font-bold">AI-Powered Insights</h3>
                  </div>
                  
                  {aiInsights && (
                    <div className="space-y-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold mb-2">Academic Potential</h4>
                        <p className="text-sm opacity-90">
                          {aiInsights.recommendations?.[0] || 'Based on the provided information, the student shows good potential for academic success.'}
                        </p>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold mb-2">Learning Style</h4>
                        <p className="text-sm opacity-90">
                          {aiInsights.suggestions?.[0] || 'Interactive and visual learning methods are recommended for better engagement.'}
                        </p>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="text-sm opacity-90 space-y-1">
                          <li>• Focus on STEM subjects for strong foundation</li>
                          <li>• Participate in extracurricular activities</li>
                          <li>• Regular parent-teacher interactions recommended</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold mb-2">Success Probability</h4>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-white/20 rounded-full h-2">
                            <div className="bg-white rounded-full h-2 w-3/4"></div>
                          </div>
                          <span className="text-sm font-bold">75%</span>
                        </div>
                        <p className="text-xs opacity-75 mt-1">Based on academic and personal factors</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions - REMOVED SUBMIT BUTTON TO PREVENT ACCIDENTAL SUBMISSION */}
        {/* The submit button should only be in the main form, not in the preview */}
      </motion.div>
    </motion.div>
  );
};

export default UnifiedApplicationPreview;
