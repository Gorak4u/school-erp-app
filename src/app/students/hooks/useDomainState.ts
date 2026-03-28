// @ts-nocheck
'use client';

import { useState } from 'react';
import { Student } from '../types';

export function useDomainState() {
  // Document Management State
  const [documentManagement, setDocumentManagement] = useState({
    showDocumentModal: false,
    selectedStudent: null as Student | null,
    documents: [] as Array<{
      id: string;
      studentId: number;
      name: string;
      type: string;
      category: string;
      size: number;
      url: string;
      uploadedAt: string;
      uploadedBy: string;
      version: number;
      isPublic: boolean;
      tags: string[];
      description: string;
      expiryDate: string;
    }>,
    uploadProgress: 0,
    uploadStatus: 'idle' as 'idle' | 'uploading' | 'success' | 'error',
    uploadErrors: [] as string[],
    selectedDocuments: [] as string[],
    searchQuery: '',
    filterCategory: 'all',
    sortBy: 'uploadedAt' as 'uploadedAt' | 'name' | 'size' | 'type',
    sortOrder: 'desc' as 'asc' | 'desc',
    storageStats: {
      totalStorage: 10737418240, // 10GB in bytes
      usedStorage: 2147483648, // 2GB in bytes
      totalFiles: 1234,
      fileTypes: {
        pdf: 456,
        jpg: 234,
        png: 189,
        docx: 123,
        xlsx: 89,
        other: 143
      }
    },
    documentCategories: [
      { id: 'academic', name: 'Academic', icon: '📚', color: 'blue' },
      { id: 'medical', name: 'Medical', icon: '🏥', color: 'red' },
      { id: 'identity', name: 'Identity', icon: '🆔', color: 'green' },
      { id: 'financial', name: 'Financial', icon: '💰', color: 'yellow' },
      { id: 'disciplinary', name: 'Disciplinary', icon: '⚖️', color: 'purple' },
      { id: 'achievement', name: 'Achievement', icon: '🏆', color: 'orange' },
      { id: 'other', name: 'Other', icon: '📄', color: 'gray' }
    ],
    allowedFileTypes: [
      { extensions: ['.pdf'], maxSize: 10485760, icon: '📄', name: 'PDF Document' },
      { extensions: ['.jpg', '.jpeg'], maxSize: 5242880, icon: '🖼️', name: 'JPEG Image' },
      { extensions: ['.png'], maxSize: 5242880, icon: '🖼️', name: 'PNG Image' },
      { extensions: ['.doc', '.docx'], maxSize: 10485760, icon: '📝', name: 'Word Document' },
      { extensions: ['.xls', '.xlsx'], maxSize: 10485760, icon: '📊', name: 'Excel Spreadsheet' },
      { extensions: ['.txt'], maxSize: 1048576, icon: '📄', name: 'Text File' }
    ]
  });

  // Communication Center State
  const [communicationCenter, setCommunicationCenter] = useState({
    showCommunicationModal: false,
    messageType: 'sms' as 'sms' | 'email',
    selectedRecipients: [] as number[],
    messageContent: '',
    subject: '',
    selectedTemplate: '',
    sendProgress: 0,
    sendStatus: 'idle' as 'idle' | 'sending' | 'success' | 'error',
    sendErrors: [] as string[],
    messageHistory: [] as Array<{
      id: string;
      type: 'sms' | 'email';
      recipients: number[];
      subject?: string;
      content: string;
      sentAt: string;
      sentBy: string;
      deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
      deliveryStats: {
        total: number;
        sent: number;
        delivered: number;
        failed: number;
      };
    }>,
    smsTemplates: [
      {
        id: 'attendance_reminder',
        name: 'Attendance Reminder',
        content: 'Dear Parent, Your child {student_name} was absent from school on {date}. Please ensure regular attendance. Contact: {school_phone}',
        category: 'attendance'
      },
      {
        id: 'fee_reminder',
        name: 'Fee Payment Reminder',
        content: 'Dear Parent, Fee payment for {student_name} is due. Amount: {fee_amount}. Due date: {due_date}. Please pay promptly.',
        category: 'fees'
      },
      {
        id: 'exam_schedule',
        name: 'Exam Schedule',
        content: 'Dear Student, Your exams are scheduled from {start_date} to {end_date}. Please prepare well. All the best!',
        category: 'academics'
      },
      {
        id: 'holiday_notice',
        name: 'Holiday Notice',
        content: 'Dear Parent, School will remain closed on {date} on account of {occasion}. Regular classes will resume from {next_date}.',
        category: 'general'
      },
      {
        id: 'parent_meeting',
        name: 'Parent Meeting',
        content: 'Dear Parent, Parent-teacher meeting is scheduled on {date} at {time}. Your presence is important for {student_name}\'s progress.',
        category: 'meetings'
      }
    ],
    emailTemplates: [
      {
        id: 'monthly_report',
        name: 'Monthly Progress Report',
        subject: 'Monthly Progress Report - {student_name}',
        content: 'Dear Parent,\n\nPlease find attached the monthly progress report for {student_name}.\n\nKey Highlights:\n- Attendance: {attendance_percentage}%\n- GPA: {gpa}\n- Rank: {rank}\n\nBest Regards,\n{school_name}',
        category: 'academics'
      },
      {
        id: 'fee_receipt',
        name: 'Fee Payment Receipt',
        subject: 'Fee Payment Receipt - {student_name}',
        content: 'Dear Parent,\n\nThank you for the fee payment of {amount} for {student_name}.\n\nPayment Details:\n- Receipt No: {receipt_number}\n- Date: {payment_date}\n- Amount: {amount}\n- Mode: {payment_mode}\n\nBest Regards,\nAccounts Department',
        category: 'fees'
      },
      {
        id: 'disciplinary_action',
        name: 'Disciplinary Notice',
        subject: 'Disciplinary Action - {student_name}',
        content: 'Dear Parent,\n\nWe regret to inform you about disciplinary action taken against {student_name}.\n\nIncident Details:\n- Date: {incident_date}\n- Nature: {incident_type}\n- Action Taken: {action_taken}\n\nPlease ensure this does not recur.\n\nBest Regards,\nDisciplinary Committee',
        category: 'disciplinary'
      },
      {
        id: 'achievement_congratulations',
        name: 'Achievement Congratulations',
        subject: 'Congratulations! - {student_name}',
        content: 'Dear Parent,\n\nWe are proud to announce that {student_name} has achieved {achievement}!\n\nThis is a remarkable accomplishment that reflects their hard work and dedication.\n\nCongratulations to the student and family!\n\nBest Regards,\n{school_name}',
        category: 'achievements'
      },
      {
        id: 'medical_alert',
        name: 'Medical Alert',
        subject: 'Medical Alert - {student_name}',
        content: 'Dear Parent,\n\nThis is to inform you that {student_name} visited the medical room on {date}.\n\nMedical Details:\n- Complaint: {complaint}\n- Treatment Given: {treatment}\n- Doctor\'s Advice: {advice}\n\nPlease follow up as required.\n\nBest Regards,\nSchool Medical Team',
        category: 'medical'
      }
    ],
    templateCategories: [
      { id: 'attendance', name: 'Attendance', icon: '📅', color: 'blue' },
      { id: 'fees', name: 'Fees', icon: '💰', color: 'green' },
      { id: 'academics', name: 'Academics', icon: '📚', color: 'purple' },
      { id: 'general', name: 'General', icon: '📢', color: 'gray' },
      { id: 'meetings', name: 'Meetings', icon: '🤝', color: 'orange' },
      { id: 'disciplinary', name: 'Disciplinary', icon: '⚖️', color: 'red' },
      { id: 'achievements', name: 'Achievements', icon: '🏆', color: 'yellow' },
      { id: 'medical', name: 'Medical', icon: '🏥', color: 'pink' }
    ],
    deliveryProviders: {
      sms: [
        { id: 'twilio', name: 'Twilio', status: 'active', rate: '0.05' },
        { id: 'msg91', name: 'MSG91', status: 'active', rate: '0.03' },
        { id: 'textlocal', name: 'TextLocal', status: 'inactive', rate: '0.04' }
      ],
      email: [
        { id: 'sendgrid', name: 'SendGrid', status: 'active', rate: '0.001' },
        { id: 'ses', name: 'Amazon SES', status: 'active', rate: '0.0001' },
        { id: 'mailgun', name: 'Mailgun', status: 'inactive', rate: '0.002' }
      ]
    }
  });

  // Attendance Tracking State
  const [attendanceTracking, setAttendanceTracking] = useState({
    showAttendanceModal: false,
    selectedDate: new Date().toISOString().split('T')[0],
    selectedStudent: null as any,
    attendanceRecords: [] as Array<{
      id: string;
      studentId: number;
      date: string;
      checkInTime: string;
      checkOutTime: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      method: 'biometric' | 'rfid' | 'manual' | 'mobile';
      location: {
        latitude: number;
        longitude: number;
        address: string;
        isWithinGeofence: boolean;
      };
      biometricData: {
        facialRecognition: boolean;
        fingerprintMatch: boolean;
        confidence: number;
      };
      deviceInfo: {
        deviceId: string;
        deviceType: string;
        ipAddress: string;
      };
      verifiedBy: string;
      remarks: string;
      createdAt: string;
      updatedAt: string;
    }>,
    realTimeAttendance: [] as Array<{
      studentId: number;
      status: 'present' | 'absent' | 'late';
      lastSeen: string;
      location: string;
    }>,
    geoFenceSettings: {
      enabled: true,
      center: { latitude: 28.6139, longitude: 77.2090 }, // New Delhi coordinates
      radius: 500, // meters
      allowedEntryTime: { start: '08:00', end: '09:00' },
      allowedExitTime: { start: '14:00', end: '16:00' },
      gracePeriod: 15 // minutes
    },
    biometricSettings: {
      facialRecognition: {
        enabled: true,
        confidenceThreshold: 0.85,
        livenessDetection: true,
        antiSpoofing: true
      },
      fingerprint: {
        enabled: true,
        qualityThreshold: 0.8,
        templateVersion: 'v2'
      },
      rfid: {
        enabled: true,
        cardTypes: ['student_id', 'staff_id'],
        encryption: 'AES256'
      }
    },
    attendanceAnalytics: {
      todayStats: {
        totalStudents: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        percentage: 0
      },
      weeklyTrend: [] as Array<{
        date: string;
        present: number;
        absent: number;
        late: number;
        percentage: number;
      }>,
      monthlyStats: {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        averagePercentage: 0
      },
      patternAnalysis: {
        frequentAbsentees: [] as Array<{
          studentId: number;
          studentName: string;
          absentCount: number;
          percentage: number;
        }>,
        frequentLatecomers: [] as Array<{
          studentId: number;
          studentName: string;
          lateCount: number;
          averageLateTime: string;
        }>,
        attendancePatterns: [] as Array<{
          pattern: string;
          description: string;
          affectedStudents: number;
        }>
      }
    },
    leaveRequests: [] as Array<{
      id: string;
      studentId: number;
      type: 'sick' | 'personal' | 'emergency' | 'vacation';
      startDate: string;
      endDate: string;
      reason: string;
      status: 'pending' | 'approved' | 'rejected';
      approvedBy?: string;
      approvedAt?: string;
      attachments: string[];
      createdAt: string;
    }>,
    notifications: [] as Array<{
      id: string;
      type: 'absence_alert' | 'late_arrival' | 'geofence_breach' | 'biometric_failure';
      studentId: number;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      isRead: boolean;
      createdAt: string;
    }>,
    devices: [] as Array<{
      id: string;
      name: string;
      type: 'biometric_terminal' | 'rfid_reader' | 'mobile_app';
      location: string;
      status: 'online' | 'offline' | 'maintenance';
      lastHeartbeat: string;
      batteryLevel?: number;
    }>
  });

  // Academic Performance Tracking State
  const [academicPerformance, setAcademicPerformance] = useState({
    showAcademicModal: false,
    selectedStudent: null as Student | null,
    selectedTerm: 'current' as 'current' | 'previous' | 'all',
    selectedSubject: 'all',
    performanceData: [] as Array<{
      id: string;
      studentId: number;
      term: string;
      subject: string;
      assessmentType: 'exam' | 'quiz' | 'assignment' | 'project' | 'participation';
      score: number;
      maxScore: number;
      grade: string;
      percentage: number;
      date: string;
      teacher: string;
      remarks: string;
      weightage: number;
    }>,
    gradeAnalytics: {
      overallGPA: 0,
      subjectWisePerformance: [] as Array<{
        subject: string;
        averageScore: number;
        grade: string;
        trend: 'improving' | 'declining' | 'stable';
        assessments: number;
      }>,
      termComparison: [] as Array<{
        term: string;
        gpa: number;
        percentage: number;
        rank: number;
      }>,
      classRanking: {
        currentRank: 0,
        totalStudents: 0,
        percentile: 0,
        previousRank: 0,
        rankChange: 0
      },
      strengths: [] as Array<{
        subject: string;
        score: number;
        grade: string;
      }>,
      improvements: [] as Array<{
        subject: string;
        score: number;
        grade: string;
        suggestedActions: string[];
      }>
    },
    trendAnalysis: {
      performanceTrend: [] as Array<{
        date: string;
        overallPercentage: number;
        gpa: number;
      }>,
      subjectTrends: [] as Array<{
        subject: string;
        trend: 'upward' | 'downward' | 'stable';
        changePercentage: number;
        dataPoints: Array<{
          date: string;
          score: number;
        }>;
      }>,
      predictiveAnalysis: {
        nextTermGPA: 0,
        confidenceLevel: 0,
        riskFactors: [] as string[],
        recommendations: [] as string[]
      }
    },
    learningAnalytics: {
      learningStyle: 'visual' as 'visual' | 'auditory' | 'kinesthetic' | 'reading',
      studyPatterns: [] as Array<{
        dayOfWeek: string;
        studyHours: number;
        performance: number;
      }>,
      attentionSpan: {
        averageMinutes: 0,
        optimalTimeOfDay: '',
        subjectWiseAttention: [] as Array<{
          subject: string;
          attentionScore: number;
        }>
      },
      competencyLevels: [] as Array<{
        skill: string;
        level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        masteryPercentage: number;
      }>
    },
    reports: {
      availableReports: [
        { id: 'term_report', name: 'Term Performance Report', type: 'detailed' },
        { id: 'subject_analysis', name: 'Subject-wise Analysis', type: 'analytical' },
        { id: 'progress_tracking', name: 'Progress Tracking Report', type: 'trend' },
        { id: 'comparative_analysis', name: 'Comparative Analysis', type: 'comparative' },
        { id: 'parent_summary', name: 'Parent Summary Report', type: 'summary' }
      ],
      generatedReports: [] as Array<{
        id: string;
        name: string;
        type: string;
        generatedAt: string;
        fileUrl: string;
      }>
    }
  });

  // Fee Management State
  const [feeManagement, setFeeManagement] = useState({
    showFeeModal: false,
    selectedStudent: null as Student | null,
    feeRecords: [] as Array<{
      id: string;
      studentId: number;
      feeType: 'tuition' | 'transport' | 'library' | 'lab' | 'sports' | 'examination' | 'hostel' | 'other';
      amount: number;
      dueDate: string;
      paidAmount: number;
      balance: number;
      status: 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';
      paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online' | 'cheque' | 'wallet';
      transactionId: string;
      paymentDate: string;
      lateFee: number;
      discount: number;
      description: string;
      academicYear: string;
      term: string;
      createdAt: string;
      updatedAt: string;
    }>,
    paymentGateways: {
      stripe: {
        enabled: true,
        publicKey: 'pk_test_...',
        supportedMethods: ['card', 'apple_pay', 'google_pay'],
        fees: { percentage: 2.9, fixed: 0.30 }
      },
      paypal: {
        enabled: true,
        clientId: 'test_client_id',
        supportedMethods: ['paypal', 'venmo'],
        fees: { percentage: 3.4, fixed: 0.30 }
      },
      razorpay: {
        enabled: true,
        keyId: 'rzp_test_...',
        supportedMethods: ['card', 'upi', 'netbanking', 'wallet'],
        fees: { percentage: 2.0, fixed: 0.00 }
      },
      paytm: {
        enabled: false,
        merchantId: 'test_merchant',
        supportedMethods: ['paytm_wallet', 'upi', 'netbanking'],
        fees: { percentage: 2.5, fixed: 0.00 }
      }
    },
    automatedReminders: {
      enabled: true,
      schedules: [
        { id: '1', name: '7 days before due', triggerDays: 7, channels: ['sms', 'email', 'push'] },
        { id: '2', name: '3 days before due', triggerDays: 3, channels: ['sms', 'email'] },
        { id: '3', name: 'On due date', triggerDays: 0, channels: ['sms', 'email', 'push'] },
        { id: '4', name: '3 days after due', triggerDays: -3, channels: ['sms', 'email', 'call'] },
        { id: '5', name: '7 days after due', triggerDays: -7, channels: ['sms', 'email', 'call'] }
      ],
      templates: {
        sms: {
          beforeDue: 'Dear Parent, fee of ₹{amount} for {studentName} is due on {dueDate}. Please pay on time to avoid late fees.',
          onDue: 'URGENT: Fee payment for {studentName} is due today. Amount: ₹{amount}. Pay now to avoid late charges.',
          afterDue: 'OVERDUE: Fee payment for {studentName} is {daysOverdue} days late. Amount: ₹{amount} + late fees. Please pay immediately.'
        },
        email: {
          subject: 'Fee Payment Reminder - {studentName}',
          beforeDue: 'Dear Parent,\\n\\nThis is a reminder that the fee payment of ₹{amount} for {studentName} is due on {dueDate}.\\n\\nPlease make the payment through our online portal or at the school office.\\n\\nThank you',
          afterDue: 'URGENT: Overdue Fee Payment\\n\\nThe fee payment for {studentName} is {daysOverdue} days overdue. Total amount due: ₹{totalAmount}.\\n\\nPlease make the payment immediately to avoid further penalties.'
        }
      }
    },
    feeAnalytics: {
      totalCollected: 0,
      totalPending: 0,
      totalOverdue: 0,
      collectionRate: 0,
      monthlyTrends: [] as Array<{
        month: string;
        collected: number;
        pending: number;
        overdue: number;
      }>,
      feeTypeBreakdown: [] as Array<{
        type: string;
        totalAmount: number;
        collectedAmount: number;
        pendingAmount: number;
        collectionRate: number;
      }>,
      paymentMethodStats: [] as Array<{
        method: string;
        count: number;
        amount: number;
        percentage: number;
      }>
    },
    transactions: [] as Array<{
      id: string;
      feeRecordId: string;
      studentId: number;
      amount: number;
      paymentMethod: string;
      gateway: string;
      transactionId: string;
      status: 'pending' | 'completed' | 'failed' | 'refunded';
      timestamp: string;
      failureReason?: string;
      refundAmount?: number;
      refundReason?: string;
    }>,
    refunds: [] as Array<{
      id: string;
      feeRecordId: string;
      studentId: number;
      amount: number;
      reason: string;
      status: 'pending' | 'approved' | 'rejected' | 'processed';
      requestedAt: string;
      processedAt?: string;
      approvedBy?: string;
    }>,
    discountSchemes: [] as Array<{
      id: string;
      name: string;
      type: 'percentage' | 'fixed' | 'scholarship';
      value: number;
      applicableFeeTypes: string[];
      eligibilityCriteria: string;
      validUntil: string;
      isActive: boolean;
    }>,
    installmentPlans: [] as Array<{
      id: string;
      feeRecordId: string;
      totalAmount: number;
      numberOfInstallments: number;
      installmentAmount: number;
      frequency: 'monthly' | 'quarterly' | 'biannual';
      nextDueDate: string;
      paidInstallments: number;
      status: 'active' | 'completed' | 'defaulted';
      installments: Array<{
        number: number;
        amount: number;
        dueDate: string;
        paidDate?: string;
        status: 'pending' | 'paid' | 'overdue';
      }>
    }>
  });

  // Parent Portal Integration State
  const [parentPortal, setParentPortal] = useState({
    showParentPortalModal: false,
    selectedStudent: null as Student | null,
    parentAccounts: [] as Array<{
      id: string;
      studentId: number;
      parentName: string;
      email: string;
      phone: string;
      relationship: 'father' | 'mother' | 'guardian' | 'other';
      username: string;
      isActive: boolean;
      lastLogin: string;
      notificationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
        attendance: boolean;
        grades: boolean;
        fees: boolean;
        behavior: boolean;
        announcements: boolean;
      };
      accessLevel: 'full' | 'limited' | 'view_only';
      twoFactorEnabled: boolean;
      createdAt: string;
      updatedAt: string;
    }>,
    notifications: [] as Array<{
      id: string;
      studentId: number;
      parentId: string;
      type: 'attendance' | 'grade' | 'fee' | 'behavior' | 'announcement' | 'assignment' | 'meeting' | 'emergency';
      title: string;
      message: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      channels: ('email' | 'sms' | 'push' | 'in_app')[];
      sentAt: string;
      readAt?: string;
      deliveryStatus: {
        email: 'pending' | 'sent' | 'delivered' | 'failed';
        sms: 'pending' | 'sent' | 'delivered' | 'failed';
        push: 'pending' | 'sent' | 'delivered' | 'failed';
        in_app: 'pending' | 'sent' | 'delivered' | 'failed';
      };
      metadata?: {
        grade?: string;
        subject?: string;
        amount?: number;
        percentage?: number;
        attendanceStatus?: string;
      };
    }>,
    realTimeUpdates: {
      websocketConnected: false,
      lastHeartbeat: '',
      activeConnections: 0,
      subscriptionTopics: [] as string[],
      messageQueue: [] as Array<{
        id: string;
        topic: string;
        payload: any;
        timestamp: string;
        attempts: number;
      }>
    },
    parentDashboard: {
      recentActivities: [] as Array<{
        id: string;
        type: 'login' | 'grade_view' | 'payment' | 'communication' | 'document_download';
        description: string;
        timestamp: string;
        ipAddress: string;
        device: string;
      }>,
      quickStats: {
        unreadNotifications: 0,
        pendingFees: 0,
        upcomingEvents: 0,
        recentGrades: 0
      },
      upcomingEvents: [] as Array<{
        id: string;
        title: string;
        type: 'exam' | 'meeting' | 'holiday' | 'competition' | 'other';
        date: string;
        time: string;
        location: string;
        description: string;
        requiresAction: boolean;
      }>,
      recentGrades: [] as Array<{
        id: string;
        subject: string;
        assessment: string;
        grade: string;
        percentage: number;
        date: string;
        trend: 'up' | 'down' | 'stable';
      }>
    },
    communicationLogs: [] as Array<{
      id: string;
      studentId: number;
      parentId: string;
      type: 'email' | 'sms' | 'call' | 'meeting' | 'note';
      subject?: string;
      content: string;
      direction: 'inbound' | 'outbound';
      timestamp: string;
      status: 'sent' | 'delivered' | 'read' | 'failed';
      attachments?: Array<{
        name: string;
        url: string;
        size: number;
      }>;
    }>,
    accessControls: {
      allowedIPs: [] as string[],
      sessionTimeout: 30, // minutes
      maxConcurrentSessions: 2,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        resetAfterDays: 90
      },
      auditLogs: [] as Array<{
        id: string;
        parentId: string;
        action: string;
        resource: string;
        timestamp: string;
        ipAddress: string;
        userAgent: string;
        success: boolean;
      }>
    }
  });

  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  
  // Advanced Search & Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    name: '',
    admissionNo: '',
    parentName: '',
    phone: '',
    email: '',
    bloodGroup: 'all',
    attendanceMin: '',
    attendanceMax: '',
    ageMin: '',
    ageMax: '',
    feeStatus: 'all',
    dateOfBirth: '',
    admissionDateFrom: '',
    admissionDateTo: '',
    city: '',
    state: '',
    category: 'all'
  });
  const [savedFilters, setSavedFilters] = useState<Array<{
    id: string;
    name: string;
    filters: typeof advancedFilters;
    createdAt: string;
  }>>([]);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  

  return {
    documentManagement, setDocumentManagement,
    communicationCenter, setCommunicationCenter,
    attendanceTracking, setAttendanceTracking,
    academicPerformance, setAcademicPerformance,
    feeManagement, setFeeManagement,
    parentPortal, setParentPortal,
    selectedLanguage, setSelectedLanguage,
    attendanceFilter, setAttendanceFilter,
    showAddModal, setShowAddModal,
    editingStudent, setEditingStudent,
    selectedStudents, setSelectedStudents,
    activeTab, setActiveTab,
    selectedStudent, setSelectedStudent,
    showStudentDetails, setShowStudentDetails,
    mousePosition, setMousePosition,
    isClient, setIsClient,
    showAdvancedFilters, setShowAdvancedFilters,
    advancedFilters, setAdvancedFilters,
    savedFilters, setSavedFilters,
    showSaveFilterModal, setShowSaveFilterModal,
    filterName, setFilterName,
  };
}
