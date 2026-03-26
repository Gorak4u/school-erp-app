'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import TransportCancellationModal from '@/components/transport/TransportCancellationModal';

interface AssignmentListProps {
  students: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnDanger: string;
  btnSecondary: string;
  onEdit: (assignment: any) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onTransportCancelled?: (result: any) => void;
  theme?: 'light' | 'dark';
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onGoToPage?: (page: number) => void;
  onChangePageSize?: (pageSize: number) => void;
}

export function AssignmentList({
  students,
  isDark,
  card,
  text,
  subtext,
  btnDanger,
  btnSecondary,
  onEdit,
  onDelete,
  onToggleStatus,
  onTransportCancelled,
  theme = 'light',
  pagination,
  onNextPage,
  onPrevPage,
  onGoToPage,
  onChangePageSize
}: AssignmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Get unique routes for filter dropdown
  const uniqueRoutes = useMemo(() => {
    const routes = [...new Set(students.map(s => s.route?.routeName).filter(Boolean))];
    return routes.sort();
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        (student.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.student?.admissionNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.route?.routeName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && student.isActive) ||
        (statusFilter === 'inactive' && !student.isActive);
      
      const matchesRoute = routeFilter === 'all' || student.route?.routeName === routeFilter;
      
      return matchesSearch && matchesStatus && matchesRoute;
    });
  }, [students, searchTerm, statusFilter, routeFilter]);

  // Handle transport cancellation
  const handleCancelTransport = (student: any) => {
    setSelectedStudent(student);
    setShowCancellationModal(true);
  };

  // Handle cancellation success
  const handleCancellationSuccess = (result: any) => {
    setShowCancellationModal(false);
    setSelectedStudent(null);
    if (onTransportCancelled) {
      onTransportCancelled(result);
    }
  };

  return (
    <div className="space-y-6">
      {/* Smart Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
        className={`${card} p-6 rounded-2xl border hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
      >
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-blue-600/5 via-transparent to-purple-600/5' : 'from-blue-500/3 via-transparent to-purple-500/3'} opacity-0 hover:opacity-100 transition-opacity duration-300`}></div>
        
        <div className="relative z-10">
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-lg`}
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
              transition={{ delay: 0.2 }}
              className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-100 to-purple-100'} border border-blue-300/30`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs">📊</span>
                <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Analytics</span>
              </div>
            </motion.div>
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Smart Search */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search students..."
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} hover:border-blue-400`}
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

            {/* Status Filter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-800/50 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} hover:border-blue-400`}
              >
                <option value="all">🎯 All Status</option>
                <option value="active">✅ Active</option>
                <option value="inactive">❌ Inactive</option>
              </select>
            </motion.div>

            {/* Route Filter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-800/50 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} hover:border-blue-400`}
              >
                <option value="all">🚌 All Routes</option>
                {uniqueRoutes.map(route => (
                  <option key={route} value={route}>📍 {route}</option>
                ))}
              </select>
            </motion.div>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || routeFilter !== 'all') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setRouteFilter('all');
                }}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                🔄 Reset Filters
              </motion.button>
            )}
          </div>
          
          {/* Results Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`mt-4 p-3 rounded-lg bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-50 to-purple-50'} border ${isDark ? 'border-blue-600/30' : 'border-blue-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">📈</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {filteredStudents.length} of {students.length} assignments
                </span>
              </div>
              <div className={`text-xs ${subtext}`}>
                {filteredStudents.length !== students.length && 'Filtered results'}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* World-Class AI Table */}
      {filteredStudents.length === 0 ? (
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
              <span className="text-3xl">👥</span>
            </motion.div>
            <h3 className={`text-xl font-bold ${text} mb-3`}>
              {students.length === 0 ? 'No Student Assignments' : 'No Matching Results'}
            </h3>
            <p className={`text-sm ${subtext} mb-6`}>
              {students.length === 0 
                ? 'Start by assigning students to transport routes' 
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRouteFilter('all');
              }}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${isDark ? 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} text-white shadow-lg shadow-blue-500/25`}
            >
              {students.length === 0 ? '🚀 Add First Assignment' : '🔄 Clear Filters'}
            </motion.button>
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
                  <h3 className={`text-lg font-bold ${text}`}>Student Assignments</h3>
                  <p className={`text-xs ${subtext}`}>Smart transport management</p>
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
                      <span>🚌</span> Route
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>📍</span> Stops
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>🎓</span> Class
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>💰</span> Fees
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${text} uppercase tracking-wider`}>
                    <div className="flex items-center gap-2">
                      <span>⚡</span> Status
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
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
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
                            {student.student?.name || 'Unknown Student'}
                          </div>
                          <div className={`text-xs ${subtext} flex items-center gap-1`}>
                            <span>🎫</span>
                            <span>{student.student?.admissionNo || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500'} shadow-md`}
                        >
                          <span className="text-white text-xs">🚌</span>
                        </motion.div>
                        <div>
                          <div className={`font-semibold ${text} text-sm`}>
                            {student.route?.routeNumber || 'N/A'}
                          </div>
                          <div className={`text-xs ${subtext}`}>
                            {student.route?.routeName || 'No route assigned'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {student.pickupStop && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.0 + index * 0.05 }}
                            className="flex items-center gap-1 text-xs"
                          >
                            <span className="text-green-500">📍</span>
                            <span className={`${text} bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full`}>
                              Pickup: {student.pickupStop}
                            </span>
                          </motion.div>
                        )}
                        {student.dropStop && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 + index * 0.05 }}
                            className="flex items-center gap-1 text-xs"
                          >
                            <span className="text-red-500">📍</span>
                            <span className={`${text} bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full`}>
                              Drop: {student.dropStop}
                            </span>
                          </motion.div>
                        )}
                        {!student.pickupStop && !student.dropStop && (
                          <span className={`text-xs ${subtext} italic`}>No stops defined</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500'} shadow-md`}
                        >
                          <span className="text-white text-xs">🎓</span>
                        </motion.div>
                        <div className={`text-sm ${text} bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full font-medium`}>
                          {student.student?.class || 'N/A'} 
                          {student.student?.section && ` - ${student.student?.section}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-orange-600 to-red-600' : 'from-orange-500 to-red-500'} shadow-md`}
                          >
                            <span className="text-white text-xs">💰</span>
                          </motion.div>
                          <span className={`font-semibold ${text} text-sm bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full`}>
                            ₹{student.monthlyFee || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${subtext}`}>Yearly:</span>
                          <span className={`text-xs font-medium ${text} bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full`}>
                            ₹{student.route?.yearlyFee || (student.monthlyFee || 0) * 12}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`w-3 h-3 rounded-full ${student.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'} shadow-lg`}
                        ></motion.div>
                        <span className={`text-sm font-bold ${
                          student.isActive 
                            ? 'text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full' 
                            : 'text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full'
                        }`}>
                          {student.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onToggleStatus(student.id, !student.isActive)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            student.isActive
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                          }`}
                        >
                          {student.isActive ? '⏸️ Pause' : '▶️ Start'}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onEdit(student)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${isDark ? 'border-blue-500 text-blue-400 hover:bg-blue-600/20' : 'border-blue-400 text-blue-600 hover:bg-blue-100'}`}
                        >
                          ✏️ Edit
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCancelTransport(student)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25`}
                          title="Cancel Transport Assignment"
                        >
                          ❌ Cancel
                        </motion.button>
                        
                        {student.isActive && student.monthlyFee > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.open(`/refunds?studentId=${student.studentId}&studentTransportId=${student.id}&type=transport_fee`, '_blank')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25`}
                            title="Request Transport Fee Refund"
                          >
                            💸 Refund
                          </motion.button>
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
      {pagination && pagination.totalPages > 1 && (
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
              {/* Page Size Selector */}
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500'} shadow-md`}
                >
                  <span className="text-white text-xs">📊</span>
                </motion.div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${text}`}>Show:</span>
                  <motion.select
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    value={pagination.pageSize}
                    onChange={(e) => onChangePageSize?.(parseInt(e.target.value))}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${isDark ? 'bg-gray-800/50 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} hover:border-purple-400`}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </motion.select>
                  <span className={`text-sm ${subtext}`}>per page</span>
                </div>
              </div>

              {/* Page Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-50 to-purple-50'} border ${isDark ? 'border-blue-600/30' : 'border-blue-200'}`}
              >
                <div className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount}
                </div>
                <div className={`text-xs ${subtext}`}>assignments</div>
              </motion.div>

              {/* Page Navigation */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onPrevPage}
                  disabled={pagination.page === 1}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pagination.page === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25'
                  }`}
                >
                  ⬅️ Previous
                </motion.button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onGoToPage?.(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                          pageNum === pagination.page
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                            : isDark
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  Next ➡️
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transport Cancellation Modal */}
      {showCancellationModal && selectedStudent && (
        <TransportCancellationModal
          isOpen={showCancellationModal}
          onClose={() => {
            setShowCancellationModal(false);
            setSelectedStudent(null);
          }}
          studentTransport={selectedStudent}
          onSuccess={handleCancellationSuccess}
          theme={theme}
        />
      )}
    </div>
  );
}
