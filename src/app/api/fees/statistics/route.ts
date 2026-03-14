import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/fees/statistics - Optimized reports data with date range filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const studentClass = searchParams.get('class');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    
    // Build WHERE conditions for students
    const studentWhereConditions: any = {};
    if (academicYear && academicYear !== 'all') {
      studentWhereConditions.academicYear = academicYear;
    }
    if (studentClass && studentClass !== 'all') {
      studentWhereConditions.class = studentClass;
    }

    // Build WHERE conditions for payments (with date filtering)
    const paymentWhereConditions: any = {};
    if (fromDate || toDate) {
      // Use createdAt DateTime field for reliable date filtering
      if (fromDate) {
        paymentWhereConditions.createdAt = {
          ...paymentWhereConditions.createdAt,
          gte: new Date(fromDate)
        };
      }
      if (toDate) {
        paymentWhereConditions.createdAt = {
          ...paymentWhereConditions.createdAt,
          lte: new Date(toDate + 'T23:59:59.999Z') // Include entire end day
        };
      }
    }

    // Use database aggregation for statistics
    const [students, paymentAggregations, filteredPayments] = await Promise.all([
      // Get all students with their fee records (no pagination)
      prisma.student.findMany({
        where: studentWhereConditions,
        include: {
          feeRecords: {
            where: paymentWhereConditions, // Apply date filter to fee records
            include: {
              payments: {
                where: paymentWhereConditions, // Apply date filter to payments
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      
      // Get aggregated payment data for statistics (with all filters)
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          ...paymentWhereConditions,
          feeRecord: {
            student: studentWhereConditions
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      }),

      // Get all filtered payments for monthly trend calculation
      prisma.payment.findMany({
        where: {
          ...paymentWhereConditions,
          feeRecord: {
            student: studentWhereConditions
          }
        },
        include: {
          feeRecord: {
            include: {
              student: {
                select: { class: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    
    // Calculate overall statistics
    const totalStudents = students.length;
    const totalFees = students.reduce((sum, student) => {
      return sum + student.feeRecords.reduce((feeSum, record) => feeSum + (record.amount || 0), 0);
    }, 0);
    const totalCollected = students.reduce((sum, student) => {
      return sum + student.feeRecords.reduce((feeSum, record) => feeSum + (record.paidAmount || 0), 0);
    }, 0);
    const totalPending = totalFees - totalCollected;
    const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;

    // Calculate payment status breakdown with proper amounts
    const paymentStatusCounts = students.reduce((acc: any, student) => {
      const studentTotal = student.feeRecords?.reduce((sum: number, record: any) => sum + (record.amount || 0), 0) || 0;
      const studentPaid = student.feeRecords?.reduce((sum: number, record: any) => sum + (record.paidAmount || 0), 0) || 0;
      const studentPending = studentTotal - studentPaid;
      
      // Check for overdue records
      const hasOverdue = student.feeRecords?.some((record: any) => {
        return record.status === 'overdue' || (record.dueDate && new Date(record.dueDate) < new Date() && record.pendingAmount > 0);
      });
      
      let status = 'no_payment';
      if (studentPaid >= studentTotal && studentTotal > 0) {
        status = 'fully_paid';
      } else if (studentPaid > 0 && hasOverdue) {
        status = 'overdue';
      } else if (studentPaid > 0) {
        status = 'partially_paid';
      } else if (hasOverdue) {
        status = 'overdue';
      }
      
      // Initialize status if not exists
      if (!acc[status]) {
        acc[status] = { count: 0, totalFees: 0, totalPaid: 0, totalPending: 0 };
      }
      
      acc[status].count += 1;
      acc[status].totalFees += studentTotal;
      acc[status].totalPaid += studentPaid;
      acc[status].totalPending += studentPending;
      
      return acc;
    }, {} as Record<string, any>);

    const paymentStatusBreakdown = Object.entries(paymentStatusCounts).map(([status, data]: [string, any]) => ({
      status,
      count: data.count,
      totalFees: data.totalFees,
      totalPaid: data.totalPaid,
      totalPending: data.totalPending,
      percentage: totalStudents > 0 ? (data.count / totalStudents) * 100 : 0
    }));

    // Ensure all statuses are present
    const allStatuses = ['fully_paid', 'partially_paid', 'no_payment', 'overdue'];
    const completeStatusBreakdown = allStatuses.map(status => {
      const existing = paymentStatusBreakdown.find(s => s.status === status);
      return existing || {
        status,
        count: 0,
        totalFees: 0,
        totalPaid: 0,
        totalPending: 0,
        percentage: 0
      };
    });

    // Class breakdown
    const classBreakdown = students.reduce((acc: any, student) => {
      const className = student.class || 'Unknown';
      if (!acc[className]) {
        acc[className] = {
          studentCount: 0,
          totalFees: 0,
          totalPaid: 0,
          totalPending: 0,
          fullyPaid: 0,
          partiallyPaid: 0,
          noPayment: 0
        };
      }
      
      acc[className].studentCount += 1;
      
      const studentTotal = student.feeRecords?.reduce((sum: number, record: any) => sum + (record.amount || 0), 0) || 0;
      const studentPaid = student.feeRecords?.reduce((sum: number, record: any) => sum + (record.paidAmount || 0), 0) || 0;
      
      acc[className].totalFees += studentTotal;
      acc[className].totalPaid += studentPaid;
      acc[className].totalPending += studentTotal - studentPaid;
      
      let status = 'no_payment';
      if (studentPaid >= studentTotal && studentTotal > 0) {
        status = 'fully_paid';
        acc[className].fullyPaid += 1;
      } else if (studentPaid > 0) {
        status = 'partially_paid';
        acc[className].partiallyPaid += 1;
      } else {
        acc[className].noPayment += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Monthly trend from filtered payment data
    const monthlyData = new Array(12).fill(0).map((_, i) => ({
      month: i + 1,
      monthName: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      amount: 0,
      transactions: 0,
      uniqueStudents: new Set(),
      collectors: new Set()
    }));

    // Process filtered payments to get monthly data
    filteredPayments.forEach(payment => {
      const date = payment.createdAt; // Use createdAt DateTime field
      if (date) {
        const month = date.getMonth(); // 0-11
        if (month >= 0 && month < 12) {
          monthlyData[month].amount += payment.amount || 0;
          monthlyData[month].transactions += 1;
          if (payment.feeRecord?.studentId) {
            monthlyData[month].uniqueStudents.add(payment.feeRecord.studentId);
          }
          if (payment.collectedBy) {
            monthlyData[month].collectors.add(payment.collectedBy);
          }
        }
      }
    });

    // Convert Sets to counts
    const monthlyTrend = monthlyData.map(month => ({
      month: month.month,
      monthName: month.monthName,
      amount: month.amount,
      transactions: month.transactions,
      uniqueStudents: month.uniqueStudents.size,
      collectors: month.collectors.size
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: students.length,
        totalFees,
        totalCollected,
        totalPending,
        collectionRate,
        paymentStatusBreakdown: completeStatusBreakdown,
        classBreakdown: Object.entries(classBreakdown).map(([className, data]: [string, any]) => ({
          class: className,
          studentCount: data.studentCount,
          totalFees: data.totalFees,
          totalPaid: data.totalPaid,
          totalPending: data.totalPending
        })),
        monthlyTrend,
        paymentMethodBreakdown: paymentAggregations.map(pg => ({
          paymentMethod: pg.paymentMethod,
          totalAmount: pg._sum.amount || 0,
          count: pg._count.id
        })),
        statistics: {
          totalStudents: students.length,
          totalFees,
          totalCollected,
          totalPending,
          collectionRate
        },
        filters: {
          academicYear,
          studentClass,
          fromDate,
          toDate
        }
      }
    });

  } catch (error) {
    console.error('Error fetching fee statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch fee statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
