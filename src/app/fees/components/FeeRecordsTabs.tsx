// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

export default function FeeRecordsTabs({ ctx }: { ctx: any }) {
  const {
    activeTab, theme, searchTerm, setSearchTerm, selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus, feeRecords, filteredFeeRecords, feeStructures, feeCollections,
    discounts, setShowFeeStructureModal, setShowReceiptModal, selectedFeeRecord, setSelectedFeeRecord,
    prepareMonthlyCollectionData, prepareFeeCategoryData, preparePaymentMethodData,
  } = ctx;
  const { dropdowns } = useSchoolConfig();

  return (
    <>
          {activeTab === 'fee-records' && (
            <motion.div
              key="fee-records"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Filters — handled by global FeeFilters above */}
              <div className={`p-4 rounded-lg border mb-6 hidden ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex flex-wrap gap-4">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Classes</option>
                    {dropdowns.classes.map(cls => (
                      <option key={cls.value} value={cls.label}>{cls.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>

              {/* Fee Records Table */}
              <div className={`rounded-xl border overflow-hidden ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Student</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Fee Type</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Amount</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Paid</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Pending</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Due Date</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Status</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {(filteredFeeRecords || []).map((record) => (
                        <tr key={record.id}>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            <div>
                              <div className="font-medium">{record.student?.name || 'N/A'}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {record.student?.class || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{record.feeStructure?.name || 'N/A'}</td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>₹{(record.amount || 0).toLocaleString()}</td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>₹{(record.paidAmount || 0).toLocaleString()}</td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>₹{(record.pendingAmount || 0).toLocaleString()}</td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{record.dueDate}</td>
                          <td className={`px-6 py-4 whitespace-nowrap`}>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              record.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : record.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap`}>
                            <button
                              onClick={() => {
                              setSelectedFeeRecord(record);
                              setShowReceiptModal(true);
                            }}
                              className={`text-blue-600 hover:text-blue-800 ${
                                theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : ''
                              }`}
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'structures' && (
            <motion.div
              key="structures"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {feeStructures.map((structure) => (
                  <div
                    key={structure.id}
                    className={`p-6 rounded-xl border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {structure.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        structure.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {structure.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {/* AY / Medium / Class / Board tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {structure.academicYear && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
                        }`}>
                          📅 {structure.academicYear.name || structure.academicYear.year}
                        </span>
                      )}
                      {structure.medium && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700'
                        }`}>
                          🗣️ {structure.medium.name}
                        </span>
                      )}
                      {structure.class && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-50 text-green-700'
                        }`}>
                          🏫 {structure.class.name}
                        </span>
                      )}
                      {structure.board && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-50 text-orange-700'
                        }`}>
                          📋 {structure.board.name}
                        </span>
                      )}
                      {structure.applicableCategories && structure.applicableCategories !== 'all' && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {structure.applicableCategories}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Amount</span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{structure.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Category</span>
                        <span className={`font-medium capitalize ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {structure.category || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Frequency</span>
                        <span className={`font-medium capitalize ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {structure.frequency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due Date</span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {structure.dueDate}{structure.frequency === 'monthly' ? 'st of each month' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Late Fee</span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{structure.lateFee || 0}
                        </span>
                      </div>
                    </div>
                    {structure.description && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {structure.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="space-y-4">
                {feeCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`p-6 rounded-xl border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {collection.date}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Collected by: {collection.collectedBy}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        collection.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : collection.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {collection.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{(collection.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cash</p>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{(collection.cashAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cheque</p>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{(collection.chequeAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Online</p>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{(collection.onlineAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Transactions</p>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {collection.transactionCount}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'discounts' && (
            <motion.div
              key="discounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className={`p-6 rounded-xl border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {discount.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        discount.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Type
                        </span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Valid From
                        </span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {discount.validFrom}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Valid To
                        </span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {discount.validTo}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {discount.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

              </>
  );
}
