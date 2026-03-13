// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface StudentWorkflowsProps {
  theme: 'dark' | 'light';
  studentData: any;
  onClose?: () => void;
}

export default function StudentWorkflows({ theme, studentData, onClose }: StudentWorkflowsProps) {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState<any>({});

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  const workflows = [
    {
      id: 'fee-assessment',
      title: 'Fee Assessment',
      icon: '📊',
      description: 'Calculate and assess student fees with discounts and concessions',
      color: 'blue'
    },
    {
      id: 'payment-processing',
      title: 'Payment Processing',
      icon: '💳',
      description: 'Process fee payments with multiple payment methods',
      color: 'green'
    },
    {
      id: 'collection-drive',
      title: 'Fee Collection Drive',
      icon: '📢',
      description: 'Organize and manage fee collection campaigns',
      color: 'purple'
    },
    {
      id: 'refund-processing',
      title: 'Fee Refund Processing',
      icon: '💰',
      description: 'Process fee refunds with proper approvals',
      color: 'orange'
    }
  ];

  const renderWorkflowContent = () => {
    switch (activeWorkflow) {
      case 'fee-assessment':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Academic Year</label>
                <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                  <option>2024-25</option>
                  <option>2023-24</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Fee Category</label>
                <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                  <option>Regular</option>
                  <option>Hosteller</option>
                  <option>Day Scholar</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Fee Components</h4>
              {[
                { name: 'Tuition Fee', amount: 50000, applicable: true },
                { name: 'Transport Fee', amount: 12000, applicable: false },
                { name: 'Lab Fee', amount: 8000, applicable: true },
                { name: 'Library Fee', amount: 3000, applicable: true },
                { name: 'Sports Fee', amount: 4000, applicable: true }
              ].map((fee, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={fee.applicable} className="rounded" />
                    <span className={textPrimary}>{fee.name}</span>
                  </div>
                  <span className={`font-medium ${textPrimary}`}>₹{fee.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Discounts & Concessions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Scholarship</label>
                  <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                    <option>None</option>
                    <option>Merit (10%)</option>
                    <option>Merit (25%)</option>
                    <option>EWS (50%)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Sibling Discount</label>
                  <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                    <option>None</option>
                    <option>10%</option>
                    <option>15%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={textPrimary}>Total Fees:</span>
                <span className={`text-lg font-bold ${textPrimary}`}>₹75,000</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className={textPrimary}>Discounts:</span>
                <span className={`text-lg font-bold text-green-500`}>-₹12,500</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className={`font-medium ${textPrimary}`}>Net Payable:</span>
                <span className={`text-xl font-bold text-blue-500`}>₹62,500</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className={`px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white`}>
                Generate Fee Bill
              </button>
              <button className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary}`}>
                Save Assessment
              </button>
            </div>
          </div>
        );

      case 'payment-processing':
        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`font-medium ${textPrimary}`}>Payment Details</h4>
                <span className={`text-lg font-bold text-blue-500`}>₹62,500</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Payment Method</label>
                  <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>Bank Transfer</option>
                    <option>UPI</option>
                    <option>Credit/Debit Card</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Installment</label>
                  <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                    <option>Full Payment</option>
                    <option>1st Installment</option>
                    <option>2nd Installment</option>
                    <option>3rd Installment</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Payment Information</h4>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Transaction Reference</label>
                <input type="text" placeholder="Enter transaction ID" className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Payment Date</label>
                <input type="date" className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Remarks</label>
                <textarea placeholder="Additional notes..." rows={3} className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
              <h4 className={`font-medium mb-3 ${isDark ? 'text-green-300' : 'text-green-700'}`}>Receipt Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={textSecondary}>Receipt No:</span>
                  <span className={textPrimary}>REC-2024-0456</span>
                </div>
                <div className="flex justify-between">
                  <span className={textSecondary}>Student:</span>
                  <span className={textPrimary}>{studentData?.name || 'Student Name'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textSecondary}>Amount:</span>
                  <span className={`font-medium ${textPrimary}`}>₹62,500</span>
                </div>
                <div className="flex justify-between">
                  <span className={textSecondary}>Method:</span>
                  <span className={textPrimary}>Bank Transfer</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className={`px-4 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white`}>
                Process Payment
              </button>
              <button className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary}`}>
                Print Receipt
              </button>
            </div>
          </div>
        );

      case 'collection-drive':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Collection Campaign Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Campaign Name</label>
                  <input type="text" placeholder="e.g., Q1 Fee Collection 2024" className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Target Date</label>
                  <input type="date" className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Communication Methods</h4>
              <div className="space-y-2">
                {['SMS Reminder', 'Email Notice', 'Phone Call', 'Parent Meeting', 'WhatsApp Message'].map((method, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className={textPrimary}>{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Follow-up Schedule</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <span className={textPrimary}>1st Reminder:</span>
                  <input type="date" className={`flex-1 px-3 py-2 rounded-lg border ${inputCls}`} />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <span className={textPrimary}>2nd Reminder:</span>
                  <input type="date" className={`flex-1 px-3 py-2 rounded-lg border ${inputCls}`} />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <span className={textPrimary}>Final Notice:</span>
                  <input type="date" className={`flex-1 px-3 py-2 rounded-lg border ${inputCls}`} />
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
              <h4 className={`font-medium mb-3 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Message Template</h4>
              <textarea 
                placeholder="Dear Parent, This is a reminder regarding the pending fee payment for your ward. Please arrange for the payment at the earliest..." 
                rows={4} 
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} 
              />
            </div>

            <div className="flex gap-3">
              <button className={`px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white`}>
                Start Campaign
              </button>
              <button className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary}`}>
                Schedule Later
              </button>
            </div>
          </div>
        );

      case 'refund-processing':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Refund Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Refund Type</label>
                  <select className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}>
                    <option>Fee Withdrawal</option>
                    <option>Excess Payment</option>
                    <option>Scholarship Adjustment</option>
                    <option>Transfer Refund</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Refund Amount</label>
                  <input type="number" placeholder="0.00" className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Refund Reason</h4>
              <textarea 
                placeholder="Please provide detailed reason for refund..." 
                rows={4} 
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} 
              />
            </div>

            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Supporting Documents</h4>
              <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${textSecondary}`}>📎</div>
                  <p className={`text-sm ${textSecondary}`}>Click to upload or drag and drop</p>
                  <p className={`text-xs ${textSecondary}`}>PDF, DOC, DOCX (MAX. 5MB)</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className={`font-medium ${textPrimary}`}>Refund Method</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Bank Account</label>
                  <input type="text" placeholder="Account Number" className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>IFSC Code</label>
                  <input type="text" placeholder="IFSC Code" className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>Account Holder Name</label>
                <input type="text" placeholder="Name as per bank records" className={`w-full px-3 py-2 rounded-lg border ${inputCls}`} />
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
              <h4 className={`font-medium mb-3 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Approval Workflow</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-orange-600' : 'bg-orange-500'} text-white flex items-center justify-center text-sm`}>1</div>
                  <span className={textPrimary}>Principal Approval</span>
                  <span className={`text-xs ${textSecondary}`}>Pending</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'} text-white flex items-center justify-center text-sm`}>2</div>
                  <span className={textPrimary}>Accounts Verification</span>
                  <span className={`text-xs ${textSecondary}`}>Waiting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'} text-white flex items-center justify-center text-sm`}>3</div>
                  <span className={textPrimary}>Finance Sanction</span>
                  <span className={`text-xs ${textSecondary}`}>Waiting</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className={`px-4 py-2 rounded-lg font-medium bg-orange-600 hover:bg-orange-700 text-white`}>
                Submit Refund Request
              </button>
              <button className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary}`}>
                Save Draft
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`rounded-xl border p-6 ${cardCls}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Student Workflows</h2>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            ✕
          </button>
        )}
      </div>

      {!activeWorkflow ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((workflow) => (
            <motion.div
              key={workflow.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveWorkflow(workflow.id)}
              className={`p-6 rounded-xl border cursor-pointer transition-all ${
                isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={`text-3xl`}>{workflow.icon}</div>
                <div>
                  <h3 className={`font-semibold ${textPrimary}`}>{workflow.title}</h3>
                  <p className={`text-sm ${textSecondary}`}>{workflow.description}</p>
                </div>
              </div>
              <div className={`text-sm font-medium text-${workflow.color}-500`}>
                Click to start →
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setActiveWorkflow(null)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              ← Back
            </button>
            <h3 className={`text-lg font-semibold ${textPrimary}`}>
              {workflows.find(w => w.id === activeWorkflow)?.title}
            </h3>
          </div>
          {renderWorkflowContent()}
        </div>
      )}
    </div>
  );
}
