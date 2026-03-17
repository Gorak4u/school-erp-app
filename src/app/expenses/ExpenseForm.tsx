// @ts-nocheck
'use client';
import { fmt, PAYMENT_METHODS } from './utils';

interface Props {
  form: any;
  setForm: (f: any) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  editing: boolean;
  categories: any[];
  budgets: any[];
  isDark: boolean;
  academicYears: any[];
}

export default function ExpenseForm({ form, setForm, onSave, onClose, saving, editing, categories, budgets, isDark, academicYears = [] }: Props) {
  const inp = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700' : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'}`;
  const lbl = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`;
  const card = `rounded-xl border p-6 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`;
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF or image file (JPG, PNG, WEBP)');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Store file for upload
      setForm({ ...form, receiptFile: file, receiptFileName: file.name });
    }
  };

  const removeFile = () => {
    setForm({ ...form, receiptFile: null, receiptFileName: '' });
    // Clear the file input
    const fileInput = document.getElementById('receipt-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`px-8 py-6 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${text}`}>{editing ? '✏️ Edit Expense' : '+ New Expense'}</h2>
              <p className={`text-sm ${subText} mt-1`}>{editing ? 'Update the expense details' : 'Enter the expense information below'}</p>
            </div>
            <button onClick={onClose} className={`p-3 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div className={card}>
                <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
                  <span className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">📝</span>
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Title *</label>
                    <input className={inp} placeholder="e.g. Science Lab Equipment Purchase" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>

                  <div>
                    <label className={lbl}>Amount (₹) *</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium ${subText}`}>₹</span>
                      <input type="number" min="0" step="0.01" className={`${inp} pl-10`} placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Date Incurred *</label>
                    <input type="date" className={inp} value={form.dateIncurred} onChange={e => setForm({ ...form, dateIncurred: e.target.value })} />
                  </div>

                  <div>
                    <label className={lbl}>Academic Year *</label>
                    <select className={inp} value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })}>
                      <option value="">Select Academic Year</option>
                      {academicYears.map(ay => (
                        <option key={ay.id} value={ay.year}>{ay.name || ay.year} {ay.isActive && '(Active)'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={card}>
                <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
                  <span className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">🏷️</span>
                  Classification
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Category *</label>
                    <select className={inp} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                      <option value="">— Select Category —</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map(priority => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => setForm({ ...form, priority })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            form.priority === priority
                              ? priority === 'high' ? 'bg-red-500 text-white' : priority === 'medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                              : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Details */}
            <div className="space-y-6">
              <div className={card}>
                <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
                  <span className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">💳</span>
                  Payment & Vendor
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Payment Method</label>
                    <select className={inp} value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                      <option value="">— Select Method —</option>
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Vendor Name</label>
                    <input className={inp} placeholder="Supplier / vendor name" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} />
                  </div>

                  <div>
                    <label className={lbl}>Link to Budget</label>
                    <select className={inp} value={form.budgetId} onChange={e => setForm({ ...form, budgetId: e.target.value })}>
                      <option value="">No budget</option>
                      {budgets.filter(b => b.status === 'active').map(b => (
                        <option key={b.id} value={b.id}>{b.name} · {fmt(b.remainingAmount)} remaining</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={card}>
                <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
                  <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">📄</span>
                  Additional Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Description</label>
                    <textarea rows={3} className={`${inp} resize-none`} placeholder="Provide detailed description of this expense..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div>
                    <label className={lbl}>Internal Remarks</label>
                    <textarea rows={2} className={`${inp} resize-none`} placeholder="Internal notes for reference..." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
                  </div>

                  <div>
                    <label className={lbl}>Bill/Receipt Attachment</label>
                    <div className="space-y-3">
                      {!form.receiptFile ? (
                        <div className="relative">
                          <input
                            id="receipt-file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                            isDark 
                              ? 'border-gray-600 hover:border-gray-500 bg-gray-700/30' 
                              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                          }`}>
                            <div className="flex flex-col items-center gap-2">
                              <svg className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div>
                                <p className={`text-sm font-medium ${text}`}>Click to upload bill/receipt</p>
                                <p className={`text-xs ${subText}`}>PDF, JPG, PNG or WEBP (max 5MB)</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center justify-between p-4 rounded-xl border ${
                          isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              form.receiptFile.type === 'application/pdf' 
                                ? 'bg-red-500/10 text-red-500' 
                                : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {form.receiptFile.type === 'application/pdf' ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${text}`}>{form.receiptFileName}</p>
                              <p className={`text-xs ${subText}`}>{(form.receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-8 py-6 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${subText}`}>
              {form.amount && form.title && (
                <span>Estimated expense: <strong className={text}>₹{Number(form.amount).toLocaleString('en-IN')}</strong> for {form.title}</span>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} disabled={saving} className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                Cancel
              </button>
              <button onClick={onSave} disabled={saving || !form.title || !form.amount || !form.categoryId || !form.academicYear} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all transform hover:scale-105 disabled:scale-100">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {editing ? 'Updating...' : 'Creating...'}
                  </span>
                ) : editing ? 'Update Expense' : 'Create Expense'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
