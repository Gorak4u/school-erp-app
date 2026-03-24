import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// Simple in-memory cache for pagination results (5 minutes TTL)
const paginationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: any): string {
  return JSON.stringify(params);
}

function getFromCache(key: string): any {
  const cached = paginationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  paginationCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  paginationCache.set(key, { data, timestamp: Date.now() });
  
  // Clean up old cache entries periodically
  if (paginationCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of paginationCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        paginationCache.delete(k);
      }
    }
  }
}

// Clear cache for a specific school
function clearSchoolCache(schoolId: string): void {
  for (const [key] of paginationCache.entries()) {
    if (key.includes(`"schoolId":"${schoolId}"`)) {
      paginationCache.delete(key);
    }
  }
}

// Helper function to generate fine numbers
function generateFineNumber(year: string, index: number): string {
  return `F-${year}-${String(index).padStart(4, '0')}`;
}

// GET /api/fines - List fines with filters
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    // School filtering
    if (!ctx.isSuperAdmin || ctx.schoolId) {
      where.schoolId = ctx.schoolId;
    }
    
    if (studentId) {
      where.studentId = studentId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { fineNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Create cache key
    const cacheKey = getCacheKey({ 
      schoolId: ctx.schoolId, 
      studentId, status, type, category, page, pageSize, search 
    });

    // Check cache first (except for search queries which are less likely to be repeated)
    if (!search) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // Get total count for pagination (optimized query)
    const total = await (schoolPrisma as any).Fine.count({ where });

    // Get fines with pagination (optimized with selective includes)
    const fines = await (schoolPrisma as any).Fine.findMany({
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
        },
        rule: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            baseAmount: true,
            dailyRate: true,
            maxAmount: true
          }
        },
        // Only include latest payment for performance
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            receiptNumber: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1 // Only get latest payment for performance
        },
        // Only include latest waiver request for performance
        waiverRequests: {
          select: {
            id: true,
            status: true,
            waiveAmount: true,
            requestedBy: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1 // Only get latest waiver request for performance
        }
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { dueDate: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: Math.min(pageSize, 100) // Max 100 records per page for performance
    });

    // Calculate summary statistics
    const summary = await (schoolPrisma as any).Fine.groupBy({
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

    return NextResponse.json({
      success: true,
      fines,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1
      },
      summary: summary.reduce((acc: any, item: any) => {
        acc[item.status] = {
          count: item._count,
          amount: item._sum.amount || 0,
          paidAmount: item._sum.paidAmount || 0,
          waivedAmount: item._sum.waivedAmount || 0,
          pendingAmount: item._sum.pendingAmount || 0
        };
        return acc;
      }, {} as Record<string, any>)
    });

    // Cache the response (except for search queries)
    if (!search) {
      const responseData = {
        success: true,
        fines,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page * pageSize < total,
          hasPrev: page > 1
        },
        summary: summary.reduce((acc: any, item: any) => {
          acc[item.status] = {
            count: item._count,
            amount: item._sum.amount || 0,
            paidAmount: item._sum.paidAmount || 0,
            waivedAmount: item._sum.waivedAmount || 0,
            pendingAmount: item._sum.pendingAmount || 0
          };
          return acc;
        }, {} as Record<string, any>)
      };
      setCache(cacheKey, responseData);
      return NextResponse.json(responseData);
    }

    return NextResponse.json({
      success: true,
      fines,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1
      },
      summary: summary.reduce((acc: any, item: any) => {
        acc[item.status] = {
          count: item._count,
          amount: item._sum.amount || 0,
          paidAmount: item._sum.paidAmount || 0,
          waivedAmount: item._sum.waivedAmount || 0,
          pendingAmount: item._sum.pendingAmount || 0
        };
        return acc;
      }, {} as Record<string, any>)
    });

  } catch (error) {
    console.error('GET /api/fines:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch fines',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/fines - Create fine (manual)
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { studentId, type, category, amount, description, dueDate, ruleId } = body;

    // Validate required fields
    if (!studentId || !type || !amount || !description) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: studentId, type, amount, description'
        },
        { status: 400 }
      );
    }

    // Validate student exists and belongs to school
    const student = await (schoolPrisma as any).Student.findFirst({
      where: {
        id: studentId,
        schoolId: ctx.schoolId
      }
    });

    if (!student) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Student not found' 
        },
        { status: 404 }
      );
    }

    // Validate rule if provided
    if (ruleId) {
      const rule = await (schoolPrisma as any).FineRule.findFirst({
        where: {
          id: ruleId,
          schoolId: ctx.schoolId
        }
      });

      if (!rule) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Fine rule not found' 
          },
          { status: 404 }
        );
      }
    }

    // Get current academic year for fine numbering
    const currentAcademicYear = await (schoolPrisma as any).AcademicYear.findFirst({
      where: { isActive: true }
    });

    const year = currentAcademicYear?.year || new Date().getFullYear().toString();
    
    // Get next fine number for this school using a more robust approach
    // Use a transaction with a more comprehensive approach to prevent conflicts
    const fine = await (schoolPrisma as any).$transaction(async (tx: any) => {
      // Get ALL existing fine numbers for this year and school (not just first 100)
      const allExistingFines = await tx.Fine.findMany({
        where: {
          schoolId: ctx.schoolId!,
          fineNumber: {
            startsWith: `F-${year}-`
          }
        },
        select: { fineNumber: true },
        orderBy: { fineNumber: 'asc' }
      });

      // Extract all existing numbers and sort them
      const existingNumbers = allExistingFines.map((f: any) => {
        const parts = f.fineNumber.split('-');
        return parseInt(parts[2]) || 0;
      }).sort((a: number, b: number) => a - b);

      // Find the first gap in the sequence
      let nextNumber = 1;
      for (let i = 0; i < existingNumbers.length; i++) {
        if (existingNumbers[i] !== nextNumber) {
          // Found a gap
          break;
        }
        nextNumber++;
      }

      // Generate the fine number
      let finalFineNumber = generateFineNumber(year, nextNumber);
      
      console.log(`Creating fine with number: ${finalFineNumber} (next available: ${nextNumber})`);
      
      // Double-check that this number doesn't exist (extra safety)
      const existingCheck = await tx.Fine.findFirst({
        where: { fineNumber: finalFineNumber },
        select: { id: true }
      });

      if (existingCheck) {
        // If somehow it still exists, find the next available
        let fallbackNumber = nextNumber + 1;
        let fallbackFineNumber = generateFineNumber(year, fallbackNumber);
        
        while (true) {
          const fallbackCheck = await tx.Fine.findFirst({
            where: { fineNumber: fallbackFineNumber },
            select: { id: true }
          });
          
          if (!fallbackCheck) {
            console.log(`Using fallback number: ${fallbackFineNumber}`);
            finalFineNumber = fallbackFineNumber;
            break;
          }
          
          fallbackNumber++;
          fallbackFineNumber = generateFineNumber(year, fallbackNumber);
          
          // Prevent infinite loop
          if (fallbackNumber > nextNumber + 1000) {
            throw new Error('Unable to generate unique fine number after 1000 attempts');
          }
        }
      }
      
      // Create the fine within the same transaction
      return await tx.Fine.create({
        data: {
          schoolId: ctx.schoolId!,
          studentId,
          ruleId,
          fineNumber: finalFineNumber,
          type,
          category,
          description,
          amount,
          paidAmount: 0,
          waivedAmount: 0,
          pendingAmount: amount,
          status: 'pending',
          sourceType: 'manual',
          sourceId: null,
          issuedAt: new Date(),
          dueDate: new Date(dueDate),
        }
      });
    });

    // Create notification if auto-notify is enabled
    if (ruleId) {
      const rule = await (schoolPrisma as any).FineRule.findUnique({
        where: { id: ruleId },
        select: { autoNotify: true }
      });

      if (rule?.autoNotify) {
        // TODO: Create notification for parent/student
        // await createFineNotification(fine);
      }
    }

    // Clear cache for this school after creating a fine
    clearSchoolCache(ctx.schoolId!);

    return NextResponse.json({
      success: true,
      fine,
      message: 'Fine created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create fine error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine number conflict. Please try again.' 
        },
        { status: 409 }
      );
    }
      
    if (error.message && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid reference to student, rule, or school' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create fine'
      },
      { status: 500 }
    );
  }
}
