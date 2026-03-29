'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, Search, Shield, UserPlus, Users, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/toastUtils';

interface ConversationSummary {
  id: string;
  title: string;
  conversationType: 'direct' | 'group' | 'broadcast' | string;
}

interface ConversationMember {
  id: string;
  participantId: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: 'admin' | 'member' | string;
  status: string;
  isArchived?: boolean;
}

interface MessengerUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
}

interface MessengerMembersModalProps {
  isOpen: boolean;
  conversation: ConversationSummary | null;
  isDark: boolean;
  onClose: () => void;
}

export function MessengerMembersModal({ isOpen, conversation, isDark, onClose }: MessengerMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessengerUser[]>([]);
  const [searching, setSearching] = useState(false);

  const title = useMemo(() => conversation?.title || 'Conversation members', [conversation?.title]);

  const loadMembers = useCallback(async () => {
    if (!conversation?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/messenger/conversations/${conversation.id}/participants`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || 'Failed to load members');

      setMembers(data.data?.participants || []);
      setCanManageMembers(Boolean(data.data?.canManageMembers));
    } catch (error: any) {
      console.error('Failed to load conversation members:', error);
      showToast('error', 'Failed to load members', error.message);
    } finally {
      setLoading(false);
    }
  }, [conversation?.id]);

  const searchUsers = useCallback(async (query: string) => {
    if (!conversation?.id || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/messenger/users?search=${encodeURIComponent(query.trim())}&pageSize=10`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || 'Failed to search users');

      const existingIds = new Set(members.map((member) => member.userId));
      setSearchResults((data.users || []).filter((candidate: MessengerUser) => !existingIds.has(candidate.id)));
    } catch (error) {
      console.error('Failed to search messenger users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [conversation?.id, members]);

  useEffect(() => {
    if (!isOpen || !conversation?.id) return;
    void loadMembers();
  }, [isOpen, conversation?.id, loadMembers]);

  useEffect(() => {
    if (!isOpen || !conversation?.id) return;

    const timer = window.setTimeout(() => {
      void searchUsers(searchQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [isOpen, conversation?.id, searchQuery, searchUsers]);

  const addMember = async (participantId: string) => {
    if (!conversation?.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/messenger/conversations/${conversation.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [participantId] }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || 'Failed to add member');

      setMembers(data.data?.participants || []);
      setSearchResults((prev) => prev.filter((candidate) => candidate.id !== participantId));
      showToast('success', 'Member added');
    } catch (error: any) {
      console.error('Failed to add member:', error);
      showToast('error', 'Failed to add member', error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateMember = async (participantId: string, updates: { participantRole?: 'admin' | 'member'; isMuted?: boolean; isArchived?: boolean; status?: 'active' | 'inactive' }) => {
    if (!conversation?.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/messenger/conversations/${conversation.id}/participants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, ...updates }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || 'Failed to update member');

      setMembers((prev) =>
        prev.map((member) => (member.userId === participantId ? { ...member, ...updates } : member))
      );
      showToast('success', 'Member updated');
    } catch (error: any) {
      console.error('Failed to update member:', error);
      showToast('error', 'Failed to update member', error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (participantId: string) => {
    if (!conversation?.id) return;

    const isSelf = participantId === user?.id;
    if (!window.confirm(isSelf ? 'Leave this conversation?' : 'Remove this member?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/messenger/conversations/${conversation.id}/participants`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || 'Failed to remove member');

      setMembers((prev) => prev.filter((member) => member.userId !== participantId));
      showToast('success', isSelf ? 'You left the conversation' : 'Member removed');
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      showToast('error', 'Failed to remove member', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !conversation) return null;

  const showAddMemberTools = canManageMembers && conversation.conversationType !== 'direct';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border shadow-2xl ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
              </div>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage members for this conversation</p>
            </div>
            <button
              onClick={onClose}
              className={`rounded-xl p-2 transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[calc(85vh-72px)] overflow-y-auto p-5 space-y-6">
            {showAddMemberTools && (
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-gray-50'}`}>
                <div className="mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add members</h4>
                </div>
                <div className="relative">
                  <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search users by name or email"
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20 ${isDark ? 'border-gray-700 bg-gray-900 text-white placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}`}
                  />
                </div>

                {searching && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                )}

                {!searching && searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {searchResults.map((candidate) => (
                      <div
                        key={candidate.id}
                        className={`flex items-center justify-between rounded-xl border px-3 py-3 ${isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                            {candidate.firstName?.[0] || candidate.email?.[0] || '?'}{candidate.lastName?.[0] || ''}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{candidate.firstName} {candidate.lastName}</p>
                            <p className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{candidate.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addMember(candidate.id)}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <div className={`mt-4 rounded-xl border border-dashed px-4 py-5 text-center text-sm ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                    No matching users found.
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Current members</h4>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{members.length} total</span>
              </div>

              {loading ? (
                <div className={`rounded-2xl border p-6 text-center ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className={`rounded-2xl border p-6 text-center ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  No members found.
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const isSelf = member.userId === user?.id;
                    const canRemove = isSelf || canManageMembers;

                    return (
                      <div
                        key={member.participantId}
                        className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              <>{member.name?.[0] || '?'}{member.name?.split(' ')[1]?.[0] || ''}</>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`truncate font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}{isSelf ? ' (you)' : ''}</p>
                              {member.role === 'admin' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{member.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          {canManageMembers && !isSelf && (
                            <button
                              onClick={() => updateMember(member.userId, { participantRole: member.role === 'admin' ? 'member' : 'admin' })}
                              disabled={saving}
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                member.role === 'admin'
                                  ? 'border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10'
                                  : 'border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10'
                              }`}
                            >
                              <Shield className="h-4 w-4" />
                              {member.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                          )}

                          {canManageMembers && !isSelf && (
                            <button
                              onClick={() => updateMember(member.userId, { isArchived: !Boolean(member.isArchived) })}
                              disabled={saving}
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                member.isArchived
                                  ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10'
                                  : 'border-gray-500/30 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-500/10'
                              }`}
                            >
                              <Users className="h-4 w-4" />
                              {member.isArchived ? 'Unarchive' : 'Archive'}
                            </button>
                          )}

                          {canRemove && (
                            <button
                              onClick={() => removeMember(member.userId)}
                              disabled={saving}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                              {isSelf ? 'Leave' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
