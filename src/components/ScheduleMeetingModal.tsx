'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Users, X, Search, Plus, Video,
  Phone, ChevronDown, Check, Send, Copy, Link,
} from 'lucide-react';
import { showToast } from '@/lib/toastUtils';

interface Participant {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
}

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversationParticipants?: Participant[];
  signalingSocket?: any;
  currentConversationId?: string;
  onMeetingScheduled?: (meeting: ScheduledMeeting) => void;
}

export interface ScheduledMeeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  type: 'voice' | 'video';
  participants: Participant[];
  link: string;
  scheduledAt: string;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  currentConversationParticipants = [],
  signalingSocket,
  currentConversationId,
  onMeetingScheduled,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [meetingType, setMeetingType] = useState<'voice' | 'video'>('video');
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledMeeting, setScheduledMeeting] = useState<ScheduledMeeting | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // Pre-select conversation participants
  useEffect(() => {
    if (isOpen && currentConversationParticipants.length > 0) {
      setSelectedParticipants(currentConversationParticipants);
    }
    // Set default date/time to 1 hour from now
    const now = new Date(Date.now() + 60 * 60 * 1000);
    setDate(now.toISOString().split('T')[0]);
    setTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
  }, [isOpen, currentConversationParticipants]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setScheduledMeeting(null);
      setSelectedParticipants([]);
    }
  }, [isOpen]);

  const filteredParticipants = currentConversationParticipants.filter(p =>
    p.name.toLowerCase().includes(participantSearch.toLowerCase()) &&
    !selectedParticipants.find(s => s.id === p.id)
  );

  const toggleParticipant = (p: Participant) => {
    setSelectedParticipants(prev =>
      prev.find(s => s.id === p.id)
        ? prev.filter(s => s.id !== p.id)
        : [...prev, p]
    );
  };

  const generateMeetingLink = (id: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/meeting/${id}`;
  };

  const handleSchedule = async () => {
    if (!title.trim()) { showToast('error', 'Missing Title', 'Please enter a meeting title'); return; }
    if (!date || !time) { showToast('error', 'Missing Time', 'Please select date and time'); return; }

    setIsScheduling(true);

    try {
      const meetingId = `mtg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const meeting: ScheduledMeeting = {
        id: meetingId,
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        duration,
        type: meetingType,
        participants: selectedParticipants,
        link: generateMeetingLink(meetingId),
        scheduledAt: new Date().toISOString(),
      };

      // Send meeting invite via socket (as a message in the conversation)
      if (signalingSocket && currentConversationId) {
        const meetingCard = `📅 **Meeting Scheduled**\n**${meeting.title}**\n🗓 ${new Date(`${date}T${time}`).toLocaleString()}\n⏱ ${duration} min · ${meetingType === 'video' ? '📹 Video' : '📞 Voice'}\n🔗 ${meeting.link}${description ? `\n📝 ${description}` : ''}`;
        signalingSocket.emit('send-message', {
          conversationId: currentConversationId,
          content: meetingCard,
          type: 'meeting-invite',
          metadata: meeting,
        });
      }

      setScheduledMeeting(meeting);
      onMeetingScheduled?.(meeting);
      showToast('success', 'Meeting Scheduled', `"${meeting.title}" has been scheduled`);
    } catch (err) {
      showToast('error', 'Schedule Failed', 'Could not schedule meeting. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const copyLink = () => {
    if (scheduledMeeting?.link) {
      navigator.clipboard.writeText(scheduledMeeting.link);
      showToast('success', 'Copied!', 'Meeting link copied to clipboard');
    }
  };

  const fmtDateTime = (d: string, t: string) => {
    try { return new Date(`${d}T${t}`).toLocaleString(undefined, { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch { return `${d} ${t}`; }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="schedule-meeting-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-lg" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-10 w-full max-w-lg mx-4 bg-gray-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Schedule Meeting</h2>
                <p className="text-gray-500 text-xs">Set up a call with your team</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success state */}
          {scheduledMeeting ? (
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold text-xl">Meeting Scheduled!</h3>
                <p className="text-gray-400 text-sm text-center">Invites sent to all participants</p>
              </div>

              {/* Meeting summary card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold">{scheduledMeeting.title}</p>
                    {scheduledMeeting.description && (
                      <p className="text-gray-400 text-sm mt-0.5">{scheduledMeeting.description}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${scheduledMeeting.type === 'video' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {scheduledMeeting.type === 'video' ? '📹 Video' : '📞 Voice'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {fmtDateTime(scheduledMeeting.date, scheduledMeeting.time)} · {scheduledMeeting.duration} min
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  {scheduledMeeting.participants.length} participant{scheduledMeeting.participants.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Meeting link */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <Link className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm truncate flex-1">{scheduledMeeting.link}</span>
                <button onClick={copyLink} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors">
                  Close
                </button>
                <button onClick={copyLink}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
              </div>
            </div>
          ) : (
            /* Form */
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Title */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Meeting Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Sync, Project Review..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Meeting Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['video', 'voice'] as const).map(t => (
                    <button key={t} onClick={() => setMeetingType(t)}
                      className={`flex items-center justify-center gap-2.5 py-3 rounded-2xl border transition-all font-medium text-sm
                        ${meetingType === t
                          ? t === 'video' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                      {t === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      {t === 'video' ? 'Video Call' : 'Voice Call'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-3 py-3 text-white text-sm outline-none focus:border-blue-500/60 transition-colors [color-scheme:dark]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input type="time" value={time} onChange={e => setTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-3 py-3 text-white text-sm outline-none focus:border-blue-500/60 transition-colors [color-scheme:dark]" />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Duration</label>
                <div className="relative">
                  <button onClick={() => setShowDurationPicker(v => !v)}
                    className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm hover:border-white/20 transition-colors">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {duration < 60 ? `${duration} min` : `${duration/60}h${duration%60?` ${duration%60}m`:''}` }
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDurationPicker?'rotate-180':''}`} />
                  </button>
                  {showDurationPicker && (
                    <div className="absolute top-full mt-1 w-full bg-gray-900 border border-white/10 rounded-2xl overflow-hidden z-10 shadow-xl">
                      {DURATION_OPTIONS.map(d => (
                        <button key={d} onClick={() => { setDuration(d); setShowDurationPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center justify-between
                            ${d === duration ? 'text-blue-400' : 'text-gray-300'}`}>
                          {d < 60 ? `${d} min` : `${d/60}h${d%60?` ${d%60}m`:''}` }
                          {d === duration && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                  Participants ({selectedParticipants.length})
                </label>
                {/* Selected chips */}
                {selectedParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedParticipants.map(p => (
                      <span key={p.id} className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full">
                        <span className="w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center text-[10px] font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        {p.name.split(' ')[0]}
                        <button onClick={() => toggleParticipant(p)} className="hover:text-red-400 transition-colors ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Search */}
                {currentConversationParticipants.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input ref={searchRef} value={participantSearch} onChange={e => setParticipantSearch(e.target.value)}
                      placeholder="Search participants..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-blue-500/60 transition-colors" />
                  </div>
                )}
                {filteredParticipants.length > 0 && participantSearch && (
                  <div className="mt-1 bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    {filteredParticipants.slice(0,5).map(p => (
                      <button key={p.id} onClick={() => { toggleParticipant(p); setParticipantSearch(''); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left">
                        <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-white text-sm font-medium">{p.name}</p>
                          {p.role && <p className="text-gray-500 text-xs">{p.role}</p>}
                        </div>
                        <Plus className="w-4 h-4 text-blue-400 ml-auto" />
                      </button>
                    ))}
                  </div>
                )}
                {currentConversationParticipants.length === 0 && (
                  <p className="text-gray-600 text-xs mt-1">Open from a conversation to auto-add participants</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Agenda / Notes <span className="text-gray-600 normal-case">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What will you discuss? Topics, goals, links..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-blue-500/60 transition-colors resize-none"
                />
              </div>

              {/* Schedule button */}
              <button
                onClick={handleSchedule}
                disabled={isScheduling || !title.trim() || !date || !time}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
              >
                {isScheduling ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling...</>
                ) : (
                  <><Send className="w-4 h-4" /> Schedule & Send Invites</>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
