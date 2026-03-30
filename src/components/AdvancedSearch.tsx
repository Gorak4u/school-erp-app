'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Calendar, User, FileText, Image, Video } from 'lucide-react';

interface SearchFilters {
  query: string;
  from?: string;
  dateRange?: { start: Date; end: Date };
  hasAttachments?: boolean;
  attachmentType?: 'image' | 'video' | 'document' | 'audio';
  inConversation?: string;
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
  conversations?: Array<{ id: string; title: string }>;
  users?: Array<{ id: string; name: string }>;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  isOpen,
  onClose,
  onSearch,
  conversations = [],
  users = [],
}) => {
  const [query, setQuery] = useState('');
  const [selectedFrom, setSelectedFrom] = useState('');
  const [hasAttachments, setHasAttachments] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'image' | 'video' | 'document' | 'audio' | ''>('');
  const [selectedConversation, setSelectedConversation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    const filters: SearchFilters = {
      query,
      ...(selectedFrom && { from: selectedFrom }),
      ...(hasAttachments && { hasAttachments: true }),
      ...(attachmentType && { attachmentType }),
      ...(selectedConversation && { inConversation: selectedConversation }),
    };
    onSearch(filters);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedFrom('');
    setHasAttachments(false);
    setAttachmentType('');
    setSelectedConversation('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Search Messages</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search messages, files, links..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>

              {/* Toggle Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="mt-3 flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide' : 'Show'} Advanced Filters
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* From User */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        From User
                      </label>
                      <select
                        value={selectedFrom}
                        onChange={(e) => setSelectedFrom(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Any user</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* In Conversation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        In Conversation
                      </label>
                      <select
                        value={selectedConversation}
                        onChange={(e) => setSelectedConversation(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">All conversations</option>
                        {conversations.map((conv) => (
                          <option key={conv.id} value={conv.id}>
                            {conv.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={hasAttachments}
                          onChange={(e) => setHasAttachments(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Has Attachments
                        </span>
                      </label>

                      {hasAttachments && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {[
                            { value: 'image', icon: Image, label: 'Images' },
                            { value: 'video', icon: Video, label: 'Videos' },
                            { value: 'document', icon: FileText, label: 'Docs' },
                          ].map(({ value, icon: Icon, label }) => (
                            <button
                              key={value}
                              onClick={() => setAttachmentType(attachmentType === value ? '' : value as any)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                attachmentType === value
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              <Icon className={`w-5 h-5 mx-auto mb-1 ${
                                attachmentType === value ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                              }`} />
                              <span className={`text-xs ${
                                attachmentType === value ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="p-6 flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                Clear All Filters
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
