import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { parseDateParam } from '@/lib/parseDateParam';
import { ARCHIVED_STUDENT_STATUSES } from '@/lib/studentStatus';

// Alumni statuses for tracking
const ALUMNI_STATUSES = ['graduated', 'transferred', 'exit', 'exited', 'suspended'];

// GET /api/fees/statistics - Optimized reports data with date range filtering
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const studentClass = searchParams.get('class');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const fromDate = parseDateParam(searchParams.get('fromDate'));
    const toDate = parseDateParam(searchParams.get('toDate'), { endOfDay: true });

    // Build WHERE conditions for students with tenant filtering
    const studentWhereConditions: any = { ...tenantWhere(ctx) };
    const studentAndConditions: any[] = [];
    if (academicYear && academicYear !== 'all') {
      studentWhereConditions.academicYear = academicYear;
    }
    if (studentClass && studentClass !== 'all') {
      studentWhereConditions.class = studentClass;
    }
    if (!includeArchived) {
      studentAndConditions.push({ NOT: { status: { in: ARCHIVED_STUDENT_STATUSES as unknown as string[] } } });
    }
    if (studentAndConditions.length > 0) {
      studentWhereConditions.AND = studentAndConditions;
    }

    // Build WHERE conditions for payments (with date filtering)
    const paymentWhereConditions: any = {};
    if (fromDate || toDate) {
      paymentWhereConditions.createdAt = {};
      if (fromDate) {
        paymentWhereConditions.createdAt.gte = fromDate;
      }
      if (toDate) {
        paymentWhereConditions.createdAt.lte = toDate;
      }
    }

    // OPTIMIZED: Use aggregations instead of loading all students
    const [
      studentCount,
      alumniCount,
      feeAggregates,
      alumniFeeAggregates,
      paymentAggregations,
      alumniPaymentAggregations,
      classBreakdownData,
      alumniClassBreakdownData,
      monthlyPayments,
      alumniMonthlyPayments,
    ] = await Promise.all([
      // Count students only (active students)
      schoolPrisma.student.count({ where: studentWhereConditions }),
      
      // Count alumni students (archived statuses)
      schoolPrisma.student.count({ 
        where: { 
          ...tenantWhere(ctx),
          status: { in: ALUMNI_STATUSES }
        }
      }),
      
      // Aggregate fee records for active students with date filtering
      schoolPrisma.feeRecord.aggregate({
        where: {
          student: studentWhereConditions,
          ...(fromDate || toDate ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate })
            }
          } : {})
        },
        _sum: {
          amount: true,
          paidAmount: true,
          pendingAmount: true,
          discount: true,
        },
      }),
      
      // Aggregate fee records for alumni students with date filtering
      schoolPrisma.feeRecord.aggregate({
        where: {
          student: {
            ...tenantWhere(ctx),
            status: { in: ALUMNI_STATUSES }
          },
          ...(fromDate || toDate ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate })
            }
          } : {})
        },
        _sum: {
          amount: true,
          paidAmount: true,
          pendingAmount: true,
          discount: true,
        },
      }),
      
      // Get aggregated payment data by method for active students with date filtering
      schoolPrisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          ...paymentWhereConditions,
          feeRecord: {
            student: studentWhereConditions
          }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      
      // Get aggregated payment data by method for alumni students with date filtering
      schoolPrisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          ...paymentWhereConditions,
          feeRecord: {
            student: {
              ...tenantWhere(ctx),
              status: { in: ALUMNI_STATUSES }
            }
          }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Get class breakdown using groupBy for active students
      schoolPrisma.student.groupBy({
        by: ['class'],
        where: studentWhereConditions,
        _count: { id: true },
      }),
      
      // Get class breakdown using groupBy for alumni students
      schoolPrisma.student.groupBy({
        by: ['class'],
        where: {
          ...tenantWhere(ctx),
          status: { in: ALUMNI_STATUSES }
        },
        _count: { id: true },
      }),

      // Get limited payments for monthly trend for active students (last 1000 payments max)
      schoolPrisma.payment.findMany({
        where: {
          ...paymentWhereConditions,
          feeRecord: {
            student: studentWhereConditions
          }
        },
        select: {
          amount: true,
          createdAt: true,
          paymentMethod: true,
          feeRecord: {
            select: {
              studentId: true,
              student: { select: { class: true } }
            }
          },
          collectedBy: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit to prevent memory issues
      }),
      
      // Get limited payments for monthly trend for alumni students (last 1000 payments max)
      schoolPrisma.payment.findMany({
        where: {
          ...paymentWhereConditions,
          feeRecord: {
            student: {
              ...tenantWhere(ctx),
              status: { in: ALUMNI_STATUSES }
            }
          }
        },
        select: {
          amount: true,
          createdAt: true,
          paymentMethod: true,
          feeRecord: {
            select: {
              studentId: true,
              student: { select: { class: true, status: true } }
            }
          },
          collectedBy: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit to prevent memory issues
      })
    ]);

    
    // OPTIMIZED: Calculate statistics from aggregates
    const totalStudents = studentCount;
    const totalAlumni = alumniCount;
    const totalFees = feeAggregates._sum.amount || 0;
    const totalCollected = feeAggregates._sum.paidAmount || 0;
    const totalPending = feeAggregates._sum.pendingAmount || 0;
    const totalDiscount = feeAggregates._sum.discount || 0;
    const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;
    
    // Alumni statistics
    const alumniTotalFees = alumniFeeAggregates._sum.amount || 0;
    const alumniTotalCollected = alumniFeeAggregates._sum.paidAmount || 0;
    const alumniTotalPending = alumniFeeAggregates._sum.pendingAmount || 0;
    const alumniTotalDiscount = alumniFeeAggregates._sum.discount || 0;
    const alumniCollectionRate = alumniTotalFees > 0 ? (alumniTotalCollected / alumniTotalFees) * 100 : 0;

    // OPTIMIZED: Use database aggregation for payment status with date filtering
    const statusAggregates = await schoolPrisma.feeRecord.groupBy({
      by: ['status'],
      where: {
        student: studentWhereConditions,
        ...(fromDate || toDate ? {
          createdAt: {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lte: toDate })
          }
        } : {})
      },
      _count: { id: true },
      _sum: {
        amount: true,
        paidAmount: true,
        pendingAmount: true,
        discount: true,
      },
    });

    const paymentStatusBreakdown = statusAggregates.map(item => ({
      status: item.status || 'no_payment',
      count: item._count.id,
      totalFees: item._sum.amount || 0,
      totalPaid: item._sum.paidAmount || 0,
      totalPending: item._sum.pendingAmount || 0,
      totalDiscount: item._sum.discount || 0,
      percentage: totalStudents > 0 ? (item._count.id / totalStudents) * 100 : 0
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

    // OPTIMIZED: Class breakdown from aggregated data
    const classBreakdown = classBreakdownData.reduce((acc: any, item) => {
      acc[item.class || 'Unknown'] = {
        studentCount: item._count.id,
        totalFees: 0,
        totalPaid: 0,
        totalPending: 0,
      };
      return acc;
    }, {} as Record<string, any>);
    
    // Alumni class breakdown from aggregated data
    const alumniClassBreakdown = alumniClassBreakdownData.reduce((acc: any, item) => {
      acc[item.class || 'Unknown'] = {
        alumniCount: item._count.id,
        totalFees: 0,
        totalPaid: 0,
        totalPending: 0,
      };
      return acc;
    }, {} as Record<string, any>);

    // Monthly trend from filtered payment data for active students
    const monthlyData = new Array(12).fill(0).map((_, i) => ({
      month: i + 1,
      monthName: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      amount: 0,
      transactions: 0,
      uniqueStudents: new Set(),
      collectors: new Set()
    }));
    
    // Alumni monthly trend from filtered payment data
    const alumniMonthlyData = new Array(12).fill(0).map((_, i) => ({
      month: i + 1,
      monthName: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      amount: 0,
      transactions: 0,
      uniqueStudents: new Set(),
      collectors: new Set()
    }));

    // Process limited payments to get monthly data for active students
    monthlyPayments.forEach(payment => {
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
    
    // Process limited payments to get monthly data for alumni students
    alumniMonthlyPayments.forEach(payment => {
      const date = payment.createdAt; // Use createdAt DateTime field
      if (date) {
        const month = date.getMonth(); // 0-11
        if (month >= 0 && month < 12) {
          alumniMonthlyData[month].amount += payment.amount || 0;
          alumniMonthlyData[month].transactions += 1;
          if (payment.feeRecord?.studentId) {
            alumniMonthlyData[month].uniqueStudents.add(payment.feeRecord.studentId);
          }
          if (payment.collectedBy) {
            alumniMonthlyData[month].collectors.add(payment.collectedBy);
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
    
    // Convert Sets to counts for alumni
    const alumniMonthlyTrend = alumniMonthlyData.map(month => ({
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
        totalStudents: studentCount,
        totalFees,
        totalCollected,
        totalPending,
        totalDiscount,
        collectionRate,
        paymentStatusBreakdown: completeStatusBreakdown,
        classBreakdown: Object.entries(classBreakdown).map(([className, data]: [string, any]) => ({
          class: className,
          studentCount: data.studentCount,
          totalFees: data.totalFees,
          totalPaid: data.totalPaid,
          totalPending: data.totalPending
        })),
        alumniClassBreakdown: Object.entries(alumniClassBreakdown).map(([className, data]: [string, any]) => ({
          class: className,
          alumniCount: data.alumniCount,
          totalFees: data.totalFees,
          totalPaid: data.totalPaid,
          totalPending: data.totalPending
        })),
        monthlyTrend,
        alumniMonthlyTrend,
        paymentMethodBreakdown: paymentAggregations.map(pg => ({
          paymentMethod: pg.paymentMethod,
          totalAmount: pg._sum.amount || 0,
          count: pg._count.id
        })),
        alumniPaymentMethodBreakdown: alumniPaymentAggregations.map(pg => ({
          paymentMethod: pg.paymentMethod,
          totalAmount: pg._sum.amount || 0,
          count: pg._count.id
        })),
        statistics: {
          totalStudents: studentCount,
          totalFees,
          totalCollected,
          totalPending,
          collectionRate
        },
        alumniStatistics: {
          totalAlumni: alumniCount,
          totalFees: alumniTotalFees,
          totalCollected: alumniTotalCollected,
          totalPending: alumniTotalPending,
          collectionRate: alumniCollectionRate
        },
        filters: {
          academicYear,
          studentClass,
          includeArchived,
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
