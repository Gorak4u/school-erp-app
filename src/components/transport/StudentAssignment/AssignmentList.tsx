'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

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
  pagination,
  onNextPage,
  onPrevPage,
  onGoToPage,
  onChangePageSize
}: AssignmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');

  // Get unique routes for filter dropdown
  const uniqueRoutes = useMemo(() => {
    const routes = [...new Set(students.map(s => s.route?.routeName).filter(Boolean))];
    return routes.sort();
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !searchTerm || 
        student.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student?.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student?.class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student?.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.route?.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.route?.routeName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && student.isActive) ||
        (statusFilter === 'inactive' && !student.isActive);

      const matchesRoute = routeFilter === 'all' || student.route?.routeName === routeFilter;

      return matchesSearch && matchesStatus && matchesRoute;
    });
  }, [students, searchTerm, statusFilter, routeFilter]);

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className={`${card} p-4 rounded-xl border`}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, admission no, class, route..."
              className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Route Filter */}
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="all">All Routes</option>
            {uniqueRoutes.map(route => (
              <option key={route} value={route}>{route}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all' || routeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRouteFilter('all');
              }}
              className={btnSecondary}
            >
              Clear
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className={`mt-3 text-sm ${subtext}`}>
          Showing {filteredStudents.length} of {students.length} assignments
        </div>
      </div>

      {/* Table */}
      {filteredStudents.length === 0 ? (
        <div className={`${card} p-8 rounded-xl border text-center`}>
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <span className="text-2xl">👥</span>
          </div>
          <p className={`font-medium ${text} mb-2`}>
            {students.length === 0 ? 'No student assignments found' : 'No assignments match your filters'}
          </p>
          <p className={`text-sm ${subtext}`}>
            {students.length === 0 
              ? 'Start by assigning students to transport routes' 
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      ) : (
        <div className={`${card} rounded-xl border overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Student
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Route
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Stops
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Class
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Monthly Fee
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Yearly Fee
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={`hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} transition-colors`}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <div className={`font-medium ${text}`}>
                          {student.student?.name || 'Unknown Student'}
                        </div>
                        <div className={`text-sm ${subtext}`}>
                          {student.student?.admissionNo || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className={`font-medium ${text}`}>
                          {student.route?.routeNumber || 'N/A'}
                        </div>
                        <div className={`text-sm ${subtext}`}>
                          {student.route?.routeName || 'No route assigned'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-sm ${text}`}>
                        {student.pickupStop && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-green-500">📍</span>
                            <span>Pickup: {student.pickupStop}</span>
                          </div>
                        )}
                        {student.dropStop && (
                          <div className="flex items-center gap-1">
                            <span className="text-red-500">📍</span>
                            <span>Drop: {student.dropStop}</span>
                          </div>
                        )}
                        {!student.pickupStop && !student.dropStop && (
                          <span className={subtext}>No stops defined</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-sm ${text}`}>
                        {student.student?.class || 'N/A'} 
                        {student.student?.section && ` - ${student.student.section}`}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`font-medium ${text}`}>
                        ₹{student.monthlyFee || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`font-medium ${text}`}>
                        ₹{student.route?.yearlyFee || (student.monthlyFee || 0) * 12}
                      </div>
                      {student.route?.yearlyFee && (
                        <div className={`text-xs ${subtext}`}>
                          Route rate
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-medium ${student.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleStatus(student.id, !student.isActive)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                            student.isActive
                              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {student.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => onEdit(student)}
                          className={btnSecondary}
                        >
                          Edit
                        </button>
                        {student.isActive && student.monthlyFee > 0 && (
                          <button
                            onClick={() => window.open(`/refunds?studentId=${student.studentId}&studentTransportId=${student.id}&type=transport_fee`, '_blank')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all bg-green-100 text-green-600 hover:bg-green-200`}
                            title="Request Transport Fee Refund"
                          >
                            Refund
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(student.id)}
                          className={btnDanger}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={`${card} p-4 rounded-xl border`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${subtext}`}>Show:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => onChangePageSize?.(parseInt(e.target.value))}
                className={`px-3 py-1 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className={`text-sm ${subtext}`}>per page</span>
            </div>

            {/* Page Info */}
            <div className={`text-sm ${subtext}`}>
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} assignments
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevPage}
                disabled={pagination.page === 1}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

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
                    <button
                      key={pageNum}
                      onClick={() => onGoToPage?.(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        pageNum === pagination.page
                          ? 'bg-blue-500 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onNextPage}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  pagination.page === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
