import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ARCHIVED_STUDENT_STATUSES, normalizeStudentStatus } from '@/lib/studentStatus';

// GET /api/fees/students - Optimized students data with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const studentId = searchParams.get('studentId');
    const studentClass = searchParams.get('class');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const academicYear = searchParams.get('academicYear');
    const paymentStatus = searchParams.get('paymentStatus');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build WHERE conditions
    const whereConditions: any = {};
    const andConditions: any[] = [];
    
    // Tenant isolation - strict: null schoolId only visible to super admins
    if (!ctx.isSuperAdmin) {
      if (ctx.schoolId) {
        whereConditions.schoolId = ctx.schoolId;
      } else {
        // Non-admin users without school context get no data
        whereConditions.id = 'impossible-id-no-match';
      }
    }
    // Super admins can see all students including null schoolId
    
    if (studentClass && studentClass !== 'all') {
      whereConditions.class = studentClass;
    }

    if (studentId) {
      whereConditions.id = studentId;
    }
    
    if (status && status !== 'all') {
      andConditions.push(
        status === 'exited' || status === 'exit'
          ? { status: { in: ['exit', 'exited'] } }
          : { status }
      );
    }

    if (!includeArchived) {
      andConditions.push({ NOT: { status: { in: ARCHIVED_STUDENT_STATUSES as unknown as string[] } } });
    }
    
    if (academicYear && academicYear !== 'all') {
      whereConditions.academicYear = academicYear;
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      // Note: payment_status would need to be added to Student model
      // For now, we'll filter based on fee calculations
      whereConditions.OR = [
        { totalPaid: { gt: 0 }, totalPending: { gt: 0 } },
        { totalPaid: { gt: 0 }, totalPending: 0 },
        { totalPaid: 0, totalPending: { gt: 0 } }
      ];
    }
    
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
        { parentPhone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (andConditions.length > 0) {
      whereConditions.AND = andConditions;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count for pagination
    const total = await prisma.student.count({
      where: whereConditions
    });

    // Get students with optimized includes
    const students = await prisma.student.findMany({
      where: whereConditions,
      include: {
        feeRecords: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            feeStructure: true,
            payments: {
              take: 3,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy
    });

    // Fetch fines data for all students in parallel
    const studentIds = students.map(s => s.id);
    const finesData = studentIds.length > 0 ? await (prisma as any).fine.findMany({
      where: {
        studentId: { in: studentIds },
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        waiverRequests: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    }) : [];

    // Group fines by student for efficient lookup
    const finesByStudent = finesData.reduce((acc: any, fine: any) => {
      if (!acc[fine.studentId]) {
        acc[fine.studentId] = [];
      }
      acc[fine.studentId].push(fine);
      return acc;
    }, {});

    // Process student data to calculate fee summaries
    const processedStudents = students.map(student => {
      // Calculate fee totals from fee records
      const feeRecords = student.feeRecords || [];
      
      // Get fines for this student
      const studentFines = finesByStudent[student.id] || [];
      
      // Calculate regular fee totals
      const regularFeesTotal = feeRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
      const regularFeesPaid = feeRecords.reduce((sum, record) => sum + (record.paidAmount || 0), 0);
      const regularFeesPending = feeRecords.reduce((sum, record) => sum + (record.pendingAmount || 0), 0);
      // Calculate separate totals for discounts vs waivers
      const regularFeesDiscount = feeRecords.reduce((sum, record) => sum + (record.discount || 0), 0);
      const regularFeesWaived = feeRecords.reduce((sum, record) => {
        // Check if this is a transport waiver
        if (record.feeStructure?.category === 'transport' && record.status === 'cancelled' && record.discount > 0) {
          return sum + (record.discount || 0);
        }
        return sum;
      }, 0);
      
      // Calculate fines totals
      const finesTotal = studentFines.reduce((sum: number, fine: any) => sum + (fine.amount || 0), 0);
      const finesPaid = studentFines.reduce((sum: number, fine: any) => sum + (fine.paidAmount || 0), 0);
      const finesPending = studentFines.reduce((sum: number, fine: any) => sum + (fine.pendingAmount || 0), 0);
      const finesWaived = studentFines.reduce((sum: number, fine: any) => sum + (fine.waivedAmount || 0), 0);
      
      // Combined totals (fees + fines)
      const totalFees = regularFeesTotal + finesTotal;
      const totalPaid = regularFeesPaid + finesPaid;
      const totalPending = regularFeesPending + finesPending;
      const totalDiscount = regularFeesDiscount + finesWaived;
      const totalWaived = regularFeesWaived + finesWaived;
      
      // Get latest payment date
      const allPayments = feeRecords.flatMap(fr => fr.payments || []);
      const latestPayment = allPayments.length > 0 
        ? allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

      // Determine payment status - calculate from payment amounts
      let calculatedPaymentStatus: 'fully_paid' | 'partially_paid' | 'no_payment' | 'overdue';
      
      // Calculate overdue based on due dates and pending amounts (including fines)
      const now = new Date();
      const overdueRecords = feeRecords.filter(fr => {
        const pendingAmount = (fr.amount || 0) - (fr.paidAmount || 0) - (fr.discount || 0);
        const isOverdue = fr.dueDate && new Date(fr.dueDate) < now && pendingAmount > 0;
        return isOverdue;
      });
      const overdueFines = studentFines.filter((fine: any) => {
        const pendingAmount = (fine.amount || 0) - (fine.paidAmount || 0) - (fine.waivedAmount || 0);
        const isOverdue = fine.dueDate && new Date(fine.dueDate) < now && pendingAmount > 0;
        return isOverdue;
      });
      
      const regularFeesOverdue = overdueRecords.reduce((sum, record) => sum + ((record.amount || 0) - (record.paidAmount || 0) - (record.discount || 0)), 0);
      const finesOverdue = overdueFines.reduce((sum: number, fine: any) => sum + ((fine.amount || 0) - (fine.paidAmount || 0) - (fine.waivedAmount || 0)), 0);
      const totalOverdue = regularFeesOverdue + finesOverdue;
      
      if (totalOverdue > 0) {
        calculatedPaymentStatus = 'overdue';
      } else if (totalPaid === 0) {
        calculatedPaymentStatus = 'no_payment';
      } else if (totalPaid >= totalFees) {
        calculatedPaymentStatus = 'fully_paid';
      } else {
        calculatedPaymentStatus = 'partially_paid';
      }

      // Apply payment status filter if specified
      if (paymentStatus && paymentStatus !== 'all' && calculatedPaymentStatus !== paymentStatus) {
        return null; // Filter out this student
      }

      return {
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        studentStatus: normalizeStudentStatus(student.status),
        section: student.section || '',
        rollNo: student.rollNo || '',
        admissionNo: student.admissionNo || '',
        totalFees,
        totalPaid,
        totalPending,
        totalOverdue,
        totalDiscount,
        totalWaived, // Add separate waived amount
        lastPaymentDate: latestPayment?.paymentDate || '',
        calculatedPaymentStatus,
        // Add fines-specific data
        finesTotal,
        finesPaid,
        finesPending,
        finesWaived,
        fineAmount: finesTotal, // For backward compatibility with existing UI
        pendingFinesCount: studentFines.filter((fine: any) => (fine.pendingAmount || 0) > 0).length,
        feeRecords: feeRecords.map(fr => {
          // Normalize academic year to 'YYYY-YY' format
          let normalizedAcademicYear = fr.academicYear;
          if (fr.academicYear && fr.academicYear.length === 4 && /^\d{4}$/.test(fr.academicYear)) {
            // Convert '2026' to '2025-26' format
            const year = parseInt(fr.academicYear);
            normalizedAcademicYear = `${year-1}-${fr.academicYear.slice(-2)}`;
          }
          
          // Calculate status for each fee record
          let status: string;
          const pendingAmount = (fr.amount || 0) - (fr.paidAmount || 0) - (fr.discount || 0);
          const isOverdue = fr.dueDate && fr.dueDate && new Date(fr.dueDate) < new Date() && pendingAmount > 0;
          
          if (isOverdue) {
            status = 'overdue';
          } else if (fr.paidAmount === 0) {
            status = 'pending';
          } else if ((fr.paidAmount || 0) >= ((fr.amount || 0) - (fr.discount || 0))) {
            status = 'paid';
          } else {
            status = 'partial';
          }
          
          return {
            id: fr.id,
            amount: fr.amount,
            paidAmount: fr.paidAmount,
            discount: fr.discount,
            pendingAmount: (fr.amount || 0) - (fr.paidAmount || 0) - (fr.discount || 0),
            status,
            dueDate: fr.dueDate,
            paymentMethod: fr.paymentMethod,
            payments: fr.payments,
            academicYear: normalizedAcademicYear, // Use normalized academic year
            category: fr.feeStructure?.category || 'academic',
            feeStructure: fr.feeStructure || null
          };
        }),
        // Additional student info
        gender: student.gender,
        phone: student.phone,
        email: student.email,
        parentName: student.parentName || student.fatherName || student.motherName || '',
        parentPhone: student.parentPhone || student.fatherPhone || student.motherPhone || '',
        medium: student.languageMedium || '',
        academicYear: student.academicYear
      };
    }).filter(student => student !== null); // Remove filtered out students

    // Recalculate total after payment status filtering
    const filteredTotal = paymentStatus && paymentStatus !== 'all' 
      ? processedStudents.length 
      : total;

    return NextResponse.json({
      success: true,
      data: {
        students: processedStudents,
        pagination: {
          page,
          limit,
          total: filteredTotal,
          totalPages: Math.ceil(filteredTotal / limit),
          hasNext: page * limit < filteredTotal,
          hasPrev: page > 1
        },
        summary: {
          totalStudents: filteredTotal,
          totalFees: processedStudents.reduce((sum, s) => sum + (s?.totalFees || 0), 0),
          totalCollected: processedStudents.reduce((sum, s) => sum + (s?.totalPaid || 0), 0),
          totalPending: processedStudents.reduce((sum, s) => sum + (s?.totalPending || 0), 0),
          // Add fines-specific summary data
          totalFinesAmount: processedStudents.reduce((sum, s) => sum + (s?.finesTotal || 0), 0),
          totalFinesCollected: processedStudents.reduce((sum, s) => sum + (s?.finesPaid || 0), 0),
          totalFinesPending: processedStudents.reduce((sum, s) => sum + (s?.finesPending || 0), 0),
          totalFinesWaived: processedStudents.reduce((sum, s) => sum + (s?.finesWaived || 0), 0),
          // Regular payment status counts
          fullyPaid: processedStudents.filter(s => s?.calculatedPaymentStatus === 'fully_paid').length,
          partiallyPaid: processedStudents.filter(s => s?.calculatedPaymentStatus === 'partially_paid').length,
          noPayment: processedStudents.filter(s => s?.calculatedPaymentStatus === 'no_payment').length,
          overdue: processedStudents.filter(s => s?.calculatedPaymentStatus === 'overdue').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch students',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
