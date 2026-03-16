// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BulkFeeOperationsProps {
  theme: 'dark' | 'light';
  selectedStudents: string[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function BulkFeeOperations({ theme, selectedStudents, onClose, onSuccess }: BulkFeeOperationsProps) {
  const [operationType, setOperationType] = useState<'collect' | 'discount' | 'reminder' | 'export' | 'waiver'>('collect');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [feeStructures, setFeeStructures] = useState<Array<{id: string; name: string; amount: number; class?: {name: string}}>>([]);
  const [formData, setFormData] = useState({
    amount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    targetType: 'total' as 'total' | 'fee_structure',
    feeStructureIds: [] as string[],
    message: '',
    paymentMethod: 'cash' as 'cash' | 'online' | 'upi' | 'cheque',
    dueDate: '',
    reason: ''
  });

  // Helper function to get fee data for a structure (bulk operations use structure amounts)
  const getFeeDataForStructure = (structureId: string) => {
    const structure = feeStructures.find(fs => fs.id === structureId);
    return structure ? {
      totalAmount: structure.amount,
      pendingAmount: structure.amount, // For bulk, assume full amount is pending
      paidAmount: 0
    } : {
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0
    };
  };

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'online', label: 'Online Transfer', icon: '🏦' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'cheque', label: 'Cheque', icon: '📄' }
  ];

  // Fetch fee structures
  useEffect(() => {
    const fetchFeeStructures = async () => {
      try {
        console.log('Bulk operations: Fetching fee structures...');
        const res = await fetch('/api/fees/structures');
        console.log('Bulk operations: Fee structures response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Bulk operations: Fee structures data:', data);
          setFeeStructures(data.feeStructures || []);
        } else {
          const errorData = await res.json();
          console.error('Bulk operations: Fee structures error:', errorData);
        }
      } catch (err) {
        console.error('Bulk operations: Failed to fetch fee structures:', err);
      }
    };
    
    fetchFeeStructures();
  }, []);

  const handleBulkOperation = async () => {
    setIsProcessing(true);
    setProgress(0);
    setErrors([]);

    try {
      // Simulate bulk operation with progress
      const totalStudents = selectedStudents.length;
      
      for (let i = 0; i < totalStudents; i++) {
        // Simulate processing each student
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(Math.round(((i + 1) / totalStudents) * 100));
        
        // Simulate occasional errors (10% chance)
        if (Math.random() < 0.1) {
          setErrors(prev => [...prev, `Failed to process student ${i + 1}`]);
        }
      }

      // Success
      const successCount = totalStudents - errors.length;
      onSuccess(`Successfully processed ${successCount} out of ${totalStudents} students`);
      onClose();
    } catch (error) {
      setErrors(['Operation failed: ' + error.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOperationForm = () => {
    switch (operationType) {
      case 'collect':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Amount to Collect</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                placeholder="Enter amount"
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(method => (
                  <button
                    key={method.value}
                    onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                    className={`p-3 rounded-lg border transition-colors ${
                      formData.paymentMethod === method.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : cardCls
                    }`}
                  >
                    <span className="text-lg mr-2">{method.icon}</span>
                    <span className={`text-sm ${textPrimary}`}>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              />
            </div>
          </div>
        );

      case 'discount':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
                Discount {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                placeholder={formData.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Apply To</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormData({ ...formData, targetType: 'total', feeStructureIds: [] })}
                  className={`p-2 rounded-lg border text-center transition-colors text-sm ${
                    formData.targetType === 'total'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : cardCls
                  }`}
                >
                  Total Fees
                </button>
                <button
                  onClick={() => setFormData({ ...formData, targetType: 'fee_structure' })}
                  className={`p-2 rounded-lg border text-center transition-colors text-sm ${
                    formData.targetType === 'fee_structure'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : cardCls
                  }`}
                >
                  Specific Fee Structures
                </button>
              </div>
            </div>
            
            {formData.targetType === 'fee_structure' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Select Fee Structures</label>
                <div className={`max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1 ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'
                }`}>
                  {feeStructures.length === 0 ? (
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No fee structures available
                    </p>
                  ) : (
                    feeStructures.map((structure) => {
                      const feeData = getFeeDataForStructure(structure.id);
                      return (
                        <label key={structure.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.feeStructureIds.includes(structure.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  feeStructureIds: [...prev.feeStructureIds, structure.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  feeStructureIds: prev.feeStructureIds.filter(id => id !== structure.id)
                                }));
                              }
                            }}
                            className="rounded text-xs"
                          />
                          <div className="flex-1">
                            <div className={`text-xs font-medium ${textPrimary}`}>
                              {structure.name}
                            </div>
                            {structure.class && (
                              <div className={`text-xs ${textSecondary}`}>
                                {structure.class.name}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <div className={`text-xs ${textSecondary}`}>
                                Total: <span className="font-medium">₹{feeData.totalAmount.toLocaleString('en-IN')}</span>
                              </div>
                              <div className={`text-xs text-orange-500 font-medium`}>
                                Pending: ₹{feeData.pendingAmount.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {formData.feeStructureIds.length > 0 && (
                  <div className={`mt-1 text-xs ${textSecondary}`}>
                    {formData.feeStructureIds.length} fee structure(s) selected
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for discount"
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              />
            </div>
          </div>
        );

      case 'reminder':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Message Template</label>
              <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                <option>Fee Payment Reminder</option>
                <option>Overdue Payment Notice</option>
                <option>Upcoming Fee Due</option>
                <option>Custom Message</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Custom Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter custom message..."
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sms" className="rounded" />
              <label htmlFor="sms" className={`text-sm ${textPrimary}`}>Send SMS</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="email" className="rounded" />
              <label htmlFor="email" className={`text-sm ${textPrimary}`}>Send Email</label>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button className={`p-3 rounded-lg border ${cardCls} ${textPrimary}`}>
                  📊 Excel
                </button>
                <button className={`p-3 rounded-lg border ${cardCls} ${textPrimary}`}>
                  📄 PDF
                </button>
                <button className={`p-3 rounded-lg border ${cardCls} ${textPrimary}`}>
                  📋 CSV
                </button>
                <button className={`p-3 rounded-lg border ${cardCls} ${textPrimary}`}>
                  🧾 Receipts
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="includePaid" className="rounded" defaultChecked />
              <label htmlFor="includePaid" className={`text-sm ${textPrimary}`}>Include Paid Fees</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="includeSummary" className="rounded" defaultChecked />
              <label htmlFor="includeSummary" className={`text-sm ${textPrimary}`}>Include Summary</label>
            </div>
          </div>
        );

      case 'waiver':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Waiver Type</label>
              <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                <option>Full Fee Waiver</option>
                <option>Partial Fee Waiver</option>
                <option>Transport Fee Waiver</option>
                <option>Late Fee Waiver</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Waiver Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for waiver..."
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Academic Period</label>
              <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                <option>Current Month</option>
                <option>Current Quarter</option>
                <option>Current Year</option>
                <option>Custom Period</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`rounded-xl ${cardCls} p-6 max-w-2xl mx-auto`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Bulk Fee Operations</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          ✕
        </button>
      </div>

      <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <p className={`text-sm ${textPrimary}`}>
          <span className="font-semibold">{selectedStudents.length}</span> students selected
        </p>
      </div>

      {/* Operation Type Selection */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-3 ${textPrimary}`}>Operation Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { id: 'collect', label: '💰 Collect Fees', icon: '💰' },
            { id: 'discount', label: '🎁 Apply Discount', icon: '🎁' },
            { id: 'reminder', label: '📧 Send Reminder', icon: '📧' },
            { id: 'export', label: '📊 Export Data', icon: '📊' },
            { id: 'waiver', label: '📋 Fee Waiver', icon: '📋' }
          ].map(op => (
            <button
              key={op.id}
              onClick={() => setOperationType(op.id)}
              className={`p-3 rounded-lg border transition-colors ${
                operationType === op.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : cardCls
              }`}
            >
              <span className="text-lg mr-2">{op.icon}</span>
              <span className={`text-sm ${textPrimary}`}>{op.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Operation Form */}
      <div className="mb-6">
        {renderOperationForm()}
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${textPrimary}`}>Processing...</span>
            <span className={`text-sm ${textPrimary}`}>{progress}%</span>
          </div>
          <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
          <h4 className={`text-sm font-medium mb-2 text-red-600`}>Errors occurred:</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleBulkOperation}
          disabled={isProcessing || selectedStudents.length === 0}
          className={`flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors`}
        >
          {isProcessing ? 'Processing...' : `Process ${selectedStudents.length} Students`}
        </button>
        <button
          onClick={onClose}
          disabled={isProcessing}
          className={`px-6 py-3 font-medium rounded-lg transition-colors ${cardCls} ${textPrimary} disabled:opacity-50`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
