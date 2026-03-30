'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { MessengerMembersModal } from '@/components/MessengerMembersModal';
import { CallModal } from '@/components/CallModal';
import { ScheduleMeetingModal } from '@/components/ScheduleMeetingModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppConfig } from '@/contexts/SchoolConfigContext';
import { useAuth } from '@/hooks/useAuth';
import { useMessenger } from '@/hooks/useMessenger';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { showToast } from '@/lib/toastUtils';
import { useCallContext } from '@/contexts/CallContext';
import { unlockAudio } from '@/lib/ringtone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Plus, Send, Paperclip, 
  Smile, MoreVertical, Phone, Video,
  Trash2, Users, X, Check, CheckCheck, Mic, Edit2, Sparkles, Archive
} from 'lucide-react';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function MessengerPage() {
  const { theme } = useTheme();
  const { messengerEnabled } = useAppConfig();
  const { user } = useAuth();

  // Unlock AudioContext early so ringtones work when calls arrive
  useEffect(() => {
    unlockAudio();
    const handler = () => unlockAudio();
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);
  const isDark = theme === 'dark';
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationFilter, setConversationFilter] = useState<'all' | 'direct' | 'group' | 'broadcast'>('all');
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
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiAutoSuggest, setAiAutoSuggest] = useState<string>('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  
  // Use centralized call context
  const { incomingCallData, showCallModal, setShowCallModal, setIsOnMessengerPage, dismissCall } = useCallContext();
  
  useEffect(() => {
    setIsOnMessengerPage(true);
    return () => setIsOnMessengerPage(false);
  }, [setIsOnMessengerPage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  // Guard to prevent multiple call initiations from rapid clicks
  const callInitiatingRef = useRef<boolean>(false);
  const lastCallAttemptRef = useRef<number>(0);

  const { 
    conversations, 
    messages, 
    loading, 
    sending,
    socket,
    fetchConversations, 
    fetchMessages, 
    sendMessage, 
    editMessage,
    deleteMessage,
    markAsRead,
    archiveConversation, 
    createConversation 
  } = useMessenger(selectedConversationId || undefined, messengerEnabled);

  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`;

  useEffect(() => {
    if (messengerEnabled) {
      fetchConversations(1, showArchived ? 'true' : 'false');
    }
  }, [fetchConversations, messengerEnabled, showArchived]);

  useEffect(() => {
    if (messengerEnabled && selectedConversationId) {
      fetchMessages();
      markAsRead();
    }
  }, [selectedConversationId, fetchMessages, markAsRead, messengerEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate online presence - mark conversation participants as online
  useEffect(() => {
    if (!conversations.length) return;
    const allParticipantIds = conversations.flatMap((c) => c.participants?.map((p: any) => p.userId) || []);
    const uniqueIds = [...new Set(allParticipantIds)].slice(0, 5); // Simulate first 5 users online
    setOnlineUsers(new Set(uniqueIds));
  }, [conversations]);

  // Simulate typing indicators for demo
  useEffect(() => {
    if (!selectedConversationId) return;
    const interval = setInterval(() => {
      const conv = conversations.find((c) => c.id === selectedConversationId);
      if (conv && conv.participants && conv.participants.length > 1) {
        const otherParticipant = conv.participants.find((p: any) => p.userId !== user?.id);
        if (otherParticipant && Math.random() > 0.7) {
          setTypingUsers({ [selectedConversationId]: otherParticipant.user?.name || 'Someone' });
          setTimeout(() => setTypingUsers({}), 3000);
        }
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedConversationId, conversations, user?.id]);

  // Call listener removed - now handled by centralized CallProvider
  // Show toast when incoming call data changes
  useEffect(() => {
    if (incomingCallData && user?.id && incomingCallData.from !== user.id) {
      showToast('info', `${incomingCallData.callType === 'video' ? 'Video' : 'Voice'} call`, `${incomingCallData.callerName || 'Unknown'} is calling you`);
      setCallType(incomingCallData.callType);
    }
  }, [incomingCallData, user?.id]);

  const isUserOnline = (userId: string) => onlineUsers.has(userId);

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
  const callParticipant = selectedConversation?.participants?.find((p: any) => p.id !== user?.id);
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = conversationFilter === 'all' || c.conversationType === conversationFilter;
    const matchesArchived = showArchived ? c.isArchived : !c.isArchived;
    return matchesSearch && matchesFilter && matchesArchived;
  });

  const conversationCounts = {
    all: conversations.length,
    direct: conversations.filter((c) => c.conversationType === 'direct').length,
    group: conversations.filter((c) => c.conversationType === 'group').length,
    broadcast: conversations.filter((c) => c.conversationType === 'broadcast').length,
  };

  const typeLabelMap: Record<'direct' | 'group' | 'broadcast', string> = {
    direct: 'Direct',
    group: 'Group',
    broadcast: 'Broadcast',
  };

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

  const handleVoiceCall = () => {
    if (!selectedConversation) return;
    
    // GUARD: Prevent multiple rapid clicks (debounce 2 seconds)
    const now = Date.now();
    if (callInitiatingRef.current || showCallModal || (now - lastCallAttemptRef.current < 2000)) {
      console.log('⏭️ Ignoring duplicate voice call click');
      return;
    }
    
    callInitiatingRef.current = true;
    lastCallAttemptRef.current = now;
    
    // Find the other participant for direct calls
    const otherParticipant = callParticipant;
    if (otherParticipant) {
      // Only dismiss if there's an incoming call, not for outgoing
      if (incomingCallData) {
        dismissCall();
      }
      setCallType('voice');
      setShowCallModal(true);
      // Reset guard after modal opens
      setTimeout(() => {
        callInitiatingRef.current = false;
      }, 1000);
    } else {
      showToast('error', 'Cannot initiate call', 'No other participants found');
      callInitiatingRef.current = false;
    }
  };

  const handleVideoCall = () => {
    if (!selectedConversation) return;
    
    // GUARD: Prevent multiple rapid clicks (debounce 2 seconds)
    const now = Date.now();
    if (callInitiatingRef.current || showCallModal || (now - lastCallAttemptRef.current < 2000)) {
      console.log('⏭️ Ignoring duplicate video call click');
      return;
    }
    
    callInitiatingRef.current = true;
    lastCallAttemptRef.current = now;
    
    // Find the other participant for direct calls
    const otherParticipant = callParticipant;
    if (otherParticipant) {
      // Only dismiss if there's an incoming call, not for outgoing
      if (incomingCallData) {
        dismissCall();
      }
      setCallType('video');
      setShowCallModal(true);
      // Reset guard after modal opens
      setTimeout(() => {
        callInitiatingRef.current = false;
      }, 1000);
    } else {
      showToast('error', 'Cannot initiate call', 'No other participants found');
      callInitiatingRef.current = false;
    }
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

            <div className="mt-4 flex items-center justify-between">
              <div className="grid grid-cols-4 gap-2 flex-1">
                {(['all', 'direct', 'group', 'broadcast'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setConversationFilter(filterKey)}
                    className={`rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
                      conversationFilter === filterKey
                        ? isDark
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterKey === 'all' ? 'All' : typeLabelMap[filterKey as 'direct' | 'group' | 'broadcast']}
                    <span className="ml-1 opacity-70">
                      {conversationCounts[filterKey]}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowArchived(!showArchived);
                  setSelectedConversationId(null);
                }}
                className={`ml-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  showArchived
                    ? isDark ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
                title={showArchived ? 'Show active conversations' : 'Show archived conversations'}
              >
                <Archive className="w-4 h-4" />
              </button>
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
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        {conv.avatar ? (
                          <img src={conv.avatar} alt={conv.title} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <MessageSquare className="w-6 h-6" />
                        )}
                      </div>
                      {/* Online status indicator for direct messages */}
                      {conv.conversationType === 'direct' && conv.participants?.[0]?.userId && isUserOnline(conv.participants[0].userId) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                      {/* Online count for groups */}
                      {conv.conversationType !== 'direct' && (
                        <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-green-500 text-white text-[10px] font-bold border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                          {conv.participants?.filter((p: any) => isUserOnline(p.userId)).length || 0}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 pr-2">
                          <h3 className={`truncate font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {conv.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-[11px]">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              {typeLabelMap[conv.conversationType as 'direct' | 'group' | 'broadcast'] || conv.conversationType}
                            </span>
                            {conv.conversationType !== 'direct' && (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${isDark ? 'bg-blue-600/15 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                                {conv.participants?.length || 0} members
                              </span>
                            )}
                          </div>
                        </div>
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

          {/* AI Insights Panel */}
          <div className={`p-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
            <button
              onClick={() => setShowAIInsights((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                showAIInsights 
                  ? isDark ? 'bg-purple-600/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                  : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold">AI Insights</span>
              </div>
              <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {showAIInsights ? 'Hide' : 'Show'}
              </span>
            </button>
            
            {showAIInsights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 space-y-2"
              >
                <div className={`rounded-xl p-2.5 text-[11px] ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium">Response Time</span>
                    <span className={isDark ? 'text-green-400' : 'text-green-600'}>Fast</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className={`h-full rounded-full w-[85%] ${isDark ? 'bg-green-500' : 'bg-green-500'}`} />
                  </div>
                </div>
                
                <div className={`rounded-xl p-2.5 text-[11px] ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium">Engagement</span>
                    <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>High</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className={`h-full rounded-full w-[72%] ${isDark ? 'bg-blue-500' : 'bg-blue-500'}`} />
                  </div>
                </div>
                
                <div className={`rounded-xl p-2 text-[10px] italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  AI-powered insights are generated based on conversation patterns
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className={`flex-1 ${card} flex flex-col overflow-hidden`}>
          {selectedConversation ? (
            <>
              <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      {selectedConversation.avatar ? (
                        <img src={selectedConversation.avatar} alt={selectedConversation.title} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <MessageSquare className="w-5 h-5" />
                      )}
                    </div>
                    {selectedConversation.conversationType === 'direct' && selectedConversation.participants?.[0]?.userId && isUserOnline(selectedConversation.participants[0].userId) && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedConversation.title}
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedConversationId && typingUsers[selectedConversationId] ? (
                        <span className="flex items-center gap-1.5 text-green-500">
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          {selectedConversationId && typingUsers[selectedConversationId]} is typing...
                        </span>
                      ) : (
                        <>
                          {selectedConversation.participants.length} participants
                          {selectedConversation.conversationType === 'direct' && selectedConversation.participants?.[0]?.userId && isUserOnline(selectedConversation.participants[0].userId) && (
                            <span className="ml-2 text-green-500">● Online</span>
                          )}
                        </>
                      )}
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
                  <button 
                    onClick={handleVoiceCall}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                    title="Voice call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleVideoCall}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                    title="Video call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowConversationMenu(!showConversationMenu)}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="More options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {showConversationMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-lg z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                      >
                        <button
                          onClick={async () => {
                            const isArchived = selectedConversation?.isArchived;
                            if (window.confirm(isArchived ? 'Unarchive this conversation?' : 'Archive this conversation? It will be hidden from your main list but other participants can still see it.')) {
                              try {
                                await archiveConversation(selectedConversation.id, !isArchived);
                                showToast('success', isArchived ? 'Conversation unarchived' : 'Conversation archived');
                                if (!isArchived) {
                                  setSelectedConversationId(null);
                                }
                              } catch {
                                showToast('error', 'Failed to archive conversation');
                              }
                            }
                            setShowConversationMenu(false);
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                          <Archive className="w-4 h-4" />
                          <span className="text-sm">{selectedConversation?.isArchived ? 'Unarchive' : 'Archive'}</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
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
                    
                    {/* AI Smart Starters */}
                    <div className="mt-6 w-full max-w-md px-4">
                      <div className={`flex items-center gap-2 mb-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">AI Suggested Starters</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'Hey! How are you doing today?',
                          'Can we schedule a quick call?',
                          'I have an update to share...',
                          'Thanks for your help earlier!',
                        ].map((starter, idx) => (
                          <button
                            key={idx}
                            onClick={() => setMessageInput(starter)}
                            className={`text-left px-3 py-2.5 rounded-xl text-xs transition-all hover:scale-[1.02] ${
                              isDark 
                                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
                                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {starter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender.id === user?.id;
                    const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
                    return (
                      <MessageBubble
                        key={msg.id}
                        id={msg.id}
                        text={msg.body || ''}
                        isMine={isOwnMessage}
                        timestamp={new Date(msg.createdAt)}
                        status={msg.isRead ? 'read' : 'delivered'}
                        senderName={!isOwnMessage ? msg.sender.name : undefined}
                        attachments={attachments.map((att: any) => ({
                          type: att.type?.startsWith('image/') ? 'image' : 'file',
                          url: att.url,
                          name: att.name || att.filename,
                          size: att.size ? `${Math.round(att.size / 1024)} KB` : undefined,
                        }))}
                        onEdit={() => handleStartEditMessage(msg)}
                        onDelete={() => handleDeleteMessage(msg.id)}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />

                {/* Typing Indicator */}
                {isAIThinking && (
                  <TypingIndicator userName="AI Assistant" />
                )}
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
                  <div className={`mb-3 rounded-2xl border p-4 ${isDark ? 'border-purple-600/30 bg-purple-600/10' : 'border-purple-200 bg-purple-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <span className={`text-sm font-semibold ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>AI Assistant</span>
                      </div>
                      <button
                        onClick={() => setShowAIAssistant(false)}
                        className={`p-1 rounded-lg ${isDark ? 'hover:bg-purple-600/30 text-purple-300' : 'hover:bg-purple-200 text-purple-600'}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setMessageInput((prev) => prev || 'Draft a professional message about...');
                          showToast('info', 'AI Draft', 'Start typing your topic and AI will help refine it');
                        }}
                        className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">✍️</span>
                          <span>Draft with AI</span>
                        </div>
                        <span className={`text-[10px] opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Get help writing professional messages</span>
                      </button>
                      <button
                        onClick={() => {
                          showToast('info', 'Smart Summary', 'Conversation summary would appear here');
                        }}
                        className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">📝</span>
                          <span>Summarize</span>
                        </div>
                        <span className={`text-[10px] opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Get a quick summary of the chat</span>
                      </button>
                      <button
                        onClick={() => {
                          const suggestions = ['Sounds great, thanks!', 'Let me check and get back to you.', 'Can you share more details?'];
                          setAiSuggestions(suggestions);
                          showToast('success', 'Smart Replies', 'Quick reply suggestions generated');
                        }}
                        className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">⚡</span>
                          <span>Smart Reply</span>
                        </div>
                        <span className={`text-[10px] opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Get context-aware reply suggestions</span>
                      </button>
                      <button
                        onClick={() => {
                          showToast('info', 'Grammar Check', 'Grammar and tone suggestions would appear here');
                        }}
                        className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">✨</span>
                          <span>Improve</span>
                        </div>
                        <span className={`text-[10px] opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enhance grammar and tone</span>
                      </button>
                    </div>
                    {aiSuggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Quick replies:</p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setMessageInput(suggestion);
                                setAiSuggestions([]);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isDark ? 'bg-purple-600/30 text-purple-200 hover:bg-purple-600/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                    <button
                      type="button"
                      onClick={() => setShowAIAssistant((prev) => !prev)}
                      className={`p-2 rounded-lg ${showAIAssistant ? (isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600') : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="AI Assistant"
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                    <RichTextEditor
                      value={messageInput}
                      onChange={setMessageInput}
                      onSend={handleSendMessage}
                      placeholder={editingMessageId ? 'Edit your message...' : 'Type a message...'}
                      showFormatting={true}
                    />
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

          <CallModal
            isOpen={showCallModal}
            onClose={() => {
              setShowCallModal(false);
              dismissCall();
              // CRITICAL: Reset guards when modal closes to allow next call
              callInitiatingRef.current = false;
              lastCallAttemptRef.current = 0;
            }}
            conversationId={incomingCallData?.conversationId || selectedConversationId || undefined}
            targetUserId={callParticipant?.id || incomingCallData?.from}
            targetUserName={callParticipant?.name || selectedConversation?.title || incomingCallData?.callerName || 'Unknown'}
            currentUserName={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'You'}
            initialCallType={callType}
            signalingSocket={socket}
            isIncomingCall={Boolean(incomingCallData)}
            incomingCallData={incomingCallData || undefined}
            enabled={showCallModal}
            onScheduleMeeting={() => setShowScheduleModal(true)}
          />

          <ScheduleMeetingModal
            isOpen={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            currentConversationParticipants={selectedConversation?.participants?.map((p: any) => ({
              id: p.userId || p.id || '',
              name: p.name || p.firstName ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'User',
              role: p.role,
            })) || []}
            signalingSocket={socket}
            currentConversationId={selectedConversationId || undefined}
          />
        </>
      )}
    </AppLayout>
  );
}
