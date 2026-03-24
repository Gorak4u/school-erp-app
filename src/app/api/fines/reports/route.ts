import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { Prisma } from '@prisma/client';

// GET /api/fines/reports - Generate fine reports and analytics
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const academicYearId = searchParams.get('academicYearId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const studentId = searchParams.get('studentId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    // Build date filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build where clause
    const where: any = {};
    
    // School filtering
    if (!ctx.isSuperAdmin || ctx.schoolId) {
      where.schoolId = ctx.schoolId;
    }
    
    if (academicYearId) {
      where.student = {
        academicYearId
      };
    }
    
    if (studentId) {
      where.studentId = studentId;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (Object.keys(dateFilter).length > 0) {
      where.issuedAt = dateFilter;
    }

    switch (reportType) {
      case 'summary':
        return await generateSummaryReport(where);
      case 'detailed':
        return await generateDetailedReport(where);
      case 'analytics':
        return await generateAnalyticsReport(where);
      case 'trends':
        return await generateTrendsReport(where);
      case 'student-wise':
        return await generateStudentWiseReport(where);
      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid report type. Available types: summary, detailed, analytics, trends, student-wise' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('GET /api/fines/reports:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateSummaryReport(where: any) {
  // Overall statistics
  const totalFines = await (schoolPrisma as any).Fine.count({ where });
  
  const amountStats = await (schoolPrisma as any).Fine.aggregate({
    where,
    _sum: {
      amount: true,
      paidAmount: true,
      waivedAmount: true,
      pendingAmount: true
    },
    _count: true
  });

  const statusBreakdown = await (schoolPrisma as any).Fine.groupBy({
    by: ['status'],
    where,
    _count: true,
    _sum: {
      amount: true,
      paidAmount: true,
      waivedAmount: true,
      pendingAmount: true
    }
  });

  const categoryBreakdown = await (schoolPrisma as any).Fine.groupBy({
    by: ['category'],
    where,
    _count: true,
    _sum: {
      amount: true,
      paidAmount: true,
      waivedAmount: true,
      pendingAmount: true
    }
  });

  const typeBreakdown = await (schoolPrisma as any).Fine.groupBy({
    by: ['type'],
    where,
    _count: true,
    _sum: {
      amount: true,
      paidAmount: true,
      waivedAmount: true,
      pendingAmount: true
    }
  });

  // Recent fines
  const recentFines = await (schoolPrisma as any).Fine.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          admissionNo: true,
          class: true,
          section: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({
    success: true,
    reportType: 'summary',
    data: {
      overview: {
        totalFines,
        totalAmount: amountStats._sum.amount || 0,
        totalPaid: amountStats._sum.paidAmount || 0,
        totalWaived: amountStats._sum.waivedAmount || 0,
        totalPending: amountStats._sum.pendingAmount || 0,
        collectionRate: amountStats._sum.amount 
          ? ((amountStats._sum.paidAmount || 0) / amountStats._sum.amount * 100).toFixed(2)
          : 0
      },
      statusBreakdown: statusBreakdown.map((item: any) => ({
        status: item.status,
        count: item._count,
        amount: item._sum.amount || 0,
        paidAmount: item._sum.paidAmount || 0,
        waivedAmount: item._sum.waivedAmount || 0,
        pendingAmount: item._sum.pendingAmount || 0
      })),
      categoryBreakdown: categoryBreakdown.map((item: any) => ({
        category: item.category,
        count: item._count,
        amount: item._sum.amount || 0,
        paidAmount: item._sum.paidAmount || 0,
        waivedAmount: item._sum.waivedAmount || 0,
        pendingAmount: item._sum.pendingAmount || 0
      })),
      typeBreakdown: typeBreakdown.map((item: any) => ({
        type: item.type,
        count: item._count,
        amount: item._sum.amount || 0,
        paidAmount: item._sum.paidAmount || 0,
        waivedAmount: item._sum.waivedAmount || 0,
        pendingAmount: item._sum.pendingAmount || 0
      })),
      recentFines
    }
  });
}

async function generateDetailedReport(where: any) {
  const fines = await (schoolPrisma as any).Fine.findFirst({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          admissionNo: true,
          class: true,
          section: true,
          rollNo: true
        }
      },
      rule: {
        select: {
          id: true,
          name: true,
          code: true,
          type: true
        }
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          receiptNumber: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      },
      waiverRequests: {
        select: {
          id: true,
          status: true,
          requestedBy: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: [
      { createdAt: 'desc' },
      { status: 'asc' }
    ]
  });

  return NextResponse.json({
    success: true,
    reportType: 'detailed',
    data: {
      fines,
      total: fines.length,
      summary: {
        totalAmount: fines.reduce((sum: number, fine: any) => sum + fine.amount, 0),
        totalPaid: fines.reduce((sum: number, fine: any) => sum + fine.paidAmount, 0),
        totalWaived: fines.reduce((sum: number, fine: any) => sum + fine.waivedAmount, 0),
        totalPending: fines.reduce((sum: number, fine: any) => sum + fine.pendingAmount, 0)
      }
    }
  });
}

async function generateAnalyticsReport(where: any) {
  // Monthly trends
  const monthlyTrends = await schoolPrisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      SUM("paidAmount") as total_paid,
      SUM("waivedAmount") as total_waived,
      SUM("pendingAmount") as total_pending
    FROM "Fine" 
    WHERE ${Object.keys(where).length > 0 ? Prisma.sql`1=1` : Prisma.sql`1=1`}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month DESC
    LIMIT 12
  ` as Array<{
    month: Date;
    count: bigint;
    total_amount: bigint;
    total_paid: bigint;
    total_waived: bigint;
    total_pending: bigint;
  }>;

  // Top fine types
  const topFineTypes = await (schoolPrisma as any).Fine.groupBy({
    by: ['type'],
    where,
    _count: true,
    _sum: {
      amount: true,
      paidAmount: true
    },
    orderBy: {
      type: 'asc'
    },
    take: 10
  });

  // Top fine categories
  const topFineCategories = await (schoolPrisma as any).Fine.groupBy({
    by: ['category'],
    where,
    _count: true,
    _sum: {
      amount: true,
      paidAmount: true
    },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    },
    take: 10
  });

  // Payment method breakdown
  const paymentMethodBreakdown = await schoolPrisma.finePayment.groupBy({
    by: ['paymentMethod'],
    where: {
      fine: where
    },
    _count: true,
    _sum: {
      amount: true
    },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    }
  });

  // Waiver request statistics
  const waiverStats = await schoolPrisma.fineWaiverRequest.groupBy({
    by: ['status'],
    where: {
      fine: where
    },
    _count: true
  });

  return NextResponse.json({
    success: true,
    reportType: 'analytics',
    data: {
      monthlyTrends: monthlyTrends.map(item => ({
        month: item.month.toISOString(),
        count: Number(item.count),
        totalAmount: Number(item.total_amount),
        totalPaid: Number(item.total_paid),
        totalWaived: Number(item.total_waived),
        totalPending: Number(item.total_pending)
      })),
      topFineTypes: topFineTypes.map((item: any) => ({
        type: item.type,
        count: item._count,
        totalAmount: Number(item._sum.amount || 0),
        totalPaid: Number(item._sum.paidAmount || 0)
      })),
      topFineCategories: topFineCategories.map((item: any) => ({
        category: item.category,
        count: item._count,
        totalAmount: Number(item._sum.amount || 0),
        totalPaid: Number(item._sum.paidAmount || 0)
      })),
      paymentMethodBreakdown: paymentMethodBreakdown.map((item: any) => ({
        paymentMethod: item.paymentMethod,
        count: item._count,
        totalAmount: Number(item._sum.amount || 0)
      })),
      waiverStats: waiverStats.map((item: any) => ({
        status: item.status,
        count: item._count
      }))
    }
  });
}

async function generateTrendsReport(where: any) {
  // Daily trends for last 30 days
  const dailyTrends = await schoolPrisma.$queryRaw`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      SUM("paidAmount") as total_paid,
      SUM("waivedAmount") as total_waived,
      SUM("pendingAmount") as total_pending
    FROM "Fine" 
    WHERE 
      "createdAt" >= NOW() - INTERVAL '30 days'
      AND ${Object.keys(where).length > 0 ? Prisma.sql`1=1` : Prisma.sql`1=1`}
    GROUP BY DATE("createdAt")
    ORDER BY date DESC
  ` as Array<{
    date: Date;
    count: bigint;
    total_amount: bigint;
    total_paid: bigint;
    total_waived: bigint;
    total_pending: bigint;
  }>;

  // Weekly trends
  const weeklyTrends = await schoolPrisma.$queryRaw`
    SELECT 
      DATE_TRUNC('week', "createdAt") as week,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      SUM("paidAmount") as total_paid,
      SUM("waivedAmount") as total_waived,
      SUM("pendingAmount") as total_pending
    FROM "Fine" 
    WHERE 
      "createdAt" >= NOW() - INTERVAL '12 weeks'
      AND ${Object.keys(where).length > 0 ? Prisma.sql`1=1` : Prisma.sql`1=1`}
    GROUP BY DATE_TRUNC('week', "createdAt")
    ORDER BY week DESC
  ` as Array<{
    week: Date;
    count: bigint;
    total_amount: bigint;
    total_paid: bigint;
    total_waived: bigint;
    total_pending: bigint;
  }>;

  // Growth comparison (current vs previous period)
  const currentPeriod = await (schoolPrisma as any).Fine.aggregate({
    where: {
      ...where,
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    },
    _count: true,
    _sum: {
      amount: true,
      paidAmount: true
    }
  });

  const previousPeriod = await (schoolPrisma as any).Fine.aggregate({
    where: {
      ...where,
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 60)),
        lt: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    },
    _count: true,
    _sum: {
      amount: true,
      paidAmount: true
    }
  });

  return NextResponse.json({
    success: true,
    reportType: 'trends',
    data: {
      dailyTrends: dailyTrends.map(item => ({
        date: item.date.toISOString(),
        count: Number(item.count),
        totalAmount: Number(item.total_amount),
        totalPaid: Number(item.total_paid),
        totalWaived: Number(item.total_waived),
        totalPending: Number(item.total_pending)
      })),
      weeklyTrends: weeklyTrends.map(item => ({
        week: item.week.toISOString(),
        count: Number(item.count),
        totalAmount: Number(item.total_amount),
        totalPaid: Number(item.total_paid),
        totalWaived: Number(item.total_waived),
        totalPending: Number(item.total_pending)
      })),
      growthComparison: {
        current: {
          count: currentPeriod._count,
          totalAmount: Number(currentPeriod._sum.amount || 0),
          totalPaid: Number(currentPeriod._sum.paidAmount || 0)
        },
        previous: {
          count: previousPeriod._count,
          totalAmount: Number(previousPeriod._sum.amount || 0),
          totalPaid: Number(previousPeriod._sum.paidAmount || 0)
        },
        growth: {
          count: previousPeriod._count 
            ? ((currentPeriod._count - previousPeriod._count) / previousPeriod._count * 100).toFixed(2)
            : 0,
          totalAmount: previousPeriod._sum.amount
            ? (((currentPeriod._sum.amount || 0) - (previousPeriod._sum.amount || 0)) / (previousPeriod._sum.amount || 1) * 100).toFixed(2)
            : 0,
          totalPaid: previousPeriod._sum.paidAmount
            ? (((currentPeriod._sum.paidAmount || 0) - (previousPeriod._sum.paidAmount || 0)) / (previousPeriod._sum.paidAmount || 1) * 100).toFixed(2)
            : 0
        }
      }
    }
  });
}

async function generateStudentWiseReport(where: any) {
  const studentFines = await (schoolPrisma as any).Fine.groupBy({
    by: ['studentId'],
    where,
    _count: true,
    _sum: {
      amount: true,
      paidAmount: true,
      waivedAmount: true,
      pendingAmount: true
    },
    orderBy: {
      _sum: {
        pendingAmount: 'desc'
      }
    },
    take: 100
  });

  // Get student details for each group
  const studentIds = studentFines.map((item: any) => item.studentId);
  const students = await (schoolPrisma as any).Student.findMany({
    where: {
      id: { in: studentIds },
      ...(where.student && { id: where.student.studentId })
    },
    select: {
      id: true,
      name: true,
      admissionNo: true,
      class: true,
      section: true,
      rollNo: true,
      email: true,
      phone: true
    }
  });

  const studentMap = students.reduce((map: any, student: any) => {
    map[student.id] = student;
    return map;
  }, {} as Record<string, any>);

  const studentWiseData = studentFines.map((item: any) => ({
    student: studentMap[item.studentId],
    statistics: {
      totalFines: item._count,
      totalAmount: Number(item._sum.amount || 0),
      totalPaid: Number(item._sum.paidAmount || 0),
      totalWaived: Number(item._sum.waivedAmount || 0),
      totalPending: Number(item._sum.pendingAmount || 0),
      collectionRate: item._sum.amount 
        ? ((item._sum.paidAmount || 0) / item._sum.amount * 100).toFixed(2)
        : 0
    }
  }));

  return NextResponse.json({
    success: true,
    reportType: 'student-wise',
    data: {
      students: studentWiseData,
      summary: {
        totalStudents: studentWiseData.length,
        totalFines: studentWiseData.reduce((sum: number, item: any) => sum + item.statistics.totalFines, 0),
        totalAmount: studentWiseData.reduce((sum: number, item: any) => sum + item.statistics.totalAmount, 0),
        totalPaid: studentWiseData.reduce((sum: number, item: any) => sum + item.statistics.totalPaid, 0),
        totalPending: studentWiseData.reduce((sum: number, item: any) => sum + item.statistics.totalPending, 0)
      }
    }
  });
}
