import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// Simple in-memory cache for waiver requests pagination (5 minutes TTL)
const waiverCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getWaiverCacheKey(params: any): string {
  return JSON.stringify(params);
}

function getWaiverFromCache(key: string): any {
  const cached = waiverCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  waiverCache.delete(key);
  return null;
}

function setWaiverCache(key: string, data: any): void {
  waiverCache.set(key, { data, timestamp: Date.now() });
  
  // Clean up old cache entries periodically
  if (waiverCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of waiverCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        waiverCache.delete(k);
      }
    }
  }
}

// Clear waiver cache for a specific school
function clearWaiverCache(schoolId: string): void {
  for (const [key] of waiverCache.entries()) {
    if (key.includes(`"schoolId":"${schoolId}"`)) {
      waiverCache.delete(key);
    }
  }
}

// GET /api/fines/waiver-requests - List all waiver requests
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected, all
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    // Build where clause
    const where: any = {};
    
    // School filtering
    if (!ctx.isSuperAdmin || ctx.schoolId) {
      where.schoolId = ctx.schoolId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    // Create cache key
    const cacheKey = getWaiverCacheKey({ 
      schoolId: ctx.schoolId, 
      status, page, pageSize 
    });

    // Check cache first
    const cached = getWaiverFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get total count (optimized query)
    const total = await (schoolPrisma as any).FineWaiverRequest.count({ where });

    // Get waiver requests with pagination (optimized with selective includes)
    const waiverRequests = await (schoolPrisma as any).FineWaiverRequest.findMany({
      where,
      include: {
        fine: {
          select: {
            id: true,
            fineNumber: true,
            amount: true,
            status: true,
            student: {
              select: {
                id: true,
                name: true,
                admissionNo: true,
                class: true,
                section: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: Math.min(pageSize, 100) // Max 100 records per page for performance
    });

    // Cache the response
    const responseData = {
      success: true,
      waiverRequests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1
      }
    };
    setWaiverCache(cacheKey, responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Failed to fetch waiver requests:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch waiver requests' 
      },
      { status: 500 }
    );
  }
}

// POST /api/fines/waiver-requests - Create new waiver request
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      fineId,
      reason,
      remarks,
      documents,
      waiveAmount
    } = body;

    // Validation
    if (!fineId || !reason) {
      return NextResponse.json(
        { 
          success: false,
          error: 'fineId and reason are required' 
        },
        { status: 400 }
      );
    }

    // Get fine details
    const fine = await (schoolPrisma as any).Fine.findFirst({
      where: { id: fineId },
      include: {
        student: true
      }
    });

    if (!fine) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine not found' 
        },
        { status: 404 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await (schoolPrisma as any).FineWaiverRequest.findFirst({
      where: {
        fineId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { 
          success: false,
          error: 'A waiver request for this fine is already pending' 
        },
        { status: 400 }
      );
    }

    // Calculate waiver amount
    const pendingAmount = fine.amount - fine.paidAmount - fine.waivedAmount;
    const actualWaiveAmount = waiveAmount && waiveAmount <= pendingAmount ? waiveAmount : pendingAmount;

    // Create waiver request
    const waiverRequest = await (schoolPrisma as any).FineWaiverRequest.create({
      data: {
        schoolId: ctx.schoolId!,
        fineId,
        requestedBy: ctx.email,
        requesterId: fine.student.id,
        requesterName: fine.student.name,
        requesterEmail: fine.student.email || '',
        reason,
        remarks,
        waiveAmount: actualWaiveAmount,
        documents: documents ? JSON.stringify(documents) : null,
        status: 'pending'
      }
    });

    // Clear cache for this school after creating a waiver request
    clearWaiverCache(ctx.schoolId!);

    return NextResponse.json({
      success: true,
      waiverRequest,
      message: 'Waiver request submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create waiver request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create waiver request' 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/fines/waiver-requests - Update waiver request (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');
    
    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Waiver request ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, remarks } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status (approved/rejected) is required' },
        { status: 400 }
      );
    }

    // Get the waiver request
    const waiverRequest = await (schoolPrisma as any).FineWaiverRequest.findFirst({
      where: {
        id: requestId,
        schoolId: ctx.schoolId!
      },
      include: {
        fine: {
          include: {
            student: true
          }
        }
      }
    });

    if (!waiverRequest) {
      return NextResponse.json(
        { success: false, error: 'Waiver request not found' },
        { status: 404 }
      );
    }

    if (waiverRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Waiver request has already been processed' },
        { status: 400 }
      );
    }

    // Update the waiver request
    const updatedRequest = await (schoolPrisma as any).FineWaiverRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedBy: ctx.email,
        reviewedByName: ctx.email, // Use email as name fallback
        reviewedAt: new Date(),
        remarks: remarks || null
      }
    });

    // If approved, update the fine
    if (status === 'approved') {
      const fine = waiverRequest.fine;
      const newWaivedAmount = fine.waivedAmount + waiverRequest.waiveAmount;
      const newPendingAmount = fine.amount - fine.paidAmount - newWaivedAmount;

      await (schoolPrisma as any).Fine.update({
        where: { id: fine.id },
        data: {
          waivedAmount: newWaivedAmount,
          pendingAmount: newPendingAmount,
          status: newPendingAmount === 0 ? 'paid' : newPendingAmount < fine.amount ? 'partial' : fine.status
        }
      });
    }

    // Clear cache for this school
    clearWaiverCache(ctx.schoolId!);

    return NextResponse.json({
      success: true,
      waiverRequest: updatedRequest,
      message: `Waiver request ${status} successfully`
    });

  } catch (error) {
    console.error('Failed to update waiver request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update waiver request' 
      },
      { status: 500 }
    );
  }
}
