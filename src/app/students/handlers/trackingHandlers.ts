// @ts-nocheck
import { Student } from '../types';

export function createTrackingHandlers(ctx: any) {
  // Destructure all needed state from context
  const { academicPerformance, attendanceTracking, setAcademicPerformance, setAttendanceTracking, setStudents, students } = ctx;

  // Attendance Tracking Functions
  const markAttendance = async (studentId: number, method: 'biometric' | 'rfid' | 'manual' | 'mobile', location?: { latitude: number; longitude: number }) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    const date = now.toISOString().split('T')[0];
    
    // Check if within geofence
    const isWithinGeofence = location ? checkGeofence(location) : true;
    
    // Determine attendance status based on time
    let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
    const entryTime = parseTime(currentTime);
    const allowedEntryEnd = parseTime(attendanceTracking.geoFenceSettings.allowedEntryTime.end);
    const gracePeriod = attendanceTracking.geoFenceSettings.gracePeriod;
    
    if (entryTime > allowedEntryEnd + gracePeriod) {
      status = 'late';
    }
    
    // Simulate biometric verification
    const biometricData = method === 'biometric' ? {
      facialRecognition: Math.random() > 0.1,
      fingerprintMatch: Math.random() > 0.05,
      confidence: 0.85 + Math.random() * 0.15
    } : {
      facialRecognition: false,
      fingerprintMatch: false,
      confidence: 0
    };

    const attendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      date,
      checkInTime: currentTime,
      checkOutTime: '',
      status,
      method,
      location: {
        latitude: location?.latitude || 28.6139,
        longitude: location?.longitude || 77.2090,
        address: location ? 'School Campus' : 'Manual Entry',
        isWithinGeofence
      },
      biometricData,
      deviceInfo: {
        deviceId: method === 'mobile' ? 'mobile_app' : method === 'rfid' ? 'rfid_reader_01' : 'biometric_terminal_01',
        deviceType: method,
        ipAddress: '192.168.1.100'
      },
      verifiedBy: 'System',
      remarks: '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Update attendance records
    setAttendanceTracking(prev => ({
      ...prev,
      attendanceRecords: [...prev.attendanceRecords, attendanceRecord],
      realTimeAttendance: prev.realTimeAttendance.map(rt => 
        rt.studentId === studentId 
          ? { ...rt, status, lastSeen: now.toISOString(), location: attendanceRecord.location.address }
          : rt
      )
    }));

    // Update student attendance stats
    setStudents(prev => prev.map(s => 
      s.id === studentId 
        ? {
            ...s,
            attendance: {
              ...s.attendance,
              present: (status === 'present' || status === 'late') ? s.attendance.present + 1 : s.attendance.present,
              absent: 0, // Absent is handled separately, not in markAttendance
              late: status === 'late' ? s.attendance.late + 1 : s.attendance.late,
              percentage: calculateAttendancePercentage(s.id)
            }
          }
        : s
    ));

    // Send notification if needed
    if (status === 'late') {
      createAttendanceNotification(studentId, status);
    }
  };

  const checkGeofence = (location: { latitude: number; longitude: number }): boolean => {
    const center = attendanceTracking.geoFenceSettings.center;
    const radius = attendanceTracking.geoFenceSettings.radius;
    
    // Calculate distance using Haversine formula
    const R = 6371000; // Earth's radius in meters
    const dLat = (location.latitude - center.latitude) * Math.PI / 180;
    const dLon = (location.longitude - center.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(center.latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance <= radius;
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculateAttendancePercentage = (studentId: number): number => {
    const studentRecords = attendanceTracking.attendanceRecords.filter(r => r.studentId === studentId);
    if (studentRecords.length === 0) return 95; // Default percentage
    
    const presentCount = studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    return Math.round((presentCount / studentRecords.length) * 100);
  };

  const createAttendanceNotification = (studentId: number, status: 'late' | 'absent') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const type: 'absence_alert' | 'late_arrival' = status === 'late' ? 'late_arrival' : 'absence_alert';
    const severity: 'medium' | 'high' = status === 'late' ? 'medium' : 'high';
    
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      studentId,
      message: status === 'late' 
        ? `${student.name} arrived late today`
        : `${student.name} is absent today`,
      severity,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setAttendanceTracking(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications]
    }));
  };

  const bulkMarkAttendance = async (studentIds: number[], status: 'present' | 'absent' | 'late') => {
    for (const studentId of studentIds) {
      await markAttendance(studentId, 'manual');
      // Update status if needed
      setAttendanceTracking(prev => ({
        ...prev,
        attendanceRecords: prev.attendanceRecords.map(record => 
          record.studentId === studentId && record.date === prev.selectedDate
            ? { ...record, status, updatedAt: new Date().toISOString() }
            : record
        )
      }));
    }
  };

  const generateAttendanceReport = (startDate: string, endDate: string) => {
    const records = attendanceTracking.attendanceRecords.filter(record => 
      record.date >= startDate && record.date <= endDate
    );

    const report = {
      period: { startDate, endDate },
      summary: {
        totalDays: records.length,
        totalStudents: students.length,
        averageAttendance: 0,
        presentRate: 0,
        absentRate: 0,
        lateRate: 0
      },
      studentBreakdown: students.map(student => {
        const studentRecords = records.filter(r => r.studentId === student.id);
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        
        return {
          studentId: student.id,
          studentName: student.name,
          class: student.class,
          totalDays: studentRecords.length,
          present,
          absent,
          late,
          percentage: studentRecords.length > 0 ? Math.round((present / studentRecords.length) * 100) : 0
        };
      }),
      generatedAt: new Date().toISOString()
    };

    return report;
  };

  const getAttendanceStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceTracking.attendanceRecords.filter(r => r.date === today);
    
    return {
      total: students.length,
      present: todayRecords.filter(r => r.status === 'present').length,
      absent: todayRecords.filter(r => r.status === 'absent').length,
      late: todayRecords.filter(r => r.status === 'late').length,
      excused: todayRecords.filter(r => r.status === 'excused').length,
      percentage: students.length > 0 ? Math.round((todayRecords.filter(r => r.status === 'present' || r.status === 'late').length / students.length) * 100) : 0
    };
  };

  // Academic Performance Functions
  const calculateGrade = (percentage: number): string => {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 65) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const calculateGPA = (grade: string): number => {
    const gradePoints: { [key: string]: number } = {
      'A+': 4.0,
      'A': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'C+': 2.7,
      'C': 2.3,
      'D+': 2.0,
      'D': 1.7,
      'F': 0.0
    };
    return gradePoints[grade] || 0;
  };

  const analyzePerformance = (studentId: number) => {
    const studentData = academicPerformance.performanceData.filter(d => d.studentId === studentId);
    
    if (studentData.length === 0) return;

    // Calculate overall GPA
    const totalWeightedScore = studentData.reduce((sum, data) => sum + (data.score * data.weightage), 0);
    const totalWeightage = studentData.reduce((sum, data) => sum + data.weightage, 0);
    const overallPercentage = totalWeightage > 0 ? (totalWeightedScore / totalWeightage) * 100 : 0;
    const overallGPA = calculateGPA(calculateGrade(overallPercentage));

    // Subject-wise performance
    const subjectGroups = studentData.reduce((groups, data) => {
      if (!groups[data.subject]) {
        groups[data.subject] = [];
      }
      groups[data.subject].push(data);
      return groups;
    }, {} as { [key: string]: typeof studentData });

    const subjectWisePerformance = Object.entries(subjectGroups).map(([subject, assessments]) => {
      const avgScore = assessments.reduce((sum, a) => sum + a.percentage, 0) / assessments.length;
      const grade = calculateGrade(avgScore);
      
      // Calculate trend (simplified - compare first half with second half)
      const midPoint = Math.floor(assessments.length / 2);
      const firstHalf = assessments.slice(0, midPoint);
      const secondHalf = assessments.slice(midPoint);
      const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, a) => sum + a.percentage, 0) / firstHalf.length : 0;
      const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, a) => sum + a.percentage, 0) / secondHalf.length : 0;
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (secondHalfAvg > firstHalfAvg + 5) trend = 'improving';
      else if (secondHalfAvg < firstHalfAvg - 5) trend = 'declining';

      return {
        subject,
        averageScore: avgScore,
        grade,
        trend,
        assessments: assessments.length
      };
    });

    // Identify strengths and improvements
    const strengths = subjectWisePerformance
      .filter(s => s.averageScore >= 85)
      .map(s => ({ subject: s.subject, score: s.averageScore, grade: s.grade }));

    const improvements = subjectWisePerformance
      .filter(s => s.averageScore < 75)
      .map(s => ({
        subject: s.subject,
        score: s.averageScore,
        grade: s.grade,
        suggestedActions: [
          'Increase practice time',
          'Seek additional help from teacher',
          'Join study groups',
          'Review fundamentals'
        ]
      }));

    // Update academic performance state
    setAcademicPerformance(prev => ({
      ...prev,
      gradeAnalytics: {
        ...prev.gradeAnalytics,
        overallGPA,
        subjectWisePerformance,
        strengths,
        improvements
      }
    }));
  };

  const generateTrendAnalysis = (studentId: number) => {
    const studentData = academicPerformance.performanceData
      .filter(d => d.studentId === studentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (studentData.length < 2) return;

    // Performance trend over time
    const performanceTrend = studentData.map((data, index) => {
      const cumulativeData = studentData.slice(0, index + 1);
      const totalWeightedScore = cumulativeData.reduce((sum, d) => sum + (d.score * d.weightage), 0);
      const totalWeightage = cumulativeData.reduce((sum, d) => sum + d.weightage, 0);
      const overallPercentage = totalWeightage > 0 ? (totalWeightedScore / totalWeightage) * 100 : 0;
      
      return {
        date: data.date,
        overallPercentage,
        gpa: calculateGPA(calculateGrade(overallPercentage))
      };
    });

    // Subject trends
    const subjectGroups = studentData.reduce((groups, data) => {
      if (!groups[data.subject]) {
        groups[data.subject] = [];
      }
      groups[data.subject].push(data);
      return groups;
    }, {} as { [key: string]: typeof studentData });

    const subjectTrends = Object.entries(subjectGroups).map(([subject, assessments]) => {
      if (assessments.length < 2) {
        return {
          subject,
          trend: 'stable' as const,
          changePercentage: 0,
          dataPoints: assessments.map(a => ({ date: a.date, score: a.percentage }))
        };
      }

      const firstScore = assessments[0].percentage;
      const lastScore = assessments[assessments.length - 1].percentage;
      const changePercentage = ((lastScore - firstScore) / firstScore) * 100;
      
      let trend: 'upward' | 'downward' | 'stable' = 'stable';
      if (changePercentage > 10) trend = 'upward';
      else if (changePercentage < -10) trend = 'downward';

      return {
        subject,
        trend,
        changePercentage,
        dataPoints: assessments.map(a => ({ date: a.date, score: a.percentage }))
      };
    });

    // Predictive analysis (simplified)
    const recentPerformance = performanceTrend.slice(-5);
    const avgRecentGPA = recentPerformance.reduce((sum, p) => sum + p.gpa, 0) / recentPerformance.length;
    const trendSlope = recentPerformance.length > 1 ? 
      (recentPerformance[recentPerformance.length - 1].gpa - recentPerformance[0].gpa) / recentPerformance.length : 0;
    
    const nextTermGPA = Math.max(0, Math.min(4.0, avgRecentGPA + trendSlope));
    const confidenceLevel = Math.max(0.5, Math.min(0.95, 1 - (Math.abs(trendSlope) / 2)));

    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (avgRecentGPA < 2.0) {
      riskFactors.push('Low GPA trend');
      recommendations.push('Intensive tutoring recommended');
    }
    if (trendSlope < -0.2) {
      riskFactors.push('Declining performance');
      recommendations.push('Review study methods');
    }

    setAcademicPerformance(prev => ({
      ...prev,
      trendAnalysis: {
        performanceTrend,
        subjectTrends,
        predictiveAnalysis: {
          nextTermGPA,
          confidenceLevel,
          riskFactors,
          recommendations
        }
      }
    }));
  };

  const generateAcademicReport = (studentId: number, reportType: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const reportData = {
      student: {
        name: student.name,
        rollNo: student.rollNo,
        class: student.class
      },
      reportType,
      generatedAt: new Date().toISOString(),
      gradeAnalytics: academicPerformance.gradeAnalytics,
      trendAnalysis: academicPerformance.trendAnalysis,
      learningAnalytics: academicPerformance.learningAnalytics
    };

    // Simulate report generation
    const report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${reportType.replace('_', ' ')} - ${student.name}`,
      type: reportType,
      generatedAt: new Date().toISOString(),
      fileUrl: `/reports/${reportData.student.name}_${reportType}.pdf`
    };

    setAcademicPerformance(prev => ({
      ...prev,
      reports: {
        ...prev.reports,
        generatedReports: [...prev.reports.generatedReports, report]
      }
    }));

    return report;
  };

  const getPerformanceColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 75) return 'text-blue-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };


  return { markAttendance, checkGeofence, parseTime, calculateAttendancePercentage, createAttendanceNotification, bulkMarkAttendance, generateAttendanceReport, getAttendanceStats, calculateGrade, calculateGPA, analyzePerformance, generateTrendAnalysis, generateAcademicReport, getPerformanceColor };
}
