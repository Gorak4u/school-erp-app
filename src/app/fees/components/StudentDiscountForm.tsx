'use client';

import React, { useState } from 'react';

interface StudentDiscountFormProps {
  theme: 'dark' | 'light';
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentDiscountForm({ theme, studentId, studentName, onClose, onSuccess }: StudentDiscountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: `Discount for ${studentName}`,
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxCapAmount: '',
    targetType: 'total',
    feeStructureIds: [] as string[],
    reason: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  const isDark = theme === 'dark';
  const inputCls = `w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
    isDark 
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  }`;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/fees/discount-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scope: 'student',
          studentIds: [studentId],
          academicYear: '2024-25',
          discountValue: Number(formData.discountValue),
          maxCapAmount: formData.maxCapAmount ? Number(formData.maxCapAmount) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit discount request');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Request Name</label>
          <input
            type="text"
            className={inputCls}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea
            rows={2}
            className={inputCls}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Additional details about this discount..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Discount Type</label>
            <select
              className={inputCls}
              value={formData.discountType}
              onChange={(e) => setFormData({...formData, discountType: e.target.value})}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
              <option value="full_waiver">Full Waiver (100%)</option>
            </select>
          </div>
          
          {formData.discountType !== 'full_waiver' && (
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="number"
                className={inputCls}
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                placeholder={formData.discountType === 'percentage' ? 'e.g., 10' : 'e.g., 5000'}
              />
            </div>
          )}
        </div>

        {formData.discountType === 'percentage' && (
          <div>
            <label className="block text-sm font-medium mb-1">Maximum Cap Amount (Optional)</label>
            <input
              type="number"
              className={inputCls}
              value={formData.maxCapAmount}
              onChange={(e) => setFormData({...formData, maxCapAmount: e.target.value})}
              placeholder="e.g., 2000"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Apply To</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormData({...formData, targetType: 'total'})}
              className={`p-3 rounded-lg border text-center transition-colors ${
                formData.targetType === 'total'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
              }`}
            >
              Total Fees
            </button>
            <button
              onClick={() => setFormData({...formData, targetType: 'fee_structure'})}
              className={`p-3 rounded-lg border text-center transition-colors ${
                formData.targetType === 'fee_structure'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
              }`}
            >
              Specific Fee Structures
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Valid From</label>
            <input
              type="date"
              className={inputCls}
              value={formData.validFrom}
              onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valid To</label>
            <input
              type="date"
              className={inputCls}
              value={formData.validTo}
              onChange={(e) => setFormData({...formData, validTo: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reason for Discount <span className="text-red-500">*</span></label>
          <textarea
            rows={4}
            className={inputCls}
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            placeholder="Please provide a detailed justification for this discount request..."
          />
        </div>
      </div>

      {/* Preview */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className="font-medium mb-2">Request Summary</h4>
        <ul className="space-y-2 text-sm">
          <li><span className="opacity-70">Student:</span> {studentName}</li>
          <li><span className="opacity-70">Name:</span> {formData.name}</li>
          <li>
            <span className="opacity-70">Discount:</span>{' '}
            {formData.discountType === 'percentage' ? `${formData.discountValue}%` : 
             formData.discountType === 'fixed' ? `₹${formData.discountValue}` : 'Full Waiver'}
            {formData.maxCapAmount && ` (max ₹${formData.maxCapAmount})`}
          </li>
          <li><span className="opacity-70">Target:</span> {formData.targetType.replace('_', ' ')}</li>
          <li><span className="opacity-70">Validity:</span> {formData.validFrom} to {formData.validTo}</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.reason || !formData.discountValue}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Submit for Approval
        </button>
      </div>
    </div>
  );
}
