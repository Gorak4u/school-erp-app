'use client';

import React, { useState, useEffect } from 'react';

interface DiscountRequestFormProps {
  theme: 'dark' | 'light';
  onClose: () => void;
}

export default function DiscountRequestForm({ theme, onClose }: DiscountRequestFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxCapAmount: '',
    scope: 'student',
    targetType: 'fee_structure',
    feeStructureIds: [] as string[],
    studentIds: [] as string[],
    classIds: [] as string[],
    sectionIds: [] as string[],
    academicYear: '2024-25',
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
          discountValue: Number(formData.discountValue),
          maxCapAmount: formData.maxCapAmount ? Number(formData.maxCapAmount) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              step >= num 
                ? 'bg-blue-600 text-white' 
                : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
            }`}>
              {num}
            </div>
            {num < 3 && (
              <div className={`w-24 h-1 mx-2 rounded ${
                step > num ? 'bg-blue-600' : isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-semibold">Scope & Targeting</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Request Name</label>
              <input
                type="text"
                placeholder="e.g., Sibling Discount Q1"
                className={inputCls}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Scope</label>
              <div className="grid grid-cols-3 gap-4">
                {['student', 'class', 'bulk'].map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setFormData({...formData, scope})}
                    className={`p-3 rounded-lg border text-center capitalize transition-colors ${
                      formData.scope === scope
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : isDark ? 'border-gray-700 hover:border-gray-600 text-gray-300' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope specific inputs would go here (student picker, class picker, etc) */}
            <div className="p-4 border border-dashed rounded-lg text-center text-sm text-gray-500">
              [ {formData.scope} selector component will be embedded here ]
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-semibold">Discount Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target Type</label>
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
                <label className="block text-sm font-medium mb-1">Type</label>
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
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-semibold">Justification & Review</h3>
          
          <div className="space-y-4">
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

            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className="font-medium mb-2">Request Summary</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="opacity-70">Name:</span> {formData.name}</li>
                <li><span className="opacity-70">Scope:</span> <span className="capitalize">{formData.scope}</span></li>
                <li>
                  <span className="opacity-70">Discount:</span>{' '}
                  {formData.discountType === 'percentage' ? `${formData.discountValue}%` : 
                   formData.discountType === 'fixed' ? `₹${formData.discountValue}` : 'Full Waiver'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Back
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !formData.name}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.reason}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Submit for Approval
          </button>
        )}
      </div>
    </div>
  );
}
