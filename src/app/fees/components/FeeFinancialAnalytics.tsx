// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { feeRecordsApi, feeStructuresApi } from '@/lib/apiClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

interface FeeFinancialAnalyticsProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
}

export default function FeeFinancialAnalytics({ theme, onClose }: FeeFinancialAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('year');

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const chartTextColor = isDark ? '#fff' : '#000';
  const chartGridColor = isDark ? '#333' : '#ddd';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: chartTextColor } } },
    scales: {
      y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
      x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' as const, labels: { color: chartTextColor } } }
  };

  const [records, setRecords] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [recData, strData] = await Promise.all([
          feeRecordsApi.list({ pageSize: 500 }),
          feeStructuresApi.list(),
        ]);
        setRecords(recData.records || recData.feeRecords || []);
        setStructures(strData.feeStructures || []);
      } catch (e) { console.error('Failed to load analytics data', e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Compute aggregates from real data
  const totalBilled = useMemo(() => records.reduce((s, r) => s + (r.amount || 0), 0), [records]);
  const totalCollected = useMemo(() => records.reduce((s, r) => s + (r.paidAmount || 0), 0), [records]);
  const totalPending = totalBilled - totalCollected;
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0';

  // Monthly collection trend (keyed by month index from createdAt or dueDate)
  const monthLabels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const monthlyCollected = useMemo(() => {
    const m = new Array(12).fill(0);
    records.forEach(r => {
      if (r.paidAmount > 0) {
        const d = new Date(r.updatedAt || r.dueDate);
        // Fiscal month index: Apr=0 .. Mar=11
        const fiscal = (d.getMonth() + 9) % 12;
        m[fiscal] += r.paidAmount;
      }
    });
    return m;
  }, [records]);

  const revenueData = {
    labels: monthLabels,
    datasets: [
      { label: 'Collected', data: monthlyCollected, borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', tension: 0.4 },
    ]
  };

  // Collection by payment method
  const methodCounts = useMemo(() => {
    const mc: Record<string, number> = {};
    records.forEach(r => {
      if (r.paidAmount > 0) {
        const m = r.paymentMethod || 'Other';
        mc[m] = (mc[m] || 0) + r.paidAmount;
      }
    });
    return mc;
  }, [records]);
  const collectionByMethod = {
    labels: Object.keys(methodCounts).length ? Object.keys(methodCounts) : ['No data'],
    datasets: [{
      data: Object.keys(methodCounts).length ? Object.values(methodCounts) : [1],
      backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)', 'rgba(251,146,60,0.8)', 'rgba(147,51,234,0.8)', 'rgba(236,72,153,0.8)', 'rgba(20,184,166,0.8)']
    }]
  };

  // Collection by fee category
  const categoryCounts = useMemo(() => {
    const cc: Record<string, { collected: number; pending: number }> = {};
    records.forEach(r => {
      const cat = r.feeStructure?.category || 'other';
      if (!cc[cat]) cc[cat] = { collected: 0, pending: 0 };
      cc[cat].collected += r.paidAmount || 0;
      cc[cat].pending += r.pendingAmount || 0;
    });
    return cc;
  }, [records]);
  const catLabels = Object.keys(categoryCounts).length ? Object.keys(categoryCounts) : ['No data'];
  const feeTypeRevenue = {
    labels: catLabels,
    datasets: [{
      label: 'Collected (Rs)',
      data: Object.keys(categoryCounts).length ? Object.values(categoryCounts).map(c => c.collected) : [0],
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  };

  const collectionByGrade = {
    labels: catLabels,
    datasets: [
      { label: 'Collected', data: Object.keys(categoryCounts).length ? Object.values(categoryCounts).map(c => c.collected) : [0], backgroundColor: 'rgba(34, 197, 94, 0.8)' },
      { label: 'Pending', data: Object.keys(categoryCounts).length ? Object.values(categoryCounts).map(c => c.pending) : [0], backgroundColor: 'rgba(239, 68, 68, 0.8)' }
    ]
  };

  // Status breakdown for doughnut
  const statusCounts = useMemo(() => {
    const sc: Record<string, number> = {};
    records.forEach(r => { const s = r.status || 'pending'; sc[s] = (sc[s] || 0) + 1; });
    return sc;
  }, [records]);
  const expenseBreakdown = {
    labels: Object.keys(statusCounts).length ? Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)) : ['No data'],
    datasets: [{
      data: Object.keys(statusCounts).length ? Object.values(statusCounts) : [1],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(251,191,36,0.8)', 'rgba(239,68,68,0.8)', 'rgba(59,130,246,0.8)', 'rgba(147,51,234,0.8)', 'rgba(156,163,175,0.8)']
    }]
  };

  const cashFlowData = {
    labels: monthLabels,
    datasets: [
      { label: 'Collections', data: monthlyCollected, backgroundColor: 'rgba(34, 197, 94, 0.8)' },
    ]
  };

  const MetricCard = ({ title, value, subtitle, color, trend }: { title: string; value: string; subtitle: string; color: string; trend?: string }) => (
    <div className={`p-4 rounded-lg border ${cardCls}`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-sm ${textSecondary}`}>{title}</p>
        {trend && <span className={`text-xs px-2 py-0.5 rounded-full ${trend.startsWith('+') ? isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600' : isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>{trend}</span>}
      </div>
      <p className={`text-2xl font-bold ${textPrimary}`}>{value}</p>
      <p className={`text-xs mt-1 ${color}`}>{subtitle}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Financial Analytics</h2>
        <div className="flex items-center space-x-2">
          {(['month', 'quarter', 'year'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                selectedPeriod === period
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
          {onClose && (
            <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Close
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className={`text-center py-8 ${textSecondary}`}>Loading analytics...</div>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Billed" value={`Rs.${(totalBilled / 1000).toFixed(0)}K`} subtitle="Current academic year" color="text-green-400" />
        <MetricCard title="Collected" value={`Rs.${(totalCollected / 1000).toFixed(0)}K`} subtitle="Current academic year" color="text-green-400" />
        <MetricCard title="Pending" value={`Rs.${(totalPending / 1000).toFixed(0)}K`} subtitle="Billed - Collected" color="text-red-400" />
        <MetricCard title="Collection Rate" value={`${collectionRate}%`} subtitle="Fees collected vs billed" color="text-purple-400" />
      </div>
      )}

      {/* Revenue vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-xl border ${cardCls}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Revenue vs Expenses Trend</h3>
          <div className="h-64"><Line data={revenueData} options={chartOptions} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-6 rounded-xl border ${cardCls}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Collection by Payment Method</h3>
          <div className="h-64"><Doughnut data={collectionByMethod} options={pieOptions} /></div>
        </motion.div>
      </div>

      {/* Collection by Grade & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-6 rounded-xl border ${cardCls}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Collection by Grade Group</h3>
          <div className="h-64"><Bar data={collectionByGrade} options={chartOptions} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`p-6 rounded-xl border ${cardCls}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Expense Breakdown</h3>
          <div className="h-64"><Doughnut data={expenseBreakdown} options={pieOptions} /></div>
        </motion.div>
      </div>

      {/* Cash Flow & Revenue by Fee Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`p-6 rounded-xl border ${cardCls}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Monthly Cash Flow (in thousands)</h3>
          <div className="h-64"><Bar data={cashFlowData} options={chartOptions} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`p-6 rounded-xl border ${cardCls}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Revenue by Fee Type (in Lakhs)</h3>
          <div className="h-64"><Bar data={feeTypeRevenue} options={chartOptions} /></div>
        </motion.div>
      </div>

      {/* Key Financial Insights */}
      <div className={`p-6 rounded-xl border ${cardCls}`}>
        <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Key Financial Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
            <h4 className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>Positive Trends</h4>
            <ul className={`text-sm mt-2 space-y-1 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
              <li>- Collection rate improved by 3.1%</li>
              <li>- Online payments up by 15%</li>
              <li>- Late payments reduced by 8%</li>
            </ul>
          </div>
          <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
            <h4 className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>Areas of Attention</h4>
            <ul className={`text-sm mt-2 space-y-1 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
              <li>- Class 11-12 collection at 82%</li>
              <li>- Transport fee defaults rising</li>
              <li>- 23 accounts overdue &gt;60 days</li>
            </ul>
          </div>
          <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <h4 className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Recommendations</h4>
            <ul className={`text-sm mt-2 space-y-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
              <li>- Enable auto-pay for transport</li>
              <li>- Send targeted reminders for Class 11-12</li>
              <li>- Offer early payment discounts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className={`p-4 rounded-lg border ${cardCls}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-medium ${textPrimary}`}>Export Financial Report</h4>
            <p className={`text-sm ${textSecondary} mt-1`}>Download detailed financial data for further analysis</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className={`px-4 py-2 text-sm rounded-lg font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Export Excel</button>
            <button className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700">Generate PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
