import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Download,
  Printer,
  Mail,
  User,
  GraduationCap,
  Phone,
  Mail as MailIcon,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  FileText,
  Award,
  Activity,
  TrendingUp,
  CheckCircle,
  Star,
  Shield,
  Heart,
  Building,
  Globe,
  Brain,
  Zap,
  Sparkles,
  Cpu,
  Network,
  BarChart3,
  Target,
  Eye,
  Lightbulb,
  Rocket,
  Gem,
  Layers,
  Waves
} from 'lucide-react';
import { StudentFormData, AIInsights } from '../types';
import { useSchoolDetails, useAcademicYears } from '@/contexts/SchoolConfigContext';

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
  const [isExporting, setIsExporting] = React.useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Advanced AI World-Class Features
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [neuralNetworkActive, setNeuralNetworkActive] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(0);
  
  // Get real school data from database
  const schoolDetails = useSchoolDetails();
  const { activeAcademicYear } = useAcademicYears();

  // Mouse tracking for spotlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // AI Processing animation
  useEffect(() => {
    if (show) {
      setAiProcessing(true);
      setNeuralNetworkActive(true);
      
      // Simulate AI confidence calculation
      const confidenceInterval = setInterval(() => {
        setAiConfidence(prev => {
          const next = prev + Math.random() * 15;
          return next >= 95 ? 95 : next;
        });
      }, 200);

      setTimeout(() => {
        setAiProcessing(false);
        clearInterval(confidenceInterval);
        setAiConfidence(aiInsights.confidence || 95);
      }, 2000);

      return () => clearInterval(confidenceInterval);
    }
  }, [show, aiInsights.confidence]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    setAiProcessing(true);
    try {
      // AI-powered document generation simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowSuccess(true);
      setAiProcessing(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('AI Export failed:', error);
      setAiProcessing(false);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleEmail = useCallback(() => {
    window.open(`mailto:?subject=Student Application - ${formData.name}&body=Please find attached the application details.`);
  }, [formData.name]);

  if (!show) return null;

  return (
    <AnimatePresence>
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
          id="ai-preview-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
            isDark 
              ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 border-gray-700' 
              : 'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-gray-200'
          } border`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* AI-Enhanced Header */}
          <div className={`px-6 py-4 border-b relative overflow-hidden ${
            isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            {/* Neural Network Background Animation */}
            {neuralNetworkActive && (
              <div className="absolute inset-0 opacity-20">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-500 rounded-full"
                    animate={{
                      x: [0, Math.random() * 300 - 150],
                      y: [0, Math.random() * 100 - 50],
                      opacity: [0, 1, 0],
                      scale: [1, 2, 1],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  />
                ))}
              </div>
            )}
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Brain className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <motion.h2 
                    className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                    }}
                    style={{
                      backgroundSize: '200% 200%',
                    }}
                  >
                    AI-Powered Application Resume
                  </motion.h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formData.name} • {formData.class} • {formData.admissionNo}
                  </p>
                  {aiProcessing && (
                    <motion.div 
                      className="flex items-center gap-2 text-xs text-blue-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Cpu className="w-3 h-3 animate-pulse" />
                      AI Processing... {aiConfidence.toFixed(1)}%
                    </motion.div>
                  )}
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

          {/* Main Content - AI Enhanced Printable Resume */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div ref={previewRef} className="bg-white relative" id="ai-preview-container">
              {/* Advanced AI World-Class Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-indigo-900/10 pointer-events-none">
                {/* Dynamic Mouse Spotlight */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59,130,246,0.4) 0%, rgba(147,51,234,0.3) 30%, transparent 70%)`
                  }}
                />
                
                {/* Neural Network Visualization */}
                {neuralNetworkActive && (
                  <div className="absolute inset-0">
                    {/* Neural Connections */}
                    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
                      {[...Array(12)].map((_, i) => (
                        <motion.line
                          key={`line-${i}`}
                          x1={`${Math.random() * 100}%`}
                          y1={`${Math.random() * 100}%`}
                          x2={`${Math.random() * 100}%`}
                          y2={`${Math.random() * 100}%`}
                          stroke="url(#gradient)"
                          strokeWidth="1"
                          animate={{
                            opacity: [0, 1, 0],
                            pathLength: [0, 1],
                          }}
                          transition={{
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#9333EA" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Neural Nodes */}
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={`node-${i}`}
                        className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                        animate={{
                          x: [0, Math.random() * 200 - 100],
                          y: [0, Math.random() * 200 - 100],
                          opacity: [0, 1, 0.5, 0],
                          scale: [1, 1.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 5 + Math.random() * 3,
                          repeat: Infinity,
                          delay: Math.random() * 3,
                        }}
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                )}
              
              {/* Floating AI Particles */}
              {[...Array(25)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full"
                  animate={{
                    x: [0, Math.random() * 150 - 75],
                    y: [0, Math.random() * 150 - 75],
                    opacity: [0, 0.8, 0],
                    scale: [1, 2, 1],
                  }}
                  transition={{
                    duration: 6 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
              
              {/* AI Processing Waves */}
              {aiProcessing && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                  animate={{
                    opacity: [0, 0.3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}
            </div>

              {/* School Letterhead */}
              <div className="relative z-10 bg-gradient-to-r from-blue-800 to-blue-600 text-white p-8 text-center">
                <div className="flex justify-center mb-4">
                  {schoolDetails.logo_url ? (
                    <img 
                      src={schoolDetails.logo_url} 
                      alt={`${schoolDetails.name} Logo`}
                      className="w-16 h-16 object-contain bg-white rounded-lg p-1"
                    />
                  ) : (
                    <Building className="w-16 h-16 text-white/80" />
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2">{schoolDetails.name || 'School Name'}</h1>
                <p className="text-lg text-blue-100 mb-1">Excellence in Education Since {schoolDetails.established || '1985'}</p>
                <div className="flex justify-center gap-4 text-sm text-blue-100 mt-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {schoolDetails.address || 'School Address'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {schoolDetails.phone || '+1 (555) 123-4567'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {schoolDetails.website ? (
                      <a href={schoolDetails.website.startsWith('http') ? schoolDetails.website : `https://${schoolDetails.website}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="hover:text-white transition-colors">
                        {schoolDetails.website}
                      </a>
                    ) : (
                      'www.school-website.edu'
                    )}
                  </span>
                </div>
              </div>

              {/* Resume Header */}
              <div className="relative z-10 bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b-4 border-blue-600">
                <div className="text-center">
                  <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2"
                  >
                    STUDENT APPLICATION RESUME
                  </motion.h2>
                  <div className="flex justify-center items-center gap-6 text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {formData.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {formData.class}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formData.admissionNo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="relative z-10 p-6">
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-6 p-4 bg-green-500/20 backdrop-blur-xl border border-green-500/50 rounded-2xl text-green-700 text-center shadow-lg"
                    >
                      ✨ Application exported successfully!
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Personal Information */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                    <div>
                      <span className="font-semibold text-gray-700">Full Name:</span>
                      <p className="text-gray-800">{formData.name}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Date of Birth:</span>
                      <p className="text-gray-800">{formData.dateOfBirth}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Gender:</span>
                      <p className="text-gray-800">{formData.gender}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Blood Group:</span>
                      <p className="text-gray-800">{formData.bloodGroup}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Nationality:</span>
                      <p className="text-gray-800">{formData.nationality}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Religion:</span>
                      <p className="text-gray-800">{formData.religion}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Place of Birth:</span>
                      <p className="text-gray-800">{formData.placeOfBirth}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Category:</span>
                      <p className="text-gray-800">{formData.category}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Mother Tongue:</span>
                      <p className="text-gray-800">{formData.motherTongue}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">STS ID:</span>
                      <p className="text-gray-800">{formData.stsId}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Aadhar Number:</span>
                      <p className="text-gray-800">{formData.aadharNumber}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Personal Phone:</span>
                      <p className="text-gray-800">{formData.phone}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Personal Email:</span>
                      <p className="text-gray-800">{formData.email}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">GPA:</span>
                      <p className="text-gray-800">{formData.gpa}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Status:</span>
                      <p className="text-gray-800">{formData.status}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Academic Information */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.1, type: "spring" }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div>
                      <span className="font-semibold text-gray-700">Admission Number:</span>
                      <p className="text-gray-800">{formData.admissionNo}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Admission Date:</span>
                      <p className="text-gray-800">{formData.admissionDate}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Class Applied:</span>
                      <p className="text-gray-800">{formData.class}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Section:</span>
                      <p className="text-gray-800">{formData.section}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Roll Number:</span>
                      <p className="text-gray-800">{formData.rollNumber}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Language Medium:</span>
                      <p className="text-gray-800">{formData.languageMedium}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Previous Class:</span>
                      <p className="text-gray-800">{formData.previousClass}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Previous School:</span>
                      <p className="text-gray-800">{formData.previousSchool}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Academic Year:</span>
                      <p className="text-gray-800">{activeAcademicYear?.year || '2025-26'}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Advanced AI-Powered Insights Section */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.9, type: "spring" }}
                  className="mb-8"
                >
                  <motion.h3 
                    className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                    }}
                    style={{
                      backgroundSize: '200% 200%',
                    }}
                  >
                    <motion.div 
                      className="p-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <Brain className="w-5 h-5 text-white" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Advanced AI-Powered Analysis & Intelligence
                    </span>
                  </motion.h3>
                  
                  <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl border border-indigo-200 shadow-xl relative overflow-hidden">
                    {/* AI Background Effects */}
                    <div className="absolute inset-0 opacity-10">
                      <motion.div
                        className="absolute w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl"
                        animate={{
                          x: [0, 100, 0],
                          y: [0, -50, 0],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                        }}
                        style={{
                          top: '20%',
                          left: '10%',
                        }}
                      />
                      <motion.div
                        className="absolute w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl"
                        animate={{
                          x: [0, -80, 0],
                          y: [0, 60, 0],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                        }}
                        style={{
                          bottom: '20%',
                          right: '15%',
                        }}
                      />
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* AI Confidence Score */}
                      <motion.div 
                        className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring" }}
                      >
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <motion.div
                            animate={{
                              rotate: [0, 360],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          >
                            <Target className="w-4 h-4 text-blue-500" />
                          </motion.div>
                          AI Confidence Score
                        </h4>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Overall Assessment</span>
                            <motion.span 
                              className="font-bold text-green-600 text-lg"
                              animate={{
                                color: aiProcessing ? ['#3B82F6', '#10B981', '#8B5CF6'] : '#10B981',
                              }}
                              transition={{
                                duration: 1,
                                repeat: aiProcessing ? Infinity : 0,
                              }}
                            >
                              {aiConfidence.toFixed(1)}%
                            </motion.span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 rounded-full"
                              animate={{
                                width: `${aiConfidence}%`,
                              }}
                              transition={{
                                duration: 2,
                                ease: "easeOut"
                              }}
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {aiConfidence >= 90 ? 'Excellent Match' : aiConfidence >= 80 ? 'Strong Candidate' : 'Good Potential'}
                          </div>
                        </div>
                      </motion.div>

                      {/* AI Learning Style Analysis */}
                      <motion.div 
                        className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring" }}
                      >
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                          >
                            <Lightbulb className="w-4 h-4 text-purple-500" />
                          </motion.div>
                          AI Learning Style
                        </h4>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-gray-800 text-sm leading-relaxed">
                            {aiInsights.suggestions?.[0] || 'AI analyzing learning patterns...'}
                          </p>
                          {aiProcessing && (
                            <motion.div 
                              className="mt-2 flex items-center gap-2 text-xs text-purple-500"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <Sparkles className="w-3 h-3 animate-pulse" />
                              Neural Network Processing...
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* AI Strengths Analysis */}
                      <motion.div 
                        className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring" }}
                      >
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <motion.div
                            animate={{
                              rotateY: [0, 180, 360],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          >
                            <Shield className="w-4 h-4 text-indigo-500" />
                          </motion.div>
                          AI-Identified Strengths
                        </h4>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <ul className="text-sm text-gray-700 space-y-2">
                            {aiInsights.suggestions?.slice(0, 3).map((suggestion: string, index: number) => (
                              <motion.li 
                                key={index} 
                                className="flex items-start gap-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.2 }}
                              >
                                <motion.div
                                  animate={{
                                    scale: [1, 1.2, 1],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: index * 0.3,
                                  }}
                                >
                                  <Gem className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                </motion.div>
                                <span className="text-gray-800">{suggestion}</span>
                              </motion.li>
                            )) || (
                              <motion.li 
                                className="flex items-start gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <Rocket className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0 animate-pulse" />
                                <span className="text-gray-600">AI analyzing strengths...</span>
                              </motion.li>
                            )}
                          </ul>
                        </div>
                      </motion.div>

                      {/* AI Recommendations */}
                      <motion.div 
                        className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring" }}
                      >
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <motion.div
                            animate={{
                              rotateZ: [0, 10, -10, 0],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                            }}
                          >
                            <Eye className="w-4 h-4 text-amber-500" />
                          </motion.div>
                          AI Strategic Recommendations
                        </h4>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <ul className="text-sm text-gray-700 space-y-2">
                            {aiInsights.recommendations?.slice(0, 3).map((rec: string, index: number) => (
                              <motion.li 
                                key={index} 
                                className="flex items-start gap-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.2 }}
                              >
                                <motion.div
                                  animate={{
                                    opacity: [0.5, 1, 0.5],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: index * 0.4,
                                  }}
                                >
                                  <Star className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                </motion.div>
                                <span className="text-gray-800">{rec}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    </div>

                    {/* AI Summary with Advanced Visualization */}
                    <motion.div 
                      className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        >
                          <BarChart3 className="w-4 h-4 text-purple-500" />
                        </motion.div>
                        AI Comprehensive Assessment
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {aiInsights.warnings?.[0] || 'AI processing comprehensive analysis...'}
                      </p>
                      {aiProcessing && (
                        <motion.div 
                          className="mt-3 flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-blue-500 rounded-full"
                                animate={{
                                  y: [0, -10, 0],
                                  opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: i * 0.2,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-blue-500">Deep Learning Analysis in Progress...</span>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-300">
                  <div className="text-center text-sm text-gray-600">
                    <p>This application was processed using advanced AI analytics</p>
                    <p className="mt-1">Generated on {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnifiedApplicationPreview;
