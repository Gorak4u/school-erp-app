'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  RefreshCw, Play, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, Building2, Globe, Zap, Settings2
} from 'lucide-react';

interface CronJob {
  id: string;
  jobName: string;
  scope: 'school' | 'saas';
  category: string;
  description: string;
  schedule: string;
  enabled: boolean;
  running: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastRunMs: number | null;
}

interface CronRun {
  id: string;
  jobName: string;
  scope: string;
  status: string;
  triggeredBy: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  processed: number | null;
  error: string | null;
}

const PRESETS: { label: string; value: string }[] = [
  { label: 'Every 5 min',    value: '*/5 * * * *' },
  { label: 'Every 15 min',   value: '*/15 * * * *' },
  { label: 'Every 30 min',   value: '*/30 * * * *' },
  { label: 'Every hour',     value: '0 * * * *' },
  { label: 'Every 2 hours',  value: '0 */2 * * *' },
  { label: 'Every 6 hours',  value: '0 */6 * * *' },
  { label: 'Daily 2 AM',     value: '0 2 * * *' },
  { label: 'Daily 4 AM',     value: '0 4 * * *' },
  { label: 'Daily 9 AM',     value: '0 9 * * *' },
  { label: 'Weekly Sun 2AM', value: '0 2 * * 0' },
];

const CATEGORY_COLORS: Record<string, string> = {
  communication: 'bg-blue-100 text-blue-700',
  billing:        'bg-yellow-100 text-yellow-700',
  analytics:      'bg-purple-100 text-purple-700',
  maintenance:    'bg-orange-100 text-orange-700',
  marketing:      'bg-pink-100 text-pink-700',
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  if (status === 'success') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3"/>Success</span>;
  if (status === 'failed')  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3"/>Failed</span>;
  if (status === 'running') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><RefreshCw className="w-3 h-3 animate-spin"/>Running</span>;
  return null;
}

export default function CronManagementPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'school' | 'saas'>('school');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [editSchedule, setEditSchedule] = useState<{ jobName: string; value: string } | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ─── Theme shortcuts ──────────────────────────────────────────────────────
  const card  = `rounded-2xl border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const txt   = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const inp   = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const btnP  = `px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all hover:scale-105 shadow`;
  const btnS  = `px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`;

  // ─── Data fetch ───────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/cron');
      if (!r.ok) return;
      const d = await r.json();
      setJobs(d.jobs ?? []);
      setRuns(d.recentRuns ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const apiPost = async (body: object) => {
    const r = await fetch('/api/cron', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggle = async (job: CronJob) => {
    setActioning(job.jobName);
    const result = await apiPost({ action: job.enabled ? 'disable' : 'enable', jobName: job.jobName });
    if (result.success) { await fetchStatus(); showToast(`${job.jobName} ${job.enabled ? 'disabled' : 'enabled'}`, true); }
    else showToast(result.error ?? 'Failed', false);
    setActioning(null);
  };

  const handleTrigger = async (jobName: string) => {
    setActioning(jobName + '_trigger');
    const result = await apiPost({ action: 'trigger', jobName });
    showToast(result.message ?? (result.success ? 'Triggered' : 'Failed'), !!result.success);
    setTimeout(fetchStatus, 2000);
    setActioning(null);
  };

  const handleScheduleSave = async () => {
    if (!editSchedule) return;
    setActioning(editSchedule.jobName + '_sched');
    const result = await apiPost({ action: 'update-schedule', jobName: editSchedule.jobName, schedule: editSchedule.value });
    if (result.success) { await fetchStatus(); setEditSchedule(null); showToast('Schedule updated', true); }
    else showToast(result.error ?? 'Invalid schedule', false);
    setActioning(null);
  };

  const handleInitialize = async () => {
    setActioning('init');
    const result = await apiPost({ action: 'initialize' });
    await fetchStatus();
    showToast(result.message ?? 'Done', !!result.success);
    setActioning(null);
  };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const result = await apiPost({ action: 'seed-defaults' });
      if (result.success) {
        showToast(result.message || 'Default cron jobs seeded', true);
        await fetchStatus();
      } else {
        showToast(result.error || 'Failed to seed defaults', false);
      }
    } catch {
      showToast('Failed to seed default cron jobs', false);
    } finally {
      setSeeding(false);
    }
  };

  // ─── Derived data ─────────────────────────────────────────────────────────
  const schoolJobs  = jobs.filter(j => j.scope === 'school');
  const saasJobs    = jobs.filter(j => j.scope === 'saas');
  const visibleJobs = activeTab === 'school' ? schoolJobs : saasJobs;
  const visibleRuns = runs.filter(r => r.scope === activeTab).slice(0, 20);

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className={`h-20 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}/>)}
    </div>
  );

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${txt}`}>Cron Management</h1>
          <p className={`text-sm mt-1 ${muted}`}>
            {jobs.filter(j => j.enabled).length} of {jobs.length} jobs enabled · {jobs.filter(j => j.running).length} currently running
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStatus} className={btnS}>
            <RefreshCw className="w-4 h-4 inline mr-1.5"/>Refresh
          </button>
          <button onClick={seedDefaults} disabled={seeding} className={btnS}>
            🌱 {seeding ? 'Seeding…' : 'Seed Defaults'}
          </button>
          <button onClick={handleInitialize} disabled={actioning === 'init'} className={btnP}>
            <Zap className="w-4 h-4 inline mr-1.5"/>
            {actioning === 'init' ? 'Starting…' : 'Initialize'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'School Jobs', value: schoolJobs.length, icon: <Building2 className="w-5 h-5 text-blue-500"/>, sub: `${schoolJobs.filter(j=>j.enabled).length} enabled` },
          { label: 'SaaS Jobs',   value: saasJobs.length,   icon: <Globe className="w-5 h-5 text-purple-500"/>, sub: `${saasJobs.filter(j=>j.enabled).length} enabled` },
          { label: 'Successful',  value: runs.filter(r=>r.status==='success').length, icon: <CheckCircle className="w-5 h-5 text-green-500"/>, sub: 'last 50 runs' },
          { label: 'Failed',      value: runs.filter(r=>r.status==='failed').length,  icon: <XCircle className="w-5 h-5 text-red-500"/>, sub: 'last 50 runs' },
        ].map(c => (
          <div key={c.label} className={card + ' p-4'}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${muted}`}>{c.label}</p>
                <p className={`text-2xl font-bold mt-1 ${txt}`}>{c.value}</p>
                <p className={`text-xs mt-0.5 ${muted}`}>{c.sub}</p>
              </div>
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {(['school', 'saas'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : muted + ' hover:opacity-80'
            }`}
          >
            {tab === 'school' ? <Building2 className="w-4 h-4"/> : <Globe className="w-4 h-4"/>}
            {tab === 'school' ? 'School Jobs' : 'SaaS Jobs'}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-white/20' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              {tab === 'school' ? schoolJobs.length : saasJobs.length}
            </span>
          </button>
        ))}
      </div>

      {/* Scope description */}
      <div className={`px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-blue-900/30 border border-blue-800 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
        {activeTab === 'school'
          ? '🏫 School jobs run per-school context: fee reminders, communication outbox, statistics, and log cleanup. Uses school SMTP.'
          : '🌐 SaaS jobs run platform-wide: subscription renewals, suspensions, promo cleanup. Uses platform SMTP.'}
      </div>

      {/* Job cards */}
      <div className="space-y-3">
        {visibleJobs.map(job => {
          const isExpanded = expandedJob === job.jobName;
          const isActioning = actioning === job.jobName || actioning === job.jobName + '_trigger' || actioning === job.jobName + '_sched';
          const jobRuns = visibleRuns.filter(r => r.jobName === job.jobName);

          return (
            <div key={job.jobName} className={card}>
              <div className="p-4">
                {/* Row 1: name, category, status badges, toggle */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${txt}`}>{job.jobName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[job.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {job.category}
                      </span>
                      {job.running && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <RefreshCw className="w-3 h-3 animate-spin"/>Running
                        </span>
                      )}
                      <StatusBadge status={job.lastStatus}/>
                    </div>
                    <p className={`text-xs mt-1 ${muted}`}>{job.description}</p>
                  </div>
                  {/* Enable/Disable toggle */}
                  <button
                    onClick={() => handleToggle(job)}
                    disabled={!!actioning}
                    title={job.enabled ? 'Disable' : 'Enable'}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${job.enabled ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${job.enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </button>
                </div>

                {/* Row 2: schedule, last run info, action buttons */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className={`font-mono text-xs px-2 py-1 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <Clock className="w-3 h-3 inline mr-1"/>
                    {job.schedule}
                  </span>
                  {job.lastRunAt && (
                    <span className={`text-xs ${muted}`}>
                      Last: {new Date(job.lastRunAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      {job.lastRunMs ? ` (${job.lastRunMs}ms)` : ''}
                    </span>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleTrigger(job.jobName)}
                      disabled={isActioning || !job.enabled}
                      className={`${btnP} py-1 text-xs`}
                    >
                      <Play className="w-3 h-3 inline mr-1"/>
                      {actioning === job.jobName + '_trigger' ? 'Running…' : 'Run Now'}
                    </button>
                    <button
                      onClick={() => setExpandedJob(isExpanded ? null : job.jobName)}
                      className={`${btnS} py-1 text-xs`}
                    >
                      <Settings2 className="w-3 h-3 inline mr-1"/>
                      {isExpanded ? <ChevronUp className="w-3 h-3 inline"/> : <ChevronDown className="w-3 h-3 inline"/>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded panel: schedule editor + recent runs */}
              {isExpanded && (
                <div className={`border-t px-4 py-4 space-y-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  {/* Schedule editor */}
                  <div>
                    <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Edit Schedule</p>
                    <div className="flex gap-2">
                      <input
                        value={editSchedule?.jobName === job.jobName ? editSchedule.value : job.schedule}
                        onChange={e => setEditSchedule({ jobName: job.jobName, value: e.target.value })}
                        onFocus={() => !editSchedule && setEditSchedule({ jobName: job.jobName, value: job.schedule })}
                        placeholder="cron expression"
                        className={`${inp} font-mono max-w-xs`}
                      />
                      <button
                        onClick={handleScheduleSave}
                        disabled={!editSchedule || editSchedule.jobName !== job.jobName || actioning === job.jobName + '_sched'}
                        className={btnP}
                      >
                        {actioning === job.jobName + '_sched' ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {PRESETS.map(p => (
                        <button
                          key={p.value}
                          onClick={() => setEditSchedule({ jobName: job.jobName, value: p.value })}
                          className={`px-2.5 py-1 rounded-lg text-xs border transition-all hover:scale-105 ${
                            (editSchedule?.jobName === job.jobName ? editSchedule.value : job.schedule) === p.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                              : isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent runs for this job */}
                  {jobRuns.length > 0 && (
                    <div>
                      <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Recent Runs</p>
                      <div className="space-y-1.5">
                        {jobRuns.slice(0, 5).map(run => (
                          <div key={run.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <span className="shrink-0"><StatusBadge status={run.status}/></span>
                            <span className={muted}>{new Date(run.startedAt).toLocaleString('en-IN')}</span>
                            {run.durationMs != null && <span className={muted}>{run.durationMs}ms</span>}
                            {run.processed != null && <span className={muted}>{run.processed} records</span>}
                            <span className={`capitalize shrink-0 ml-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{run.triggeredBy}</span>
                            {run.error && <span className="text-red-500 truncate max-w-xs" title={run.error}>{run.error}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global run history table */}
      {visibleRuns.length > 0 && (
        <div className={card}>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`font-semibold ${txt}`}>Run History</h2>
            <p className={`text-xs mt-0.5 ${muted}`}>Last 20 executions · {activeTab} scope</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'bg-gray-700/50' : 'bg-gray-50'}>
                  {['Job', 'Status', 'Triggered', 'Started', 'Duration', 'Records', 'Error'].map(h => (
                    <th key={h} className={`px-4 py-2.5 text-left text-xs font-semibold ${muted}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRuns.map(run => (
                  <tr key={run.id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className={`px-4 py-2.5 font-mono text-xs ${txt}`}>{run.jobName}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={run.status}/></td>
                    <td className={`px-4 py-2.5 text-xs capitalize ${muted}`}>{run.triggeredBy}</td>
                    <td className={`px-4 py-2.5 text-xs ${muted}`}>{new Date(run.startedAt).toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-2.5 text-xs ${muted}`}>{run.durationMs != null ? `${run.durationMs}ms` : '—'}</td>
                    <td className={`px-4 py-2.5 text-xs ${muted}`}>{run.processed ?? '—'}</td>
                    <td className={`px-4 py-2.5 text-xs text-red-500 max-w-xs truncate`} title={run.error ?? undefined}>{run.error ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
