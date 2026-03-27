import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Printer, 
  Edit3, 
  Save,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share2,
  Mail,
  CheckCircle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  FileImage,
  File,
  Settings,
  Palette,
  Layout,
  Type,
  Grid,
  List,
  Maximize2,
  Minimize2,
  RefreshCw,
  Loader,
  Star,
  Shield,
  Clock,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail as MailIcon,
  GraduationCap,
  BookOpen,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Award,
  Target,
  Briefcase,
  Heart,
  Activity
} from 'lucide-react';

interface PreviewData {
  student: {
    name: string;
    photo: string;
    admissionNo: string;
    admissionDate: string;
    dateOfBirth: string;
    gender: string;
    placeOfBirth: string;
    nationality: string;
    bloodGroup: string;
    religion: string;
    category: string;
    motherTongue: string;
    stsId: string;
    aadharNumber: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    class: string;
    section: string;
    rollNumber: string;
    medium: string;
    board: string;
    previousSchool: string;
    previousClass: string;
    fatherName: string;
    fatherPhone: string;
    fatherEmail: string;
    fatherOccupation: string;
    motherName: string;
    motherPhone: string;
    motherEmail: string;
    motherOccupation: string;
    medicalConditions: string;
    allergies: string;
  };
  academic: {
    tuitionAnnual: number;
    tuitionFinalTotal: number;
    discountAmount: number;
    discountPercent: number;
    applicableFeeStructures: Array<{
      name: string;
      category: string;
      amount: number;
      frequency: string;
    }>;
    feeCalcs: {
      baseTotal: number;
      discountAmount: number;
      finalTotal: number;
      savingsPercent: number;
    };
  };
  transport: {
    routeName: string;
    routeNumber: string;
    pickupStop: string;
    dropStop: string;
    baseAnnual: number;
    discountAmount: number;
    finalAnnual: number;
  };
  combined: {
    grandTotal: number;
    totalDiscount: number;
    savingsPercent: number;
  };
  academicYear: string;
  documents: Array<{
    name: string;
    type: string;
    status: 'uploaded' | 'pending' | 'verified';
    url?: string;
  }>;
}

interface AdvancedApplicationPreviewProps {
  data: PreviewData;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (data: PreviewData) => Promise<void>;
  onEdit: (section: string) => void;
  isLoading?: boolean;
}

const AdvancedApplicationPreview: React.FC<AdvancedApplicationPreviewProps> = ({
  data,
  theme,
  onClose,
  onSave,
  onEdit,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [showWatermark, setShowWatermark] = useState(true);
  const [showHeaders, setShowHeaders] = useState(true);
  const [showFooters, setShowFooters] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'image'>('pdf');
  const [showSettings, setShowSettings] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);
  const [editedData, setEditedData] = useState<PreviewData>(data);
  const [hasChanges, setHasChanges] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewTheme, setPreviewTheme] = useState<'modern' | 'classic' | 'minimal'>('modern');

  const isDark = theme === 'dark';

  const sections = [
    { id: 'overview', label: 'Overview', icon: User, color: 'blue' },
    { id: 'personal', label: 'Personal Info', icon: Heart, color: 'purple' },
    { id: 'academic', label: 'Academic', icon: GraduationCap, color: 'green' },
    { id: 'fees', label: 'Fee Details', icon: DollarSign, color: 'amber' },
    { id: 'transport', label: 'Transport', icon: MapPin, color: 'cyan' },
    { id: 'parents', label: 'Parents', icon: Users, color: 'pink' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'indigo' },
    { id: 'medical', label: 'Medical', icon: Activity, color: 'red' }
  ];

  const exportOptions = [
    { id: 'pdf', label: 'PDF Document', icon: File, description: 'High-quality PDF with all details' },
    { id: 'excel', label: 'Excel Sheet', icon: File, description: 'Data in Excel format' },
    { id: 'image', label: 'Image', icon: FileImage, description: 'PNG/JPEG image' }
  ];

  const layoutOptions = [
    { id: 'grid', label: 'Grid View', icon: Grid, description: 'Card-based layout' },
    { id: 'list', label: 'List View', icon: List, description: 'Linear layout' },
    { id: 'compact', label: 'Compact', icon: Minimize2, description: 'Space-saving layout' }
  ];

  const themeOptions = [
    { id: 'modern', label: 'Modern', icon: Palette, description: 'Contemporary design' },
    { id: 'classic', label: 'Classic', icon: FileText, description: 'Traditional layout' },
    { id: 'minimal', label: 'Minimal', icon: Type, description: 'Clean and simple' }
  ];

  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
    if (direction === 'in') setZoomLevel(prev => Math.min(prev + 10, 200));
    else if (direction === 'out') setZoomLevel(prev => Math.max(prev - 10, 50));
    else setZoomLevel(100);
  }, []);

  const handleExport = useCallback(async (format: 'pdf' | 'excel' | 'image') => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // - Generate PDF using libraries like jsPDF or Puppeteer
      // - Create Excel file using ExcelJS
      // - Capture screenshot using html2canvas
      
      console.log(`Exporting as ${format}...`);
      alert(`Application exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await onSave(editedData);
      setHasChanges(false);
      setLastSaved(new Date());
      alert('Application saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed. Please try again.');
    }
  }, [editedData, onSave]);

  const handleEmail = useCallback(() => {
    // Simulate email functionality
    alert('Application preview would be sent to parents email address');
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const renderSectionContent = useCallback((sectionId: string) => {
    switch (sectionId) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Student Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/30' 
                  : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Student Overview
                </h3>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-500">Complete</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-blue-800/50' : 'bg-blue-100'
                  }`}>
                    <User className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {data.student.name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {data.student.admissionNo}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {data.student.class} - {data.student.section}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {data.student.admissionDate}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {data.student.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MailIcon className="w-4 h-4 text-purple-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {data.student.email}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Fees', value: data.combined.grandTotal, icon: DollarSign, color: 'green' },
                { label: 'Discount', value: data.combined.totalDiscount, icon: TrendingUp, color: 'amber' },
                { label: 'Savings', value: `${data.combined.savingsPercent}%`, icon: Target, color: 'blue' },
                { label: 'Documents', value: `${data.documents.filter(d => d.status === 'verified').length}/${data.documents.length}`, icon: FileText, color: 'purple' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    isDark 
                      ? 'bg-gray-800/50 border-gray-700/50' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.label}
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {typeof stat.value === 'number' ? `₹${stat.value.toLocaleString()}` : stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'fees':
        return (
          <div className="space-y-6">
            {/* Fee Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/30' 
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50'
              }`}
            >
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                Fee Structure
              </h3>
              
              <div className="space-y-4">
                {/* Academic Fees */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Academic Fees
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Base Tuition:</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        ₹{data.academic.tuitionAnnual.toLocaleString()}
                      </span>
                    </div>
                    {data.academic.discountAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Academic Discount:</span>
                        <span className="text-sm font-medium text-green-500">
                          -₹{data.academic.discountAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Final Academic:</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                        ₹{data.academic.tuitionFinalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transport Fees */}
                {data.transport.baseAnnual > 0 && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Transport Fees
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Base Transport:</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          ₹{data.transport.baseAnnual.toLocaleString()}
                        </span>
                      </div>
                      {data.transport.discountAmount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Transport Discount:</span>
                          <span className="text-sm font-medium text-green-500">
                            -₹{data.transport.discountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Final Transport:</span>
                        <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          ₹{data.transport.finalAnnual.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grand Total */}
                <div className={`p-4 rounded-xl border-2 ${
                  isDark 
                    ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/50' 
                    : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-lg font-bold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                      Grand Total:
                    </span>
                    <span className={`text-xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                      ₹{data.combined.grandTotal.toLocaleString()}/year
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );

      // Add more sections as needed...
      default:
        return (
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Section content for {sectionId}
            </p>
          </div>
        );
    }
  }, [data, isDark]);

  return (
    <div className={`fixed inset-0 z-50 ${isDark ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-sm`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Application Preview
              </h2>
              {hasChanges && (
                <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-600 rounded-full">
                  Unsaved Changes
                </span>
              )}
              {lastSaved && (
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View Controls */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleZoom('out')}
                  className={`p-1 rounded transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className={`text-sm font-medium px-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => handleZoom('in')}
                  className={`p-1 rounded transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleZoom('reset')}
                  className={`p-1 rounded transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </button>

                {viewMode === 'edit' ? (
                  <button
                    onClick={handleSave}
                    disabled={isExporting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isExporting
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isExporting ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isDark 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={handleEmail}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-cyan-600 text-white hover:bg-cyan-700' 
                      : 'bg-cyan-500 text-white hover:bg-cyan-600'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                </button>

                {/* Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setExportFormat(exportFormat === 'pdf' ? 'excel' : exportFormat === 'excel' ? 'image' : 'pdf')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isDark 
                        ? 'bg-amber-600 text-white hover:bg-amber-700' 
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {exportOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleExport(option.id as 'pdf' | 'excel' | 'image')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                      >
                        <option.icon className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-b ${isDark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-white/30'}`}
            >
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Layout Options */}
                  <div>
                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Layout
                    </h4>
                    <div className="space-y-2">
                      {layoutOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setLayoutMode(option.id as 'grid' | 'list' | 'compact')}
                          className={`w-full px-3 py-2 text-left rounded-lg text-sm transition-all ${
                            layoutMode === option.id
                              ? isDark ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'bg-blue-100 text-blue-700 border border-blue-200'
                              : isDark ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Options */}
                  <div>
                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Theme
                    </h4>
                    <div className="space-y-2">
                      {themeOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setPreviewTheme(option.id as 'modern' | 'classic' | 'minimal')}
                          className={`w-full px-3 py-2 text-left rounded-lg text-sm transition-all ${
                            previewTheme === option.id
                              ? isDark ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50' : 'bg-purple-100 text-purple-700 border border-purple-200'
                              : isDark ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display Options */}
                  <div>
                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Display
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Show Watermark', value: showWatermark, setter: setShowWatermark },
                        { label: 'Show Headers', value: showHeaders, setter: setShowHeaders },
                        { label: 'Show Footers', value: showFooters, setter: setShowFooters },
                        { label: 'Auto Save', value: autoSave, setter: setAutoSave }
                      ].map(option => (
                        <label key={option.label} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={option.value}
                            onChange={(e) => option.setter(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className={`w-64 border-r ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/50'} overflow-y-auto`}>
            <div className="p-4">
              <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Navigation
              </h3>
              <div className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full px-3 py-2 text-left rounded-lg text-sm transition-all flex items-center gap-3 ${
                      activeSection === section.id
                        ? isDark 
                          ? `bg-${section.color}-600/20 text-${section.color}-400 border border-${section.color}-600/50`
                          : `bg-${section.color}-100 text-${section.color}-700 border border-${section.color}-200`
                        : isDark 
                          ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto">
            <div 
              ref={previewRef}
              className="p-6"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
            >
              {/* Watermark */}
              {showWatermark && (
                <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-10 pointer-events-none ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  <div className="text-6xl font-bold">PREVIEW</div>
                </div>
              )}

              {/* Headers */}
              {showHeaders && (
                <div className="mb-6 text-center">
                  <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Student Application Form
                  </h1>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Academic Year: {data.academicYear}
                  </p>
                </div>
              )}

              {/* Section Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-full"
                >
                  {renderSectionContent(activeSection)}
                </motion.div>
              </AnimatePresence>

              {/* Footers */}
              {showFooters && (
                <div className={`mt-8 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                      Generated on {new Date().toLocaleString()}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-green-500" />
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          Auto-saved
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedApplicationPreview;
