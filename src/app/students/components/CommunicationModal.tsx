// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface CommunicationModalProps {
  calculateEstimatedCost: any; communicationCenter: any; getFilteredTemplates: any; getRecipientCount: any; handleSendMessage: any; selectTemplate: any; setCommunicationCenter: any; students: any; theme: any;
}

export default function CommunicationModal({ calculateEstimatedCost, communicationCenter, getFilteredTemplates, getRecipientCount, handleSendMessage, selectTemplate, setCommunicationCenter, students, theme }: CommunicationModalProps) {
  return (
    <>
      {/* Communication Center Modal */}
      <AnimatePresence>
        {communicationCenter.showCommunicationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={() => setCommunicationCenter(prev => ({ ...prev, showCommunicationModal: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      💬 Communication Center
                    </h3>
                    <button
                      onClick={() => setCommunicationCenter(prev => ({ ...prev, showCommunicationModal: false }))}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {/* Message Type Selection */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCommunicationCenter(prev => ({ ...prev, messageType: 'sms' }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        communicationCenter.messageType === 'sms'
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      📱 SMS
                    </button>
                    <button
                      onClick={() => setCommunicationCenter(prev => ({ ...prev, messageType: 'email' }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        communicationCenter.messageType === 'email'
                          ? 'bg-green-600 text-white'
                          : theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      📧 Email
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                      {/* Left Column - Compose Message */}
                      <div className="space-y-4">
                        {/* Recipients */}
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Recipients ({getRecipientCount()} selected)
                          </label>
                          <div className={`p-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className={`text-sm ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {getRecipientCount() > 0 
                                ? `${getRecipientCount()} students selected`
                                : 'Please select students from the table'
                              }
                            </div>
                          </div>
                        </div>

                        {/* Template Selection */}
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Message Template
                          </label>
                          <select
                            value={communicationCenter.selectedTemplate}
                            onChange={(e) => selectTemplate(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select a template...</option>
                            {getFilteredTemplates().map(template => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Subject (for Email) */}
                        {communicationCenter.messageType === 'email' && (
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              Subject
                            </label>
                            <input
                              type="text"
                              value={communicationCenter.subject}
                              onChange={(e) => setCommunicationCenter(prev => ({ ...prev, subject: e.target.value }))}
                              placeholder="Enter email subject..."
                              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                            />
                          </div>
                        )}

                        {/* Message Content */}
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Message Content
                            {communicationCenter.messageType === 'sms' && (
                              <span className={`ml-2 text-xs ${
                                communicationCenter.messageContent.length > 160
                                  ? 'text-red-500'
                                  : 'text-gray-500'
                              }`}>
                                ({communicationCenter.messageContent.length}/160)
                              </span>
                            )}
                          </label>
                          <textarea
                            value={communicationCenter.messageContent}
                            onChange={(e) => setCommunicationCenter(prev => ({ ...prev, messageContent: e.target.value }))}
                            placeholder={
                              communicationCenter.messageType === 'sms'
                                ? 'Enter SMS message...'
                                : 'Enter email content...'
                            }
                            rows={8}
                            className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                        </div>

                        {/* Available Variables */}
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Available Variables
                          </label>
                          <div className={`p-3 rounded-lg border text-xs ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700 text-gray-300'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}>
                            <div className="grid grid-cols-2 gap-1">
                              <span>{'{student_name}'}</span>
                              <span>{'{student_class}'}</span>
                              <span>{'{parent_name}'}</span>
                              <span>{'{parent_phone}'}</span>
                              <span>{'{attendance_percentage}'}</span>
                              <span>{'{gpa}'}</span>
                              <span>{'{fee_amount}'}</span>
                              <span>{'{due_date}'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Send Button */}
                        <button
                          onClick={handleSendMessage}
                          disabled={communicationCenter.sendStatus === 'sending'}
                          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                            communicationCenter.sendStatus === 'sending'
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : communicationCenter.messageType === 'sms'
                                ? theme === 'dark'
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                                : theme === 'dark'
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {communicationCenter.sendStatus === 'sending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Sending...
                            </div>
                          ) : (
                            `Send ${communicationCenter.messageType === 'sms' ? 'SMS' : 'Email'}`
                          )}
                        </button>

                        {/* Send Progress */}
                        {communicationCenter.sendStatus === 'sending' && (
                          <div className={`p-3 rounded-lg border ${
                            theme === 'dark' ? 'bg-blue-900/50 border-blue-800' : 'bg-blue-50 border-blue-200'
                          }`}>
                            <div className={`flex items-center justify-between mb-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              <span className="text-sm">Sending messages...</span>
                              <span className="text-sm">{communicationCenter.sendProgress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${communicationCenter.sendProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Send Results */}
                        {communicationCenter.sendStatus !== 'idle' && communicationCenter.sendStatus !== 'sending' && (
                          <div className={`p-3 rounded-lg border ${
                            communicationCenter.sendStatus === 'success'
                              ? theme === 'dark' ? 'bg-green-900/50 border-green-800' : 'bg-green-50 border-green-200'
                              : theme === 'dark' ? 'bg-red-900/50 border-red-800' : 'bg-red-50 border-red-200'
                          }`}>
                            <h4 className={`font-medium mb-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {communicationCenter.sendStatus === 'success' ? '✅ Messages Sent' : '❌ Sending Failed'}
                            </h4>
                            
                            {communicationCenter.sendErrors.length > 0 && (
                              <div className={`text-sm ${
                                theme === 'dark' ? 'text-red-400' : 'text-red-600'
                              }`}>
                                <div className="font-medium mb-1">Errors:</div>
                                <ul className="space-y-1">
                                  {communicationCenter.sendErrors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Column - Templates & History */}
                      <div className="space-y-4">
                        {/* Template Categories */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Template Categories
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {communicationCenter.templateCategories.map(category => (
                              <div
                                key={category.id}
                                className={`p-2 rounded-lg border text-center ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-gray-300'
                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className="text-lg">{category.icon}</span>
                                <div className="text-xs">{category.name}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cost Estimation */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Cost Estimation
                          </h4>
                          <div className={`p-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className={`text-sm space-y-1 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <div>Recipients: {getRecipientCount()}</div>
                              <div>Provider: {communicationCenter.deliveryProviders[communicationCenter.messageType][0].name}</div>
                              <div>Rate: ₹{communicationCenter.deliveryProviders[communicationCenter.messageType][0].rate}/message</div>
                              <div className={`font-bold pt-2 border-t ${
                                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                              }`}>
                                Total Cost: ₹{calculateEstimatedCost().toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recent Messages */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Recent Messages
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {communicationCenter.messageHistory.slice(0, 5).map(message => (
                              <div
                                key={message.id}
                                className={`p-3 rounded-lg border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs font-medium ${
                                    message.type === 'sms'
                                      ? 'text-blue-500'
                                      : 'text-green-500'
                                  }`}>
                                    {message.type.toUpperCase()}
                                  </span>
                                  <span className={`text-xs ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {new Date(message.sentAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className={`text-xs mb-1 ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {message.subject || message.content.substring(0, 50) + '...'}
                                </div>
                                <div className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {message.deliveryStats.delivered}/{message.deliveryStats.total} delivered
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
