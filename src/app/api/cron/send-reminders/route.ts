import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { queueCommunicationOutbox } from '@/lib/communicationOutbox';

/**
 * Send Reminders - Cron Job Handler
 * Sends fee payment reminders and other notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reminders = {
      feeReminders: 0,
      attendanceReminders: 0,
      deadlineReminders: 0,
    };

    // 1. Send fee payment reminders
    try {
      const pendingFees = await schoolPrisma.feeRecord.findMany({
        where: {
          status: 'pending',
          dueDate: {
            lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Due in next 7 days (YYYY-MM-DD format)
          },
        },
        include: {
          // Get student information through separate query or relation
          // Note: Adjust based on your actual schema relations
        },
      });

      for (const fee of pendingFees) {
        // Get student information separately
        const student = await schoolPrisma.student.findUnique({
          where: { id: fee.studentId },
          select: {
            id: true,
            name: true,
            email: true,
            fatherEmail: true,
            motherEmail: true,
            phone: true,
            fatherPhone: true,
            schoolId: true,
          },
        });

        if (!student) continue; // Skip if student not found

        const recipientEmails = [
          student.email,
          student.fatherEmail,
          student.motherEmail,
        ].filter(Boolean);

        const recipientPhones = [
          student.phone,
          student.fatherPhone,
        ].filter(Boolean);

        for (const email of recipientEmails) {
          if (!email) continue;
          await queueCommunicationOutbox({
            email: {
              to: email,
              subject: `Fee Payment Reminder - ${student.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 24px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">💳 Fee Payment Reminder</h2>
                      <p style="color: #475569; margin: 0 0 16px 0; font-size: 16px;">Dear Parent/Guardian,</p>
                      <p style="color: #64748b; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                        This is a friendly reminder that the fee payment for <strong style="color: #1e293b;">${student.name}</strong> is due soon.
                      </p>
                      
                      <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <span style="color: #64748b; font-size: 14px;">Due Date</span>
                          <span style="color: #1e293b; font-weight: 600; font-size: 14px;">${fee.dueDate}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="color: #64748b; font-size: 14px;">Amount Due</span>
                          <span style="color: #dc2626; font-weight: 700; font-size: 18px;">₹${fee.amount}</span>
                        </div>
                      </div>
                      
                      <div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
                          ⚠️ Status: <strong>Pending</strong>
                        </p>
                        <p style="color: #92400e; margin: 8px 0 0 0; font-size: 13px;">
                          Please ensure timely payment to avoid any late fees.
                        </p>
                      </div>
                      
                      <div style="margin: 24px 0;">
                        <p style="color: #64748b; margin: 0 0 12px 0; font-size: 14px;">
                          For payment assistance or queries, please contact the school office.
                        </p>
                      </div>
                      
                      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #475569; margin: 0; font-size: 14px;">
                          Best regards,<br>
                          <strong style="color: #1e293b;">School Administration</strong><br>
                          <span style="color: #64748b; font-size: 12px;">Finance Department</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              `,
              schoolId: student.schoolId || undefined,
            },
          });
          reminders.feeReminders++;
        }

        // SMS reminders for critical fees (due in 2 days) - TODO: Implement SMS gateway
        if (fee.dueDate && new Date(fee.dueDate).getTime() <= Date.now() + 2 * 24 * 60 * 60 * 1000) {
          console.log(`[Cron] SMS reminder would be sent to ${recipientPhones.join(', ')} for fee payment of ${student.name}`);
          reminders.feeReminders++;
        }
      }
    } catch (error) {
      console.error('[Cron] Fee reminders error:', error);
    }

    // 2. Send attendance reminders (for students with low attendance)
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get students with attendance data
      const studentsWithAttendance = await schoolPrisma.student.findMany({
        where: {
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          email: true,
          fatherEmail: true,
          motherEmail: true,
          schoolId: true,
        },
      });

      for (const student of studentsWithAttendance) {
        // Get attendance records for this student
        const attendanceRecords = await schoolPrisma.attendanceRecord.findMany({
          where: {
            studentId: student.id,
            date: {
              gte: thirtyDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD format
            },
          },
        });

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        if (attendanceRate < 75 && totalDays >= 10) { // Less than 75% attendance with at least 10 days
          const recipientEmails = [
            student.email,
            student.fatherEmail,
            student.motherEmail,
          ].filter(Boolean);

          for (const email of recipientEmails) {
            if (!email) continue;
            await queueCommunicationOutbox({
              email: {
                to: email,
                subject: `Low Attendance Alert - ${student.name}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); padding: 24px; border-radius: 8px; margin-bottom: 20px;">
                      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #991b1b; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">⚠️ Low Attendance Alert</h2>
                        <p style="color: #475569; margin: 0 0 16px 0; font-size: 16px;">Dear Parent/Guardian,</p>
                        <p style="color: #64748b; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                          This is to inform you that <strong style="color: #991b1b;">${student.name}</strong> has low attendance and needs immediate attention.
                        </p>
                        
                        <div style="background: #fef3c7; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                          <div style="text-align: center; margin-bottom: 12px;">
                            <div style="display: inline-block; padding: 8px 16px; background: ${attendanceRate < 50 ? '#dc2626' : attendanceRate < 75 ? '#f59e0b' : '#10b981'}; color: white; border-radius: 20px; font-weight: 600; font-size: 16px;">
                              ${attendanceRate.toFixed(1)}% Attendance
                            </div>
                          </div>
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #92400e; font-size: 14px;">Present Days</span>
                            <span style="color: #92400e; font-weight: 600; font-size: 16px;">${presentDays} / ${totalDays}</span>
                          </div>
                        </div>
                        
                        <div style="background: #fee2e2; padding: 12px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
                          <p style="color: #991b1b; margin: 0; font-size: 14px; font-weight: 500;">
                            📉 Attendance Status: <strong>${attendanceRate < 50 ? 'Critical' : 'Below Average'}</strong>
                          </p>
                          <p style="color: #991b1b; margin: 8px 0 0 0; font-size: 13px;">
                            Regular attendance is crucial for academic success and overall development.
                          </p>
                        </div>
                        
                        <div style="background: #f0f9ff; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                          <h4 style="color: #0c4a6e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">💡 Recommendations:</h4>
                          <ul style="color: #0c4a6e; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
                            <li>Ensure your child attends school regularly unless genuinely unwell</li>
                            <li>Provide proper reasons for any absences to the class teacher</li>
                            <li>Check with teachers for any missed assignments or lessons</li>
                            <li>Maintain communication with the school regarding attendance concerns</li>
                          </ul>
                        </div>
                        
                        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                          <p style="color: #475569; margin: 0; font-size: 14px;">
                            Best regards,<br>
                            <strong style="color: #1e293b;">School Administration</strong><br>
                            <span style="color: #64748b; font-size: 12px;">Academic Department</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                `,
                schoolId: student.schoolId || undefined,
              },
            });
            reminders.attendanceReminders++;
          }
        }
      }
    } catch (error) {
      console.error('[Cron] Attendance reminders error:', error);
    }

    // 3. Send deadline reminders for assignments/exams (if applicable)
    try {
      // This would depend on your assignment/exam system
      // For now, just a placeholder
      console.log('[Cron] Deadline reminders: Not implemented yet');
    } catch (error) {
      console.error('[Cron] Deadline reminders error:', error);
    }

    return NextResponse.json({
      success: true,
      reminders,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cron] Send reminders error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
