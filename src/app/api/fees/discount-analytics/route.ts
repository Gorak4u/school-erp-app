import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

/**
 * Discount Analytics API
 * Optimized for processing 10M+ records using aggregate functions and indexed queries
 */

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Using schoolPrisma directly as it's tenant-aware through context
    const { searchParams } = new URL(request.url);
    
    const academicYear = searchParams.get('academicYear');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const scope = searchParams.get('scope'); // student, class, bulk
    const status = searchParams.get('status'); // pending, approved, applied, rejected

    // Build base where clause with indexes
    const baseWhere: any = {
      schoolId: ctx.schoolId,
    };

    if (academicYear) baseWhere.academicYear = academicYear;
    if (scope) baseWhere.scope = scope;
    if (status) baseWhere.status = status;
    
    if (dateFrom || dateTo) {
      baseWhere.createdAt = {};
      if (dateFrom) baseWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) baseWhere.createdAt.lte = new Date(dateTo);
    }

    // Execute optimized aggregate queries in parallel
    const [
      totalDiscounts,
      discountsByStatus,
      discountsByScope,
      discountsByType,
      totalAmountDiscounted,
      topRequesters,
      monthlyTrends,
      approvalStats,
      feeStructureImpact
    ] = await Promise.all([
      // 1. Total discount requests count
      schoolPrisma.discountRequest.count({ where: baseWhere }),

      // 2. Group by status with counts
      schoolPrisma.discountRequest.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { id: true },
      }),

      // 3. Group by scope (student, class, bulk)
      schoolPrisma.discountRequest.groupBy({
        by: ['scope'],
        where: baseWhere,
        _count: { id: true },
      }),

      // 4. Group by discount type (percentage, fixed, full_waiver)
      schoolPrisma.discountRequest.groupBy({
        by: ['discountType'],
        where: baseWhere,
        _count: { id: true },
        _avg: { discountValue: true },
        _sum: { discountValue: true },
      }),

      // 5. Calculate total amount discounted (only applied discounts)
      schoolPrisma.discountRequest.aggregate({
        where: { ...baseWhere, status: 'applied' },
        _sum: { discountValue: true },
        _avg: { discountValue: true },
        _count: { id: true },
      }),

      // 6. Top requesters by count
      schoolPrisma.discountRequest.groupBy({
        by: ['requestedBy', 'requestedByName'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // 7. Monthly trends (last 12 months)
      schoolPrisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          SUM(CASE WHEN status = 'applied' THEN "discountValue" ELSE 0 END) as total_amount
        FROM "school"."DiscountRequest"
        WHERE "schoolId" = ${ctx.schoolId}
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,

      // 8. Approval statistics (time to approve, approval rate)
      schoolPrisma.$queryRaw`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status IN ('approved', 'applied') THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          AVG(
            CASE 
              WHEN status IN ('approved', 'applied', 'rejected') 
              THEN EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 3600 
            END
          ) as avg_approval_time_hours
        FROM "school"."DiscountRequest"
        WHERE "schoolId" = ${ctx.schoolId}
      `,

      // 9. Fee structure impact analysis
      schoolPrisma.$queryRaw`
        SELECT 
          dr.scope,
          dr."targetType",
          COUNT(*) as request_count,
          COUNT(CASE WHEN dr.status = 'applied' THEN 1 END) as applied_count,
          SUM(CASE WHEN dr.status = 'applied' THEN dr."discountValue" ELSE 0 END) as total_discount_amount
        FROM "school"."DiscountRequest" dr
        WHERE dr."schoolId" = ${ctx.schoolId}
        GROUP BY dr.scope, dr."targetType"
        ORDER BY applied_count DESC
      `
    ]);

    // Calculate derived metrics
    const approvalRate = approvalStats[0]?.total_requests > 0
      ? ((Number(approvalStats[0].approved_count) / Number(approvalStats[0].total_requests)) * 100).toFixed(2)
      : 0;

    const rejectionRate = approvalStats[0]?.total_requests > 0
      ? ((Number(approvalStats[0].rejected_count) / Number(approvalStats[0].total_requests)) * 100).toFixed(2)
      : 0;

    const avgApprovalTimeHours = approvalStats[0]?.avg_approval_time_hours 
      ? Number(approvalStats[0].avg_approval_time_hours).toFixed(2)
      : 0;

    // Format monthly trends
    const formattedMonthlyTrends = monthlyTrends.map((trend: any) => ({
      month: new Date(trend.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      totalRequests: Number(trend.count),
      approved: Number(trend.approved_count),
      applied: Number(trend.applied_count),
      rejected: Number(trend.rejected_count),
      totalAmount: Number(trend.total_amount || 0),
    }));

    // Format status breakdown
    const statusBreakdown = discountsByStatus.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});

    // Format scope breakdown
    const scopeBreakdown = discountsByScope.reduce((acc: any, item: any) => {
      acc[item.scope] = item._count.id;
      return acc;
    }, {});

    // Format type breakdown
    const typeBreakdown = discountsByType.map((item: any) => ({
      type: item.discountType,
      count: item._count.id,
      avgValue: Number(item._avg.discountValue || 0).toFixed(2),
      totalValue: Number(item._sum.discountValue || 0).toFixed(2),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRequests: totalDiscounts,
          totalAmountDiscounted: Number(totalAmountDiscounted._sum.discountValue || 0).toFixed(2),
          avgDiscountAmount: Number(totalAmountDiscounted._avg.discountValue || 0).toFixed(2),
          appliedDiscountsCount: totalAmountDiscounted._count,
          approvalRate: `${approvalRate}%`,
          rejectionRate: `${rejectionRate}%`,
          avgApprovalTimeHours,
        },
        breakdowns: {
          byStatus: statusBreakdown,
          byScope: scopeBreakdown,
          byType: typeBreakdown,
        },
        topRequesters: topRequesters.map((req: any) => ({
          userId: req.requestedBy,
          name: req.requestedByName,
          requestCount: req._count.id,
        })),
        monthlyTrends: formattedMonthlyTrends,
        feeStructureImpact: feeStructureImpact.map((impact: any) => ({
          scope: impact.scope,
          targetType: impact.targetType,
          requestCount: Number(impact.request_count),
          appliedCount: Number(impact.applied_count),
          totalDiscountAmount: Number(impact.total_discount_amount || 0).toFixed(2),
        })),
        approvalMetrics: {
          pending: Number(approvalStats[0]?.pending_count || 0),
          approved: Number(approvalStats[0]?.approved_count || 0),
          rejected: Number(approvalStats[0]?.rejected_count || 0),
          avgApprovalTimeHours,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/fees/discount-analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount analytics' },
      { status: 500 }
    );
  }
}
