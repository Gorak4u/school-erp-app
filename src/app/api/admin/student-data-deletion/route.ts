import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma, saasPrisma } from '@/lib/prisma-server';
import { getSessionContext } from '@/lib/apiAuth';

/**
 * CRITICAL: This endpoint completely removes all student data from all tables
 * Only accessible by SaaS super admins
 * This action is irreversible and should be logged for audit purposes
 */

interface DeletionLog {
  studentId: string;
  admissionNo: string;
  name: string;
  schoolId: string;
  schoolName: string;
  deletedBy: string;
  deletedAt: Date;
  tablesAffected: string[];
  recordsDeleted: number;
}

export async function POST(req: NextRequest) {
  // Perform actual student data deletion
  const startTime = Date.now();
  let deletionLog: DeletionLog;

  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    
    if (!ctx.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only SaaS super admins can perform this action' },
        { status: 403 }
      );
    }

    const { studentId, admissionNo, schoolId, confirmation } = await req.json();

    // Validate required fields
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    if (!studentId && !admissionNo) {
      return NextResponse.json(
        { error: 'Either Student ID or Admission Number is required' },
        { status: 400 }
      );
    }

    // Require explicit confirmation
    if (confirmation !== 'DELETE_STUDENT_DATA_PERMANENTLY') {
      return NextResponse.json(
        { 
          error: 'Explicit confirmation required',
          requiredConfirmation: 'DELETE_STUDENT_DATA_PERMANENTLY'
        },
        { status: 400 }
      );
    }

    // Build search query based on what's provided
    const whereClause: any = { schoolId };
    if (studentId) {
      whereClause.id = studentId;
    } else if (admissionNo) {
      whereClause.admissionNo = admissionNo;
    }

    // Get student information for logging
    const student = await schoolPrisma.student.findFirst({
      where: whereClause,
      select: {
        id: true,
        admissionNo: true,
        name: true,
        schoolId: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify school exists
    const school = await schoolPrisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Initialize deletion tracking
    const tablesAffected: string[] = [];
    let totalRecordsDeleted = 0;

    console.log(`🗑️ Starting complete student data deletion: ${student.admissionNo} - ${student.name}`);

    // Use the actual student ID from the found student record
    const actualStudentId = student.id;

    // Perform deletion in dependency order (child tables first)
    const deletionOperations = [
      // 1. Assignment related data
      {
        name: 'AssignmentSubmissions',
        operation: () => schoolPrisma.assignmentSubmission.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },
      {
        name: 'AssignmentRecipients',
        operation: () => schoolPrisma.assignmentRecipient.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 2. Fee related data
      {
        name: 'FeeDiscountApplications',
        operation: () => schoolPrisma.discountApplication.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },
      {
        name: 'FeeRecords',
        operation: () => schoolPrisma.feeRecord.deleteMany({
          where: { studentId: actualStudentId }
        })
      },

      // 3. Attendance data
      {
        name: 'AttendanceRecords',
        operation: () => schoolPrisma.attendanceRecord.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 4. Exam results
      {
        name: 'ExamResults',
        operation: () => schoolPrisma.examResult.deleteMany({
          where: { studentId: actualStudentId }
        })
      },

      // 5. Medical records
      {
        name: 'MedicalRecords',
        operation: () => schoolPrisma.medicalRecord.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 6. Transport assignments
      {
        name: 'StudentTransport',
        operation: () => schoolPrisma.studentTransport.deleteMany({
          where: { studentId: actualStudentId }
        })
      },

      // 7. Fines
      {
        name: 'Fines',
        operation: () => schoolPrisma.fine.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 8. Refund requests
      {
        name: 'RefundRequests',
        operation: () => schoolPrisma.refundRequest.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 9. Book loans
      {
        name: 'BookLoans',
        operation: () => schoolPrisma.bookLoan.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 10. Attendance fine counters
      {
        name: 'AttendanceFineCounters',
        operation: () => schoolPrisma.attendanceFineCounter.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 11. Student promotions
      {
        name: 'StudentPromotions',
        operation: () => schoolPrisma.studentPromotion.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 12. Teacher notes (where student is specified)
      {
        name: 'TeacherNotes',
        operation: () => schoolPrisma.teacherNote.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 13. Razorpay transactions (student payments)
      {
        name: 'RazorpayTransactions',
        operation: () => schoolPrisma.razorpayPaymentTransaction.deleteMany({
          where: { studentId: actualStudentId, schoolId }
        })
      },

      // 14. Finally, the student record itself
      {
        name: 'Student',
        operation: () => schoolPrisma.student.delete({
          where: { id: actualStudentId, schoolId }
        })
      }
    ];

    // Execute all deletions
    for (const deletion of deletionOperations) {
      try {
        const result = await deletion.operation();
        const deletedCount = 'count' in result ? result.count : 1;
        totalRecordsDeleted += deletedCount;
        
        if (deletedCount > 0) {
          tablesAffected.push(deletion.name);
          console.log(`✅ Deleted ${deletedCount} records from ${deletion.name}`);
        }
      } catch (error) {
        console.error(`❌ Error deleting from ${deletion.name}:`, error);
        // Continue with other deletions even if one fails
      }
    }

    // Create deletion log
    deletionLog = {
      studentId: student.id,
      admissionNo: student.admissionNo,
      name: student.name,
      schoolId: school.id,
      schoolName: school.name,
      deletedBy: ctx.userId || 'unknown',
      deletedAt: new Date(),
      tablesAffected,
      recordsDeleted: totalRecordsDeleted
    };

    console.log(`🗑️ Student data deletion completed: ${totalRecordsDeleted} records from ${tablesAffected.length} tables`);

    return NextResponse.json({
      success: true,
      message: 'Student data deletion completed',
      deletionLog: {
        studentId: deletionLog.studentId,
        admissionNo: deletionLog.admissionNo,
        name: deletionLog.name,
        schoolName: deletionLog.schoolName,
        deletedAt: deletionLog.deletedAt,
        tablesAffected: deletionLog.tablesAffected,
        recordsDeleted: deletionLog.recordsDeleted
      },
      duration: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('❌ Student data deletion failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete student data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Return information about what would be deleted (for preview)
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    
    if (!ctx.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only SaaS super admins can access this endpoint' },
        { status: 403 }
      );
    }

    const searchParams = new URL(req.url).searchParams;
    const studentId = searchParams.get('studentId');
    const admissionNo = searchParams.get('admissionNo');
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    if (!studentId && !admissionNo) {
      return NextResponse.json(
        { error: 'Either Student ID or Admission Number is required' },
        { status: 400 }
      );
    }

    // Build search query based on what's provided
    const whereClause: any = { schoolId };
    if (studentId) {
      whereClause.id = studentId;
    } else if (admissionNo) {
      whereClause.admissionNo = admissionNo;
    }

    // Get student information
    const student = await schoolPrisma.student.findFirst({
      where: whereClause,
      select: {
        id: true,
        admissionNo: true,
        name: true,
        schoolId: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Use the actual student ID for counting
    const actualStudentId = student.id;

    // Count records in each table that would be affected
    const counts = await Promise.all([
      schoolPrisma.assignmentSubmission.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.assignmentRecipient.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.discountApplication.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.feeRecord.count({ where: { studentId: actualStudentId } }),
      schoolPrisma.attendanceRecord.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.examResult.count({ where: { studentId: actualStudentId } }),
      schoolPrisma.medicalRecord.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.studentTransport.count({ where: { studentId: actualStudentId } }),
      schoolPrisma.fine.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.refundRequest.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.bookLoan.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.attendanceFineCounter.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.studentPromotion.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.teacherNote.count({ where: { studentId: actualStudentId, schoolId } }),
      schoolPrisma.razorpayPaymentTransaction.count({ where: { studentId: actualStudentId, schoolId } }),
    ]);

    const tableNames = [
      'AssignmentSubmissions', 'AssignmentRecipients', 'FeeDiscountApplications',
      'FeeRecords', 'AttendanceRecords', 'ExamResults', 'MedicalRecords',
      'StudentTransport', 'Fines', 'RefundRequests', 'BookLoans',
      'AttendanceFineCounters', 'StudentPromotions', 'TeacherNotes',
      'RazorpayTransactions', 'Student'
    ];

    const affectedTables = tableNames.map((name, index) => ({
      table: name,
      records: counts[index]
    }));

    const totalRecords = counts.reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        name: student.name
      },
      totalRecords,
      affectedTables,
      warning: `This will permanently delete ${totalRecords} records from ${affectedTables.filter(t => t.records > 0).length} tables. This action cannot be undone.`
    });

  } catch (error) {
    console.error('❌ Student data preview failed:', error);
    return NextResponse.json(
      { error: 'Failed to preview student data deletion', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
