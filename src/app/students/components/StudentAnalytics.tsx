// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
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
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { Student } from '../types';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale
);

interface StudentAnalyticsProps {
  theme: 'dark' | 'light';
  students: Student[];
  onClose: () => void;
}

export default function StudentAnalytics({ theme, students, onClose }: StudentAnalyticsProps) {
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'academic' | 'attendance' | 'behavioral' | 'financial'>('academic');

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

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: chartTextColor } } },
    scales: {
      r: {
        ticks: { color: chartTextColor, backdropColor: 'transparent' },
        grid: { color: chartGridColor },
        pointLabels: { color: chartTextColor }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' as const, labels: { color: chartTextColor } } }
  };

  // Computed analytics data
  const analytics = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    const totalStudents = activeStudents.length || 1;

    // Academic
    const avgGpa = activeStudents.reduce((sum, s) => sum + (s.academics?.gpa || 0), 0) / totalStudents;
    const gpaDistribution = { excellent: 0, good: 0, average: 0, belowAvg: 0, poor: 0 };
    activeStudents.forEach(s => {
      const gpa = s.academics?.gpa || 0;
      if (gpa >= 3.5) gpaDistribution.excellent++;
      else if (gpa >= 3.0) gpaDistribution.good++;
      else if (gpa >= 2.5) gpaDistribution.average++;
      else if (gpa >= 2.0) gpaDistribution.belowAvg++;
      else gpaDistribution.poor++;
    });

    const passRate = activeStudents.reduce((sum, s) => {
      const total = s.academics?.totalSubjects || 1;
      const passed = s.academics?.passedSubjects || 0;
      return sum + (passed / total);
    }, 0) / totalStudents * 100;

    // Attendance
    const avgAttendance = activeStudents.reduce((sum, s) => sum + (s.attendance?.percentage || 0), 0) / totalStudents;
    const lowAttendance = activeStudents.filter(s => (s.attendance?.percentage || 0) < 75).length;
    const perfectAttendance = activeStudents.filter(s => (s.attendance?.percentage || 0) >= 95).length;

    // Class-wise attendance
    const classAttendance: Record<string, { total: number; sum: number }> = {};
    activeStudents.forEach(s => {
      if (!classAttendance[s.class]) classAttendance[s.class] = { total: 0, sum: 0 };
      classAttendance[s.class].total++;
      classAttendance[s.class].sum += s.attendance?.percentage || 0;
    });

    // Behavioral
    const avgDiscipline = activeStudents.reduce((sum, s) => sum + (s.behavior?.disciplineScore || 0), 0) / totalStudents;
    const totalIncidents = activeStudents.reduce((sum, s) => sum + (s.behavior?.incidents || 0), 0);
    const totalAchievements = activeStudents.reduce((sum, s) => sum + (s.behavior?.achievements || 0), 0);

    // Financial
    const totalFees = activeStudents.reduce((sum, s) => sum + (s.fees?.total || 0), 0);
    const totalPaid = activeStudents.reduce((sum, s) => sum + (s.fees?.paid || 0), 0);
    const totalPending = activeStudents.reduce((sum, s) => {
      // Ensure we're using the correct pending amount that includes discount
      const studentPending = s.fees?.pending || 0;
      return sum + studentPending;
    }, 0);
    const collectionRate = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;
    const feeDefaulters = activeStudents.filter(s => (s.fees?.pending || 0) > 0).length;

    // Gender distribution
    const genderDist = { male: 0, female: 0, other: 0 };
    activeStudents.forEach(s => {
      if (s.gender === 'Male') genderDist.male++;
      else if (s.gender === 'Female') genderDist.female++;
      else genderDist.other++;
    });

    return {
      avgGpa, gpaDistribution, passRate,
      avgAttendance, lowAttendance, perfectAttendance, classAttendance,
      avgDiscipline, totalIncidents, totalAchievements,
      totalFees, totalPaid, totalPending, collectionRate, feeDefaulters,
      genderDist, totalStudents
    };
  }, [students]);

  // Chart data builders
  const academicCharts = {
    gpaDistribution: {
      labels: ['Excellent (3.5+)', 'Good (3.0-3.5)', 'Average (2.5-3.0)', 'Below Avg (2.0-2.5)', 'Poor (<2.0)'],
      datasets: [{
        data: [analytics.gpaDistribution.excellent, analytics.gpaDistribution.good, analytics.gpaDistribution.average, analytics.gpaDistribution.belowAvg, analytics.gpaDistribution.poor],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(156, 163, 175, 0.8)']
      }]
    },
    subjectPerformance: {
      labels: Object.keys(analytics.classAttendance).length ? Object.keys(analytics.classAttendance).sort() : ['No data'],
      datasets: [{
        label: 'Avg Attendance %',
        data: Object.keys(analytics.classAttendance).length
          ? Object.keys(analytics.classAttendance).sort().map(cls => +(analytics.classAttendance[cls].sum / analytics.classAttendance[cls].total).toFixed(1))
          : [0],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }]
    },
    gradeWiseGPA: {
      labels: Object.keys(analytics.classAttendance).sort(),
      datasets: [{
        label: 'Average GPA',
        data: Object.keys(analytics.classAttendance).sort().map(cls => {
          const classStudents = students.filter(s => s.class === cls && s.status === 'active');
          if (!classStudents.length) return 0;
          return +(classStudents.reduce((sum, s) => sum + (s.academics?.gpa || 0), 0) / classStudents.length).toFixed(2);
        }),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4
      }]
    },
    performanceRadar: {
      labels: Object.keys(analytics.classAttendance).sort().slice(0, 6),
      datasets: [
        {
          label: 'Avg GPA',
          data: Object.keys(analytics.classAttendance).sort().slice(0, 6).map(cls => {
            const cs = students.filter(s => s.class === cls && s.status === 'active');
            return cs.length ? +(cs.reduce((sum, s) => sum + (s.academics?.gpa || 0), 0) / cs.length).toFixed(2) : 0;
          }),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)'
        },
        {
          label: 'Avg Attendance %',
          data: Object.keys(analytics.classAttendance).sort().slice(0, 6).map(cls => +(analytics.classAttendance[cls].sum / analytics.classAttendance[cls].total / 25).toFixed(2)),
          backgroundColor: 'rgba(156, 163, 175, 0.2)',
          borderColor: 'rgb(156, 163, 175)'
        }
      ]
    }
  };

  const attendanceCharts = {
    monthlyTrend: {
      labels: Object.keys(analytics.classAttendance).sort(),
      datasets: [{
        label: 'Avg Attendance %',
        data: Object.keys(analytics.classAttendance).sort().map(cls => +(analytics.classAttendance[cls].sum / analytics.classAttendance[cls].total).toFixed(1)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }]
    },
    classWise: {
      labels: Object.keys(analytics.classAttendance).sort(),
      datasets: [{
        label: 'Avg Attendance %',
        data: Object.keys(analytics.classAttendance).sort().map(cls => (analytics.classAttendance[cls].sum / analytics.classAttendance[cls].total).toFixed(1)),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }]
    },
    distribution: {
      labels: ['95%+', '85-95%', '75-85%', '<75%'],
      datasets: [{
        data: [
          students.filter(s => (s.attendance?.percentage || 0) >= 95).length,
          students.filter(s => { const p = s.attendance?.percentage || 0; return p >= 85 && p < 95; }).length,
          students.filter(s => { const p = s.attendance?.percentage || 0; return p >= 75 && p < 85; }).length,
          students.filter(s => (s.attendance?.percentage || 0) < 75).length
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(239, 68, 68, 0.8)']
      }]
    }
  };

  const behavioralCharts = {
    disciplineScore: {
      labels: Object.keys(analytics.classAttendance).sort(),
      datasets: [{
        label: 'Avg Discipline Score',
        data: Object.keys(analytics.classAttendance).sort().map(cls => {
          const cs = students.filter(s => s.class === cls && s.status === 'active');
          return cs.length ? +(cs.reduce((sum, s) => sum + (s.behavior?.disciplineScore || 0), 0) / cs.length).toFixed(1) : 0;
        }),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4
      }]
    },
    incidentTypes: {
      labels: analytics.totalIncidents > 0 ? ['Incidents'] : ['No data'],
      datasets: [{
        data: analytics.totalIncidents > 0 ? [analytics.totalIncidents] : [1],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(251, 191, 36, 0.8)',
          'rgba(59, 130, 246, 0.8)', 'rgba(147, 51, 234, 0.8)', 'rgba(156, 163, 175, 0.8)'
        ]
      }]
    }
  };

  const financialCharts = {
    collectionTrend: {
      labels: ['Collected %', 'Pending %'],
      datasets: [
        { label: 'Current', data: [+analytics.collectionRate.toFixed(1), +(100 - analytics.collectionRate).toFixed(1)], backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'] },
      ]
    },
    feeDistribution: {
      labels: analytics.totalPaid > 0 ? ['Paid', 'Pending'] : ['No data'],
      datasets: [{
        data: analytics.totalPaid > 0 ? [analytics.totalPaid, analytics.totalPending] : [1],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(156, 163, 175, 0.8)']
      }]
    }
  };

  const tabs = [
    { id: 'academic', label: 'Academic Performance' },
    { id: 'attendance', label: 'Attendance Patterns' },
    { id: 'behavioral', label: 'Behavioral Analysis' },
    { id: 'financial', label: 'Financial Analysis' }
  ];

  const MetricCard = ({ title, value, subtitle, color }: { title: string; value: string | number; subtitle: string; color: string }) => (
    <div className={`p-4 rounded-lg border ${cardCls}`}>
      <p className={`text-sm ${textSecondary}`}>{title}</p>
      <p className={`text-2xl font-bold ${textPrimary}`}>{value}</p>
      <p className={`text-xs mt-1 ${color}`}>{subtitle}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Student Analytics</h2>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveAnalyticsTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeAnalyticsTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Academic Performance Tab */}
      {activeAnalyticsTab === 'academic' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="Average GPA" value={analytics.avgGpa.toFixed(2)} subtitle={`Out of 4.0`} color="text-blue-400" />
            <MetricCard title="Pass Rate" value={`${analytics.passRate.toFixed(1)}%`} subtitle="Students passing all subjects" color="text-green-400" />
            <MetricCard title="Top Performers" value={analytics.gpaDistribution.excellent} subtitle="GPA 3.5 and above" color="text-purple-400" />
            <MetricCard title="Needs Support" value={analytics.gpaDistribution.poor + analytics.gpaDistribution.belowAvg} subtitle="GPA below 2.5" color="text-red-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>GPA Distribution</h3>
              <div className="h-64"><Doughnut data={academicCharts.gpaDistribution} options={pieOptions} /></div>
            </div>
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Subject-wise Average</h3>
              <div className="h-64"><Bar data={academicCharts.subjectPerformance} options={chartOptions} /></div>
            </div>
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Grade-wise GPA Trend</h3>
              <div className="h-64"><Line data={academicCharts.gradeWiseGPA} options={chartOptions} /></div>
            </div>
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Term Comparison</h3>
              <div className="h-64"><Radar data={academicCharts.performanceRadar} options={radarOptions} /></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Attendance Patterns Tab */}
      {activeAnalyticsTab === 'attendance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="Avg Attendance" value={`${analytics.avgAttendance.toFixed(1)}%`} subtitle="Current academic year" color="text-green-400" />
            <MetricCard title="Perfect Attendance" value={analytics.perfectAttendance} subtitle="95% and above" color="text-blue-400" />
            <MetricCard title="Low Attendance" value={analytics.lowAttendance} subtitle="Below 75% - needs attention" color="text-red-400" />
            <MetricCard title="Total Students" value={analytics.totalStudents} subtitle="Active students tracked" color="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Monthly Attendance Trend</h3>
              <div className="h-64"><Line data={attendanceCharts.monthlyTrend} options={chartOptions} /></div>
            </div>
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Class-wise Attendance</h3>
              <div className="h-64"><Bar data={attendanceCharts.classWise} options={chartOptions} /></div>
            </div>
            <div className={`p-6 rounded-xl border ${cardCls} lg:col-span-2`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Attendance Distribution</h3>
              <div className="h-64"><Doughnut data={attendanceCharts.distribution} options={pieOptions} /></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Behavioral Analysis Tab */}
      {activeAnalyticsTab === 'behavioral' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="Avg Discipline Score" value={analytics.avgDiscipline.toFixed(1)} subtitle="Out of 10" color="text-blue-400" />
            <MetricCard title="Total Incidents" value={analytics.totalIncidents} subtitle="This academic year" color="text-red-400" />
            <MetricCard title="Achievements" value={analytics.totalAchievements} subtitle="Awards and recognitions" color="text-green-400" />
            <MetricCard title="Students Tracked" value={analytics.totalStudents} subtitle="Active students" color="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Discipline Score by Class</h3>
              <div className="h-64"><Line data={behavioralCharts.disciplineScore} options={chartOptions} /></div>
            </div>
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Incident Types</h3>
              <div className="h-64"><Doughnut data={behavioralCharts.incidentTypes} options={pieOptions} /></div>
            </div>
          </div>

          {/* Recent Incidents List */}
          <div className={`p-6 rounded-xl border ${cardCls}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Recent Incidents</h3>
            <div className="space-y-3">
              {([] as { student: string; type: string; description: string; severity: string; date: string }[]).map((incident, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${incident.severity === 'high' ? 'bg-red-500' : incident.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className={`font-medium ${textPrimary}`}>{incident.student}</p>
                      <p className={`text-sm ${textSecondary}`}>{incident.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>{incident.type}</span>
                    <p className={`text-xs mt-1 ${textSecondary}`}>{incident.date}</p>
                  </div>
                </div>
              ))}
              {([] as any[]).length === 0 && (
                <p className={`text-sm text-center py-4 ${textSecondary}`}>No incidents recorded</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Financial Analysis Tab */}
      {activeAnalyticsTab === 'financial' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="Total Fees" value={`Rs.${(analytics.totalFees / 100000).toFixed(1)}L`} subtitle="Current academic year" color="text-blue-400" />
            <MetricCard title="Collected" value={`Rs.${(analytics.totalPaid / 100000).toFixed(1)}L`} subtitle={`${analytics.collectionRate.toFixed(1)}% collection rate`} color="text-green-400" />
            <MetricCard title="Pending" value={`Rs.${(analytics.totalPending / 100000).toFixed(1)}L`} subtitle={`${analytics.feeDefaulters} defaulters`} color="text-red-400" />
            <MetricCard title="Collection Rate" value={`${analytics.collectionRate.toFixed(1)}%`} subtitle="Overall efficiency" color="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Collection Trend</h3>
              <div className="h-64"><Line data={financialCharts.collectionTrend} options={chartOptions} /></div>
            </div>
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Fee Distribution</h3>
              <div className="h-64"><Doughnut data={financialCharts.feeDistribution} options={pieOptions} /></div>
            </div>
          </div>

          {/* Top Defaulters */}
          <div className={`p-6 rounded-xl border ${cardCls}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Top Fee Defaulters</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Student</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Class</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Total</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Paid</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Pending</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => (s.fees?.pending || 0) > 0).sort((a, b) => (b.fees?.pending || 0) - (a.fees?.pending || 0)).slice(0, 10).map((s, i) => (
                    <tr key={i} className={`${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                      <td className={`py-3 px-4 ${textPrimary}`}>{s.name}</td>
                      <td className={`py-3 px-4 ${textSecondary}`}>{s.class}</td>
                      <td className={`py-3 px-4 text-right ${textPrimary}`}>Rs.{s.fees?.total?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-green-500">Rs.{s.fees?.paid?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-red-500">Rs.{s.fees?.pending?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${(s.fees?.pending || 0) > (s.fees?.total || 1) * 0.5 ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                          {(s.fees?.pending || 0) > (s.fees?.total || 1) * 0.5 ? 'Critical' : 'Overdue'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
