'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  MapPin,
  Heart,
  CreditCard,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Download,
  RefreshCw,
  Settings,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  GraduationCap,
  BookOpen,
  Award,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  Filter,
  SlidersHorizontal,
  Shield,
  UserCheck,
  UserX,
  Clock,
  BarChart3,
  FileText,
  DollarSign,
  Star,
  Bell,
  Archive,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Student } from '../types';

interface StudentTableProps {
  activeTab: string;
  currentPage: number;
  filteredStudents: Student[];
  handleDeleteStudent: (id: number) => void;
  isMobile: boolean;
  mobileView: string;
  pageSize: number;
  selectedStudents: number[];
  setActiveTab: (v: string) => void;
  setCurrentPage: (v: number) => void;
  setEditingStudent: (v: Student | null) => void;
  setSelectedStudent: (v: Student | null) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  setSortConfig: (v: { key: string; direction: 'asc' | 'desc' } | null) => void;
  theme: 'dark' | 'light';
  toggleAllStudentsSelection: () => void;
  toggleStudentSelection: (id: number) => void;
  totalPages: number;
  visibleColumns: string[];
  columnSettings: any;
  onPromoteSingle?: (studentId: string) => void;
  onPromoteClass?: (cls: string, section: string) => void;
  onExitSingle?: (studentId: string) => void;
  canEditStudents?: boolean;
  canPromoteStudents?: boolean;
  isAdmin?: boolean;
  themeConfig?: any;
  getCardClass?: () => string;
  getBtnClass?: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass?: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
}

export default function StudentTable({
  activeTab, currentPage, filteredStudents, handleDeleteStudent, isMobile,
  mobileView, pageSize, selectedStudents, setActiveTab, setCurrentPage,
  setEditingStudent, setSelectedStudent, sortConfig, setSortConfig, theme,
  toggleAllStudentsSelection, toggleStudentSelection, totalPages, visibleColumns, columnSettings,
  onPromoteSingle, onPromoteClass, onExitSingle, canEditStudents = true, canPromoteStudents = true, isAdmin = false,
  themeConfig,
  getCardClass,
  getBtnClass,
  getTextClass
}: StudentTableProps) {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('');
  const isDark = theme === 'dark';
  
  // Use provided theme functions or fallback
  const cardClass = getCardClass?.() || (isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200');
  const primaryBtnClass = getBtnClass?.('primary') || 'bg-gradient-to-r from-blue-600 to-purple-600 text-white';
  const secondaryBtnClass = getBtnClass?.('secondary') || (isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800');
  const dangerBtnClass = getBtnClass?.('danger') || 'bg-red-600 text-white';
  const successBtnClass = getBtnClass?.('success') || 'bg-green-600 text-white';
  const primaryTextClass = getTextClass?.('primary') || (isDark ? 'text-white' : 'text-gray-900');
  const secondaryTextClass = getTextClass?.('secondary') || (isDark ? 'text-gray-400' : 'text-gray-600');
  const mutedTextClass = getTextClass?.('muted') || (isDark ? 'text-gray-500' : 'text-gray-500');
  const accentTextClass = getTextClass?.('accent') || (isDark ? 'text-blue-400' : 'text-blue-600');
  
  // Set current path on client side only
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal = (a as any)[key];
    let bVal = (b as any)[key];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedStudents = sortedStudents.slice(startIdx, startIdx + pageSize);
  const actualTotalPages = Math.ceil(filteredStudents.length / pageSize) || 1;

  const tabs: Array<{key: string, label: string, href: string}> = [
    // Removed Overview, Academics, Attendance, and Fees buttons as requested
    // Only keeping essential navigation within students section
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 border border-green-500/30';
      case 'inactive': return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-600 border border-gray-500/30';
      case 'graduated': return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 border border-blue-500/30';
      case 'transferred': return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border border-amber-500/30';
      case 'exited': return 'bg-gradient-to-r from-slate-500/20 to-gray-600/20 text-slate-600 border border-slate-500/30';
      case 'suspended': return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-600 border border-red-500/30';
      case 'locked': return 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-600 border border-orange-500/30';
      default: return 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-600 border border-gray-500/30';
    }
  };

  const getAttendanceColor = (pct: number) => {
    if (pct >= 90) return 'text-green-500';
    if (pct >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  const getAttendanceBackground = (pct: number) => {
    if (pct >= 90) return 'bg-gradient-to-r from-green-500/10 to-emerald-500/10';
    if (pct >= 75) return 'bg-gradient-to-r from-amber-500/10 to-orange-500/10';
    return 'bg-gradient-to-r from-red-500/10 to-pink-500/10';
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'Male': return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-600 border border-blue-500/30';
      case 'Female': return 'bg-gradient-to-r from-pink-500/20 to-pink-600/20 text-pink-600 border border-pink-500/30';
      default: return 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-600 border border-gray-500/30';
    }
  };

  const normalizeStudentStatus = (status?: string) => status === 'exit' ? 'exited' : (status || 'active');

  // Helper function to render table cell content based on column key
  const renderTableCell = (student: Student, columnKey: string) => {
    const normalizedStatus = normalizeStudentStatus(student.status);
    const canRunLifecycleActions = normalizedStatus === 'active' || normalizedStatus === 'locked';
    const canEditStudentRecord = canEditStudents && !(student.needsPromotion || normalizedStatus === 'locked') && (normalizedStatus !== 'exited' || isAdmin);

    switch (columnKey) {
      case 'select':
        return (
          <td className="px-4 py-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onChange={() => toggleStudentSelection(student.id)}
                className={`w-5 h-5 rounded-lg border-2 text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
            </motion.div>
          </td>
        );
      
      case 'photo':
        return (
          <td className="px-4 py-3">
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {student.photo ? (
                <img 
                  src={student.photo} 
                  alt={student.name}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-600 cursor-pointer transition-all hover:scale-110 hover:shadow-lg"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ${student.photo ? 'hidden' : ''}`}>
                {student.name.charAt(0)}
              </div>
              
              {/* Modern Hover popup with larger photo */}
              {student.photo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  whileTap={{ opacity: 0, scale: 0.8 }}
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] pointer-events-none"
                >
                  <div className="relative">
                    <img 
                      src={student.photo} 
                      alt={student.name}
                      className="w-48 h-64 rounded-2xl object-cover border-2 border-gray-300 dark:border-gray-600 shadow-2xl"
                    />
                    <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${cardClass} shadow-xl border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className={primaryTextClass}>{student.name}</div>
                    </div>
                    <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${cardClass} shadow-xl border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className={mutedTextClass}>{student.admissionNo}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </td>
        );
      
      case 'admissionNo':
        return (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className={`font-mono text-xs font-medium ${secondaryTextClass}`}>
                {student.admissionNo || 'N/A'}
              </span>
            </div>
          </td>
        );
      
      case 'admissionDate':
        return (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={`text-xs font-medium ${secondaryTextClass}`}>
                {student.admissionDate || 'N/A'}
              </span>
            </div>
          </td>
        );
      
      case 'rollNo':
        return (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className={`font-medium ${primaryTextClass}`}>
                {student.rollNo || 'N/A'}
              </span>
            </div>
          </td>
        );
      
      case 'name':
        return (
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              {(student.needsPromotion || student.status === 'locked') && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  title="Needs promotion to current AY"
                  className="p-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30"
                >
                  <Lock className="w-4 h-4 text-orange-500" />
                </motion.div>
              )}
              <div className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStudent(student)}
                  className={`font-bold text-left transition-colors hover:scale-105 ${primaryTextClass} ${accentTextClass} hover:opacity-80`}
                >
                  {student.name}
                </motion.button>
                {(student.needsPromotion || student.status === 'locked') ? (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-orange-500 mt-1"
                  >
                    AY: {student.academicYear} — promote required
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs ${mutedTextClass}`}>{student.email || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>
          </td>
        );
      
      case 'dateOfBirth':
        return (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={`text-xs font-medium ${secondaryTextClass}`}>
                {student.dateOfBirth || 'N/A'}
              </span>
            </div>
          </td>
        );
      
      case 'gender':
        return (
          <td className="px-4 py-3">
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${getGenderColor(student.gender || '')} flex items-center gap-2 w-fit`}>
              {student.gender === 'Male' && <User className="w-3 h-3" />}
              {student.gender === 'Female' && <User className="w-3 h-3" />}
              {student.gender || 'N/A'}
            </div>
          </td>
        );
      
      case 'bloodGroup':
        return (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className={`text-xs font-medium ${secondaryTextClass}`}>
                {student.bloodGroup || 'N/A'}
              </span>
            </div>
          </td>
        );
      
      case 'category':
        return (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className={`text-xs font-medium ${secondaryTextClass}`}>
                {student.category || 'N/A'}
              </span>
            </div>
          </td>
        );
      
      case 'religion':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.religion || 'N/A'}
          </td>
        );
      
      case 'parents':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="font-medium">{student.fatherName || student.parentName || 'N/A'}</div>
            <div className="text-xs opacity-70">{student.motherName || 'N/A'}</div>
          </td>
        );
      
      case 'phoneNumbers':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="font-medium">
              {student.fatherPhone ? (
                <>
                  <span className="text-blue-500">Father:</span> {student.fatherPhone}
                </>
              ) : 'N/A'}
            </div>
            <div className="text-xs opacity-70">
              {student.emergencyContact ? (
                <>
                  <span className="text-red-500">Emergency:</span> {student.emergencyContact}
                </>
              ) : 'N/A'}
            </div>
          </td>
        );
      
      case 'fatherPhone':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.fatherPhone || 'N/A'}
          </td>
        );
      
      case 'motherPhone':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.motherPhone || 'N/A'}
          </td>
        );
      
      case 'class':
        return (
          <td className="px-4 py-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              {student.class && student.section 
                ? `${student.class} - ${student.section}` 
                : student.class || student.section || 'N/A'
              }
            </span>
          </td>
        );
      
      case 'medium':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.languageMedium || 'N/A'}
          </td>
        );
      
      case 'board':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.board || 'N/A'}
          </td>
        );
      
      case 'phone':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.phone || 'N/A'}
          </td>
        );
      
      case 'email':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.email || 'N/A'}
          </td>
        );
      
      case 'address':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.address || 'N/A'}
          </td>
        );
      
      case 'city':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.city || 'N/A'}
          </td>
        );
      
      case 'state':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.state || 'N/A'}
          </td>
        );
      
      case 'aadharNumber':
        return (
          <td className={`px-4 py-3 font-mono text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.aadharNumber || 'N/A'}
          </td>
        );
      
      case 'stsId':
        return (
          <td className={`px-4 py-3 font-mono text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.stsId || 'N/A'}
          </td>
        );
      
      case 'transport':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.transport ? (
              <span className="text-green-500">✓ {student.transport}</span>
            ) : (
              <span className="text-gray-500">No</span>
            )}
          </td>
        );
      
      case 'hostel':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.hostel ? (
              <span className="text-green-500">✓ {student.hostel}</span>
            ) : (
              <span className="text-gray-500">No</span>
            )}
          </td>
        );
      
      case 'attendance':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.attendance ? (
              <div>
                <div className={`font-medium ${getAttendanceColor(student.attendance.percentage || 0)}`}>
                  {student.attendance.percentage || 0}%
                </div>
                <div className="text-xs opacity-70">
                  {student.attendance.present || 0}/{(student.attendance.present || 0) + (student.attendance.absent || 0)} days
                </div>
              </div>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </td>
        );
      
      case 'fees':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.fees ? (
              <div>
                <div className={`font-medium ${
                  student.fees.pending > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  ₹{student.fees.total?.toLocaleString() || 0}
                </div>
                <div className="text-xs opacity-70">
                  Paid: ₹{student.fees.paid?.toLocaleString() || 0}
                </div>
                {student.fees.pending > 0 && (
                  <div className="text-xs text-red-500">
                    Pending: ₹{student.fees.pending?.toLocaleString() || 0}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </td>
        );
      
      case 'grade':
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {student.gpa ? (
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                student.gpa >= 3.5 ? 'bg-green-100 text-green-700' :
                student.gpa >= 2.5 ? 'bg-blue-100 text-blue-700' :
                student.gpa >= 1.5 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {student.gpa.toFixed(2)}
              </span>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </td>
        );
      
      case 'status':
        return (
          <td className="px-4 py-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(normalizedStatus)}`}>
              {normalizedStatus.replace('_', ' ').toUpperCase()}
            </span>
          </td>
        );
      
      case 'actions':
        return (
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStudent(student)}
                className={`text-blue-600 hover:text-blue-800 text-lg ${
                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : ''
                }`}
                title="View Details"
              >
                👁️
              </button>
              {canEditStudentRecord && (
                <button
                  onClick={() => setEditingStudent(student)}
                  className={`text-green-600 hover:text-green-800 text-lg ${
                    theme === 'dark' ? 'text-green-400 hover:text-green-300' : ''
                  }`}
                  title="Edit"
                >
                  ✏️
                </button>
              )}
              {canPromoteStudents && onPromoteSingle && canRunLifecycleActions && (
                <button
                  onClick={() => onPromoteSingle(student.id.toString())}
                  className={`text-purple-600 hover:text-purple-800 text-lg ${
                    theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : ''
                  }`}
                  title="Promote"
                >
                  🎓
                </button>
              )}
              {canPromoteStudents && onExitSingle && canRunLifecycleActions && (
                <button
                  onClick={() => onExitSingle(student.id.toString())}
                  className={`text-red-600 hover:text-red-800 text-lg ${
                    theme === 'dark' ? 'text-red-400 hover:text-red-300' : ''
                  }`}
                  title="Exit Student"
                >
                  🚪
                </button>
              )}
            </div>
          </td>
        );

      default:
        return (
          <td className={`px-4 py-3 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            N/A
          </td>
        );
    }
  };

  // Get column headers from columnSettings instead of hardcoded array
  const columnHeaders = columnSettings?.availableColumns || [
    { key: 'select', label: 'Select', fixed: true },
    { key: 'photo', label: 'Photo', fixed: false },
    { key: 'admissionNo', label: 'Admission No', fixed: false },
    { key: 'admissionDate', label: 'Admission Date', fixed: false },
    { key: 'rollNo', label: 'Roll No', fixed: false },
    { key: 'name', label: 'Name', fixed: true },
    { key: 'dateOfBirth', label: 'Date of Birth', fixed: false },
    { key: 'gender', label: 'Gender', fixed: false },
    { key: 'bloodGroup', label: 'Blood Group', fixed: false },
    { key: 'category', label: 'Category', fixed: false },
    { key: 'religion', label: 'Religion', fixed: false },
    { key: 'parents', label: 'Parents', fixed: false },
    { key: 'phoneNumbers', label: 'Phone Numbers', fixed: false },
    { key: 'fatherPhone', label: "Father's Phone", fixed: false },
    { key: 'motherPhone', label: "Mother's Phone", fixed: false },
    { key: 'class', label: 'Class / Section', fixed: false },
    { key: 'medium', label: 'Medium', fixed: false },
    { key: 'board', label: 'Board', fixed: false },
    { key: 'phone', label: 'Student Phone', fixed: false },
    { key: 'email', label: 'Email', fixed: false },
    { key: 'address', label: 'Address', fixed: false },
    { key: 'city', label: 'City', fixed: false },
    { key: 'state', label: 'State', fixed: false },
    { key: 'aadharNumber', label: 'Aadhar No', fixed: false },
    { key: 'stsId', label: 'STS ID', fixed: false },
    { key: 'transport', label: 'Transport', fixed: false },
    { key: 'hostel', label: 'Hostel', fixed: false },
    { key: 'attendance', label: 'Attendance', fixed: false },
    { key: 'fees', label: 'Fee Status', fixed: false },
    { key: 'grade', label: 'Grade / GPA', fixed: false },
    { key: 'status', label: 'Status', fixed: false },
    { key: 'actions', label: 'Actions', fixed: true },
  ];

  return (
    <>
      {/* Navigation Tabs */}
      <div className={`flex gap-1 mb-4 p-1 rounded-xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {tabs.map(tab => {
          const isActive = currentPath === tab.href || 
                          (tab.key === 'overview' && currentPath === '/students');
          
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
              title={`Navigate to ${tab.label}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Student Table */}
      <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Mobile Card View */}
        {isMobile && mobileView !== 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {paginatedStudents.map(student => (
              <motion.div
                key={student.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'}`}
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative group">
                    {student.photo ? (
                      <img 
                        src={student.photo} 
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 cursor-pointer transition-transform hover:scale-110"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm ${student.photo ? 'hidden' : ''}`}>
                      {student.name.charAt(0)}
                    </div>
                    
                    {/* Hover popup with larger photo */}
                    {student.photo && (
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] pointer-events-none">
                        <div className="relative">
                          <img 
                            src={student.photo} 
                            alt={student.name}
                            className="w-48 h-64 rounded-xl object-cover border-2 border-gray-300 dark:border-gray-600 shadow-2xl"
                          />
                          <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${theme === 'dark' ? 'bg-gray-900 text-white border-2 border-gray-600 shadow-xl' : 'bg-white text-gray-900 border-2 border-gray-200 shadow-xl'}`}>
                            {student.name}
                          </div>
                          <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${theme === 'dark' ? 'bg-gray-900 text-white border-2 border-gray-600 shadow-xl' : 'bg-white text-gray-900 border-2 border-gray-200 shadow-xl'}`}>
                            {student.admissionNo}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{student.name}</h4>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {student.admissionNo} | {student.class && student.section ? `${student.class} - ${student.section}` : student.class || student.section || 'N/A'} | {student.languageMedium || 'N/A'}
                  </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(normalizeStudentStatus(student.status))}`}>{normalizeStudentStatus(student.status)}</span>
                  <span className={`text-xs font-medium ${getAttendanceColor(student.attendance?.percentage || 0)}`}>{student.attendance?.percentage || 0}%</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => window.location.href = `/fee-collection?studentId=${student.id}`}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    💰 Fee
                  </button>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    👁️ View
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  {visibleColumns.map(columnKey => {
                    const column = columnHeaders.find((c: any) => c.key === columnKey);
                    if (!column) return null;
                    
                    return (
                      <th
                        key={column.key}
                        onClick={() => !column.fixed && handleSort(column.key)}
                        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                          !column.fixed ? 'cursor-pointer hover:text-blue-500' : ''
                        } ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        <div className="flex items-center gap-1">
                          {column.key === 'select' ? (
                            <input
                              type="checkbox"
                              checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.includes(s.id))}
                              onChange={toggleAllStudentsSelection}
                              className="rounded"
                            />
                          ) : (
                            <>
                              {column.label}
                              {sortConfig?.key === column.key && !column.fixed && sortConfig && (
                                <span className="text-blue-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="px-4 py-12 text-center">
                      <div className={`text-lg ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        No students found matching your criteria
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student, idx) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`transition-colors ${
                        selectedStudents.includes(student.id)
                          ? theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
                          : theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {visibleColumns.map(columnKey => {
                        const cell = renderTableCell(student, columnKey);
                        return React.isValidElement(cell)
                          ? React.cloneElement(cell, { key: `${student.id}-${columnKey}` })
                          : cell;
                      })}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className={`flex items-center justify-between px-4 py-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {startIdx + 1}-{Math.min(startIdx + pageSize, filteredStudents.length)} of {filteredStudents.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, actualTotalPages) }, (_, i) => {
              let pageNum;
              if (actualTotalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= actualTotalPages - 2) {
                pageNum = actualTotalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(actualTotalPages, currentPage + 1))}
              disabled={currentPage >= actualTotalPages}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                currentPage >= actualTotalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
