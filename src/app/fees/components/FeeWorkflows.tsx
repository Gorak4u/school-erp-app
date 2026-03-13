// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  fields?: Array<{ label: string; type: string; placeholder?: string; options?: string[] }>;
}

interface Workflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  steps: WorkflowStep[];
}

interface FeeWorkflowsProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
}

export default function FeeWorkflows({ theme, onClose }: FeeWorkflowsProps) {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  const workflows: Workflow[] = [
    {
      id: 'fee-assessment',
      title: 'Fee Assessment',
      description: 'Calculate and assign fees for students based on class and plan',
      icon: '📋',
      color: 'blue',
      steps: [
        { id: 1, title: 'Select Students', description: 'Choose students for fee assessment', fields: [
          { label: 'Academic Year', type: 'select', options: ['2025-26', '2026-27'] },
          { label: 'Class', type: 'select', options: ['All Classes', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
          { label: 'Section', type: 'select', options: ['All Sections', 'A', 'B', 'C', 'D'] },
          { label: 'Student Type', type: 'select', options: ['All', 'New Admissions', 'Existing Students'] },
        ]},
        { id: 2, title: 'Fee Structure', description: 'Configure fee components and amounts', fields: [
          { label: 'Fee Template', type: 'select', options: ['Standard', 'Scholarship', 'Staff Ward', 'Custom'] },
          { label: 'Tuition Fee', type: 'text', placeholder: 'Enter amount' },
          { label: 'Transport Fee', type: 'text', placeholder: 'Enter amount' },
          { label: 'Lab Fee', type: 'text', placeholder: 'Enter amount' },
          { label: 'Activity Fee', type: 'text', placeholder: 'Enter amount' },
          { label: 'Library Fee', type: 'text', placeholder: 'Enter amount' },
        ]},
        { id: 3, title: 'Payment Plan', description: 'Set payment schedule and terms', fields: [
          { label: 'Payment Plan', type: 'select', options: ['Annual', 'Semester', 'Quarterly', 'Monthly'] },
          { label: 'Late Fee Policy', type: 'select', options: ['Rs.50/day', 'Rs.100/day', '2% per month', 'No late fee'] },
          { label: 'Early Payment Discount', type: 'select', options: ['None', '2%', '5%', '10%'] },
          { label: 'First Due Date', type: 'date' },
        ]},
        { id: 4, title: 'Review & Apply', description: 'Review fee assessment and apply to students' },
        { id: 5, title: 'Generate Invoices', description: 'Auto-generate invoices and send notifications' },
      ]
    },
    {
      id: 'payment-processing',
      title: 'Payment Processing',
      description: 'Process individual or bulk fee payments',
      icon: '💳',
      color: 'green',
      steps: [
        { id: 1, title: 'Select Student', description: 'Find student for payment', fields: [
          { label: 'Student Name / ID', type: 'text', placeholder: 'Search student...' },
          { label: 'Class', type: 'select', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
        ]},
        { id: 2, title: 'Payment Details', description: 'Enter payment information', fields: [
          { label: 'Fee Component', type: 'select', options: ['Full Payment', 'Tuition Fee', 'Transport Fee', 'Lab Fee', 'Partial Payment'] },
          { label: 'Amount', type: 'text', placeholder: 'Enter amount' },
          { label: 'Payment Method', type: 'select', options: ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Credit Card', 'Online Payment'] },
          { label: 'Reference Number', type: 'text', placeholder: 'Transaction/Cheque number' },
          { label: 'Payment Date', type: 'date' },
        ]},
        { id: 3, title: 'Verify & Process', description: 'Verify payment details and process' },
        { id: 4, title: 'Receipt & Notification', description: 'Generate receipt and notify parent' },
      ]
    },
    {
      id: 'collection-workflow',
      title: 'Fee Collection Drive',
      description: 'Manage collection campaigns for pending and overdue fees',
      icon: '📢',
      color: 'orange',
      steps: [
        { id: 1, title: 'Define Scope', description: 'Select target group for collection', fields: [
          { label: 'Target Group', type: 'select', options: ['All Pending', 'Overdue > 30 days', 'Overdue > 60 days', 'Specific Class'] },
          { label: 'Class Filter', type: 'select', options: ['All Classes', '1-5', '6-8', '9-10', '11-12'] },
          { label: 'Amount Range', type: 'select', options: ['All', 'Above Rs.10,000', 'Above Rs.25,000', 'Above Rs.50,000'] },
        ]},
        { id: 2, title: 'Communication Plan', description: 'Set up reminder schedule', fields: [
          { label: 'Channel', type: 'select', options: ['Email + SMS', 'Email Only', 'SMS Only', 'WhatsApp', 'All Channels'] },
          { label: 'First Reminder', type: 'date' },
          { label: 'Follow-up Interval', type: 'select', options: ['3 days', '5 days', '7 days', '14 days'] },
          { label: 'Escalation After', type: 'select', options: ['2 reminders', '3 reminders', '5 reminders'] },
        ]},
        { id: 3, title: 'Incentives', description: 'Configure payment incentives', fields: [
          { label: 'Offer Discount', type: 'select', options: ['No', 'Waive Late Fee', '5% Discount', '10% Discount'] },
          { label: 'Payment Plan Option', type: 'select', options: ['No', 'Allow Installments', 'Extended Deadline'] },
          { label: 'Valid Until', type: 'date' },
        ]},
        { id: 4, title: 'Launch & Track', description: 'Launch campaign and monitor progress' },
      ]
    },
    {
      id: 'refund-workflow',
      title: 'Fee Refund Processing',
      description: 'Process fee refunds for transfers, withdrawals, or overpayments',
      icon: '↩️',
      color: 'purple',
      steps: [
        { id: 1, title: 'Refund Request', description: 'Initiate refund request', fields: [
          { label: 'Student Name / ID', type: 'text', placeholder: 'Search student...' },
          { label: 'Refund Reason', type: 'select', options: ['Student Transfer', 'Student Withdrawal', 'Overpayment', 'Fee Restructure', 'Other'] },
          { label: 'Refund Amount', type: 'text', placeholder: 'Enter amount' },
          { label: 'Supporting Documents', type: 'file' },
        ]},
        { id: 2, title: 'Verification', description: 'Verify payment records and calculate refund', fields: [
          { label: 'Deductions', type: 'select', options: ['None', 'Processing Fee (2%)', 'Admin Charge (5%)', 'Custom'] },
          { label: 'Net Refund', type: 'text', placeholder: 'Calculated automatically' },
        ]},
        { id: 3, title: 'Approval', description: 'Submit for management approval' },
        { id: 4, title: 'Process Refund', description: 'Process refund to parent account', fields: [
          { label: 'Refund Method', type: 'select', options: ['Bank Transfer', 'Cheque', 'Original Payment Method'] },
          { label: 'Account Details', type: 'text', placeholder: 'Enter bank account details' },
        ]},
        { id: 5, title: 'Confirmation', description: 'Send refund confirmation to parent' },
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const map: Record<string, string> = {
      blue: isDark ? 'bg-blue-600/20 text-blue-400 border-blue-700' : 'bg-blue-50 text-blue-600 border-blue-200',
      green: isDark ? 'bg-green-600/20 text-green-400 border-green-700' : 'bg-green-50 text-green-600 border-green-200',
      orange: isDark ? 'bg-orange-600/20 text-orange-400 border-orange-700' : 'bg-orange-50 text-orange-600 border-orange-200',
      purple: isDark ? 'bg-purple-600/20 text-purple-400 border-purple-700' : 'bg-purple-50 text-purple-600 border-purple-200'
    };
    return map[color] || map.blue;
  };

  const activeWf = workflows.find(w => w.id === activeWorkflow);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Financial Workflows</h2>
        {onClose && (
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Close
          </button>
        )}
      </div>

      {!activeWorkflow ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows.map((wf, index) => (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-xl border cursor-pointer hover:shadow-lg transition-all ${cardCls}`}
              onClick={() => { setActiveWorkflow(wf.id); setCurrentStep(0); }}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getColorClasses(wf.color)}`}>{wf.icon}</div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>{wf.title}</h3>
                  <p className={`text-sm mt-1 ${textSecondary}`}>{wf.description}</p>
                  <div className="flex items-center mt-3 space-x-2">
                    <span className={`text-xs ${textSecondary}`}>{wf.steps.length} steps</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getColorClasses(wf.color)}`}>Start</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : activeWf && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => setActiveWorkflow(null)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${getColorClasses(activeWf.color)}`}>{activeWf.icon}</div>
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary}`}>{activeWf.title}</h3>
              <p className={`text-sm ${textSecondary}`}>Step {currentStep + 1} of {activeWf.steps.length}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center space-x-2">
            {activeWf.steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer ${
                    idx < currentStep ? 'bg-green-500 text-white'
                    : idx === currentStep ? 'bg-blue-500 text-white'
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}
                  onClick={() => setCurrentStep(idx)}
                >
                  {idx < currentStep ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : idx + 1}
                </div>
                {idx < activeWf.steps.length - 1 && (
                  <div className={`flex-1 h-1 rounded ${idx < currentStep ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={`p-6 rounded-xl border ${cardCls}`}>
              <h4 className={`text-lg font-semibold ${textPrimary}`}>{activeWf.steps[currentStep].title}</h4>
              <p className={`text-sm mt-1 mb-6 ${textSecondary}`}>{activeWf.steps[currentStep].description}</p>

              {activeWf.steps[currentStep].fields ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeWf.steps[currentStep].fields.map((field, fi) => (
                    <div key={fi}>
                      <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>{field.label}</label>
                      {field.type === 'select' ? (
                        <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                          <option value="">Select...</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : field.type === 'file' ? (
                        <div className={`w-full px-3 py-4 rounded-lg border-2 border-dashed text-center text-sm cursor-pointer ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                          Click to upload
                        </div>
                      ) : (
                        <input type={field.type} placeholder={field.placeholder} className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${textSecondary}`}>
                  <div className="text-4xl mb-3">{currentStep === activeWf.steps.length - 1 ? '✅' : '⏳'}</div>
                  <p className="text-sm">{currentStep === activeWf.steps.length - 1 ? 'Review and complete the workflow' : 'This step will be processed automatically'}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${currentStep === 0 ? isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            <div className="flex items-center space-x-2">
              <button className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Save Draft</button>
              {currentStep < activeWf.steps.length - 1 ? (
                <button onClick={() => setCurrentStep(currentStep + 1)} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Next Step</button>
              ) : (
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700">Complete</button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
