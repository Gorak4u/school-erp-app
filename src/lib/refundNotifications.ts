import { schoolPrisma } from '@/lib/prisma';

// Refund notification functions
export async function sendRefundStatusNotification(refundId: string, status: string) {
  try {
    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { id: refundId },
      include: {
        student: true,
        approvals: {
          include: {
            approver: true
          }
        }
      }
    });

    if (!refund) return;

    const notificationData = {
      refundId,
      studentId: refund.studentId,
      status,
      amount: refund.netAmount,
      reason: refund.reason,
      studentName: refund.student.name,
      parentEmail: refund.student.parentEmail,
      parentPhone: refund.student.parentPhone,
      refundNumber: `REF-${refund.id.slice(-8).toUpperCase()}`,
      timestamp: new Date()
    };

    // Send email notification
    await sendRefundEmail(notificationData);
    
    // Send SMS notification if phone available
    if (refund.student.parentPhone) {
      await sendRefundSMS(notificationData);
    }

    // Log notification
    // Notification sent successfully
  } catch (error) {
    console.error('Error sending refund notification:', error);
  }
}

async function sendRefundEmail(data: any) {
  // TODO: Integrate with existing email service
  const emailContent = {
    to: data.parentEmail,
    subject: `Refund ${data.status} - ${data.refundNumber}`,
    template: 'refund-status',
    data: {
      studentName: data.studentName,
      refundNumber: data.refundNumber,
      status: data.status,
      amount: data.amount,
      reason: data.reason,
      timestamp: data.timestamp
    }
  };
  // await emailService.send(emailContent);
}

async function sendRefundSMS(data: any) {
  // TODO: Integrate with existing SMS service
  const smsContent = {
    to: data.parentPhone,
    message: `Refund ${data.status}: ${data.refundNumber} for ₹${data.amount}. Status: ${data.status}. ${data.timestamp.toLocaleDateString()}`
  };
  // await smsService.send(smsContent);
}

export async function sendBulkRefundNotification(routeId: string, refundCount: number, totalAmount: number) {
  try {
    const route = await (schoolPrisma as any).TransportRoute.findFirst({
      where: { id: routeId },
      include: {
        students: {
          where: { isActive: true },
          include: {
            student: true
          }
        }
      }
    });

    if (!route) return;

    // Send notification to all parents on the route
    for (const studentTransport of route.students) {
      const notificationData = {
        studentId: studentTransport.student.id,
        parentEmail: studentTransport.student.parentEmail,
        parentPhone: studentTransport.student.parentPhone,
        studentName: studentTransport.student.name,
        routeName: route.routeName,
        refundCount,
        totalAmount,
        timestamp: new Date()
      };

      await sendBulkRefundEmail(notificationData);
    }
  } catch (error) {
    console.error('Error sending bulk refund notification:', error);
  }
}

async function sendBulkRefundEmail(data: any) {
  const emailContent = {
    to: data.parentEmail,
    subject: `Transport Fee Refund - ${data.routeName}`,
    template: 'bulk-refund',
    data: {
      studentName: data.studentName,
      routeName: data.routeName,
      refundCount: data.refundCount,
      totalAmount: data.totalAmount,
      timestamp: data.timestamp
    }
  };

  console.log('Bulk refund email data:', emailContent);
  // await emailService.send(emailContent);
}

export async function notifyStakeholdersOnRefundCompletion(refundId: string) {
  try {
    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { id: refundId },
      include: {
        student: true,
        transactions: true,
        approvals: {
          include: {
            approver: true
          }
        }
      }
    });

    if (!refund || refund.status !== 'processed') return;

    // Notify parents
    await sendRefundStatusNotification(refundId, 'processed');

    // Notify finance department
    await notifyFinanceDepartment(refund);

    // Update audit log
    await updateRefundAuditLog(refundId, 'stakeholders_notified');
  } catch (error) {
    console.error('Error notifying stakeholders:', error);
  }
}

async function notifyFinanceDepartment(refund: any) {
  // TODO: Get finance department users and send notifications
  const financeNotification = {
    type: 'refund_processed',
    refundId: refund.id,
    amount: refund.netAmount,
    studentName: refund.student.name,
    refundMethod: refund.refundMethod,
    processedAt: new Date()
  };

  // await notificationService.notifyFinance(financeNotification);
}

async function updateRefundAuditLog(refundId: string, action: string) {
  try {
    await (schoolPrisma as any).RefundRequest.update({
      where: { id: refundId },
      data: {
        metadata: {
          auditLog: {
            [action]: new Date().toISOString()
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating audit log:', error);
  }
}
