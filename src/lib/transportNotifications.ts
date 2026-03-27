import { schoolPrisma } from './prisma';
import { routeChangeNotificationTemplate, routeChangeNotificationText } from './emails/transport/routeChangeNotification';
import { assignmentConfirmationTemplate, assignmentConfirmationText } from './emails/transport/assignmentConfirmation';
import { transportFeeReminderTemplate } from './emails/transport/feeReminder';
import { sendEmail } from './email';
import { logger } from './logger';

// Create notification in database
async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: any;
  schoolId?: string;
}) {
  try {
    await (schoolPrisma as any).notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        schoolId: data.schoolId,
        isRead: false,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Failed to create notification', { error, userId: data.userId, type: data.type });
  }
}

// ─── ROUTE CHANGE NOTIFICATION ───────────────────────────────────────────────

export async function sendRouteChangeNotification(params: {
  studentId: string;
  oldRouteId?: string;
  newRouteId: string;
  effectiveDate: string;
  schoolId: string;
}) {
  try {
    // Fetch student, parent, route, and school details
    const [student, newRoute, oldRoute, school] = await Promise.all([
      (schoolPrisma as any).student.findUnique({
        where: { id: params.studentId },
        select: { 
          name: true, 
          parentEmail: true, 
          parentName: true,
          userId: true
        }
      }),
      (schoolPrisma as any).transportRoute.findUnique({
        where: { id: params.newRouteId },
        select: { routeNumber: true, routeName: true, monthlyFee: true }
      }),
      params.oldRouteId ? (schoolPrisma as any).transportRoute.findUnique({
        where: { id: params.oldRouteId },
        select: { routeName: true }
      }) : null,
      (schoolPrisma as any).school.findUnique({
        where: { id: params.schoolId },
        select: { name: true }
      })
    ]);

    if (!student || !newRoute || !school) {
      logger.error('Missing data for route change notification', {
        studentId: params.studentId,
        oldRouteId: params.oldRouteId,
        newRouteId: params.newRouteId,
        schoolId: params.schoolId
      });
      return;
    }

    // Get assignment details
    const assignment = await (schoolPrisma as any).StudentTransport.findFirst({
      where: { studentId: params.studentId, routeId: params.newRouteId, isActive: true },
      select: { pickupStop: true, dropStop: true, monthlyFee: true }
    });

    const emailData = {
      studentName: student.name,
      oldRoute: oldRoute?.routeName,
      newRoute: newRoute.routeName,
      routeNumber: newRoute.routeNumber,
      pickupStop: assignment?.pickupStop || 'TBD',
      dropStop: assignment?.dropStop,
      monthlyFee: assignment?.monthlyFee || newRoute.monthlyFee,
      effectiveDate: params.effectiveDate,
      schoolName: school.name
    };

    // Send email to parent
    if (student.parentEmail) {
      try {
        const result = await sendEmail({
          to: student.parentEmail,
          subject: `Transport Route ${oldRoute ? 'Change' : 'Assignment'} - ${student.name}`,
          html: routeChangeNotificationTemplate(emailData)
        });
        
        if (!result.success) {
          logger.error('Failed to send transport route change email', {
            to: student.parentEmail,
            error: result.error
          });
        }
      } catch (error) {
        logger.error('Exception sending transport route change email', error as any);
      }
    }

    // Create bell notification for parent
    if (student.userId) {
      await createNotification({
        userId: student.userId,
        type: 'transport_route_change',
        title: `🚌 Transport Route ${oldRoute ? 'Changed' : 'Assigned'}`,
        message: `${student.name}'s transport route has been ${oldRoute ? 'changed to' : 'assigned to'} ${newRoute.routeName} (${newRoute.routeNumber})`,
        priority: 'high',
        metadata: { studentId: params.studentId, routeId: params.newRouteId },
        schoolId: params.schoolId
      });
    }

    return { success: true, message: 'Route change notification sent' };
  } catch (error) {
    logger.error('Error sending route change notification', { error, params });
    return { success: false, error };
  }
}

// ─── ASSIGNMENT CONFIRMATION ──────────────────────────────────────────────────

export async function sendAssignmentConfirmation(params: {
  studentId: string;
  routeId: string;
  academicYear: string;
  schoolId: string;
}) {
  try {
    const [student, route, assignment, school] = await Promise.all([
      (schoolPrisma as any).student.findUnique({
        where: { id: params.studentId },
        select: { 
          name: true, 
          parentEmail: true, 
          parentName: true,
          userId: true
        }
      }),
      (schoolPrisma as any).transportRoute.findUnique({
        where: { id: params.routeId },
        select: { routeNumber: true, routeName: true, monthlyFee: true }
      }),
      (schoolPrisma as any).studentTransport.findFirst({
        where: { studentId: params.studentId, routeId: params.routeId, isActive: true },
        select: { pickupStop: true, dropStop: true, monthlyFee: true }
      }),
      (schoolPrisma as any).school.findUnique({
        where: { id: params.schoolId },
        select: { name: true }
      })
    ]);

    if (!student || !route || !assignment || !school) {
      logger.error('Missing data for assignment confirmation', {
        studentId: params.studentId,
        routeId: params.routeId,
        schoolId: params.schoolId
      });
      return;
    }

    const emailData = {
      studentName: student.name,
      routeNumber: route.routeNumber,
      routeName: route.routeName,
      pickupStop: assignment.pickupStop,
      dropStop: assignment.dropStop,
      monthlyFee: assignment.monthlyFee,
      academicYear: params.academicYear,
      schoolName: school.name
    };

    // Send email
    if (student.parentEmail) {
      await sendEmail({
        to: student.parentEmail,
        subject: `Transport Assignment Confirmed - ${student.name}`,
        html: assignmentConfirmationTemplate(emailData)
      });
    }

    // Create bell notification
    if (student.userId) {
      await createNotification({
        userId: student.userId,
        type: 'transport_assignment',
        title: '✅ Transport Assignment Confirmed',
        message: `${student.name} has been assigned to ${route.routeName} (${route.routeNumber}) for ${params.academicYear}`,
        priority: 'medium',
        metadata: { studentId: params.studentId, routeId: params.routeId },
        schoolId: params.schoolId
      });
    }

    return { success: true, message: 'Assignment confirmation sent' };
  } catch (error) {
    logger.error('Error sending assignment confirmation', { error, params });
    return { success: false, error };
  }
}

// ─── FEE REMINDER ─────────────────────────────────────────────────────────────

export async function sendTransportFeeReminder(params: {
  studentId: string;
  feeRecordId: string;
  isOverdue?: boolean;
  schoolId: string;
}) {
  try {
    const [student, feeRecord, school] = await Promise.all([
      (schoolPrisma as any).student.findUnique({
        where: { id: params.studentId },
        select: { 
          name: true, 
          parentEmail: true, 
          parentName: true,
          userId: true
        }
      }),
      (schoolPrisma as any).FeeRecord.findUnique({
        where: { id: params.feeRecordId },
        include: { feeStructure: true }
      }),
      (schoolPrisma as any).school.findUnique({
        where: { id: params.schoolId },
        select: { name: true }
      })
    ]);

    if (!student || !feeRecord || !school) {
      logger.error('Missing data for fee reminder', {
        studentId: params.studentId,
        feeRecordId: params.feeRecordId,
        schoolId: params.schoolId
      });
      return;
    }

    // Get transport assignment
    const assignment = await (schoolPrisma as any).StudentTransport.findFirst({
      where: { studentId: params.studentId, isActive: true },
      include: { route: true }
    });

    if (!assignment) {
      logger.error('No active transport assignment found', { studentId: params.studentId });
      return;
    }

    const emailData = {
      studentName: student.name,
      routeNumber: assignment.route.routeNumber,
      routeName: assignment.route.routeName,
      monthlyFee: assignment.monthlyFee,
      dueDate: new Date(feeRecord.dueDate).toLocaleDateString('en-IN'),
      pendingAmount: feeRecord.pendingAmount,
      academicYear: feeRecord.academicYear,
      schoolName: school.name,
      isOverdue: params.isOverdue
    };

    // Send email
    if (student.parentEmail) {
      await sendEmail({
        to: student.parentEmail,
        subject: `Transport Fee ${params.isOverdue ? 'Overdue' : 'Reminder'} - ${student.name}`,
        html: transportFeeReminderTemplate(emailData)
      });
    }

    // Create bell notification
    if (student.userId) {
      await createNotification({
        userId: student.userId,
        type: params.isOverdue ? 'transport_fee_overdue' : 'transport_fee_reminder',
        title: params.isOverdue ? '⚠️ Transport Fee Overdue' : '💰 Transport Fee Reminder',
        message: `Transport fee of ₹${feeRecord.pendingAmount.toLocaleString('en-IN')} for ${student.name} is ${params.isOverdue ? 'overdue' : 'due on ' + new Date(feeRecord.dueDate).toLocaleDateString('en-IN')}`,
        priority: params.isOverdue ? 'high' : 'medium',
        metadata: { studentId: params.studentId, feeRecordId: params.feeRecordId },
        schoolId: params.schoolId
      });
    }

    return { success: true, message: 'Fee reminder sent' };
  } catch (error) {
    logger.error('Error sending fee reminder', { error, params });
    return { success: false, error };
  }
}

// ─── CAPACITY WARNING (Transport Manager) ────────────────────────────────────

export async function sendCapacityWarning(params: {
  routeId: string;
  utilizationRate: number;
  schoolId: string;
}) {
  try {
    const [route, transportManagers] = await Promise.all([
      (schoolPrisma as any).transportRoute.findUnique({
        where: { id: params.routeId },
        select: { routeNumber: true, routeName: true, capacity: true }
      }),
      // Get all admin users as transport managers
      (schoolPrisma as any).school_User.findMany({
        where: { schoolId: params.schoolId, role: 'admin' },
        select: { id: true, email: true }
      })
    ]);

    if (!route || !transportManagers.length) return;

    const studentsAssigned = Math.round((route.capacity * params.utilizationRate) / 100);

    // Create notifications for all transport managers
    for (const manager of transportManagers) {
      await createNotification({
        userId: manager.id,
        type: 'transport_capacity_warning',
        title: '⚠️ Route Capacity Warning',
        message: `Route ${route.routeNumber} (${route.routeName}) is ${params.utilizationRate}% full (${studentsAssigned}/${route.capacity} students)`,
        priority: params.utilizationRate >= 95 ? 'high' : 'medium',
        metadata: { routeId: params.routeId, utilizationRate: params.utilizationRate },
        schoolId: params.schoolId
      });
    }

    return { success: true, message: 'Capacity warning sent to transport managers' };
  } catch (error) {
    logger.error('Error sending capacity warning', { error, params });
    return { success: false, error };
  }
}

// ─── BULK NOTIFICATION (Promotion, Route Copy, etc.) ─────────────────────────

export async function sendBulkTransportNotification(params: {
  type: 'promotion_transport' | 'route_copied' | 'route_deleted';
  studentIds?: string[];
  routeId?: string;
  targetAcademicYear?: string;
  message: string;
  schoolId: string;
}) {
  try {
    const admins = await (schoolPrisma as any).user.findMany({
      where: { schoolId: params.schoolId, role: 'admin' },
      select: { id: true }
    });

    // Create notification for all admins
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: params.type,
        title: `📊 ${params.type === 'promotion_transport' ? 'Promotion Transport Update' : params.type === 'route_copied' ? 'Route Copied' : 'Route Deleted'}`,
        message: params.message,
        priority: 'medium',
        metadata: { 
          studentIds: params.studentIds, 
          routeId: params.routeId,
          targetAcademicYear: params.targetAcademicYear
        },
        schoolId: params.schoolId
      });
    }

    return { success: true, message: 'Bulk notification sent' };
  } catch (error) {
    logger.error('Error sending bulk notification', { error, params });
    return { success: false, error };
  }
}
