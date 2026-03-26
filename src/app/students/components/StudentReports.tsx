'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Brain,
  Sparkles,
  Eye,
  Printer,
  Share2,
  Mail,
  FileSpreadsheet,
  File,
  Database,
  Settings,
  RefreshCw
} from 'lucide-react';

interface StudentReportsProps {
  theme: 'dark' | 'light';
  students: any[];
  onClose: () => void;
  getCardClass?: () => string;
  getBtnClass?: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass?: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
  getInputClass?: () => string;
}

export default function StudentReports({ 
  theme, 
  students, 
  onClose,
  getCardClass,
  getBtnClass,
  getTextClass,
  getInputClass
}: StudentReportsProps) {
  const [activeReportTab, setActiveReportTab] = useState<'academic' | 'attendance' | 'financial' | 'behavioral' | 'custom'>('academic');
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isDark = theme === 'dark';
  const cardClass = getCardClass?.() || (isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200');
  const primaryTextClass = getTextClass?.('primary') || (isDark ? 'text-white' : 'text-gray-900');
  const secondaryTextClass = getTextClass?.('secondary') || (isDark ? 'text-gray-400' : 'text-gray-600');
  const accentTextClass = getTextClass?.('accent') || (isDark ? 'text-blue-400' : 'text-blue-600');

  // AI-powered report suggestions based on data
  const aiReportSuggestions = useMemo(() => {
    if (!students || students.length === 0) return [];
    
    const suggestions = [];
    
    // Analyze student data for AI suggestions
    const lowAttendanceCount = students.filter(s => s.attendance?.percentage < 75).length;
    const highPerformers = students.filter(s => s.academic?.average >= 90).length;
    const pendingFees = students.filter(s => s.fees?.pending > 0).length;
    
    if (lowAttendanceCount > 0) {
      suggestions.push({
        id: 'attendance-alert',
        title: 'Attendance Alert Report',
        description: `${lowAttendanceCount} students need attention`,
        icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
        priority: 'high',
        category: 'attendance'
      });
    }
    
    if (highPerformers > 0) {
      suggestions.push({
        id: 'top-performers',
        title: 'Top Performers Report',
        description: `${highPerformers} students with 90%+ scores`,
        icon: <Award className="w-5 h-5 text-green-500" />,
        priority: 'medium',
        category: 'academic'
      });
    }
    
    if (pendingFees > 0) {
      suggestions.push({
        id: 'fee-overdue',
        title: 'Fee Overdue Report',
        description: `${pendingFees} students with pending fees`,
        icon: <DollarSign className="w-5 h-5 text-red-500" />,
        priority: 'high',
        category: 'financial'
      });
    }
    
    return suggestions;
  }, [students]);

  const reportTemplates = {
    academic: [
      { id: 'performance-summary', name: 'Performance Summary', icon: <BarChart3 />, description: 'Overall academic performance overview' },
      { id: 'subject-wise', name: 'Subject-wise Analysis', icon: <PieChart />, description: 'Detailed performance by subject' },
      { id: 'grade-distribution', name: 'Grade Distribution', icon: <Activity />, description: 'Grade distribution across classes' },
      { id: 'top-achievers', name: 'Top Achievers', icon: <Award />, description: 'Highest performing students' }
    ],
    attendance: [
      { id: 'attendance-summary', name: 'Attendance Summary', icon: <Calendar />, description: 'Overall attendance statistics' },
      { id: 'monthly-attendance', name: 'Monthly Attendance', icon: <Clock />, description: 'Month-wise attendance trends' },
      { id: 'low-attendance', name: 'Low Attendance Alert', icon: <AlertCircle />, description: 'Students with poor attendance' },
      { id: 'perfect-attendance', name: 'Perfect Attendance', icon: <CheckCircle />, description: 'Students with 100% attendance' }
    ],
    financial: [
      { id: 'fee-collection', name: 'Fee Collection Report', icon: <DollarSign />, description: 'Fee collection status and trends' },
      { id: 'pending-fees', name: 'Pending Fees', icon: <AlertCircle />, description: 'Students with outstanding fees' },
      { id: 'payment-history', name: 'Payment History', icon: <TrendingUp />, description: 'Historical payment data' },
      { id: 'discount-analysis', name: 'Discount Analysis', icon: <Target />, description: 'Discount usage and impact' }
    ],
    behavioral: [
      { id: 'conduct-report', name: 'Conduct Report', icon: <Users />, description: 'Student behavior and discipline' },
      { id: 'achievements', name: 'Achievements', icon: <Award />, description: 'Student achievements and awards' },
      { id: 'disciplinary-actions', name: 'Disciplinary Actions', icon: <AlertCircle />, description: 'Disciplinary records' }
    ]
  };

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true);
    setSelectedReport(reportId);
    
    // Simulate AI-powered report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsGenerating(false);
  };

  const filteredReports = useMemo(() => {
    const reports = reportTemplates[activeReportTab as keyof typeof reportTemplates] || [];
    if (!searchTerm) return reports;
    
    return reports.filter(report =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeReportTab, searchTerm]);

  return (
    <div className="space-y-6">
      {/* AI Suggestions Banner */}
      {aiReportSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className={`font-bold ${accentTextClass}`}>AI Insights</span>
            </div>
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiReportSuggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleGenerateReport(suggestion.id)}
                className={`p-3 rounded-lg border text-left transition-all hover:scale-105 ${
                  isDark ? 'bg-gray-800/50 border-gray-700 hover:border-purple-500/50' : 'bg-white/50 border-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {suggestion.icon}
                  <span className={`font-semibold text-sm ${primaryTextClass}`}>{suggestion.title}</span>
                  {suggestion.priority === 'high' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500 border border-red-500/30">
                      High Priority
                    </span>
                  )}
                </div>
                <p className={`text-xs ${secondaryTextClass}`}>{suggestion.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Report Categories */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(reportTemplates).map((category) => (
          <motion.button
            key={category}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveReportTab(category as any)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeReportTab === category
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : isDark 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {category === 'academic' && <BarChart3 className="w-4 h-4" />}
              {category === 'attendance' && <Calendar className="w-4 h-4" />}
              {category === 'financial' && <DollarSign className="w-4 h-4" />}
              {category === 'behavioral' && <Users className="w-4 h-4" />}
              {category === 'custom' && <Settings className="w-4 h-4" />}
              <span className="capitalize">{category}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`
              w-full pl-10 pr-4 py-3 rounded-xl border-2
              ${getInputClass?.() || (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')}
              border-gray-500/30 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
            `}
          />
        </div>
        
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${getBtnClass?.('secondary')}`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${getBtnClass?.('primary')}`}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Report Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-xl ${cardClass}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${
                isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'
              }`}>
                {React.cloneElement(report.icon, { className: "w-6 h-6 text-white" })}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${primaryTextClass}`}>{report.name}</h3>
                <p className={`text-sm ${secondaryTextClass}`}>{report.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGenerateReport(report.id)}
                disabled={isGenerating && selectedReport === report.id}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  isGenerating && selectedReport === report.id
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : getBtnClass?.('primary')
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isGenerating && selectedReport === report.id ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate</span>
                    </>
                  )}
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg transition-all ${getBtnClass?.('secondary')}`}
              >
                <Eye className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-xl border-2 ${cardClass}`}
      >
        <h3 className={`text-lg font-semibold ${primaryTextClass} mb-4`}>Export Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <File />, label: 'PDF Report', format: 'pdf' },
            { icon: <FileSpreadsheet />, label: 'Excel Sheet', format: 'excel' },
            { icon: <Database />, label: 'CSV Data', format: 'csv' },
            { icon: <Mail />, label: 'Email Report', format: 'email' }
          ].map((option, index) => (
            <motion.button
              key={option.format}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                isDark ? 'bg-gray-800 border-gray-700 hover:border-blue-500/50' : 'bg-gray-100 border-gray-300 hover:border-blue-500/50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  {React.cloneElement(option.icon, { className: "w-5 h-5" })}
                </div>
                <span className={`text-xs font-medium ${primaryTextClass}`}>{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
