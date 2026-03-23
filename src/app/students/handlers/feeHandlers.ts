// @ts-nocheck
import { Student } from '../types';

export function createFeeHandlers(ctx: any) {
  // Destructure all needed state from context
  const { feeManagement, parentPortal, setCommunicationCenter, setFeeManagement, setParentPortal, students } = ctx;

  // Fee Management Functions
  const processPayment = async (feeRecordId: number, amount: number, paymentMethod: string, gateway: string) => {
    const feeRecord = feeManagement.feeRecords.find(r => r.id === feeRecordId);
    if (!feeRecord) return;

    // Process payment (in production, implement actual payment gateway integration)
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      feeRecordId,
      studentId: feeRecord.studentId,
      amount,
      paymentMethod,
      gateway,
      transactionId: `${gateway}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique transaction ID
      status: 'completed' as const, // Default to completed for demo purposes
      timestamp: new Date().toISOString()
    };

    // Update fee record
    const updatedPaidAmount = feeRecord.paidAmount + amount;
    const updatedBalance = (feeRecord.amount - feeRecord.discount - feeRecord.paidAmount) - amount;
    const updatedStatus = updatedBalance <= 0 ? 'paid' : 'partial' as const;

    setFeeManagement(prev => ({
      ...prev,
      feeRecords: prev.feeRecords.map(record =>
        record.id === feeRecordId
          ? {
              ...record,
              paidAmount: updatedPaidAmount,
              balance: Math.max(0, (record.amount - record.discount - updatedPaidAmount)),
              status: updatedStatus,
              paymentDate: new Date().toISOString().split('T')[0],
              transactionId: transaction.transactionId,
              updatedAt: new Date().toISOString()
            }
          : record
      ),
      transactions: [...prev.transactions, transaction]
    }));

    // Send payment confirmation
    await sendPaymentConfirmation(feeRecord.studentId, transaction);
  };

  const sendPaymentConfirmation = async (studentId: number, transaction: any) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Send payment confirmation (server-side only)
    if (typeof window === 'undefined') {
      try {
        const { sendSchoolEmail } = await import('@/lib/email');
        
        if (student.parentEmail) {
          const emailResult = await sendSchoolEmail({
            to: student.parentEmail,
            subject: 'Payment Confirmation - School ERP',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #28a745;">Payment Confirmation</h2>
                <p>Dear Parent/Guardian,</p>
                <p>We have successfully received your payment of ₹${transaction.amount}.</p>
                <p><strong>Transaction Details:</strong></p>
                <ul>
                  <li>Transaction ID: ${transaction.transactionId}</li>
                  <li>Amount: ₹${transaction.amount}</li>
                  <li>Payment Method: ${paymentMethod}</li>
                  <li>Date: ${new Date().toLocaleDateString()}</li>
                </ul>
                <p>Thank you for your prompt payment!</p>
              </div>
            `,
            schoolId: student.schoolId
          });
          
          if (emailResult.success) {
            console.log('Payment confirmation email sent successfully');
          }
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }
    }
    
    // Add to communication center message history
    const message = `Payment of ₹${transaction.amount} received successfully. Transaction ID: ${transaction.transactionId}. Thank you!`;
    const confirmationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'sms' as const,
      recipients: [studentId],
      content: message,
      sentAt: new Date().toISOString(),
      sentBy: 'System',
      deliveryStatus: 'delivered' as const,
      deliveryStats: {
        total: 1,
        sent: 1,
        delivered: 1,
        failed: 0
      }
    };

    setCommunicationCenter(prev => ({
      ...prev,
      messageHistory: [confirmationMessage, ...prev.messageHistory]
    }));
  };

  const calculateLateFee = (dueDate: string, amount: number): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysLate = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLate <= 0) return 0;
    
    // 1% late fee per week, maximum 10%
    const weeksLate = Math.ceil(daysLate / 7);
    const lateFeePercentage = Math.min(weeksLate * 0.01, 0.10);
    
    return Math.round(amount * lateFeePercentage);
  };

  const generateFeeReport = (studentId: number, reportType: 'detailed' | 'summary' | 'outstanding') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const studentFees = feeManagement.feeRecords.filter(f => f.studentId === studentId);
    
    const reportData = {
      student: {
        name: student.name,
        rollNo: student.rollNo,
        class: student.class
      },
      reportType,
      generatedAt: new Date().toISOString(),
      fees: studentFees,
      summary: {
        totalAmount: studentFees.reduce((sum, f) => sum + f.amount, 0),
        totalPaid: studentFees.reduce((sum, f) => sum + f.paidAmount, 0),
        totalBalance: studentFees.reduce((sum, f) => sum + f.balance, 0),
        overdueCount: studentFees.filter(f => f.status === 'overdue').length
      }
    };

    return reportData;
  };

  const sendAutomatedReminders = () => {
    if (!feeManagement.automatedReminders.enabled) return;

    const today = new Date();
    feeManagement.feeRecords.forEach(feeRecord => {
      if (feeRecord.status === 'paid' || feeRecord.status === 'waived') return;

      const dueDate = new Date(feeRecord.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if any reminder schedule matches
      feeManagement.automatedReminders.schedules.forEach(schedule => {
        if (daysUntilDue === schedule.triggerDays) {
          const student = students.find(s => s.id === feeRecord.studentId);
          if (!student) return;

          const message = schedule.triggerDays > 0 
            ? feeManagement.automatedReminders.templates.sms.beforeDue
                .replace('{amount}', feeRecord.balance.toString())
                .replace('{studentName}', student.name)
                .replace('{dueDate}', feeRecord.dueDate)
            : feeManagement.automatedReminders.templates.sms.afterDue
                .replace('{amount}', feeRecord.balance.toString())
                .replace('{studentName}', student.name)
                .replace('{daysOverdue}', Math.abs(daysUntilDue).toString());

          // Add reminder to communication center
          const reminderMessage = {
            id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'sms' as const,
            recipients: [feeRecord.studentId],
            content: message,
            sentAt: new Date().toISOString(),
            sentBy: 'Automated System',
            deliveryStatus: 'delivered' as const,
            deliveryStats: {
              total: 1,
              sent: 1,
              delivered: 1,
              failed: 0
            }
          };

          setCommunicationCenter(prev => ({
            ...prev,
            messageHistory: [reminderMessage, ...prev.messageHistory]
          }));
        }
      });
    });
  };

  const createInstallmentPlan = (feeRecordId: string, numberOfInstallments: number, frequency: 'monthly' | 'quarterly' | 'biannual') => {
    const feeRecord = feeManagement.feeRecords.find(r => r.id === feeRecordId);
    if (!feeRecord) return;

    const installmentAmount = Math.ceil(feeRecord.balance / numberOfInstallments);
    const installments = [];
    let nextDueDate = new Date();

    for (let i = 1; i <= numberOfInstallments; i++) {
      const status: 'pending' | 'paid' | 'overdue' = i === 1 ? 'paid' : 'pending';
      installments.push({
        number: i,
        amount: installmentAmount,
        dueDate: nextDueDate.toISOString().split('T')[0],
        paidDate: i === 1 ? new Date().toISOString().split('T')[0] : undefined,
        status
      });

      // Calculate next due date
      if (frequency === 'monthly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else if (frequency === 'quarterly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      } else if (frequency === 'biannual') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 6);
      }
    }

    const installmentPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      feeRecordId,
      totalAmount: feeRecord.balance,
      numberOfInstallments,
      installmentAmount,
      frequency,
      nextDueDate: installments.find(i => i.status === 'pending')?.dueDate || '',
      paidInstallments: 1,
      status: 'active' as const,
      installments
    };

    setFeeManagement(prev => ({
      ...prev,
      installmentPlans: [...prev.installmentPlans, installmentPlan]
    }));
  };

  const getFeeStatusColor = (status: string): string => {
    switch (status) {
      case 'paid': return 'text-green-500';
      case 'partial': return 'text-blue-500';
      case 'pending': return 'text-yellow-500';
      case 'overdue': return 'text-red-500';
      case 'waived': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getPaymentGatewayFees = (gateway: string, amount: number): number => {
    const gatewayConfig = feeManagement.paymentGateways[gateway as keyof typeof feeManagement.paymentGateways];
    if (!gatewayConfig) return 0;

    return (amount * gatewayConfig.fees.percentage / 100) + gatewayConfig.fees.fixed;
  };

  // Parent Portal Functions
  const createParentAccount = (studentId: number, parentData: {
    name: string;
    email: string;
    phone: string;
    relationship: 'father' | 'mother' | 'guardian' | 'other';
  }) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const parentAccount = {
      id: `parent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      parentName: parentData.name,
      email: parentData.email,
      phone: parentData.phone,
      relationship: parentData.relationship,
      username: `${parentData.name.toLowerCase().replace(/\s+/g, '.')}_${studentId}`,
      isActive: true,
      lastLogin: '',
      notificationPreferences: {
        email: true,
        sms: true,
        push: true,
        attendance: true,
        grades: true,
        fees: true,
        behavior: true,
        announcements: true
      },
      accessLevel: 'full' as const,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setParentPortal(prev => ({
      ...prev,
      parentAccounts: [...prev.parentAccounts, parentAccount]
    }));

    // Send welcome notification
    sendParentNotification(studentId, parentAccount.id, 'announcement', 
      'Welcome to Parent Portal', 
      `Your parent account has been created successfully. Username: ${parentAccount.username}`,
      ['email', 'sms']
    );

    return parentAccount;
  };

  const sendParentNotification = (
    studentId: number, 
    parentId: string, 
    type: 'attendance' | 'grade' | 'fee' | 'behavior' | 'announcement' | 'assignment' | 'meeting' | 'emergency',
    title: string,
    message: string,
    channels: ('email' | 'sms' | 'push' | 'in_app')[],
    metadata?: any
  ) => {
    const parent = parentPortal.parentAccounts.find(p => p.id === parentId);
    if (!parent || !parent.isActive) return;

    // Check notification preferences
    const allowedChannels = channels.filter(channel => {
      switch (channel) {
        case 'email': return parent.notificationPreferences.email;
        case 'sms': return parent.notificationPreferences.sms;
        case 'push': return parent.notificationPreferences.push;
        case 'in_app': return true; // Always allow in-app notifications
        default: return false;
      }
    });

    if (allowedChannels.length === 0) return;

    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      parentId,
      type,
      title,
      message,
      priority: type === 'emergency' ? 'urgent' as const : 
               type === 'fee' ? 'high' as const : 
               type === 'grade' || type === 'attendance' ? 'medium' as const : 'low' as const,
      channels: allowedChannels,
      sentAt: new Date().toISOString(),
      deliveryStatus: {
        email: allowedChannels.includes('email') ? 'sent' as const : 'pending' as const,
        sms: allowedChannels.includes('sms') ? 'sent' as const : 'pending' as const,
        push: allowedChannels.includes('push') ? 'sent' as const : 'pending' as const,
        in_app: 'delivered' as const
      },
      metadata
    };

    setParentPortal(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications]
    }));

    // Add to communication center if email/sms
    if (allowedChannels.includes('email') || allowedChannels.includes('sms')) {
      const commMessage = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: allowedChannels.includes('email') ? 'email' as const : 'sms' as const,
        recipients: [studentId],
        subject: title,
        content: message,
        sentAt: new Date().toISOString(),
        sentBy: 'Parent Portal',
        deliveryStatus: 'delivered' as const,
        deliveryStats: {
          total: 1,
          sent: 1,
          delivered: 1,
          failed: 0
        }
      };

      setCommunicationCenter(prev => ({
        ...prev,
        messageHistory: [commMessage, ...prev.messageHistory]
      }));
    }

    // Send real-time update via WebSocket (in production, implement actual WebSocket)
    // if (websocketConnection) {
    //   websocketConnection.send(JSON.stringify({
    //     type: 'notification',
    //     data: notification,
    //     recipientId: parentId
    //   }));
    // }
  };

  const pushRealTimeUpdate = (parentId: string, data: any) => {
    const update = {
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: `parent_${parentId}`,
      payload: data,
      timestamp: new Date().toISOString(),
      attempts: 0
    };

    setParentPortal(prev => ({
      ...prev,
      realTimeUpdates: {
        ...prev.realTimeUpdates,
        messageQueue: [...prev.realTimeUpdates.messageQueue, update]
      }
    }));
  };

  const triggerAttendanceNotification = (studentId: number, status: string, time: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const parents = parentPortal.parentAccounts.filter(p => 
      p.studentId === studentId && p.isActive && p.notificationPreferences.attendance
    );

    parents.forEach(parent => {
      const isLate = status === 'late';
      const isAbsent = status === 'absent';
      
      if (isLate || isAbsent) {
        sendParentNotification(
          studentId,
          parent.id,
          'attendance',
          `Attendance Alert: ${status.toUpperCase()}`,
          `${student.name} was marked ${status} at ${time}. Please contact the school if you have any questions.`,
          ['sms', 'email', 'push'],
          { attendanceStatus: status }
        );
      }
    });
  };

  const triggerGradeNotification = (studentId: number, subject: string, grade: string, assessment: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const parents = parentPortal.parentAccounts.filter(p => 
      p.studentId === studentId && p.isActive && p.notificationPreferences.grades
    );

    parents.forEach(parent => {
      sendParentNotification(
        studentId,
        parent.id,
        'grade',
        `New Grade Posted: ${subject}`,
        `${student.name} received a grade of ${grade} in ${assessment}. Check the parent portal for details.`,
        ['email', 'push'],
        { grade, subject, assessment }
      );
    });
  };

  const triggerFeeNotification = (studentId: number, amount: number, dueDate: string, status: 'due' | 'overdue' | 'paid') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const parents = parentPortal.parentAccounts.filter(p => 
      p.studentId === studentId && p.isActive && p.notificationPreferences.fees
    );

    parents.forEach(parent => {
      let title, message;
      
      switch (status) {
        case 'due':
          title = 'Fee Payment Reminder';
          message = `Fee payment of ₹${amount} for ${student.name} is due on ${dueDate}.`;
          break;
        case 'overdue':
          title = 'OVERDUE: Fee Payment Required';
          message = `Fee payment of ₹${amount} for ${student.name} is overdue. Please pay immediately to avoid penalties.`;
          break;
        case 'paid':
          title = 'Fee Payment Confirmation';
          message = `Thank you! Fee payment of ₹${amount} for ${student.name} has been received successfully.`;
          break;
      }

      sendParentNotification(
        studentId,
        parent.id,
        'fee',
        title,
        message,
        ['sms', 'email', 'push'],
        { amount, dueDate, status }
      );
    });
  };

  const logParentActivity = (parentId: string, activity: {
    type: 'login' | 'grade_view' | 'payment' | 'communication' | 'document_download';
    description: string;
    ipAddress: string;
    device: string;
  }) => {
    const logEntry = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...activity,
      timestamp: new Date().toISOString()
    };

    setParentPortal(prev => ({
      ...prev,
      parentDashboard: {
        ...prev.parentDashboard,
        recentActivities: [logEntry, ...prev.parentDashboard.recentActivities.slice(0, 49)]
      }
    }));
  };

  const getNotificationPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };


  return { processPayment, sendPaymentConfirmation, calculateLateFee, generateFeeReport, sendAutomatedReminders, createInstallmentPlan, getFeeStatusColor, getPaymentGatewayFees, createParentAccount, sendParentNotification, pushRealTimeUpdate, triggerAttendanceNotification, triggerGradeNotification, triggerFeeNotification, logParentActivity, getNotificationPriorityColor };
}
