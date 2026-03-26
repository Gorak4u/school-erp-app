import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { getCachedData, setCachedData, getRefundAnalyticsKey } from '@/lib/refundCache';

// GET /api/dashboard/refunds - Dashboard refund analytics
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Check cache first
    const cacheKey = getRefundAnalyticsKey(ctx.schoolId || '', period);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Overall refund statistics
    const [
      totalRefunds,
      pendingRefunds,
      approvedRefunds,
      processedRefunds,
      rejectedRefunds
    ] = await Promise.all([
      (schoolPrisma as any).RefundRequest.count({
        where: { schoolId: ctx.schoolId }
      }),
      (schoolPrisma as any).RefundRequest.count({
        where: { schoolId: ctx.schoolId, status: 'pending' }
      }),
      (schoolPrisma as any).RefundRequest.count({
        where: { schoolId: ctx.schoolId, status: 'approved' }
      }),
      (schoolPrisma as any).RefundRequest.count({
        where: { schoolId: ctx.schoolId, status: 'processed' }
      }),
      (schoolPrisma as any).RefundRequest.count({
        where: { schoolId: ctx.schoolId, status: 'rejected' }
      })
    ]);

    // Financial totals
    const [
      totalAmount,
      pendingAmount,
      approvedAmount,
      processedAmount,
      rejectedAmount
    ] = await Promise.all([
      (schoolPrisma as any).RefundRequest.aggregate({
        where: { schoolId: ctx.schoolId },
        _sum: { amount: true, netAmount: true }
      }),
      (schoolPrisma as any).RefundRequest.aggregate({
        where: { schoolId: ctx.schoolId, status: 'pending' },
        _sum: { amount: true, netAmount: true }
      }),
      (schoolPrisma as any).RefundRequest.aggregate({
        where: { schoolId: ctx.schoolId, status: 'approved' },
        _sum: { amount: true, netAmount: true }
      }),
      (schoolPrisma as any).RefundRequest.aggregate({
        where: { schoolId: ctx.schoolId, status: 'processed' },
        _sum: { amount: true, netAmount: true }
      }),
      (schoolPrisma as any).RefundRequest.aggregate({
        where: { schoolId: ctx.schoolId, status: 'rejected' },
        _sum: { amount: true, netAmount: true }
      })
    ]);

    // Refund type breakdown
    const typeBreakdown = await (schoolPrisma as any).RefundRequest.groupBy({
      by: ['type'],
      where: { schoolId: ctx.schoolId },
      _sum: { amount: true, netAmount: true },
      _count: true
    });

    // Refund method breakdown
    const methodBreakdown = await (schoolPrisma as any).RefundRequest.groupBy({
      by: ['refundMethod'],
      where: { schoolId: ctx.schoolId },
      _sum: { amount: true, netAmount: true },
      _count: true
    });

    // Priority breakdown
    const priorityBreakdown = await (schoolPrisma as any).RefundRequest.groupBy({
      by: ['priority'],
      where: { schoolId: ctx.schoolId, status: 'pending' },
      _count: true,
      _sum: { netAmount: true }
    });

    // Monthly trend (last 6 months) by type and month
    const monthlyTrend = await (schoolPrisma as any).RefundRequest.groupBy({
      by: ['type', 'status'],
      where: {
        schoolId: ctx.schoolId,
        createdAt: { gte: daysAgo }
      },
      _sum: { amount: true, netAmount: true },
      _count: true
    });

    // Monthly trend by month for charts
    const monthlyTrendByMonth = await (schoolPrisma as any).RefundRequest.findMany({
      where: {
        schoolId: ctx.schoolId,
        createdAt: { gte: daysAgo }
      },
      select: {
        createdAt: true,
        type: true,
        status: true,
        amount: true,
        netAmount: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Process monthly trend data for charts
    const processedMonthlyTrend = monthlyTrendByMonth.reduce((acc: any, refund: any) => {
      const month = new Date(refund.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!acc[month]) {
        acc[month] = { month, academic_fee: 0, transport_fee: 0, fine: 0, overpayment: 0, total: 0 };
      }
      acc[month][refund.type] += refund.netAmount;
      acc[month].total += refund.netAmount;
      return acc;
    }, {});

    const monthlyChartData = Object.values(processedMonthlyTrend);

    // Recent refunds
    const recentRefunds = await (schoolPrisma as any).RefundRequest.findMany({
      where: { schoolId: ctx.schoolId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Approval efficiency metrics
    const approvalEfficiency = await (schoolPrisma as any).RefundRequest.findMany({
      where: {
        schoolId: ctx.schoolId,
        status: { in: ['approved', 'rejected', 'processed'] },
        approvedAt: { not: null }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        processedAt: true
      }
    });

    // Calculate average approval time
    const approvalTimes = approvalEfficiency
      .filter((r: any) => r.approvedAt)
      .map((r: any) => {
        const created = new Date(r.createdAt).getTime();
        const approved = new Date(r.approvedAt!).getTime();
        return (approved - created) / (1000 * 60 * 60); // hours
      });

    const avgApprovalTime = approvalTimes.length > 0 
      ? (approvalTimes.reduce((sum: number, time: number) => sum + time, 0) / approvalTimes.length).toFixed(1)
      : 0;

    // Calculate average processing time
    const processingTimes = approvalEfficiency
      .filter((r: any) => r.processedAt)
      .map((r: any) => {
        const created = new Date(r.createdAt).getTime();
        const processed = new Date(r.processedAt!).getTime();
        return (processed - created) / (1000 * 60 * 60); // hours
      });

    const avgProcessingTime = processingTimes.length > 0
      ? (processingTimes.reduce((sum: number, time: number) => sum + time, 0) / processingTimes.length).toFixed(1)
      : 0;

    // Auto-approval rate
    const autoApprovedCount = await (schoolPrisma as any).RefundRequest.count({
      where: {
        schoolId: ctx.schoolId,
        approvedBy: 'system'
      }
    });

    const autoApprovalRate = totalRefunds > 0 
      ? ((autoApprovedCount / totalRefunds) * 100).toFixed(1)
      : 0;

    // High priority pending refunds
    const highPriorityPending = await (schoolPrisma as any).RefundRequest.findMany({
      where: {
        schoolId: ctx.schoolId,
        status: 'pending',
        priority: 'high'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 5
    });

    const analytics = {
      overview: {
        totalRefunds,
        pendingRefunds,
        approvedRefunds,
        processedRefunds,
        rejectedRefunds,
        approvalRate: totalRefunds > 0 ? ((approvedRefunds + processedRefunds) / totalRefunds * 100).toFixed(1) : 0
      },
      financial: {
        totalAmount: totalAmount._sum.amount || 0,
        totalNetAmount: totalAmount._sum.netAmount || 0,
        totalAdminFees: (totalAmount._sum.amount || 0) - (totalAmount._sum.netAmount || 0),
        pendingAmount: pendingAmount._sum.netAmount || 0,
        approvedAmount: approvedAmount._sum.netAmount || 0,
        processedAmount: processedAmount._sum.netAmount || 0,
        rejectedAmount: rejectedAmount._sum.amount || 0
      },
      trends: {
        monthlyChartData,
        monthlyTrend: monthlyTrend.map((item: any) => ({
          type: item.type,
          status: item.status,
          count: item._count,
          amount: item._sum.amount || 0,
          netAmount: item._sum.netAmount || 0
        }))
      },
      efficiency: {
        avgApprovalTime: `${avgApprovalTime} hours`,
        avgProcessingTime: `${avgProcessingTime} hours`,
        autoApprovalRate: `${autoApprovalRate}%`,
        autoApprovedCount,
        totalProcessed: approvedRefunds + processedRefunds
      },
      breakdown: {
        byType: typeBreakdown.map((item: any) => ({
          type: item.type,
          count: item._count,
          amount: item._sum.amount || 0,
          netAmount: item._sum.netAmount || 0
        })),
        byMethod: methodBreakdown.map((item: any) => ({
          method: item.refundMethod,
          count: item._count,
          amount: item._sum.amount || 0,
          netAmount: item._sum.netAmount || 0
        })),
        byPriority: priorityBreakdown.map((item: any) => ({
          priority: item.priority,
          count: item._count,
          amount: item._sum.netAmount || 0
        }))
      },
      recent: recentRefunds.map((refund: any) => ({
        id: refund.id,
        type: refund.type,
        amount: refund.amount,
        netAmount: refund.netAmount,
        status: refund.status,
        priority: refund.priority,
        createdAt: refund.createdAt,
        student: refund.student
      })),
      alerts: {
        highPriorityPending: highPriorityPending.map((refund: any) => ({
          id: refund.id,
          amount: refund.netAmount,
          type: refund.type,
          createdAt: refund.createdAt,
          student: refund.student
        })),
        pendingCount: pendingRefunds,
        totalPendingAmount: pendingAmount._sum.netAmount || 0
      }
    };

    // Cache the result
    setCachedData(cacheKey, analytics);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('GET /api/dashboard/refunds:', error);
    return NextResponse.json({ error: 'Failed to fetch refund analytics' }, { status: 500 });
  }
}
