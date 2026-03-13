// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
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

interface StudentWorkflowsProps {
  theme: 'dark' | 'light';
  onClose: () => void;
}

export default function StudentWorkflows({ theme, onClose }: StudentWorkflowsProps) {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  const workflows: Workflow[] = [
    {
      id: 'enrollment',
      title: 'New Student Enrollment',
      description: 'Complete enrollment process for new students',
      icon: '🎓',
      color: 'blue',
      steps: [
        {
          id: 1, title: 'Application Form', description: 'Fill in student and parent details', status: 'active',
          fields: [
            { label: 'Student Name', type: 'text', placeholder: 'Enter full name' },
            { label: 'Date of Birth', type: 'date' },
            { label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
            { label: 'Grade Applying For', type: 'select', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
            { label: 'Parent Name', type: 'text', placeholder: 'Enter parent/guardian name' },
            { label: 'Contact Number', type: 'text', placeholder: 'Enter phone number' },
          ]
        },
        {
          id: 2, title: 'Document Collection', description: 'Upload required documents', status: 'pending',
          fields: [
            { label: 'Birth Certificate', type: 'file' },
            { label: 'Previous School TC', type: 'file' },
            { label: 'Aadhar Card', type: 'file' },
            { label: 'Passport Photos', type: 'file' },
            { label: 'Medical Certificate', type: 'file' },
          ]
        },
        {
          id: 3, title: 'Assessment Test', description: 'Schedule and conduct entrance test', status: 'pending',
          fields: [
            { label: 'Test Date', type: 'date' },
            { label: 'Test Type', type: 'select', options: ['Written', 'Oral', 'Both'] },
            { label: 'Test Score', type: 'text', placeholder: 'Enter score (after test)' },
            { label: 'Result', type: 'select', options: ['Pass', 'Fail', 'Conditional'] },
          ]
        },
        {
          id: 4, title: 'Class Assignment', description: 'Assign class and section', status: 'pending',
          fields: [
            { label: 'Assigned Class', type: 'select', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
            { label: 'Section', type: 'select', options: ['A', 'B', 'C', 'D'] },
            { label: 'Roll Number', type: 'text', placeholder: 'Auto-generated or manual' },
            { label: 'Admission Number', type: 'text', placeholder: 'Auto-generated' },
          ]
        },
        {
          id: 5, title: 'Fee Setup & Orientation', description: 'Configure fees and conduct parent orientation', status: 'pending',
          fields: [
            { label: 'Fee Plan', type: 'select', options: ['Annual', 'Semester', 'Quarterly', 'Monthly'] },
            { label: 'Scholarship', type: 'select', options: ['None', 'Merit', 'Need-based', 'Sports'] },
            { label: 'Transport Required', type: 'select', options: ['Yes', 'No'] },
            { label: 'Orientation Date', type: 'date' },
          ]
        },
        { id: 6, title: 'System Activation', description: 'Activate student account and credentials', status: 'pending' }
      ]
    },
    {
      id: 'promotion',
      title: 'Grade Promotion',
      description: 'Promote students to next grade based on academic performance',
      icon: '📈',
      color: 'green',
      steps: [
        {
          id: 1, title: 'Academic Evaluation', description: 'Review student academic performance', status: 'active',
          fields: [
            { label: 'Academic Year', type: 'select', options: ['2025-26', '2026-27'] },
            { label: 'Current Class', type: 'select', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
            { label: 'Selection', type: 'select', options: ['All Students', 'Selected Students', 'By Section'] },
          ]
        },
        {
          id: 2, title: 'Promotion Criteria', description: 'Set promotion requirements', status: 'pending',
          fields: [
            { label: 'Min Attendance', type: 'text', placeholder: '75%' },
            { label: 'Min GPA', type: 'text', placeholder: '2.0' },
            { label: 'Max Failed Subjects', type: 'text', placeholder: '2' },
            { label: 'Auto-promote if criteria met', type: 'select', options: ['Yes', 'No'] },
          ]
        },
        { id: 3, title: 'Review & Approve', description: 'Review promotion list and approve', status: 'pending' },
        { id: 4, title: 'Notification', description: 'Send promotion notifications to parents', status: 'pending' },
        { id: 5, title: 'Record Update', description: 'Update student records and class assignments', status: 'pending' }
      ]
    },
    {
      id: 'transfer',
      title: 'Student Transfer',
      description: 'Process student transfer to another school',
      icon: '🔄',
      color: 'orange',
      steps: [
        {
          id: 1, title: 'Transfer Request', description: 'Initiate transfer process', status: 'active',
          fields: [
            { label: 'Student Name', type: 'text', placeholder: 'Search student' },
            { label: 'Reason for Transfer', type: 'select', options: ['Relocation', 'Parent Request', 'Disciplinary', 'Other'] },
            { label: 'Transfer Date', type: 'date' },
            { label: 'Destination School', type: 'text', placeholder: 'Enter school name' },
          ]
        },
        {
          id: 2, title: 'Clearance', description: 'Complete clearance from all departments', status: 'pending',
          fields: [
            { label: 'Library Clearance', type: 'select', options: ['Cleared', 'Pending'] },
            { label: 'Fee Clearance', type: 'select', options: ['Cleared', 'Pending'] },
            { label: 'Lab Clearance', type: 'select', options: ['Cleared', 'Pending'] },
            { label: 'Sports Clearance', type: 'select', options: ['Cleared', 'Pending'] },
          ]
        },
        { id: 3, title: 'TC Generation', description: 'Generate Transfer Certificate', status: 'pending' },
        { id: 4, title: 'Record Transfer', description: 'Transfer academic records', status: 'pending' },
        { id: 5, title: 'System Update', description: 'Deactivate student account', status: 'pending' }
      ]
    },
    {
      id: 'graduation',
      title: 'Student Graduation',
      description: 'Process graduating students and generate certificates',
      icon: '🎉',
      color: 'purple',
      steps: [
        {
          id: 1, title: 'Graduation Requirements', description: 'Verify all requirements are met', status: 'active',
          fields: [
            { label: 'Academic Year', type: 'select', options: ['2025-26', '2026-27'] },
            { label: 'Graduating Class', type: 'select', options: ['10', '12'] },
            { label: 'Selection', type: 'select', options: ['All Eligible', 'Selected Students'] },
          ]
        },
        { id: 2, title: 'Credit Verification', description: 'Verify all credits are earned', status: 'pending' },
        { id: 3, title: 'Final Assessment', description: 'Complete final assessments and grades', status: 'pending' },
        { id: 4, title: 'Certificate Generation', description: 'Generate graduation certificates', status: 'pending' },
        { id: 5, title: 'Alumni Registration', description: 'Register in alumni database', status: 'pending' },
        { id: 6, title: 'Record Archival', description: 'Archive student records', status: 'pending' }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const map = {
      blue: isDark ? 'bg-blue-600/20 text-blue-400 border-blue-700' : 'bg-blue-50 text-blue-600 border-blue-200',
      green: isDark ? 'bg-green-600/20 text-green-400 border-green-700' : 'bg-green-50 text-green-600 border-green-200',
      orange: isDark ? 'bg-orange-600/20 text-orange-400 border-orange-700' : 'bg-orange-50 text-orange-600 border-orange-200',
      purple: isDark ? 'bg-purple-600/20 text-purple-400 border-purple-700' : 'bg-purple-50 text-purple-600 border-purple-200'
    };
    return map[color as keyof typeof map] || map.blue;
  };

  const activeWf = workflows.find(w => w.id === activeWorkflow);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Student Workflows</h2>
        <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Close Workflows
        </button>
      </div>

      {!activeWorkflow ? (
        /* Workflow Cards */
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getColorClasses(wf.color)}`}>
                  {wf.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>{wf.title}</h3>
                  <p className={`text-sm mt-1 ${textSecondary}`}>{wf.description}</p>
                  <div className="flex items-center mt-3 space-x-2">
                    <span className={`text-xs ${textSecondary}`}>{wf.steps.length} steps</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getColorClasses(wf.color)}`}>Start Workflow</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : activeWf && (
        /* Active Workflow Wizard */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveWorkflow(null)}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${getColorClasses(activeWf.color)}`}>
              {activeWf.icon}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary}`}>{activeWf.title}</h3>
              <p className={`text-sm ${textSecondary}`}>Step {currentStep + 1} of {activeWf.steps.length}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            {activeWf.steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all ${
                    idx < currentStep
                      ? 'bg-green-500 text-white'
                      : idx === currentStep
                      ? 'bg-blue-500 text-white'
                      : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}
                  onClick={() => setCurrentStep(idx)}
                >
                  {idx < currentStep ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : idx + 1}
                </div>
                {idx < activeWf.steps.length - 1 && (
                  <div className={`flex-1 h-1 rounded ${idx < currentStep ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Current Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-6 rounded-xl border ${cardCls}`}
            >
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
                        <div className={`w-full px-3 py-4 rounded-lg border-2 border-dashed text-center text-sm cursor-pointer ${isDark ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                          Click to upload {field.label}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${textSecondary}`}>
                  <div className="text-4xl mb-3">
                    {currentStep === activeWf.steps.length - 1 ? '🎉' : '⏳'}
                  </div>
                  <p className="text-sm">
                    {currentStep === activeWf.steps.length - 1
                      ? 'Review all information and complete the workflow'
                      : 'This step will be processed automatically'}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStep === 0
                  ? isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center space-x-2">
              <button className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Save Draft
              </button>
              {currentStep < activeWf.steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Next Step
                </button>
              ) : (
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700">
                  Complete Workflow
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
