import React, { useRef, useCallback } from 'react';
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
  Globe
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
  
  // Get real school data from database
  const schoolDetails = useSchoolDetails();
  const { activeAcademicYear } = useAcademicYears();

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Export failed:', error);
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
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
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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

          {/* Main Content - Single Printable Resume */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div ref={previewRef} className="bg-white">
              {/* School Letterhead */}
              <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-8 text-center">
                <div className="flex justify-center mb-4">
                  <Building className="w-16 h-16 text-white/80" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{schoolDetails.name || 'School Name'}</h1>
                <p className="text-lg text-blue-100 mb-1">Excellence in Education Since 1985</p>
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
                    {schoolDetails.website || 'www.school-website.edu'}
                  </span>
                </div>
              </div>

              {/* Resume Header */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b-4 border-blue-600">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">STUDENT APPLICATION RESUME</h2>
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

              {/* Personal Information Section */}
              <div className="p-6">
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
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
                </div>

                {/* Academic Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-green-500" />
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
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
                </div>

                {/* Family Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Family Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="font-semibold text-gray-700">Father's Name:</span>
                      <p className="text-gray-800">{formData.fatherName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Father's Occupation:</span>
                      <p className="text-gray-800">{formData.fatherOccupation}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Father's Phone:</span>
                      <p className="text-gray-800">{formData.fatherPhone}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Father's Email:</span>
                      <p className="text-gray-800">{formData.fatherEmail}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Mother's Name:</span>
                      <p className="text-gray-800">{formData.motherName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Mother's Occupation:</span>
                      <p className="text-gray-800">{formData.motherOccupation}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Mother's Phone:</span>
                      <p className="text-gray-800">{formData.motherPhone}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Mother's Email:</span>
                      <p className="text-gray-800">{formData.motherEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-purple-500" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="font-semibold text-gray-700">Address:</span>
                      <p className="text-gray-800">{formData.address}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">City:</span>
                      <p className="text-gray-800">{formData.city}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">State:</span>
                      <p className="text-gray-800">{formData.state}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">PIN Code:</span>
                      <p className="text-gray-800">{formData.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="font-semibold text-gray-700">Medical Conditions:</span>
                      <p className="text-gray-800">{formData.medicalConditions || 'None'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Allergies:</span>
                      <p className="text-gray-800">{formData.allergies || 'None'}</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-orange-500" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="font-semibold text-gray-700">Emergency Contact Person:</span>
                      <p className="text-gray-800">{formData.emergencyContact}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Emergency Phone:</span>
                      <p className="text-gray-800">{formData.emergencyPhone}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Relationship:</span>
                      <p className="text-gray-800">{formData.emergencyRelation}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-500" />
                    Bank Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="font-semibold text-gray-700">Bank Name:</span>
                      <p className="text-gray-800">{formData.bankName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Account Number:</span>
                      <p className="text-gray-800">{formData.bankAccountNumber}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Account Name:</span>
                      <p className="text-gray-800">{formData.bankAccountName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">IFSC Code:</span>
                      <p className="text-gray-800">{formData.bankIfsc}</p>
                    </div>
                  </div>
                </div>

                {/* Transport & Hostel */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-500" />
                    Transport & Hostel
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="font-semibold text-gray-700">Transport Required:</span>
                      <p className="text-gray-800">{formData.transport || 'No'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Hostel Required:</span>
                      <p className="text-gray-800">{formData.hostel || 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Documents Status */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Documents Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="font-semibold text-gray-700">Birth Certificate:</span>
                      <p className="text-gray-800">{formData.documents?.birthCertificate ? '✅ Submitted' : '❌ Pending'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Aadhar Card:</span>
                      <p className="text-gray-800">{formData.documents?.aadharCard ? '✅ Submitted' : '❌ Pending'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Transfer Certificate:</span>
                      <p className="text-gray-800">{formData.documents?.transferCertificate ? '✅ Submitted' : '❌ Pending'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Medical Certificate:</span>
                      <p className="text-gray-800">{formData.documents?.medicalCertificate ? '✅ Submitted' : '❌ Pending'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Passport Photo:</span>
                      <p className="text-gray-800">{formData.documents?.passportPhoto ? '✅ Submitted' : '❌ Pending'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Marksheet:</span>
                      <p className="text-gray-800">{formData.documents?.marksheet ? '✅ Submitted' : '❌ Pending'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Caste Certificate:</span>
                      <p className="text-gray-800">{formData.documents?.casteCertificate ? '✅ Submitted' : '❌ Pending'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Income Certificate:</span>
                      <p className="text-gray-800">{formData.documents?.incomeCertificate ? '✅ Submitted' : '❌ Pending'}</p>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {formData.remarks && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      Additional Remarks
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800">{formData.remarks}</p>
                    </div>
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    AI-Powered Insights & Analysis
                  </h3>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Academic Potential */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          Academic Potential
                        </h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Overall Score</span>
                            <span className="font-bold text-green-600">{aiInsights.confidence}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                              style={{ width: `${aiInsights.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Learning Style */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-blue-500" />
                          Learning Style
                        </h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-gray-800">{aiInsights.suggestions?.[0] || 'AI analysis in progress...'}</p>
                        </div>
                      </div>

                      {/* Strengths */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-500" />
                          Key Strengths
                        </h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <ul className="text-sm text-gray-700 space-y-1">
                            {aiInsights.suggestions?.slice(0, 3).map((suggestion: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {suggestion}
                              </li>
                            )) || (
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                AI analysis in progress...
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          Recommendations
                        </h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <ul className="text-sm text-gray-700 space-y-1">
                            {aiInsights.recommendations?.slice(0, 3).map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <Star className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="mt-6 p-4 bg-white rounded border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">AI Assessment Summary</h4>
                      <p className="text-gray-700 leading-relaxed">
                        {aiInsights.warnings?.[0] || 'AI analysis in progress...'}
                      </p>
                    </div>
                  </div>
                </div>

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
