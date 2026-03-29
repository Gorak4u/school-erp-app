'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { MessengerMembersModal } from '@/components/MessengerMembersModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppConfig } from '@/contexts/SchoolConfigContext';
import { useAuth } from '@/hooks/useAuth';
import { useMessenger } from '@/hooks/useMessenger';
import { showToast } from '@/lib/toastUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Plus, Send, Paperclip, 
  Smile, MoreVertical, Phone, Video,
  Trash2, Users, X, Check, CheckCheck, Mic, Edit2
} from 'lucide-react';

export default function MessengerPage() {
  const { theme } = useTheme();
  const { messengerEnabled } = useAppConfig();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newChatConversationType, setNewChatConversationType] = useState<'direct' | 'group' | 'broadcast'>('direct');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatUsers, setNewChatUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const { 
    conversations, 
    messages, 
    loading, 
    sending,
    fetchConversations, 
    fetchMessages, 
    sendMessage, 
    editMessage,
    deleteMessage,
    markAsRead,
    createConversation 
  } = useMessenger(selectedConversationId || undefined, messengerEnabled);

  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`;

  useEffect(() => {
    if (messengerEnabled) {
      fetchConversations();
    }
  }, [fetchConversations, messengerEnabled]);

  useEffect(() => {
    if (messengerEnabled && selectedConversationId) {
      fetchMessages();
      markAsRead();
    }
  }, [selectedConversationId, fetchMessages, markAsRead, messengerEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedConversationId) return;

    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage && pendingAttachments.length === 0 && !editingMessageId) return;
    if (editingMessageId && !trimmedMessage) {
      showToast('error', 'Enter message text', 'Edited messages cannot be empty');
      return;
    }

    try {
      if (editingMessageId) {
        await editMessage(editingMessageId, trimmedMessage);
        showToast('success', 'Message updated');
      } else {
        await sendMessage(trimmedMessage, {
          attachments: pendingAttachments,
          messageType: pendingAttachments.length > 0 ? 'file' : 'text',
        });
        showToast('success', 'Message sent');
      }
      setMessageInput('');
      setPendingAttachments([]);
      setEditingMessageId(null);
      setShowEmojiPicker(false);
    } catch (error) {
      showToast('error', 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setNewChatUsers([]);
      return;
    }
    try {
      const response = await fetch(`/api/messenger/users?search=${encodeURIComponent(query)}&pageSize=10`);
      if (response.ok) {
        const data = await response.json();
        setNewChatUsers(data.users || []);
      }
    } catch (error) {
      setNewChatUsers([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => searchUsers(newChatSearch), 300);
    return () => clearTimeout(timeoutId);
  }, [newChatSearch]);

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      showToast('error', 'Select Users', 'Please select at least one user');
      return;
    }

    if (newChatConversationType !== 'direct' && !newChatTitle.trim()) {
      showToast('error', 'Add a title', 'Group and broadcast conversations need a title');
      return;
    }

    try {
      const conversation = await createConversation(selectedUsers, {
        conversationType: newChatConversationType,
        title: newChatConversationType === 'direct' ? undefined : newChatTitle.trim(),
      });
      setShowNewChatModal(false);
      setNewChatConversationType('direct');
      setNewChatTitle('');
      setSelectedUsers([]);
      setNewChatSearch('');
      setNewChatUsers([]);
      setSelectedConversationId(conversation.id);
      showToast('success', 'Conversation Created');
    } catch (error) {
      showToast('error', 'Failed to create conversation');
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const emojiOptions = ['😀', '😁', '😂', '😅', '😍', '🤔', '👍', '🙏', '🎉', '❤️'];

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) return;

    try {
      const uploadedAttachments: any[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'messenger');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload attachment');
        }

        uploadedAttachments.push({
          url: data.url,
          filename: data.filename,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }

      setPendingAttachments((prev) => [...prev, ...uploadedAttachments]);
      showToast('success', 'Attachment added', `${uploadedAttachments.length} file(s) ready to send`);
    } catch (error: any) {
      showToast('error', 'Attachment upload failed', error.message || 'Please try again');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleEmojiInsert = (emoji: string) => {
    setMessageInput((prev) => `${prev}${prev ? ' ' : ''}${emoji}`);
    setShowEmojiPicker(false);
  };

  const handleToggleVoiceInput = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      showToast('warning', 'Voice input unavailable', 'Your browser does not support speech recognition');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      if (transcript) {
        setMessageInput((prev) => `${prev}${prev ? ' ' : ''}${transcript}`);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const handleStartEditMessage = (msg: any) => {
    setEditingMessageId(msg.id);
    setMessageInput(msg.body || '');
    setPendingAttachments([]);
    setShowEmojiPicker(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await deleteMessage(messageId);
      showToast('success', 'Message deleted');
    } catch (error) {
      showToast('error', 'Failed to delete message');
    }
  };

  useEffect(() => {
    setPendingAttachments([]);
    setShowEmojiPicker(false);
    setEditingMessageId(null);
    setMessageInput('');
    setIsRecording(false);
    recognitionRef.current?.stop?.();
  }, [selectedConversationId]);

  const openMembersModal = () => {
    if (!selectedConversation) return;
    setShowMembersModal(true);
  };

  if (!messengerEnabled) {
    return (
      <AppLayout currentPage="messenger" title="Messenger">
        <div className="h-[calc(100vh-80px)] flex items-center justify-center p-4">
          <div className={`max-w-lg w-full ${card} p-10 text-center space-y-4`}>
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-600'}`}>
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Messenger is disabled</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your school has turned messenger off from App Settings. Ask an admin to enable it if you need chat access.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="messenger" title="Messenger">
      <div className="h-[calc(100vh-80px)] flex gap-4 p-4">
        <div className={`w-80 flex-shrink-0 ${card} flex flex-col overflow-hidden`}>
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Messages
              </h2>
              <button onClick={() => setShowNewChatModal(true)} className={btnPrimary}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${input} pl-10`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto ${isDark ? 'border-blue-400' : 'border-blue-600'}`} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No conversations</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full p-4 border-b transition-colors text-left ${
                    selectedConversationId === conv.id
                      ? isDark ? 'bg-blue-600/20 border-blue-600/30' : 'bg-blue-50 border-blue-200'
                      : isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      {conv.avatar ? (
                        <img src={conv.avatar} alt={conv.title} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <MessageSquare className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {conv.title}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {conv.lastMessage?.body || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`flex-1 ${card} flex flex-col overflow-hidden`}>
          {selectedConversation ? (
            <>
              <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    {selectedConversation.avatar ? (
                      <img src={selectedConversation.avatar} alt={selectedConversation.title} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedConversation.title}
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedConversation.participants.length} participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.conversationType !== 'direct' && (
                    <button
                      onClick={openMembersModal}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="Manage members"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                  )}
                  <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                    <Video className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-blue-400' : 'border-blue-600'}`} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <MessageSquare className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender.id === user?.id;
                    const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          {!isOwnMessage && (
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {msg.sender.name}
                            </span>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : isDark
                                ? 'bg-gray-700 text-white rounded-bl-sm'
                                : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                            }`}
                          >
                            {msg.replyTo && (
                              <div className={`mb-2 pb-2 border-b ${isOwnMessage ? 'border-blue-500' : isDark ? 'border-gray-600' : 'border-gray-300'} text-xs opacity-75`}>
                                <div className="font-medium">{msg.replyTo.senderName}</div>
                                <div className="truncate">{msg.replyTo.body}</div>
                              </div>
                            )}
                            {attachments.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {attachments.map((attachment: any, index: number) => {
                                  const isImage = attachment?.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(attachment?.url || attachment?.name || '');
                                  return isImage ? (
                                    <a key={`${msg.id}-attachment-${index}`} href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/10">
                                      <img src={attachment.url} alt={attachment.name || 'Attachment'} className="max-h-56 w-full object-cover" />
                                    </a>
                                  ) : (
                                    <a key={`${msg.id}-attachment-${index}`} href={attachment.url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${isOwnMessage ? 'border-white/20 bg-white/10 text-white' : isDark ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}>
                                      <Paperclip className="h-4 w-4" />
                                      <span className="truncate">{attachment.name || attachment.filename || 'Attachment'}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                            {msg.body && <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwnMessage && (
                              msg.isRead ? (
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                              ) : (
                                <Check className="w-3 h-3 text-gray-400" />
                              )
                            )}
                          </div>
                          {isOwnMessage && (
                            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => handleStartEditMessage(msg)}
                                className={`rounded-lg p-1.5 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                                title="Edit message"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className={`rounded-lg p-1.5 ${isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                                title="Delete message"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {editingMessageId && (
                  <div className={`mb-3 flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-blue-600/30 bg-blue-600/10 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                    <span>Editing message</span>
                    <button onClick={() => { setEditingMessageId(null); setMessageInput(''); }} className="font-medium underline-offset-2 hover:underline">
                      Cancel
                    </button>
                  </div>
                )}

                {pendingAttachments.length > 0 && (
                  <div className="mb-3 grid gap-2 sm:grid-cols-2">
                    {pendingAttachments.map((attachment, index) => {
                      const isImage = attachment?.type?.startsWith('image/');
                      return (
                        <div key={`${attachment.filename || attachment.name}-${index}`} className={`relative rounded-xl border p-2 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                          <button
                            onClick={() => handleRemoveAttachment(index)}
                            className={`absolute right-2 top-2 rounded-full p-1 ${isDark ? 'bg-gray-900/80 text-gray-300' : 'bg-white text-gray-600'} shadow-sm`}
                            title="Remove attachment"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {isImage ? (
                            <img src={attachment.url} alt={attachment.name || 'Attachment'} className="mb-2 h-28 w-full rounded-lg object-cover" />
                          ) : (
                            <div className={`mb-2 flex h-28 items-center justify-center rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-500'}`}>
                              <Paperclip className="h-8 w-8" />
                            </div>
                          )}
                          <div className="pr-8">
                            <p className={`truncate text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{attachment.name}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{Math.round((attachment.size || 0) / 1024)} KB</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative mb-2">
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className={`absolute bottom-full left-0 mb-2 grid grid-cols-5 gap-2 rounded-2xl border p-3 shadow-xl ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}
                      >
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiInsert(emoji)}
                            className={`rounded-xl p-2 text-xl transition-transform hover:scale-110 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept="image/*,application/pdf,text/plain,audio/*,video/mp4,.doc,.docx,.xls,.xlsx,.zip"
                    onChange={handleAttachmentChange}
                  />

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={handleAttachmentClick}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="Add attachment"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className={`p-2 rounded-lg ${showEmojiPicker ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="Emoji picker"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleVoiceInput}
                      className={`p-2 rounded-lg ${isRecording ? 'bg-red-500/10 text-red-500' : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="Voice input"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={editingMessageId ? 'Edit your message...' : 'Type a message...'}
                      rows={1}
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || ((editingMessageId ? !messageInput.trim() : !messageInput.trim() && pendingAttachments.length === 0))}
                      className={`p-2.5 rounded-xl transition-all ${
                        (!editingMessageId && (messageInput.trim() || pendingAttachments.length > 0) || (editingMessageId && messageInput.trim())) && !sending
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {editingMessageId ? <Edit2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className={`w-20 h-20 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Select a conversation
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          )}
        </div>
      </div>

      {messengerEnabled && (
        <>
          <AnimatePresence>
            {showNewChatModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={() => setShowNewChatModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`w-full max-w-md ${card} p-6`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      New Conversation
                    </h3>
                    <button onClick={() => setShowNewChatModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Conversation Type
                      </label>
                      <select
                        value={newChatConversationType}
                        onChange={(e) => setNewChatConversationType(e.target.value as 'direct' | 'group' | 'broadcast')}
                        className={input}
                      >
                        <option value="direct">Direct</option>
                        <option value="group">Group</option>
                        <option value="broadcast">Broadcast</option>
                      </select>
                    </div>

                    {newChatConversationType !== 'direct' && (
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Title
                        </label>
                        <input
                          type="text"
                          placeholder="Enter a title for this conversation"
                          value={newChatTitle}
                          onChange={(e) => setNewChatTitle(e.target.value)}
                          className={input}
                        />
                      </div>
                    )}

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Search Users
                      </label>
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={newChatSearch}
                        onChange={(e) => setNewChatSearch(e.target.value)}
                        className={input}
                      />
                    </div>

                    {newChatUsers.length > 0 && (
                      <div className={`max-h-48 overflow-y-auto space-y-2 p-2 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        {newChatUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSelectedUsers((prev) =>
                                prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              );
                            }}
                            className={`w-full p-2 rounded-lg flex items-center gap-3 transition-colors ${
                              selectedUsers.includes(u.id)
                                ? isDark ? 'bg-blue-600/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
                                : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div className="flex-1 text-left">
                              <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {u.firstName} {u.lastName}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {u.email}
                              </div>
                            </div>
                            {selectedUsers.includes(u.id) && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedUsers.length > 0 && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Selected: {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleCreateConversation}
                      disabled={selectedUsers.length === 0}
                      className={`w-full ${btnPrimary} ${selectedUsers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Create Conversation
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <MessengerMembersModal
            isOpen={showMembersModal}
            conversation={selectedConversation ? {
              id: selectedConversation.id,
              title: selectedConversation.title,
              conversationType: selectedConversation.conversationType,
            } : null}
            isDark={isDark}
            onClose={() => setShowMembersModal(false)}
          />
        </>
      )}
    </AppLayout>
  );
}
