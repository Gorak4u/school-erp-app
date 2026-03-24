'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Zap,
  Settings,
  Save,
  X
} from 'lucide-react';

interface CronJob {
  name: string;
  schedule: string;
  scheduleDescription: string;
  enabled: boolean;
  running: boolean;
  description?: string;
  category: string;
  priority: number;
}

interface CronStatus {
  total: number;
  running: number;
  jobs: CronJob[];
}

interface CronPresets {
  [key: string]: string;
}

export default function CronManagementPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [presets, setPresets] = useState<CronPresets>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [tempSchedule, setTempSchedule] = useState<string>('');
  const [tempEnabled, setTempEnabled] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/cron/manage');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
        setPresets(data.presets || {});
      }
    } catch (error) {
      console.error('Failed to fetch cron status:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string, jobName?: string, data?: any) => {
    setActionLoading(jobName || action);
    try {
      const response = await fetch('/api/cron/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, jobName, ...data }),
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchStatus(); // Refresh status
        if (editingJob) {
          setEditingJob(null); // Exit edit mode
        }
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const startEditing = (job: CronJob) => {
    setEditingJob(job.name);
    setTempSchedule(job.schedule);
    setTempEnabled(job.enabled);
  };

  const cancelEditing = () => {
    setEditingJob(null);
    setTempSchedule('');
    setTempEnabled(false);
  };

  const saveChanges = (jobName: string) => {
    const promises = [];
    
    // Update schedule if changed
    if (tempSchedule !== status?.jobs.find(j => j.name === jobName)?.schedule) {
      promises.push(performAction('updateSchedule', jobName, { schedule: tempSchedule }));
    }
    
    // Update enabled status if changed
    if (tempEnabled !== status?.jobs.find(j => j.name === jobName)?.enabled) {
      promises.push(performAction('enable', jobName, { enabled: tempEnabled }));
    }
    
    Promise.all(promises);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
        Failed to load cron job status
      </div>
    );
  }

  const getStatusIcon = (running: boolean) => {
    return running ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    );
  };

  const getEnabledBadge = (enabled: boolean) => {
    return enabled ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Enabled
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Disabled
      </span>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      communication: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
      analytics: 'bg-purple-100 text-purple-800',
      backup: 'bg-red-100 text-red-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isEditing = (jobName: string) => editingJob === jobName;

  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cron Job Management</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage scheduled tasks, enable/disable jobs, and change frequencies</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => performAction('initialize')}
            disabled={actionLoading === 'initialize'}
            className={btnSecondary}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading === 'initialize' ? 'animate-spin' : ''}`} />
            Initialize All
          </button>
          <button
            onClick={() => performAction('stopAll')}
            disabled={actionLoading === 'stopAll'}
            className={btnSecondary}
          >
            <Pause className="h-4 w-4 mr-2" />
            Stop All
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={card}>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Jobs</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{status.total}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Running</p>
              <p className="text-2xl font-bold text-green-600">{status.running}</p>
            </div>
            <Play className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Stopped</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{status.total - status.running}</p>
            </div>
            <Pause className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className={card}>
        <div className="p-6">
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Scheduled Jobs</h2>
          <div className="space-y-4">
            {status.jobs.map((job) => (
              <div
                key={job.name}
                className={`flex items-center justify-between p-4 border rounded-lg ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(job.running)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{job.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(job.category)}`}>
                        {job.category}
                      </span>
                      {getEnabledBadge(job.enabled)}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{job.description}</p>
                    
                    {isEditing(job.name) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Schedule:</label>
                          <input
                            type="text"
                            value={tempSchedule}
                            onChange={(e) => setTempSchedule(e.target.value)}
                            className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            placeholder="*/5 * * * *"
                          />
                          <select
                            value={tempSchedule}
                            onChange={(e) => setTempSchedule(e.target.value)}
                            className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          >
                            <option value="">Custom...</option>
                            {Object.entries(presets).map(([name, schedule]) => (
                              <option key={name} value={schedule}>
                                {name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Enabled:</label>
                          <input
                            type="checkbox"
                            checked={tempEnabled}
                            onChange={(e) => setTempEnabled(e.target.checked)}
                            className="rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {job.schedule}
                        </code>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          ({job.scheduleDescription})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isEditing(job.name) ? (
                    <>
                      <button
                        onClick={() => saveChanges(job.name)}
                        disabled={actionLoading === job.name}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {actionLoading === job.name ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => performAction('trigger', job.name)}
                        disabled={actionLoading === job.name || !job.enabled}
                        className={btnSecondary}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        {actionLoading === job.name ? '...' : 'Run Now'}
                      </button>
                      {job.running ? (
                        <button
                          onClick={() => performAction('stop', job.name)}
                          disabled={actionLoading === job.name}
                          className={btnSecondary}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => performAction('start', job.name)}
                          disabled={actionLoading === job.name || !job.enabled}
                          className={btnSecondary}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => startEditing(job)}
                        className={btnSecondary}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Information */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h3 className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>How to Manage Cron Jobs</h3>
            <div className={`text-sm mt-1 space-y-1 ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
              <p><strong>Enable/Disable:</strong> Click "Edit" to toggle job enabled status</p>
              <p><strong>Change Frequency:</strong> Edit the schedule using cron expressions or presets</p>
              <p><strong>Common Schedules:</strong> Every 5min (*/5 * * * *), Daily (0 9 * * *), Weekly (0 3 * * 0)</p>
              <p><strong>Manual Trigger:</strong> Use "Run Now" to execute jobs immediately</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
