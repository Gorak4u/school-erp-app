import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { parseDateParam } from '@/lib/parseDateParam';
import { ARCHIVED_STUDENT_STATUSES } from '@/lib/studentStatus';

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
      feeAggregates,
      paymentAggregations,
      classBreakdownData,
      monthlyPayments,
    ] = await Promise.all([
      // Count students only
      schoolPrisma.student.count({ where: studentWhereConditions }),
      
      // Aggregate fee records with date filtering
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
        },
      }),
      
      // Get aggregated payment data by method with date filtering
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

      // Get class breakdown using groupBy
      schoolPrisma.student.groupBy({
        by: ['class'],
        where: studentWhereConditions,
        _count: { id: true },
      }),

      // Get limited payments for monthly trend (last 1000 payments max)
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
      })
    ]);

    
    // OPTIMIZED: Calculate statistics from aggregates
    const totalStudents = studentCount;
    const totalFees = feeAggregates._sum.amount || 0;
    const totalCollected = feeAggregates._sum.paidAmount || 0;
    const totalPending = feeAggregates._sum.pendingAmount || 0;
    const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;

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
      },
    });

    const paymentStatusBreakdown = statusAggregates.map(item => ({
      status: item.status || 'no_payment',
      count: item._count.id,
      totalFees: item._sum.amount || 0,
      totalPaid: item._sum.paidAmount || 0,
      totalPending: item._sum.pendingAmount || 0,
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

    // Monthly trend from filtered payment data
    const monthlyData = new Array(12).fill(0).map((_, i) => ({
      month: i + 1,
      monthName: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      amount: 0,
      transactions: 0,
      uniqueStudents: new Set(),
      collectors: new Set()
    }));

    // Process limited payments to get monthly data
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
        totalStudents: studentCount,
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
          totalStudents: studentCount,
          totalFees,
          totalCollected,
          totalPending,
          collectionRate
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
