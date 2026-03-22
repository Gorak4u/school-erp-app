// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';
import StudentProfileTabs from './StudentProfileTabs';
import StudentAnalytics from './StudentAnalytics';
import StudentMedicalInfo from './StudentMedicalInfo';
import EnhancedFeeCollection from '../../fees/components/EnhancedFeeCollection';
import { buildStudentIdCardSnippet, buildStudentIdCardDocument, StudentIdCardData } from '../../../lib/idCard';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StudentProfileModalProps {
  activeTab: any;
  printStudentProfile: any;
  selectedStudent: any;
  sendStudentSMS: any;
  setAcademicPerformance: any;
  setActiveTab: any;
  setAttendanceTracking: any;
  setCommunicationCenter: any;
  setEditingStudent: any;
  setFeeManagement: any;
  setParentPortal: any;
  setSelectedStudent: any;
  theme: any;
  students?: Student[];
  includeArchivedStudents?: boolean;
  feeManagement?: any;
  attendanceTracking?: any;
  communicationCenter?: any;
  parentPortal?: any;
  canEditStudents?: boolean;
  canPromoteStudents?: boolean;
  onPromoteSingle?: (studentId: string) => void;
  onMarkExit?: (studentIds: string[]) => void;
  isAdmin?: boolean;
}

export default function StudentProfileModal({ activeTab, printStudentProfile, selectedStudent, sendStudentSMS, setAcademicPerformance, setActiveTab, setAttendanceTracking, setCommunicationCenter, setEditingStudent, setFeeManagement, setParentPortal, setSelectedStudent, theme, students = [], includeArchivedStudents = false, feeManagement, attendanceTracking, communicationCenter, parentPortal, canEditStudents = true, canPromoteStudents = true, onPromoteSingle, onMarkExit, isAdmin = false }: StudentProfileModalProps) {
  const [showIdCard, setShowIdCard] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);
  const [feeData, setFeeData] = useState(null);
  const [loadingFeeData, setLoadingFeeData] = useState(false);
  const { getSetting } = useSchoolConfig();
  const idCardRef = useRef<HTMLDivElement>(null);
  const idCardContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch fee data when modal opens
  useEffect(() => {
    if (feeManagement?.showFeeModal && feeManagement?.selectedStudent?.id) {
      fetchStudentFeeData();
    }
  }, [feeManagement?.showFeeModal, feeManagement?.selectedStudent?.id]);

  const fetchStudentFeeData = async () => {
    if (!feeManagement?.selectedStudent?.id) return;
    
    setLoadingFeeData(true);
    try {
      const params = new URLSearchParams({ includeArchived: includeArchivedStudents ? 'true' : 'false' });
      const response = await fetch(`/api/fees/students?${params}`);
      const data = await response.json();
      if (data.success && data.data?.students) {
        const studentFeeData = data.data.students.find(s => s.studentId === feeManagement.selectedStudent.id);
        setFeeData(studentFeeData);
      }
    } catch (error) {
      console.error('Failed to fetch fee data:', error);
    } finally {
      setLoadingFeeData(false);
    }
  };

  // Refresh fee data after payment
  const handleRefreshFeeData = () => {
    fetchStudentFeeData();
  };
  
  const normalizedStatus = selectedStudent?.status === 'exit' ? 'exited' : selectedStudent?.status;
  const canEditStudentRecord = canEditStudents && selectedStudent && !(selectedStudent.needsPromotion || normalizedStatus === 'locked') && (normalizedStatus !== 'exited' || isAdmin);
  const canRunLifecycleActions = normalizedStatus === 'active' || normalizedStatus === 'locked';

  // ID Card functionality
  const [idCardHtml, setIdCardHtml] = useState('');
  const [idCardBackHtml, setIdCardBackHtml] = useState('');
  
  const generateIdCardData = (student: Student): StudentIdCardData => {
    return {
      name: student.name,
      admissionNo: student.admissionNo,
      className: `${student.class}${student.section ? ` - ${student.section}` : ''}`,
      schoolName: getSetting('school_details', 'name', 'School Name'),
      schoolLogo: getSetting('school_details', 'logo_url', ''),
      photo: student.photo,
      dateOfBirth: student.dateOfBirth,
      issueDate: student.admissionDate || new Date().toISOString().split('T')[0],
      phone: student.phone,
      address: student.address,
      academicYear: student.academicYear || '2024-25',
      bloodGroup: student.bloodGroup,
      fatherName: student.fatherName,
      motherName: student.motherName,
      transportRoute: student.transportRoute
    };
  };

  const generateIdCardHtml = async (student: Student) => {
    const idCardData = generateIdCardData(student);
    const frontHtml = await buildStudentIdCardSnippet(idCardData, false);
    const backHtml = await buildStudentIdCardSnippet(idCardData, true);
    setIdCardHtml(frontHtml);
    setIdCardBackHtml(backHtml);
  };

  const handlePrintIdCard = async () => {
    const idCardData = generateIdCardData(selectedStudent);
    const frontHtml = await buildStudentIdCardDocument(idCardData, false);
    const backHtml = await buildStudentIdCardDocument(idCardData, true);
    
    const printWindow = window.open('', '_blank', 'width=1200,height=700');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ID Card - Both Sides</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6; }
              .card-container { display: flex; gap: 40px; align-items: center; }
              .card-side { text-align: center; }
              .card-side h3 { margin-bottom: 10px; color: #374151; }
              @media print { 
                body { background: white; } 
                .card-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="card-container">
              <div class="card-side">
                <h3>Front Side</h3>
                ${frontHtml}
              </div>
              <div class="card-side">
                <h3>Back Side</h3>
                ${backHtml}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadIdCardPdf = async () => {
    if (!idCardContainerRef.current || !selectedStudent) return;
    
    try {
      // Create canvas from the container with both sides - enhanced quality
      const canvas = await html2canvas(idCardContainerRef.current, {
        scale: 4, // Higher scale for better quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || element.tagName === 'LINK';
        },
        onclone: (clonedDoc) => {
          // Enhance colors in the cloned document for better contrast
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const htmlEl = el as HTMLElement;
            
            // Fix any lab() color functions
            if (computedStyle.background?.includes('lab(')) {
              htmlEl.style.background = '#0f172a';
            }
            if (computedStyle.backgroundColor?.includes('lab(')) {
              htmlEl.style.backgroundColor = '#0f172a';
            }
            if (computedStyle.color?.includes('lab(')) {
              htmlEl.style.color = '#f1f5f9';
            }
            
            // Enhance contrast for better PDF quality
            if (htmlEl.style.background === '#1f2937') {
              htmlEl.style.background = '#0f172a'; // Much darker for better contrast
            }
            if (htmlEl.style.backgroundColor === '#1f2937') {
              htmlEl.style.backgroundColor = '#0f172a';
            }
            if (htmlEl.style.background === '#2563eb') {
              htmlEl.style.background = '#1e40af'; // Darker blue for better contrast
            }
            if (htmlEl.style.backgroundColor === '#2563eb') {
              htmlEl.style.backgroundColor = '#1e40af';
            }
            
            // Enhance text colors for better readability
            if (htmlEl.style.color === '#e2e8f0') {
              htmlEl.style.color = '#f1f5f9'; // Lighter text for better contrast
            }
            if (htmlEl.style.color === '#94a3b8') {
              htmlEl.style.color = '#cbd5e1'; // Lighter secondary text
            }
            if (htmlEl.style.color === '#f8fafc') {
              htmlEl.style.color = '#ffffff'; // Pure white for headers
            }
            if (htmlEl.style.color === '#93c5fd') {
              htmlEl.style.color = '#dbeafe'; // Lighter blue text
            }
            if (htmlEl.style.color === '#86efac') {
              htmlEl.style.color = '#bbf7d0'; // Lighter green text
            }
            if (htmlEl.style.color === '#fbbf24') {
              htmlEl.style.color = '#fde68a'; // Lighter yellow text
            }
          });
        }
      });
      
      // Create PDF with enhanced quality settings
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: false // Disable compression for better quality
      });
      
      // Convert canvas to high-quality image
      const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
      const imgWidth = 280; // Width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF with better positioning
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');
      
      // Download PDF with enhanced name
      const fileName = `ID_Card_Both_Sides_${selectedStudent.name.replace(/\s+/g, '_')}_${selectedStudent.admissionNo}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadIdCardImage = async () => {
    if (!idCardContainerRef.current || !selectedStudent) return;
    
    try {
      // Create canvas from the container with both sides - enhanced quality
      const canvas = await html2canvas(idCardContainerRef.current, {
        scale: 3, // Higher scale for better quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || element.tagName === 'LINK';
        },
        onclone: (clonedDoc) => {
          // Enhance colors in the cloned document for better contrast
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const htmlEl = el as HTMLElement;
            
            // Fix any lab() color functions
            if (computedStyle.background?.includes('lab(')) {
              htmlEl.style.background = '#1f2937';
            }
            if (computedStyle.backgroundColor?.includes('lab(')) {
              htmlEl.style.backgroundColor = '#1f2937';
            }
            if (computedStyle.color?.includes('lab(')) {
              htmlEl.style.color = '#e2e8f0';
            }
            
            // Enhance contrast for better image quality
            if (htmlEl.style.background === '#1f2937') {
              htmlEl.style.background = '#111827'; // Darker for better contrast
            }
            if (htmlEl.style.backgroundColor === '#1f2937') {
              htmlEl.style.backgroundColor = '#111827';
            }
            if (htmlEl.style.background === '#2563eb') {
              htmlEl.style.background = '#1d4ed8'; // Darker blue for better contrast
            }
            if (htmlEl.style.backgroundColor === '#2563eb') {
              htmlEl.style.backgroundColor = '#1d4ed8';
            }
            
            // Enhance text colors for better readability
            if (htmlEl.style.color === '#e2e8f0') {
              htmlEl.style.color = '#f1f5f9'; // Lighter text for better contrast
            }
            if (htmlEl.style.color === '#94a3b8') {
              htmlEl.style.color = '#cbd5e1'; // Lighter secondary text
            }
            if (htmlEl.style.color === '#f8fafc') {
              htmlEl.style.color = '#ffffff'; // Pure white for headers
            }
          });
        }
      });
      
      // Convert to high-quality blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ID_Card_Both_Sides_${selectedStudent.name.replace(/\s+/g, '_')}_${selectedStudent.admissionNo}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0); // Maximum quality
      
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  // Generate ID card HTML when modal opens
  useEffect(() => {
    if (showIdCard && selectedStudent) {
      generateIdCardHtml(selectedStudent);
    }
  }, [showIdCard, selectedStudent]);

  return (
    <>
      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-7xl h-[90vh] mx-4 overflow-hidden rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Header */}
              <div className={`px-6 py-4 border-b ${
                theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      {selectedStudent.photo ? (
                        <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{selectedStudent.name}</h2>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {selectedStudent.admissionNo || 'N/A'} • Class {selectedStudent.class} • Roll No: {selectedStudent.rollNo || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Student Action Buttons */}
                    
                    <button
                      onClick={() => sendStudentSMS(selectedStudent)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                        theme === 'dark'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      📱 SMS
                    </button>
                    
                    <button
                      onClick={() => setShowIdCard(true)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                        theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      🆔 ID Card
                    </button>
                    
                                        
                    <button
                      onClick={() => printStudentProfile(selectedStudent)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                        theme === 'dark'
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                    >
                      🖨️ Print
                    </button>
                    {canEditStudentRecord && (
                      <button
                        onClick={() => setEditingStudent(selectedStudent)}
                        className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                          theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Lock Banner ──────────────────────────────────────────── */}
              {(selectedStudent?.needsPromotion || selectedStudent?.status === 'locked') && (
                <div className="px-6 py-3 bg-orange-500/10 border-b border-orange-500/20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500 text-lg">🔒</span>
                      <div>
                        <p className="text-sm font-semibold text-orange-600">
                          Student record is locked — from AY {selectedStudent.academicYear}
                        </p>
                        <p className="text-xs text-orange-500">
                          Editing and new fee assignments are blocked until you promote this student to the current academic year or mark them as exit.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canPromoteStudents && onPromoteSingle && canRunLifecycleActions && (
                        <button
                          onClick={() => { setSelectedStudent(null); onPromoteSingle(selectedStudent.id); }}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                        >
                          🎓 Promote Now
                        </button>
                      )}
                      {canPromoteStudents && onMarkExit && canRunLifecycleActions && (
                        <button
                          onClick={() => { onMarkExit(selectedStudent.id); setSelectedStudent(null); }}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                        >
                          🚪 Mark Exit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Navigation Tabs */}
              <div className={`px-6 py-3 border-b ${
                theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { id: 'overview', label: '📋 Overview', icon: '📋' },
                    { id: 'academics', label: '📈 Academics', icon: '📈' },
                    { id: 'fees', label: '💰 Fees', icon: '💰' },
                    { id: 'attendance', label: '📊 Attendance', icon: '📊' },
                    { id: 'analytics', label: '📈 Analytics', icon: '📈' },
                    { id: 'medical', label: '🏥 Medical', icon: '🏥' },
                    { id: 'communication', label: '💬 Communication', icon: '💬' },
                    { id: 'parents', label: '👨‍👩‍👧 Parents', icon: '👨‍👩‍👧' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? theme === 'dark'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Content */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                <div className="p-4 space-y-4">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {/* Basic Information */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Date of Birth</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.dateOfBirth}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Gender</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.gender}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Blood Group</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.bloodGroup}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Phone</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.phone}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Email</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.email}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Language Medium</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.languageMedium}</p>
                          </div>
                        </div>
                      </div>

                      {/* Parents Information */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Parents Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Father Name</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.fatherName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Father Phone</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.fatherPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Father Email</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.fatherEmail || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Mother Name</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.motherName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Mother Phone</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.motherPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Mother Email</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.motherEmail || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Contact & Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Street Address</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.address || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>City</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.city || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>State</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.state || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Emergency Contact</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.emergencyContact || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Emergency Relation</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.emergencyRelation || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Category</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.category || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Academics Tab */}
                  {activeTab === 'academics' && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 pb-2">
                        <h3 className={`text-xl font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Academic Performance</h3>
                        <button
                          onClick={() => setAcademicPerformance(prev => ({ ...prev, showAcademicModal: true, selectedStudent }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            theme === 'dark'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          📊 View Detailed Analytics
                        </button>
                      </div>
                      
                      {/* Academic Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Current GPA</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.gpa?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                            }`}>
                              📈
                            </div>
                          </div>
                        </div>
                        
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Class Rank</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.rank || 'N/A'}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-between ${
                              theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                            }`}>
                              🏆
                            </div>
                          </div>
                        </div>
                        
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Attendance</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.attendance?.percentage || 0}%</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                            }`}>
                              📊
                            </div>
                          </div>
                        </div>
                        
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Discipline</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedStudent.disciplineScore || 100}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              ⭐
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Academic Stats */}
                      <div className={`rounded-lg border p-4 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h4 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Academic Statistics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Achievements</label>
                            <p className={`mt-1 text-lg font-semibold ${
                              theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            }`}>🏅 {selectedStudent.achievements || 0} Awards</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Incidents</label>
                            <p className={`mt-1 text-lg font-semibold ${
                              theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                            }`}>⚠️ {selectedStudent.incidents || 0} Records</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Admission Date</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.admissionDate || selectedStudent.enrollmentDate || 'N/A'}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Academic Year</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.academicYear || 'N/A'}</p>
                          </div>
                        </div>
                        {selectedStudent.remarks && (
                          <div className="mt-4">
                            <label className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>Remarks</label>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{selectedStudent.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <StudentProfileTabs
                    activeTab={activeTab}
                    selectedStudent={selectedStudent}
                    setFeeManagement={setFeeManagement}
                    setAttendanceTracking={setAttendanceTracking}
                    setParentPortal={setParentPortal}
                    setCommunicationCenter={setCommunicationCenter}
                    theme={theme}
                  />

                  {/* Analytics Tab */}
                  {activeTab === 'analytics' && (
                    <StudentAnalytics
                      theme={theme}
                      students={selectedStudent ? [selectedStudent] : []}
                      onClose={() => setActiveTab('overview')}
                    />
                  )}

                  {/* Medical Tab */}
                  {activeTab === 'medical' && (
                    <StudentMedicalInfo
                      theme={theme}
                      student={selectedStudent}
                      onClose={() => setActiveTab('overview')}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ID Card Modal */}
      <AnimatePresence>
        {showIdCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]"
            onClick={() => setShowIdCard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-3xl mx-4 overflow-hidden rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ID Card Modal Header */}
              <div className={`px-6 py-4 border-b ${
                theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Student ID Card</h3>
                  <button
                    onClick={() => setShowIdCard(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ID Card Content */}
              <div className="p-6">
                <div ref={idCardContainerRef} className="flex justify-center items-center gap-8 mb-6 flex-wrap">
                  {/* Front Side */}
                  <div className="text-center">
                    <h4 className={`text-sm font-semibold mb-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Front Side</h4>
                    <div dangerouslySetInnerHTML={{ 
                      __html: idCardHtml 
                    }} />
                  </div>
                  
                  {/* Back Side */}
                  <div className="text-center">
                    <h4 className={`text-sm font-semibold mb-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Back Side</h4>
                    <div dangerouslySetInnerHTML={{ 
                      __html: idCardBackHtml 
                    }} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handlePrintIdCard}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold shadow bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 transition-transform`}
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={handleDownloadIdCardPdf}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-200 hover:bg-gray-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-white'
                    }`}
                  >
                    📄 Save PDF
                  </button>
                  <button
                    onClick={handleDownloadIdCardImage}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-200 hover:bg-gray-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-white'
                    }`}
                  >
                    🖼️ Save Image
                  </button>
                  <button
                    onClick={() => setShowIdCard(false)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-200 hover:bg-gray-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-white'
                    }`}
                  >
                    ✖️ Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fee Management Modal */}
      <AnimatePresence>
        {feeManagement?.showFeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]"
            onClick={() => setFeeManagement({ ...feeManagement, showFeeModal: false })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-6xl mx-4 overflow-hidden rounded-2xl border shadow-lg ${
                theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Fee Management - {feeManagement.selectedStudent?.name}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {feeManagement.selectedStudent?.class}
                    </p>
                  </div>
                  <button
                    onClick={() => setFeeManagement({ ...feeManagement, showFeeModal: false })}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    ✖️ Close
                  </button>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {loadingFeeData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading fee data...
                      </p>
                    </div>
                  </div>
                ) : feeData ? (
                  <EnhancedFeeCollection
                    theme={theme}
                    studentId={feeManagement.selectedStudent.id}
                    studentData={feeData}
                    onClose={() => setFeeManagement({ ...feeManagement, showFeeModal: false })}
                    onPaymentSuccess={handleRefreshFeeData}
                  />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Failed to load fee data. Please try again.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Tracking Modal */}
      <AnimatePresence>
        {attendanceTracking?.showAttendanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]"
            onClick={() => setAttendanceTracking({ ...attendanceTracking, showAttendanceModal: false })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-4xl mx-4 overflow-hidden rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Attendance Tracking - {attendanceTracking.selectedStudent?.name}
                </h3>
                <button
                  onClick={() => setAttendanceTracking({ ...attendanceTracking, showAttendanceModal: false })}
                  className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  ✖️ Close
                </button>
              </div>
              <div className="p-6">
                <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Attendance tracking functionality would be implemented here. This modal is triggered from the profile view.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Communication Center Modal */}
      <AnimatePresence>
        {communicationCenter?.showCommunicationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]"
            onClick={() => setCommunicationCenter({ ...communicationCenter, showCommunicationModal: false })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-4xl mx-4 overflow-hidden rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Communication Center - {communicationCenter.selectedStudent?.name}
                </h3>
                <button
                  onClick={() => setCommunicationCenter({ ...communicationCenter, showCommunicationModal: false })}
                  className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  ✖️ Close
                </button>
              </div>
              <div className="p-6">
                <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Communication center functionality would be implemented here. This modal is triggered from the profile view.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parent Portal Modal */}
      <AnimatePresence>
        {parentPortal?.showParentPortalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]"
            onClick={() => setParentPortal({ ...parentPortal, showParentPortalModal: false })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-4xl mx-4 overflow-hidden rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Parent Portal - {parentPortal.selectedStudent?.name}
                </h3>
                <button
                  onClick={() => setParentPortal({ ...parentPortal, showParentPortalModal: false })}
                  className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  ✖️ Close
                </button>
              </div>
              <div className="p-6">
                <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Parent portal functionality would be implemented here. This modal is triggered from the profile view.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
