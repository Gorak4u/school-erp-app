// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface AcademicModalProps {
  academicPerformance: any; analyzePerformance: any; generateTrendAnalysis: any; getPerformanceColor: any; selectedStudents: any; setAcademicPerformance: any; theme: any;
}

export default function AcademicModal({ academicPerformance, analyzePerformance, generateTrendAnalysis, getPerformanceColor, selectedStudents, setAcademicPerformance, theme }: AcademicModalProps) {
  return (
    <>
      {/* Academic Performance Modal */}
      <AnimatePresence>
        {academicPerformance.showAcademicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={() => setAcademicPerformance(prev => ({ ...prev, showAcademicModal: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      📈 Academic Performance Tracking
                    </h3>
                    <button
                      onClick={() => setAcademicPerformance(prev => ({ ...prev, showAcademicModal: false }))}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {/* Controls */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <select
                      value={academicPerformance.selectedTerm}
                      onChange={(e) => setAcademicPerformance(prev => ({ ...prev, selectedTerm: e.target.value as any }))}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="current">Current Term</option>
                      <option value="previous">Previous Term</option>
                      <option value="all">All Terms</option>
                    </select>
                    <select
                      value={academicPerformance.selectedSubject}
                      onChange={(e) => setAcademicPerformance(prev => ({ ...prev, selectedSubject: e.target.value }))}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Subjects</option>
                      <option value="mathematics">Mathematics</option>
                      <option value="science">Science</option>
                      <option value="english">English</option>
                      <option value="history">History</option>
                      <option value="computer">Computer Science</option>
                    </select>
                    <button
                      onClick={() => {
                        if (selectedStudents.length > 0) {
                          selectedStudents.forEach(studentId => {
                            analyzePerformance(studentId);
                            generateTrendAnalysis(studentId);
                          });
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      🔄 Analyze Performance
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                      {/* Performance Overview */}
                      <div className="lg:col-span-1 space-y-4">
                        {/* Overall GPA */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Overall Performance
                          </h4>
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="text-center">
                              <div className={`text-3xl font-bold ${
                                getPerformanceColor(academicPerformance.gradeAnalytics.overallGPA * 25)
                              }`}>
                                {academicPerformance.gradeAnalytics.overallGPA.toFixed(2)}
                              </div>
                              <div className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                GPA
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Class Ranking */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Class Ranking
                          </h4>
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                #{academicPerformance.gradeAnalytics.classRanking.currentRank}
                              </div>
                              <div className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                of {academicPerformance.gradeAnalytics.classRanking.totalStudents}
                              </div>
                              <div className={`text-xs mt-1 ${
                                academicPerformance.gradeAnalytics.classRanking.rankChange > 0 
                                  ? 'text-green-500' 
                                  : academicPerformance.gradeAnalytics.classRanking.rankChange < 0 
                                    ? 'text-red-500' 
                                    : 'text-gray-500'
                              }`}>
                                {academicPerformance.gradeAnalytics.classRanking.rankChange > 0 ? '↑' : 
                                 academicPerformance.gradeAnalytics.classRanking.rankChange < 0 ? '↓' : '→'} 
                                {Math.abs(academicPerformance.gradeAnalytics.classRanking.rankChange)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Strengths */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Strengths
                          </h4>
                          <div className="space-y-2">
                            {academicPerformance.gradeAnalytics.strengths.map((strength, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {strength.subject}
                                </div>
                                <div className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {strength.score.toFixed(1)}% - {strength.grade}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Subject-wise Performance */}
                      <div className="lg:col-span-2 space-y-4">
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Subject-wise Performance
                          </h4>
                          <div className={`rounded-lg border overflow-hidden ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-white border-gray-200'
                          }`}>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className={`${
                                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                                }`}>
                                  <tr>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Subject</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Average</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Grade</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Trend</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Assessments</th>
                                  </tr>
                                </thead>
                                <tbody className={`divide-y ${
                                  theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                                }`}>
                                  {academicPerformance.gradeAnalytics.subjectWisePerformance.map((subject, index) => (
                                    <tr key={index} className={`${
                                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                    }`}>
                                      <td className={`px-4 py-3 text-sm font-medium ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                      }`}>
                                        {subject.subject}
                                      </td>
                                      <td className={`px-4 py-3 text-sm ${getPerformanceColor(subject.averageScore)}`}>
                                        {subject.averageScore.toFixed(1)}%
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                          subject.grade === 'A+' || subject.grade === 'A' ? 'bg-green-100 text-green-800' :
                                          subject.grade === 'B+' || subject.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                          subject.grade === 'C+' || subject.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {subject.grade}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 text-xs ${
                                          subject.trend === 'improving' ? 'text-green-500' :
                                          subject.trend === 'declining' ? 'text-red-500' : 'text-gray-500'
                                        }`}>
                                          {subject.trend === 'improving' ? '↑' :
                                           subject.trend === 'declining' ? '↓' : '→'}
                                          {subject.trend}
                                        </span>
                                      </td>
                                      <td className={`px-4 py-3 text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {subject.assessments}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Areas for Improvement */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Areas for Improvement
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {academicPerformance.gradeAnalytics.improvements.map((improvement, index) => (
                              <div
                                key={index}
                                className={`p-4 rounded-lg border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-sm font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {improvement.subject}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    improvement.grade === 'D' || improvement.grade === 'F' 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {improvement.grade}
                                  </span>
                                </div>
                                <div className={`text-xs mb-2 ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Current: {improvement.score.toFixed(1)}%
                                </div>
                                <div className="space-y-1">
                                  {improvement.suggestedActions.slice(0, 2).map((action, actionIndex) => (
                                    <div key={actionIndex} className={`text-xs ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      • {action}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Predictive Analysis */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Predictive Analysis
                          </h4>
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className={`text-sm font-medium mb-1 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  Next Term GPA Prediction
                                </div>
                                <div className={`text-2xl font-bold ${getPerformanceColor(academicPerformance.trendAnalysis.predictiveAnalysis.nextTermGPA * 25)}`}>
                                  {academicPerformance.trendAnalysis.predictiveAnalysis.nextTermGPA.toFixed(2)}
                                </div>
                                <div className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Confidence: {(academicPerformance.trendAnalysis.predictiveAnalysis.confidenceLevel * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div>
                                <div className={`text-sm font-medium mb-2 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  Recommendations
                                </div>
                                <div className="space-y-1">
                                  {academicPerformance.trendAnalysis.predictiveAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                                    <div key={index} className={`text-xs ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      • {rec}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
