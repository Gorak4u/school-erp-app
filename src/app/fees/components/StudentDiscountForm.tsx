'use client';

import React, { useState, useEffect } from 'react';

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
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year: string; name: string}>>([]);
  const [feeStructures, setFeeStructures] = useState<Array<{id: string; name: string; amount: number; class?: {name: string}}>>([]);
  const [studentFeeData, setStudentFeeData] = useState<Array<{feeStructureId: string; totalAmount: number; pendingAmount: number; paidAmount: number}>>([]);
  
  const [formData, setFormData] = useState({
    name: `Discount for ${studentName}`,
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxCapAmount: '',
    targetType: 'total',
    feeStructureIds: [] as string[],
    academicYear: '',
    reason: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  // Fetch academic years, fee structures, and student fee data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch academic years
        const yearsRes = await fetch('/api/school-structure/academic-years');
        if (yearsRes.ok) {
          const yearsData = await yearsRes.json();
          setAcademicYears(yearsData.academicYears || []);
          // Set default academic year
          if (yearsData.academicYears?.length > 0 && !formData.academicYear) {
            const currentYear = new Date().getFullYear();
            const currentAcademicYear = yearsData.academicYears.find((ay: any) => ay.year.includes(currentYear.toString())) || yearsData.academicYears[0];
            setFormData(prev => ({ ...prev, academicYear: currentAcademicYear.year }));
          }
        }

        // Fetch fee structures
        const feesRes = await fetch('/api/fees/structures');
        if (feesRes.ok) {
          const feesData = await feesRes.json();
          setFeeStructures(feesData.feeStructures || []);
        } else {
          const errorData = await feesRes.json();
          console.error('Fee structures error:', errorData);
        }

        // Fetch student fee data
        if (studentId) {
          const studentFeesRes = await fetch(`/api/fees/students/${studentId}/summary`);
          if (studentFeesRes.ok) {
            const studentFeesData = await studentFeesRes.json();
            setStudentFeeData(studentFeesData.feeBreakdown || []);
          } else {
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    
    fetchData();
  }, []);

  const isDark = theme === 'dark';
  const inputCls = `w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
    isDark 
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  }`;

  // Helper function to get fee data for a structure
  const getFeeDataForStructure = (structureId: string) => {
    const studentFee = studentFeeData.find(fee => fee.feeStructureId === structureId);
    const structure = feeStructures.find(fs => fs.id === structureId);
    
    if (studentFee) {
      return {
        totalAmount: studentFee.totalAmount,
        pendingAmount: studentFee.pendingAmount,
        paidAmount: studentFee.paidAmount
      };
    } else if (structure) {
      // Fallback to fee structure amount if no student-specific data
      return {
        totalAmount: structure.amount,
        pendingAmount: structure.amount, // Assume full amount is pending
        paidAmount: 0
      };
    }
    
    return {
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0
    };
  };

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

        <div>
          <label className="block text-sm font-medium mb-1">Academic Year <span className="text-red-500">*</span></label>
          <select
            className={inputCls}
            value={formData.academicYear}
            onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
            required
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.year}>
                {year.name || year.year}
              </option>
            ))}
          </select>
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

        {formData.targetType === 'fee_structure' && (
          <div>
            <label className="block text-sm font-medium mb-2">Select Fee Structures</label>
            <div className={`max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2 ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'
            }`}>
              {feeStructures.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No fee structures available
                </p>
              ) : (
                feeStructures.map((structure) => {
                  const feeData = getFeeDataForStructure(structure.id);
                  return (
                    <label key={structure.id} className="flex items-center space-x-3 cursor-pointer">
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
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {structure.name}
                        </div>
                        {structure.class && (
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Class: {structure.class.name}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Total: <span className="font-medium">₹{feeData.totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className={`text-xs ${feeData.pendingAmount > 0 ? 'text-orange-500 font-medium' : 'text-green-500'}`}>
                            {feeData.pendingAmount > 0 ? `Pending: ₹${feeData.pendingAmount.toLocaleString('en-IN')}` : 'Paid'}
                          </div>
                        </div>
                        {feeData.paidAmount > 0 && (
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                            Paid: ₹{feeData.paidAmount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            {formData.feeStructureIds.length > 0 && (
              <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {formData.feeStructureIds.length} fee structure(s) selected
              </div>
            )}
          </div>
        )}

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
          {formData.targetType === 'fee_structure' && formData.feeStructureIds.length > 0 && (
            <li>
              <span className="opacity-70">Fee Structures:</span>
              <div className="mt-1 space-y-1">
                {formData.feeStructureIds.map(id => {
                  const structure = feeStructures.find(fs => fs.id === id);
                  const feeData = getFeeDataForStructure(id);
                  return structure ? (
                    <div key={id} className="text-xs pl-4">
                      • {structure.name} {structure.class && `(${structure.class.name})`}
                      <div className="flex items-center gap-4 mt-1 pl-4 text-xs opacity-70">
                        <span>Total: ₹{feeData.totalAmount.toLocaleString('en-IN')}</span>
                        <span className={feeData.pendingAmount > 0 ? 'text-orange-500' : 'text-green-500'}>
                          {feeData.pendingAmount > 0 ? `Pending: ₹${feeData.pendingAmount.toLocaleString('en-IN')}` : 'Paid'}
                        </span>
                      </div>
                    </div>
                  ) : null;
                })}
                {/* Total summary for selected structures */}
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>Total Selected Amount:</span>
                    <span>₹{formData.feeStructureIds.reduce((sum, id) => {
                      const feeData = getFeeDataForStructure(id);
                      return sum + feeData.totalAmount;
                    }, 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span>Total Pending:</span>
                    <span className="text-orange-500">
                      ₹{formData.feeStructureIds.reduce((sum, id) => {
                        const feeData = getFeeDataForStructure(id);
                        return sum + feeData.pendingAmount;
                      }, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          )}
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
