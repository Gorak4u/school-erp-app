'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, RefreshCw, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TransportRefundsProps {
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnPrimary: string;
  btnSecondary: string;
  btnDanger: string;
  theme: 'light' | 'dark';
}

interface RefundRequest {
  id: string;
  schoolId: string;
  studentId: string;
  type: string; // 'academic_fee', 'transport_fee', 'fine', 'overpayment', 'transport_fee_waiver'
  sourceId?: string;
  sourceType?: string;
  amount: number;
  adminFee: number;
  netAmount: number;
  reason: string;
  status: string;
  priority: string;
  refundMethod: string;
  approvedBy?: string;
  approvedAt?: string;
  processedBy?: string;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    class: string;
    section: string;
  };
  approvals?: Array<{
    approver: {
      firstName: string;
      lastName: string;
      email: string;
    };
    action: string;
    comments: string;
    createdAt: string;
  }>;
}

export default function TransportRefunds({ 
  isDark, 
  card, 
  text, 
  subtext, 
  btnPrimary, 
  btnSecondary, 
  btnDanger,
  theme 
}: TransportRefundsProps) {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState('');

  // Handle approve refund
  const handleApproveRefund = async (refundId: string) => {
    try {
      const response = await fetch(`/api/transport/approvals/${refundId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          comments: 'Approved via transport refunds management'
        })
      });

      if (response.ok) {
        fetchRefunds(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to approve refund');
      }
    } catch (error) {
      setError('Failed to approve refund');
      console.error('Approve refund error:', error);
    }
  };

  // Handle reject refund
  const handleRejectRefund = async (refundId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/transport/approvals/${refundId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          comments: reason
        })
      });

      if (response.ok) {
        fetchRefunds(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reject refund');
      }
    } catch (error) {
      setError('Failed to reject refund');
      console.error('Reject refund error:', error);
    }
  };

  // World-Class AI-Powered Form Styles
  const input = `w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] focus:scale-[1.02] ${isDark ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600 text-white placeholder-gray-400 hover:border-purple-500/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 hover:border-purple-400'}`;
  
  const label = `block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`;

  const fetchRefunds = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(requestTypeFilter !== 'all' && { requestType: requestTypeFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/transport/refunds?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transport refunds');
      }
      
      const data = await response.json();
      setRefunds(data.refunds || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [page, pageSize, statusFilter, requestTypeFilter, searchTerm]);
  
  // World-Class AI-Powered Button Component
  const WorldClassButton = ({ 
    onClick, 
    children, 
    variant = 'primary',
    size = 'sm',
    disabled = false,
    icon = null
  }: {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gradient';
    size?: 'xs' | 'sm' | 'md';
    disabled?: boolean;
    icon?: React.ReactNode;
  }) => {
    const variants = {
      primary: `bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-purple-600`,
      secondary: `border-2 ${isDark ? 'border-blue-500 text-blue-400 hover:bg-blue-600/20' : 'border-blue-400 text-blue-600 hover:bg-blue-100'}`,
      success: `bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-emerald-600`,
      danger: `bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-pink-600`,
      gradient: `bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:from-purple-600 hover:to-pink-600`
    };
    
    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm'
    };
    
    return (
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={onClick}
        disabled={disabled}
        className={`${
          variants[variant]
        } ${
          sizes[size]
        } rounded-xl font-bold transition-all duration-300 transform ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-xl active:scale-95'
        } flex items-center gap-2`}
      >
        {icon && <span className="text-sm">{icon}</span>}
        {children}
      </motion.button>
    );
  };
  
  // Enhanced Status Badge Configuration
  const getStatusBadge = (status: string, type?: string) => {
    const statusConfig: Record<string, any> = {
      pending: { 
        color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/25', 
        icon: Clock, 
        label: 'Pending',
        animation: 'animate-pulse'
      },
      approved: { 
        color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25', 
        icon: CheckCircle, 
        label: 'Approved',
        animation: 'animate-bounce'
      },
      rejected: { 
        color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25', 
        icon: XCircle, 
        label: 'Rejected',
        animation: 'animate-none'
      },
      processed: { 
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25', 
        icon: CheckCircle, 
        label: 'Processed',
        animation: 'animate-none'
      },
      pending_waiver_approval: { 
        color: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25', 
        icon: Clock, 
        label: 'Waiver Pending',
        animation: 'animate-pulse'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${config.color} ${config.animation}`}
      >
        <Icon className="w-3 h-3" />
        <span>{type === 'transport_fee_waiver' ? `Waiver ${config.label}` : config.label}</span>
      </motion.div>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* World-Class Header */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
        className={`${card} p-6 rounded-2xl border hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
      >
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-blue-600/5 via-transparent to-purple-600/5' : 'from-blue-500/3 via-transparent to-purple-500/3'} opacity-0 hover:opacity-100 transition-opacity duration-300`}></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-lg`}
              >
                <span className="text-white text-2xl">💸</span>
              </motion.div>
              <div>
                <h2 className={`text-2xl font-bold ${text}`}>Transport Refunds & Waivers</h2>
                <p className={`text-sm ${subtext} mt-1 flex items-center gap-2`}>
                  <span>🤖</span>
                  <span>Smart refund management system</span>
                </p>
              </div>
            </div>
            
            <WorldClassButton
              onClick={fetchRefunds}
              disabled={loading}
              variant="primary"
              size="md"
              icon={loading ? "🔄" : "🔄"}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </WorldClassButton>
          </div>
        </div>
      </motion.div>

      {/* Smart Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100 }}
        className={`${card} p-6 rounded-2xl border hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
      >
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-green-600/5 via-transparent to-emerald-600/5' : 'from-green-500/3 via-transparent to-emerald-500/3'} opacity-0 hover:opacity-100 transition-opacity duration-300`}></div>
        
        <div className="relative z-10">
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500'} shadow-lg`}
              >
                <span className="text-white text-lg">🔍</span>
              </motion.div>
              <div>
                <h3 className={`text-lg font-bold ${text}`}>Smart Filters</h3>
                <p className={`text-xs ${subtext}`}>Advanced search and filtering</p>
              </div>
            </div>
            
            {/* Smart Badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-100 to-emerald-100'} border border-green-300/30`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs">📊</span>
                <span className={`${isDark ? 'text-green-400' : 'text-green-600'}`}>Analytics</span>
              </div>
            </motion.div>
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Smart Search */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${subtext}`} />
              <input
                type="text"
                placeholder="🔍 Search refunds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${input} pl-10`}
              />
              {searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  ✕
                </motion.button>
              )}
            </motion.div>

            {/* Request Type Filter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <select
                value={requestTypeFilter}
                onChange={(e) => setRequestTypeFilter(e.target.value)}
                className={input}
              >
                <option value="all">🎯 All Types</option>
                <option value="refund">💸 Refunds Only</option>
                <option value="waiver">📋 Waivers Only</option>
              </select>
            </motion.div>

            {/* Status Filter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={input}
              >
                <option value="all">⚡ All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="rejected">❌ Rejected</option>
                <option value="processed">🎉 Processed</option>
                <option value="pending_waiver_approval">📋 Waiver Pending</option>
              </select>
            </motion.div>

            {/* Page Size */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={input}
              >
                <option value={10}>📄 10 per page</option>
                <option value={25}>📄 25 per page</option>
                <option value={50}>📄 50 per page</option>
              </select>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30`}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-500 shadow-lg`}
            >
              <span className="text-white text-sm">⚠️</span>
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-red-600">Error</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 100 }}
          className={`${card} p-12 rounded-2xl border text-center relative overflow-hidden`}
        >
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-blue-600/5 via-transparent to-purple-600/5' : 'from-blue-500/3 via-transparent to-purple-500/3'} opacity-50`}></div>
          
          <div className="relative z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-lg`}
            >
              <span className="text-2xl text-white">🔄</span>
            </motion.div>
            <h3 className={`text-lg font-bold ${text} mb-2`}>Loading Smart Refunds</h3>
            <p className={`text-sm ${subtext}`}>Fetching refund data...</p>
          </div>
        </motion.div>
      )}

      {!loading && refunds.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 100 }}
          className={`${card} p-12 rounded-2xl border text-center relative overflow-hidden`}
        >
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-gray-600/5 via-transparent to-purple-600/5' : 'from-gray-500/3 via-transparent to-purple-500/3'} opacity-50`}></div>
          
          <div className="relative z-10">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br ${isDark ? 'from-gray-600 to-purple-600' : 'from-gray-500 to-purple-500'} shadow-lg`}
            >
              <span className="text-3xl">💸</span>
            </motion.div>
            <h3 className={`text-xl font-bold ${text} mb-3`}>
              No Transport Refunds Found
            </h3>
            <p className={`text-sm ${subtext} mb-6`}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Transport refunds will appear here when created'
              }
            </p>
            <WorldClassButton
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRequestTypeFilter('all');
              }}
              variant="primary"
              size="sm"
              icon="🔄"
            >
              Clear Filters
            </WorldClassButton>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 100 }}
          className={`${card} rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 relative`}
        >
          {/* Table Header */}
          <div className={`px-6 py-4 bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-700' : 'from-gray-50 to-gray-100'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-md`}
                >
                  <span className="text-white text-sm">📊</span>
                </motion.div>
                <div>
                  <h3 className={`text-lg font-bold ${text}`}>Refund Requests</h3>
                  <p className={`text-xs ${subtext}`}>Smart refund management</p>
                </div>
              </div>
              
              {/* Smart Badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-100 to-emerald-100'} border border-green-300/30`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">✨</span>
                  <span className={`${isDark ? 'text-green-400' : 'text-green-600'}`}>Optimized</span>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`bg-gradient-to-r ${isDark ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50 to-gray-100'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>👤</span> Student
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>📋</span> Type
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>💰</span> Amount
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>💵</span> Net Amount
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>⚡</span> Status
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>📅</span> Date
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>🎮</span> Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {refunds.map((refund, index) => (
                  <motion.tr
                    key={refund.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.05, duration: 0.4 }}
                    className={`hover:${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} transition-all duration-200 group`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-md`}
                        >
                          <span className="text-white text-sm">👤</span>
                        </motion.div>
                        <div>
                          <div className={`font-semibold ${text} text-sm`}>
                            {refund.student?.name || 'Unknown Student'}
                          </div>
                          <div className={`text-xs ${subtext} flex items-center gap-1`}>
                            <span>🎫</span>
                            <span>{refund.student?.admissionNo}</span>
                            <span>•</span>
                            <span>{refund.student?.class}-{refund.student?.section}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                          refund.type === 'transport_fee_waiver' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                        }`}
                      >
                        <span>{refund.type === 'transport_fee_waiver' ? '📋' : '💸'}</span>
                        {refund.type === 'transport_fee_waiver' ? 'Waiver' : 'Refund'}
                      </motion.div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-orange-600 to-red-600' : 'from-orange-500 to-red-500'} shadow-md`}
                        >
                          <span className="text-white text-xs">💰</span>
                        </motion.div>
                        <div>
                          <div className={`font-bold ${text} text-sm bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full`}>
                            ₹{refund.amount}
                          </div>
                          {refund.adminFee > 0 && (
                            <div className={`text-xs ${subtext} flex items-center gap-1`}>
                              <span>📋</span>
                              <span>Admin: ₹{refund.adminFee}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500'} shadow-md`}
                        >
                          <span className="text-white text-xs">💵</span>
                        </motion.div>
                        <div className={`font-bold ${text} text-sm bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full`}>
                          ₹{refund.netAmount}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(refund.status, refund.type)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-indigo-600 to-purple-600' : 'from-indigo-500 to-purple-500'} shadow-md`}
                        >
                          <span className="text-white text-xs">📅</span>
                        </motion.div>
                        <div className={`text-xs ${subtext} bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full`}>
                          {new Date(refund.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <WorldClassButton
                          onClick={() => {
                            setSelectedRefund(refund);
                            setShowDetailsModal(true);
                          }}
                          variant="secondary"
                          size="sm"
                          icon="👁️"
                        >
                          View
                        </WorldClassButton>
                        
                        {/* Show approve/reject buttons for pending requests */}
                        {(refund.status === 'pending' || refund.status === 'pending_waiver_approval') && (
                          <>
                            <WorldClassButton
                              onClick={() => handleApproveRefund(refund.id)}
                              variant="success"
                              size="sm"
                              icon="✅"
                            >
                              Approve
                            </WorldClassButton>
                            <WorldClassButton
                              onClick={() => handleRejectRefund(refund.id)}
                              variant="danger"
                              size="sm"
                              icon="❌"
                            >
                              Reject
                            </WorldClassButton>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* World-Class Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5, type: "spring", stiffness: 100 }}
          className={`${card} p-6 rounded-2xl border hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
        >
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-purple-600/5 via-transparent to-pink-600/5' : 'from-purple-500/3 via-transparent to-pink-500/3'} opacity-0 hover:opacity-100 transition-opacity duration-300`}></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Page Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-50 to-purple-50'} border ${isDark ? 'border-blue-600/30' : 'border-blue-200'}`}
              >
                <div className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {Math.min((page - 1) * pageSize + 1, totalCount)} - {Math.min(page * pageSize, totalCount)} of {totalCount}
                </div>
                <div className={`text-xs ${subtext}`}>refund requests</div>
              </motion.div>

              {/* Page Navigation */}
              <div className="flex items-center gap-3">
                <WorldClassButton
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="primary"
                  size="sm"
                  icon="⬅️"
                >
                  Previous
                </WorldClassButton>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <WorldClassButton
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        variant={pageNum === page ? "primary" : "secondary"}
                        size="xs"
                        disabled={pageNum === page}
                      >
                        {pageNum}
                      </WorldClassButton>
                    );
                  })}
                </div>

                <WorldClassButton
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  variant="primary"
                  size="sm"
                  icon="➡️"
                >
                  Next
                </WorldClassButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRefund && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            setShowDetailsModal(false);
            setSelectedRefund(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 ${card} rounded-2xl border hover:shadow-xl transition-all duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-lg`}
                >
                  <span className="text-white text-lg">💸</span>
                </motion.div>
                <div>
                  <h3 className={`text-xl font-bold ${text}`}>Refund Details</h3>
                  <p className={`text-sm ${subtext}`}>Smart refund information</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRefund(null);
                }}
                className={`p-3 rounded-xl transition-all ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <XCircle className="w-6 h-6" />
              </motion.button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Student Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-6 rounded-xl bg-gradient-to-br ${isDark ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50 to-gray-100'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <h4 className={`font-bold mb-4 ${text} flex items-center gap-2`}>
                  <span>👤</span> Student Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Name:</span>
                    <p className={`font-medium ${text} mt-1`}>{selectedRefund.student?.name}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Admission No:</span>
                    <p className={`font-medium ${text} mt-1`}>{selectedRefund.student?.admissionNo}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Class:</span>
                    <p className={`font-medium ${text} mt-1`}>{selectedRefund.student?.class}-{selectedRefund.student?.section}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Student ID:</span>
                    <p className={`font-medium ${text} mt-1`}>{selectedRefund.studentId}</p>
                  </div>
                </div>
              </motion.div>

              {/* Refund Details */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`p-6 rounded-xl bg-gradient-to-br ${isDark ? 'from-blue-800/50 to-purple-800/50' : 'from-blue-50 to-purple-50'} border ${isDark ? 'border-blue-700' : 'border-blue-200'}`}
              >
                <h4 className={`font-bold mb-4 ${text} flex items-center gap-2`}>
                  <span>💰</span> Refund Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Type:</span>
                    <p className={`font-medium ${text} mt-1`}>
                      {selectedRefund.type === 'transport_fee_waiver' ? 'Waiver' : 'Refund'}
                    </p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Amount:</span>
                    <p className={`font-bold ${text} mt-1 text-lg`}>₹{selectedRefund.amount}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Admin Fee:</span>
                    <p className={`font-medium ${text} mt-1`}>₹{selectedRefund.adminFee}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Net Amount:</span>
                    <p className={`font-bold ${text} mt-1 text-lg text-green-600`}>₹{selectedRefund.netAmount}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedRefund.status, selectedRefund.type)}</div>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Priority:</span>
                    <p className={`font-medium ${text} mt-1 capitalize`}>{selectedRefund.priority}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Refund Method:</span>
                    <p className={`font-medium ${text} mt-1 capitalize`}>{selectedRefund.refundMethod}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${subtext}`}>Created:</span>
                    <p className={`font-medium ${text} mt-1`}>{new Date(selectedRefund.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>

              {/* Reason */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`p-6 rounded-xl bg-gradient-to-br ${isDark ? 'from-orange-800/50 to-red-800/50' : 'from-orange-50 to-red-50'} border ${isDark ? 'border-orange-700' : 'border-orange-200'}`}
              >
                <h4 className={`font-bold mb-4 ${text} flex items-center gap-2`}>
                  <span>📝</span> Reason
                </h4>
                <p className={`text-sm ${text} leading-relaxed`}>{selectedRefund.reason}</p>
              </motion.div>

              {/* Approvals */}
              {selectedRefund.approvals && selectedRefund.approvals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`p-6 rounded-xl bg-gradient-to-br ${isDark ? 'from-green-800/50 to-emerald-800/50' : 'from-green-50 to-emerald-50'} border ${isDark ? 'border-green-700' : 'border-green-200'}`}
                >
                  <h4 className={`font-bold mb-4 ${text} flex items-center gap-2`}>
                    <span>✅</span> Approval History
                  </h4>
                  <div className="space-y-3">
                    {selectedRefund.approvals.map((approval: any, index: number) => (
                      <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${text}`}>
                              {approval.approver?.firstName} {approval.approver?.lastName}
                            </p>
                            <p className={`text-xs ${subtext}`}>
                              {approval.approver?.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs ${subtext}`}>
                              {new Date(approval.createdAt).toLocaleDateString()}
                            </p>
                            <p className={`text-xs ${subtext}`}>
                              {approval.action}
                            </p>
                          </div>
                        </div>
                        {approval.comments && (
                          <p className={`text-sm ${subtext} mt-2 italic`}>
                            "{approval.comments}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
