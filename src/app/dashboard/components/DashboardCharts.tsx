'use client';

import React from 'react';
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

// Register Chart.js components
ChartJS.register(
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
);

interface DashboardChartsProps {
  theme: 'dark' | 'light';
  chartData: {
    overview: {
      studentGrowth: {
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          borderColor: string;
          backgroundColor: string;
          tension: number;
        }>;
      };
      feeCollection: {
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          backgroundColor: string;
        }>;
      };
      classDistribution: {
        labels: string[];
        datasets: Array<{
          data: number[];
          backgroundColor: string[];
        }>;
      };
      subjectPerformance: {
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          backgroundColor: string;
          borderColor: string;
        }>;
      };
      attendanceTrend: {
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          borderColor: string;
          backgroundColor: string;
          tension: number;
        }>;
      };
    };
  };
}

export default function DashboardCharts({ theme, chartData }: DashboardChartsProps) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: theme === 'dark' ? '#fff' : '#000'
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: theme === 'dark' ? '#fff' : '#000'
        },
        grid: {
          color: theme === 'dark' ? '#333' : '#ddd'
        }
      },
      x: {
        ticks: {
          color: theme === 'dark' ? '#fff' : '#000'
        },
        grid: {
          color: theme === 'dark' ? '#333' : '#ddd'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme === 'dark' ? '#fff' : '#000'
        }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: theme === 'dark' ? '#fff' : '#000'
        }
      }
    },
    scales: {
      r: {
        ticks: {
          color: theme === 'dark' ? '#fff' : '#000'
        },
        grid: {
          color: theme === 'dark' ? '#333' : '#ddd'
        },
        pointLabels: {
          color: theme === 'dark' ? '#fff' : '#000'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Row - Student Growth and Fee Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Student Growth Trend
          </h3>
          <div className="h-64">
            <Line data={chartData.overview.studentGrowth} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Fee Collection Overview
          </h3>
          <div className="h-64">
            <Bar data={chartData.overview.feeCollection} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Middle Row - Class Distribution and Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Class Distribution
          </h3>
          <div className="h-64">
            <Doughnut data={chartData.overview.classDistribution} options={pieOptions} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Subject Performance
          </h3>
          <div className="h-64">
            <Radar data={chartData.overview.subjectPerformance} options={radarOptions} />
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Attendance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Attendance Trend (Last 30 Days)
        </h3>
        <div className="h-64">
          <Line data={chartData.overview.attendanceTrend} options={chartOptions} />
        </div>
      </motion.div>
    </div>
  );
}
