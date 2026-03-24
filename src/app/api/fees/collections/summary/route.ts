import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { parseDateParam } from '@/lib/parseDateParam';

// GET /api/fees/collections/summary-optimized - Database-optimized for 10M records
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const fromDate = parseDateParam(searchParams.get('fromDate'));
    const toDate = parseDateParam(searchParams.get('toDate'), { endOfDay: true });

    // Build WHERE conditions safely
    const whereConditions = [];
    if (fromDate) {
      whereConditions.push(`p."createdAt" >= '${fromDate.toISOString()}'`);
    }
    if (toDate) {
      whereConditions.push(`p."createdAt" <= '${toDate.toISOString()}'`);
    }
    
    // Tenant isolation - strict: null schoolId only visible to super admins
    if (!ctx.isSuperAdmin) {
      if (ctx.schoolId) {
        whereConditions.push(`s."schoolId" = '${ctx.schoolId}'`);
      } else {
        // Non-admin users without school context get no data
        whereConditions.push('FALSE');
      }
    }
    // Super admins can see all data including null schoolId
    
    const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : 'TRUE';

    // OPTIMIZED: Use database aggregations with complete SQL strings
    const groupedQuery = `
      SELECT 
        COALESCE(p."collectedBy", 'Unknown') as collector,
        COALESCE(p."paymentMethod", 'Unknown') as "paymentMethod",
        COUNT(*) as collections,
        COALESCE(SUM(p.amount), 0) as "totalCollected",
        MAX(p."paymentDate") as "latestCollectionDate",
        COUNT(DISTINCT p."feeRecordId") as "uniqueStudents",
        COUNT(DISTINCT s.class) as "classesServed"
      FROM "school"."Payment" p
      LEFT JOIN "school"."FeeRecord" fr ON p."feeRecordId" = fr.id
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      WHERE ${whereClause}
      GROUP BY p."collectedBy", p."paymentMethod"
      ORDER BY "totalCollected" DESC
    `;
    
    // Add fines grouped query
    const finesGroupedQuery = `
      SELECT 
        COALESCE(fp."collectedBy", 'Unknown') as collector,
        COALESCE(fp."paymentMethod", 'Unknown') as "paymentMethod",
        COUNT(*) as collections,
        COALESCE(SUM(fp.amount), 0) as "totalCollected",
        MAX(fp."paymentDate") as "latestCollectionDate",
        COUNT(DISTINCT fp."fineId") as "uniqueStudents",
        COUNT(DISTINCT s.class) as "classesServed"
      FROM "school"."FinePayment" fp
      LEFT JOIN "school"."Fine" f ON fp."fineId" = f.id
      LEFT JOIN "school"."Student" s ON f."studentId" = s.id
      WHERE ${whereClause.replace('p."createdAt"', 'fp."createdAt"').replace('p."collectedBy"', 'fp."collectedBy"').replace('p."paymentMethod"', 'fp."paymentMethod"')}
      GROUP BY fp."collectedBy", fp."paymentMethod"
      ORDER BY "totalCollected" DESC
    `;
    
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT p."collectedBy") as "totalCollectors",
        COALESCE(SUM(p.amount), 0) as "totalAmount",
        COUNT(*) as "totalTransactions",
        COUNT(DISTINCT p."feeRecordId") as "totalStudents",
        COALESCE(AVG(p.amount), 0) as "avgTransactionAmount",
        COUNT(DISTINCT p."paymentMethod") as "paymentMethodsCount"
      FROM "school"."Payment" p
      LEFT JOIN "school"."FeeRecord" fr ON p."feeRecordId" = fr.id
      LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
      WHERE ${whereClause}
    `;
    
    // Add fines summary query
    const finesSummaryQuery = `
      SELECT 
        COUNT(DISTINCT fp."collectedBy") as "totalCollectors",
        COALESCE(SUM(fp.amount), 0) as "totalAmount",
        COUNT(*) as "totalTransactions",
        COUNT(DISTINCT fp."fineId") as "totalStudents",
        COALESCE(AVG(fp.amount), 0) as "avgTransactionAmount",
        COUNT(DISTINCT fp."paymentMethod") as "paymentMethodsCount"
      FROM "school"."FinePayment" fp
      LEFT JOIN "school"."Fine" f ON fp."fineId" = f.id
      LEFT JOIN "school"."Student" s ON f."studentId" = s.id
      WHERE ${whereClause.replace('p."createdAt"', 'fp."createdAt"').replace('p."collectedBy"', 'fp."collectedBy"').replace('p."paymentMethod"', 'fp."paymentMethod"')}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as count
      FROM (
        SELECT DISTINCT p."collectedBy", p."paymentMethod"
        FROM "school"."Payment" p
        LEFT JOIN "school"."FeeRecord" fr ON p."feeRecordId" = fr.id
        LEFT JOIN "school"."Student" s ON fr."studentId" = s.id
        WHERE ${whereClause}
      ) as distinct_groups
    `;

    const [
      groupedAggregations,
      finesGroupedAggregations,
      summaryStats,
      finesSummaryStats,
      totalCount
    ] = await Promise.all([
      schoolPrisma.$queryRawUnsafe(groupedQuery),
      schoolPrisma.$queryRawUnsafe(finesGroupedQuery),
      schoolPrisma.$queryRawUnsafe(summaryQuery),
      schoolPrisma.$queryRawUnsafe(finesSummaryQuery),
      schoolPrisma.$queryRawUnsafe(countQuery)
    ]);

    // Handle BigInt serialization by converting to numbers
    const safeParseInt = (value: any) => {
      if (typeof value === 'bigint') return Number(value);
      return parseInt(value || 0);
    };
    
    const safeParseFloat = (value: any) => {
      if (typeof value === 'bigint') return Number(value);
      return parseFloat(value || 0);
    };

    // Format the grouped collections
    const regularFeeCollections = (groupedAggregations as unknown as any[]).map((group: any) => ({
      collector: group.collector,
      paymentMethod: group.paymentMethod,
      collections: safeParseInt(group.collections),
      totalCollected: safeParseFloat(group.totalCollected),
      latestCollectionDate: group.latestCollectionDate,
      uniqueStudents: safeParseInt(group.uniqueStudents),
      classesServed: group.classesServed || [],
      type: 'regular_fees'
    }));

    // Format the fines collections
    const finesCollections = (finesGroupedAggregations as unknown as any[]).map((group: any) => ({
      collector: group.collector,
      paymentMethod: group.paymentMethod,
      collections: safeParseInt(group.collections),
      totalCollected: safeParseFloat(group.totalCollected),
      latestCollectionDate: group.latestCollectionDate,
      uniqueStudents: safeParseInt(group.uniqueStudents),
      classesServed: group.classesServed || [],
      type: 'fines'
    }));

    // Combine all collections
    const allCollections = [...regularFeeCollections, ...finesCollections];

    // Apply pagination
    const totalCollections = safeParseInt((totalCount as unknown as any[])[0]?.count);
    const formattedCollections = allCollections.slice((page - 1) * limit, page * limit);

    // Format regular fees summary statistics
    const regularFeesSummary = {
      totalCollectors: safeParseInt((summaryStats as unknown as any[])[0]?.totalCollectors),
      totalAmount: safeParseFloat((summaryStats as unknown as any[])[0]?.totalAmount),
      totalTransactions: safeParseInt((summaryStats as unknown as any[])[0]?.totalTransactions),
      totalStudents: safeParseInt((summaryStats as unknown as any[])[0]?.totalStudents),
      avgTransactionAmount: safeParseFloat((summaryStats as unknown as any[])[0]?.avgTransactionAmount),
      paymentMethodsCount: safeParseInt((summaryStats as unknown as any[])[0]?.paymentMethodsCount)
    };

    // Format fines summary statistics
    const finesSummary = {
      totalCollectors: safeParseInt((finesSummaryStats as unknown as any[])[0]?.totalCollectors),
      totalAmount: safeParseFloat((finesSummaryStats as unknown as any[])[0]?.totalAmount),
      totalTransactions: safeParseInt((finesSummaryStats as unknown as any[])[0]?.totalTransactions),
      totalStudents: safeParseInt((finesSummaryStats as unknown as any[])[0]?.totalStudents),
      avgTransactionAmount: safeParseFloat((finesSummaryStats as unknown as any[])[0]?.avgTransactionAmount),
      paymentMethodsCount: safeParseInt((finesSummaryStats as unknown as any[])[0]?.paymentMethodsCount)
    };

    // Combined summary statistics
    const summary = {
      ...regularFeesSummary,
      ...finesSummary,
      // Combined totals
      combinedTotalCollectors: regularFeesSummary.totalCollectors + finesSummary.totalCollectors,
      combinedTotalAmount: regularFeesSummary.totalAmount + finesSummary.totalAmount,
      combinedTotalTransactions: regularFeesSummary.totalTransactions + finesSummary.totalTransactions,
      combinedTotalStudents: regularFeesSummary.totalStudents + finesSummary.totalStudents,
      combinedAvgTransactionAmount: (regularFeesSummary.totalAmount + finesSummary.totalAmount) / 
        (regularFeesSummary.totalTransactions + finesSummary.totalTransactions || 1),
      combinedPaymentMethodsCount: Math.max(regularFeesSummary.paymentMethodsCount, finesSummary.paymentMethodsCount),
      // Separate breakdowns
      regularFees: regularFeesSummary,
      fines: finesSummary
    };

    // Handle BigInt serialization in JSON response
    const jsonString = JSON.stringify({
      success: true,
      data: {
        groupedCollections: formattedCollections,
        statistics: summary,
        summary,
        pagination: {
          page,
          limit,
          total: totalCollections,
          totalPages: Math.ceil(totalCollections / limit),
          hasNext: page * limit < totalCollections,
          hasPrev: page > 1
        }
      }
    }, (key, value) => typeof value === 'bigint' ? Number(value) : value);

    return new Response(jsonString, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching collections summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch collections summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
