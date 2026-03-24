// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

/**
 * GET /api/fees/students/[id]/discount-history
 * 
 * Endpoint for fetching student discount history
 * Returns all discount applications for a student with related details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get the student ID
    const { id: studentId } = await params;
    
    const { getSessionContext } = await import('@/lib/apiAuth');
    const { parseDateParam } = await import('@/lib/parseDateParam');
    
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const offset = (page - 1) * pageSize;
    
    // Filter parameters
    const search = searchParams.get('search') || '';
    const fromDate = parseDateParam(searchParams.get('fromDate'));
    const toDate = parseDateParam(searchParams.get('toDate'), { endOfDay: true });
    const discountType = searchParams.get('discountType');
    const status = searchParams.get('status'); // 'applied', 'reversed', 'all'
    
    // Build WHERE conditions
    const whereConditions: any = {
      studentId: studentId
    };
    
    // Tenant isolation
    if (!ctx.isSuperAdmin && ctx.schoolId) {
      whereConditions.schoolId = ctx.schoolId;
    }
    
    // Date filtering
    if (fromDate || toDate) {
      whereConditions.appliedAt = {};
      if (fromDate) whereConditions.appliedAt.gte = fromDate;
      if (toDate) whereConditions.appliedAt.lte = toDate;
    }
    
    // Status filtering
    if (status === 'reversed') {
      whereConditions.isReversed = true;
    } else if (status === 'applied') {
      whereConditions.isReversed = false;
    }
    // 'all' shows both applied and reversed
    
    // Fetch discount applications with related data
    const [discountApplications, totalCount] = await Promise.all([
      (schoolPrisma as any).discountApplication.findMany({
        where: whereConditions,
        include: {
          discountRequest: {
            select: {
              id: true,
              name: true,
              description: true,
              discountType: true,
              discountValue: true,
              targetType: true,
              scope: true,
              status: true,
              approvedBy: true,
              approvedAt: true
            }
          }
          // Note: feeRecord and feeArrears relations are not defined in schema
          // We'll fetch them separately below
        },
        orderBy: [
          { appliedAt: 'desc' }
        ],
        skip: offset,
        take: pageSize
      }),
      (schoolPrisma as any).discountApplication.count({
        where: whereConditions
      })
    ]);
    
    // Fetch related fee records and arrears separately
    const feeRecordIds = discountApplications
      .filter(app => app.feeRecordId)
      .map(app => app.feeRecordId);
    
    const feeArrearsIds = discountApplications
      .filter(app => app.feeArrearsId)
      .map(app => app.feeArrearsId);
    
    const feeStructureIds = discountApplications
      .filter(app => app.feeStructureId)
      .map(app => app.feeStructureId);
    
    const [feeRecords, feeArrearsRecords, feeStructures] = await Promise.all([
      feeRecordIds.length > 0 ? (schoolPrisma as any).feeRecord.findMany({
        where: { id: { in: feeRecordIds } },
        include: {
          feeStructure: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      }) : [],
      feeArrearsIds.length > 0 ? (schoolPrisma as any).feeArrears.findMany({
        where: { id: { in: feeArrearsIds } }
      }) : [],
      feeStructureIds.length > 0 ? (schoolPrisma as any).feeStructure.findMany({
        where: { id: { in: feeStructureIds } },
        select: {
          id: true,
          name: true,
          category: true
        }
      }) : []
    ]);
    
    // Create lookup maps
    const feeRecordMap = new Map(feeRecords.map(record => [record.id, record]));
    const feeArrearsMap = new Map(feeArrearsRecords.map(record => [record.id, record]));
    const feeStructureMap = new Map(feeStructures.map(structure => [structure.id, structure]));
    
    // Format the response data
    const formattedDiscounts = discountApplications.map((app: any) => {
      const feeRecord = app.feeRecordId ? feeRecordMap.get(app.feeRecordId) : null;
      const feeArrears = app.feeArrearsId ? feeArrearsMap.get(app.feeArrearsId) : null;
      const feeStructure = app.feeStructureId ? feeStructureMap.get(app.feeStructureId) : null;
      
      // Determine fee name with priority
      let feeName = 'Unknown Fee';
      let feeCategory = 'unknown';
      
      if (feeRecord?.feeStructure?.name) {
        feeName = feeRecord.feeStructure.name;
        feeCategory = feeRecord.feeStructure.category || 'fee';
      } else if (feeStructure?.name) {
        feeName = feeStructure.name;
        feeCategory = feeStructure.category || 'fee';
      } else if (feeArrears) {
        // Use arrears data to determine name, don't hardcode
        feeName = feeArrears.fromAcademicYear && feeArrears.toAcademicYear 
          ? `Arrears (${feeArrears.fromAcademicYear} → ${feeArrears.toAcademicYear})`
          : 'Fee Arrears';
        feeCategory = 'arrears';
      } else if (app.feeStructureId) {
        // If we have a feeStructureId but couldn't find the structure
        feeName = `Fee Structure (${app.feeStructureId.slice(-8)})`;
        feeCategory = 'fee';
      } else if (app.feeRecordId) {
        // If we have a feeRecordId but couldn't find the record
        feeName = `Fee Record (${app.feeRecordId.slice(-8)})`;
        feeCategory = 'fee';
      } else if (app.feeArrearsId) {
        // If we have a feeArrearsId but couldn't find the arrears
        feeName = `Fee Arrears (${app.feeArrearsId.slice(-8)})`;
        feeCategory = 'arrears';
      }
      
      const totalAmount = feeRecord?.amount || feeArrears?.amount || 0;
      const discountAmount = app.discountAmount;
      const previousDiscount = app.previousDiscount || 0;
      const totalDiscount = previousDiscount + discountAmount;
      const remainingAmount = totalAmount - discountAmount;
      
      return {
        id: app.id,
        discountRequestId: app.discountRequestId,
        discountName: app.discountRequest?.name || 'Unknown Discount',
        discountDescription: app.discountRequest?.description || '',
        discountType: app.discountRequest?.discountType || 'unknown',
        discountValue: app.discountRequest?.discountValue || 0,
        targetType: app.discountRequest?.targetType || 'unknown',
        scope: app.discountRequest?.scope || 'unknown',
        feeName,
        feeCategory,
        feeRecordId: app.feeRecordId,
        feeArrearsId: app.feeArrearsId,
        feeStructureId: app.feeStructureId,
        totalAmount,
        discountAmount,
        previousDiscount,
        totalDiscount,
        remainingAmount,
        status: app.isReversed ? 'reversed' : 'applied',
        isReversed: app.isReversed,
        reversedBy: app.reversedBy,
        reversedByEmail: app.reversedByEmail,
        reversedAt: app.reversedAt,
        reversalReason: app.reversalReason,
        appliedAt: app.appliedAt,
        appliedBy: app.appliedBy,
        appliedByEmail: app.appliedByEmail,
        discountRequestStatus: app.discountRequest?.status || 'unknown',
        approvedBy: app.discountRequest?.approvedBy,
        approvedAt: app.discountRequest?.approvedAt
      };
    });
    
    // Apply additional filtering
    let filteredDiscounts = formattedDiscounts;
    
    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDiscounts = filteredDiscounts.filter((discount: any) => 
        discount.discountName?.toLowerCase().includes(searchLower) ||
        discount.feeName?.toLowerCase().includes(searchLower) ||
        discount.discountType?.toLowerCase().includes(searchLower) ||
        discount.discountDescription?.toLowerCase().includes(searchLower)
      );
    }
    
    // Discount type filtering
    if (discountType && discountType !== 'all') {
      filteredDiscounts = filteredDiscounts.filter((discount: any) => 
        discount.discountType === discountType
      );
    }
    
    // Calculate summary statistics
    const summary = {
      totalDiscounts: filteredDiscounts.length,
      totalDiscountAmount: filteredDiscounts.reduce((sum: number, d: any) => sum + d.discountAmount, 0),
      appliedDiscounts: filteredDiscounts.filter((d: any) => !d.isReversed).length,
      reversedDiscounts: filteredDiscounts.filter((d: any) => d.isReversed).length,
      discountTypes: [...new Set(filteredDiscounts.map((d: any) => d.discountType))],
      feeCategories: [...new Set(filteredDiscounts.map((d: any) => d.feeCategory))]
    };
    
    return NextResponse.json({
      success: true,
      data: {
        discounts: filteredDiscounts,
        summary,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNext: offset + pageSize < totalCount,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching discount history:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch discount history'
    }, { status: 500 });
  }
}
