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
  
  // Data States
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year: string; name: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Data
  useEffect(() => {
    const fetchFeeStructures = async () => {
      try {
        const res = await fetch('/api/fees/structures');
        if (res.ok) {
          const data = await res.json();
          setFeeStructures(data.feeStructures || data.structures || []);
        }
      } catch (err) {
        console.error('Failed to fetch fee structures:', err);
      }
    };
    
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/school-structure/classes');
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };

    const fetchSections = async () => {
      try {
        const res = await fetch('/api/school-structure/sections');
        if (res.ok) {
          const data = await res.json();
          setSections(data.sections || []);
        }
      } catch (err) {
        console.error('Failed to fetch sections:', err);
      }
    };

    const fetchAcademicYears = async () => {
      try {
        const res = await fetch('/api/school-structure/academic-years');
        if (res.ok) {
          const data = await res.json();
          setAcademicYears(data.academicYears || []);
        }
      } catch (err) {
        console.error('Failed to fetch academic years:', err);
      }
    };
    
    fetchFeeStructures();
    fetchClasses();
    fetchSections();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const fetchStudents = async () => {
        try {
          const res = await fetch(`/api/students?search=${encodeURIComponent(searchTerm)}`);
          
          if (res.status === 429) {
            setError('Too many search requests. Please wait a moment.');
            return;
          }
          
          if (res.ok) {
            const result = await res.json();
            setStudents(result.students || []);
          } else {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to search students');
          }
        } catch (err: any) {
          console.error('Failed to search students:', err);
          setError(err.message || 'Failed to search students');
        }
      };
      const timeoutId = setTimeout(fetchStudents, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setStudents([]);
    }
  }, [searchTerm]);

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
    academicYear: '',
    reason: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  // Set default academic year when data is loaded
  useEffect(() => {
    if (academicYears.length > 0 && !formData.academicYear) {
      // Use the first academic year as default, or find the current one
      const currentYear = new Date().getFullYear();
      const currentAcademicYear = academicYears.find(ay => ay.year.includes(currentYear.toString())) || academicYears[0];
      setFormData(prev => ({ ...prev, academicYear: currentAcademicYear.year }));
    }
  }, [academicYears, formData.academicYear]);

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
        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-semibold">Scope & Targeting</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reason <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g., Financial hardship, merit scholarship, sibling discount..."
                className={inputCls}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              {formData.name.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Reason is required</p>
              )}
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

            {formData.scope === 'student' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Select Student <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Search student by name or admission number (min 2 chars)..."
                  className={inputCls}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {students.length > 0 && (
                  <div className={`max-h-48 overflow-y-auto rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    {students.map((student: any) => (
                      <div
                        key={student.id}
                        className={`p-3 cursor-pointer border-b last:border-0 flex justify-between items-center transition-colors ${
                          formData.studentIds.includes(student.id)
                            ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50')
                            : (isDark ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-100')
                        }`}
                        onClick={() => {
                          if (formData.studentIds.includes(student.id)) {
                            setFormData({...formData, studentIds: formData.studentIds.filter(id => id !== student.id)});
                          } else {
                            setFormData({...formData, studentIds: [...formData.studentIds, student.id]});
                          }
                        }}
                      >
                        <div>
                          <div className="font-medium text-sm">{student.name}</div>
                          <div className="text-xs text-gray-500">
                            Class: {student.class?.name || student.class} | Adm No: {student.admissionNo}
                          </div>
                        </div>
                        {formData.studentIds.includes(student.id) && (
                          <div className="text-blue-500">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.studentIds.length > 0 && (
                  <div className="text-sm text-green-600">
                    {formData.studentIds.length} student(s) selected
                  </div>
                )}
              </div>
            )}
            
            {formData.scope === 'class' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Select Classes <span className="text-red-500">*</span></label>
                  <div className={`max-h-48 overflow-y-auto p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    {classes.map((cls: any) => (
                      <label key={cls.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.classIds.includes(cls.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...formData.classIds, cls.id]
                              : formData.classIds.filter(id => id !== cls.id);
                            setFormData({...formData, classIds: newIds});
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{cls.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({cls.medium?.name || 'No Medium'})
                          </span>
                          <div className="text-xs text-gray-400">
                            Code: {cls.code} | Level: {cls.level}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Select Sections (Optional)</label>
                  <div className={`max-h-48 overflow-y-auto p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sectionIds.length === 0}
                        onChange={(e) => {
                          setFormData({...formData, sectionIds: []});
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">All Sections</span>
                    </label>
                    {sections.map((section: any) => (
                      <label key={section.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sectionIds.includes(section.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...formData.sectionIds, section.id]
                              : formData.sectionIds.filter(id => id !== section.id);
                            setFormData({...formData, sectionIds: newIds});
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">{section.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {(formData.classIds.length > 0 || formData.sectionIds.length > 0) && (
                  <div className="text-sm text-green-600">
                    {formData.classIds.length} class(es) and {formData.sectionIds.length} section(s) selected
                  </div>
                )}
              </div>
            )}
            
            {formData.scope === 'bulk' && (
              <div className="space-y-4">
                <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Bulk application will apply to all students in the school. 
                    You can search below to see which students will be affected.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Search Students (Preview)</label>
                  <input
                    type="text"
                    placeholder="Search by name, admission no, email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                  />
                  
                  {searchTerm.length >= 2 && (
                    <div className={`max-h-48 overflow-y-auto p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                      <p className="text-xs text-gray-500 mb-2">
                        Showing {students.length} students (this is a preview - bulk discount will apply to ALL students)
                      </p>
                      {students.length > 0 ? (
                        <>
                          {students.slice(0, 10).map((student) => (
                            <div key={student.id} className="p-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                              <div className="font-medium text-sm">{student.name}</div>
                              <div className="text-xs text-gray-500">
                                Class: {student.class?.name || student.class} | Adm No: {student.admissionNo}
                              </div>
                            </div>
                          ))}
                          {students.length > 10 && (
                            <p className="text-xs text-gray-500 p-2 text-center">
                              ... and {students.length - 10} more students
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 p-2 text-center">
                          No students found matching "{searchTerm}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
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
              
              {formData.targetType === 'fee_structure' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Select Fee Structures <span className="text-red-500">*</span></label>
                  <div className={`max-h-48 overflow-y-auto p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    {feeStructures.length > 0 ? feeStructures.map((fs: any) => (
                      <label key={fs.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.feeStructureIds.includes(fs.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...formData.feeStructureIds, fs.id]
                              : formData.feeStructureIds.filter(id => id !== fs.id);
                            setFormData({...formData, feeStructureIds: newIds});
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">
                          {fs.name} <span className="text-gray-500 text-xs">({fs.category}) - ₹{fs.amount}</span>
                        </span>
                      </label>
                    )) : (
                      <div className="text-center p-4 text-gray-500 text-sm">No fee structures available</div>
                    )}
                  </div>
                </div>
              )}
            

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
            onClick={() => {
              // Validate step 1 before proceeding
              if (step === 1) {
                if (!formData.name.trim()) {
                  setError('Reason is required');
                  return;
                }
                if (!formData.academicYear) {
                  setError('Academic year is required');
                  return;
                }
                if (!formData.scope) {
                  setError('Scope selection is required');
                  return;
                }
                if (formData.scope === 'student' && formData.studentIds.length === 0) {
                  setError('Please select at least one student');
                  return;
                }
                if (formData.scope === 'class' && formData.classIds.length === 0) {
                  setError('Please select at least one class');
                  return;
                }
                setError('');
              }
              // Validate step 2 before proceeding
              if (step === 2) {
                if (!formData.targetType) {
                  setError('Target type selection is required');
                  return;
                }
                if (formData.targetType === 'fee_structure' && formData.feeStructureIds.length === 0) {
                  setError('Please select at least one fee structure');
                  return;
                }
                if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
                  setError('Discount value must be greater than 0');
                  return;
                }
                if (!formData.validFrom || !formData.validTo) {
                  setError('Validity dates are required');
                  return;
                }
                setError('');
              }
              setStep(step + 1);
            }}
            disabled={step === 1 && (!formData.name.trim() || !formData.academicYear || !formData.scope)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
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
