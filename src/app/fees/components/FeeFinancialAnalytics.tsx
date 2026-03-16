// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import DiscountAnalytics from './discount/DiscountAnalytics';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

interface FeeFinancialAnalyticsProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
}

export default function FeeFinancialAnalytics({ theme, onClose }: FeeFinancialAnalyticsProps) {
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

  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('yearly');
  
  // Additional filtering state
  const [academicYear, setAcademicYear] = useState('all');
  const [studentClass, setStudentClass] = useState('all');
  
  // Dynamic dropdown data
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Calculate date range based on selected period
  const calculateDateRange = useCallback(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    if (selectedPeriod === 'daily') {
      // Today
      return {
        fromDate: today.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0]
      };
    } else if (selectedPeriod === 'weekly') {
      // Current week (Sunday to Saturday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        fromDate: startOfWeek.toISOString().split('T')[0],
        toDate: endOfWeek.toISOString().split('T')[0]
      };
    } else if (selectedPeriod === 'monthly') {
      // Current month
      return {
        fromDate: `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}-01`,
        toDate: `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}-31`
      };
    } else if (selectedPeriod === 'quarterly') {
      // Current quarter
      const quarter = Math.floor(today.getMonth() / 3);
      const startMonth = quarter * 3 + 1;
      const endMonth = startMonth + 2;
      return {
        fromDate: `${currentYear}-${String(startMonth).padStart(2, '0')}-01`,
        toDate: `${currentYear}-${String(endMonth).padStart(2, '0')}-31`
      };
    } else if (selectedPeriod === 'yearly') {
      // Current year
      return {
        fromDate: `${currentYear}-01-01`,
        toDate: `${currentYear}-12-31`
      };
    }
    
    // Default to current year
    return {
      fromDate: `${currentYear}-01-01`,
      toDate: `${currentYear}-12-31`
    };
  }, [selectedPeriod]);

  useEffect(() => {
    (async () => {
      try {
        // Build API parameters for date range filtering
        const params = new URLSearchParams();
        
        if (academicYear !== 'all') {
          params.append('academicYear', academicYear);
        }
        
        if (studentClass !== 'all') {
          params.append('class', studentClass);
        }
        
        // Use calculated date range from period selector
        const dateRange = calculateDateRange();
        params.append('fromDate', dateRange.fromDate);
        params.append('toDate', dateRange.toDate);
        
        const response = await fetch(`/api/fees/statistics?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setStatisticsData(result.data);
        } else {
          console.error('Failed to load statistics data:', result.error);
        }
      } catch (e) { 
        console.error('Failed to load analytics data', e); 
      }
      finally { 
        setLoading(false); 
      }
    })();
  }, [academicYear, studentClass, selectedPeriod, calculateDateRange]);

  // Load dropdown data from existing APIs
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        
        // Load academic years
        const academicYearsResponse = await fetch('/api/school-structure/academic-years');
        const academicYearsData = await academicYearsResponse.json();
        
        // Load classes
        const classesResponse = await fetch('/api/school-structure/classes');
        const classesData = await classesResponse.json();
        
        setAcademicYears(academicYearsData.academicYears || []);
        setClasses(classesData.classes || []);
      } catch (error) {
        console.error('Failed to load dropdown data:', error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  // Use statistics API data or fall back to zeros
  const totalBilled = useMemo(() => statisticsData?.totalFees || 0, [statisticsData]);
  const totalCollected = useMemo(() => statisticsData?.totalCollected || 0, [statisticsData]);
  const totalPending = useMemo(() => statisticsData?.totalPending || 0, [statisticsData]);
  const collectionRate = useMemo(() => {
    if (totalBilled > 0) {
      return ((totalCollected / totalBilled) * 100).toFixed(1);
    }
    return '0';
  }, [totalBilled, totalCollected]);

  // Dynamic chart data based on selected period
  const chartData = useMemo(() => {
    if (!statisticsData) {
      return { labels: [], datasets: [{ data: [] }] };
    }

    const today = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (selectedPeriod === 'daily') {
      // Show today's data
      labels = ['Today'];
      data = [statisticsData.totalCollected || 0];
    } else if (selectedPeriod === 'weekly') {
      // Show weekly breakdown (simplified - distribute weekly total)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyTotal = statisticsData.totalCollected || 0;
      const dailyAverage = weeklyTotal / 7;
      labels = weekDays;
      data = Array(7).fill(dailyAverage);
    } else if (selectedPeriod === 'monthly') {
      // Show monthly breakdown (simplified - distribute monthly total)
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const monthlyTotal = statisticsData.totalCollected || 0;
      const dailyAverage = monthlyTotal / daysInMonth;
      labels = Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => `${i + 1}`);
      data = Array(Math.min(daysInMonth, 30)).fill(dailyAverage);
    } else if (selectedPeriod === 'quarterly') {
      // Show quarterly breakdown (use monthlyTrend if available, otherwise distribute)
      const quarter = Math.floor(today.getMonth() / 3);
      const quarterMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const quarterLabels = quarterMonths.slice(quarter * 3, quarter * 3 + 3);
      
      if (statisticsData.monthlyTrend && statisticsData.monthlyTrend.length > 0) {
        // Use actual monthly trend data
        data = quarterLabels.map((_, i) => {
          const monthIndex = quarter * 3 + i + 1;
          const monthData = statisticsData.monthlyTrend.find((item: any) => item.month === monthIndex);
          return monthData?.amount || 0;
        });
      } else {
        // Distribute quarterly total evenly
        const quarterlyTotal = statisticsData.totalCollected || 0;
        data = Array(3).fill(quarterlyTotal / 3);
      }
      labels = quarterLabels;
    } else {
      // Yearly - show all 12 months
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      if (statisticsData.monthlyTrend && statisticsData.monthlyTrend.length > 0) {
        // Use actual monthly trend data
        data = monthLabels.map((_, i) => {
          const monthData = statisticsData.monthlyTrend.find((item: any) => item.month === i + 1);
          return monthData?.amount || 0;
        });
      } else {
        // Distribute yearly total evenly
        const yearlyTotal = statisticsData.totalCollected || 0;
        data = Array(12).fill(yearlyTotal / 12);
      }
      labels = monthLabels;
    }

    return {
      labels,
      datasets: [
        { 
          label: 'Collected', 
          data, 
          borderColor: 'rgb(34, 197, 94)', 
          backgroundColor: 'rgba(34, 197, 94, 0.1)', 
          tension: 0.4 
        },
      ]
    };
  }, [statisticsData, selectedPeriod]);

  // Collection by payment method from API data
  const methodCounts = useMemo(() => {
    if (statisticsData?.paymentMethodBreakdown) {
      const mc: Record<string, number> = {};
      statisticsData.paymentMethodBreakdown.forEach((item: any) => {
        mc[item.paymentMethod || 'Other'] = item.totalAmount || 0;
      });
      return mc;
    }
    return {};
  }, [statisticsData]);
  
  const collectionByMethod = {
    labels: Object.keys(methodCounts).length ? Object.keys(methodCounts) : ['No data'],
    datasets: [{
      data: Object.keys(methodCounts).length ? Object.values(methodCounts) : [1],
      backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)', 'rgba(251,146,60,0.8)', 'rgba(147,51,234,0.8)', 'rgba(236,72,153,0.8)', 'rgba(20,184,166,0.8)']
    }]
  };

  // Collection by fee category from API data (using classBreakdown)
  const categoryCounts = useMemo(() => {
    if (statisticsData?.classBreakdown) {
      const cc: Record<string, { collected: number; pending: number }> = {};
      statisticsData.classBreakdown.forEach((item: any) => {
        cc[item.class || 'other'] = {
          collected: item.totalPaid || 0,
          pending: item.totalPending || 0
        };
      });
      return cc;
    }
    return {};
  }, [statisticsData]);
  
  const catLabels = Object.keys(categoryCounts).length ? Object.keys(categoryCounts) : ['No data'];
  const feeTypeRevenue = {
    labels: catLabels,
    datasets: [{
      label: 'Collected (in Lakhs)',
      data: Object.keys(categoryCounts).length ? Object.values(categoryCounts).map(c => c.collected / 100000) : [0], // Convert to lakhs
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
    if (statisticsData?.paymentStatusBreakdown) {
      const sc: Record<string, number> = {};
      statisticsData.paymentStatusBreakdown.forEach((item: any) => {
        sc[item.status || 'unknown'] = item.count || 0;
      });
      return sc;
    }
    return {};
  }, [statisticsData]);
  const expenseBreakdown = {
    labels: Object.keys(statusCounts).length ? Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)) : ['No data'],
    datasets: [{
      data: Object.keys(statusCounts).length ? Object.values(statusCounts) : [1],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(251,191,36,0.8)', 'rgba(239,68,68,0.8)', 'rgba(59,130,246,0.8)', 'rgba(147,51,234,0.8)', 'rgba(156,163,175,0.8)']
    }]
  };

  // Cash flow data in thousands (as indicated by the chart title)
  const cashFlowData = useMemo(() => {
    const cashFlowInThousands = chartData.datasets[0]?.data?.map((amount: number) => amount / 1000) || [];
    return {
      labels: chartData.labels,
      datasets: [
        { 
          label: 'Collections (in thousands)', 
          data: cashFlowInThousands,
          backgroundColor: 'rgba(34, 197, 94, 0.8)' 
        },
      ]
    };
  }, [chartData]);

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
          {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map(period => (
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

      {/* Additional Filters */}
      <div className={`mt-4 p-4 rounded-lg border ${cardCls}`}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div>
              <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                disabled={loadingDropdowns}
                className={`px-3 py-2 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${loadingDropdowns ? 'opacity-50' : ''}`}
              >
                <option value="all">All Years</option>
                {academicYears.map((year: any) => (
                  <option key={year.id} value={year.year}>
                    {year.year} {year.isActive && '(Active)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Class</label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                disabled={loadingDropdowns}
                className={`px-3 py-2 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${loadingDropdowns ? 'opacity-50' : ''}`}
              >
                <option value="all">All Classes</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name} {cls.level && `(Level ${cls.level})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAcademicYear('all');
                setStudentClass('all');
                setSelectedPeriod('yearly');
              }}
              className={`px-4 py-2 rounded text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        <div className={`mt-3 text-sm ${textSecondary}`}>
          {statisticsData ? `Analytics for ${statisticsData.totalStudents} students` : 'Loading data...'}
          <span className="ml-2">({selectedPeriod})</span>
        </div>
      </div>

      {/* Metric Cards */}
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
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Collection Trend ({selectedPeriod})</h3>
          <div className="h-64"><Line data={chartData} options={chartOptions} /></div>
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

      {/* Discount Analytics Section */}
      <div className="mt-8">
        <div className={`mb-4 p-4 rounded-lg border ${cardCls}`}>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>💰 Discount Analytics & Reports</h2>
          <p className={`text-sm ${textSecondary} mt-1`}>Comprehensive discount request analytics and financial impact analysis</p>
        </div>
        <DiscountAnalytics theme={theme} />
      </div>

      {/* Export Options */}
      <div className={`p-4 rounded-lg border ${cardCls} mt-6`}>
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
