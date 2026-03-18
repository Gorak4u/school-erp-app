import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere, SessionContext } from '@/lib/apiAuth';
import { resolveUserDisplayName } from '@/lib/userName';
import { sendSchoolEmail } from '@/lib/email';
import { generateDiscountPendingEmail } from '@/lib/discount-email-templates';
import {
  validateSearchQuery,
  rateLimit,
  getClientIdentifier,
  sanitizePaginationParams,
  validateDateRange
} from '@/lib/apiSecurity';
import { canApproveDiscountsAccess } from '@/lib/permissions';

// Validation function for discount applications
async function validateDiscountApplication(
  discountData: {
    discountType: string;
    discountValue: number;
    maxCapAmount: number | null;
    scope: string;
    targetType: string;
    feeStructureIds: string[];
    studentIds: string[];
    classIds: string[];
    sectionIds: string[];
    transportRouteIds: string[];
    academicYear: string;
  },
  ctx: SessionContext
) {
  try {
    // Basic discount value validation
    if (discountData.discountValue <= 0) {
      return {
        valid: false,
        error: 'Discount value must be greater than 0',
        details: 'Please provide a positive discount value'
      };
    }

    if (discountData.discountType === 'percentage' && discountData.discountValue > 100) {
      return {
        valid: false,
        error: 'Percentage discount cannot exceed 100%',
        details: 'Please provide a discount percentage between 1 and 100'
      };
    }

    // Find target fee records to validate against
    const baseWhere: any = {
      status: { in: ['pending', 'partial'] },
      academicYear: discountData.academicYear
    };

    // Build arrears where clause (uses toAcademicYear instead of academicYear)
    const arrearsWhere: any = {
      status: { in: ['pending', 'partial'] },
      toAcademicYear: discountData.academicYear
    };

    // Build query based on scope
    if (discountData.scope === 'student' && discountData.studentIds.length > 0) {
      baseWhere.studentId = { in: discountData.studentIds };
      arrearsWhere.studentId = { in: discountData.studentIds };
    } else if (discountData.scope === 'class') {
      // Resolve class to student IDs (simplified version)
      if (discountData.classIds.length > 0) {
        const classRecords = await (schoolPrisma as any).Class.findMany({
          where: {
            OR: [
              { id: { in: discountData.classIds } },
              { code: { in: discountData.classIds } },
              { name: { in: discountData.classIds } }
            ]
          },
          select: { id: true, name: true }
        });

        const classNames = classRecords.map((c: any) => c.name);
        
        // Find students in these classes first, then use their IDs
        const studentsInClasses = await (schoolPrisma as any).Student.findMany({
          where: {
            OR: [
              { class: { in: discountData.classIds } },
              { class: { in: classNames } }
            ],
            ...(ctx.schoolId ? { schoolId: ctx.schoolId } : {})
          },
          select: { id: true }
        });
        
        const studentIds = studentsInClasses.map((s: any) => s.id);
        
        if (studentIds.length > 0) {
          baseWhere.studentId = { in: studentIds };
          arrearsWhere.studentId = { in: studentIds };
        } else {
          // If no students found, make query fail safely
          baseWhere.studentId = 'impossible-no-students-found';
          arrearsWhere.studentId = 'impossible-no-students-found';
        }
      }
    } else if (discountData.scope === 'transport') {
      // Resolve transport routes to student IDs
      if (discountData.transportRouteIds.length > 0) {
        const transportStudents = await (schoolPrisma as any).Student.findMany({
          where: {
            transportRouteId: { in: discountData.transportRouteIds },
            ...(ctx.schoolId ? { schoolId: ctx.schoolId } : {})
          },
          select: { id: true }
        });
        
        const studentIds = transportStudents.map((s: any) => s.id);
        
        if (studentIds.length > 0) {
          baseWhere.studentId = { in: studentIds };
          arrearsWhere.studentId = { in: studentIds };
        } else {
          // If no students found, make query fail safely
          baseWhere.studentId = 'impossible-no-students-found';
          arrearsWhere.studentId = 'impossible-no-students-found';
        }
      }
    }

    // Filter by fee structures (only applies to FeeRecord, not FeeArrears)
    if (['fee_structure', 'individual'].includes(discountData.targetType) && discountData.feeStructureIds.length > 0) {
      baseWhere.feeStructureId = { in: discountData.feeStructureIds };
    }

    // Apply tenant scoping
    if (ctx.schoolId) {
      baseWhere.student = { schoolId: ctx.schoolId };
      arrearsWhere.student = { schoolId: ctx.schoolId };
    }

    // Get target records for validation - both FeeRecord and FeeArrears
    const [feeRecords, arrearsRecords] = await Promise.all([
      (schoolPrisma as any).FeeRecord.findMany({
        where: baseWhere,
        select: { 
          id: true, 
          studentId: true, 
          amount: true, 
          paidAmount: true, 
          discount: true, 
          pendingAmount: true,
          student: { select: { id: true, name: true, class: true } }
        },
        take: 100
      }),
      (schoolPrisma as any).FeeArrears.findMany({
        where: arrearsWhere,
        select: { 
          id: true, 
          studentId: true, 
          amount: true, 
          paidAmount: true,
          pendingAmount: true,
          student: { select: { id: true, name: true, class: true } }
        },
        take: 100
      })
    ]);

    // Combine both record types and add metadata
    const targetRecords = [
      ...feeRecords.map((r: any) => ({ ...r, recordType: 'fee_record', discount: r.discount || 0 })),
      ...arrearsRecords.map((r: any) => ({ ...r, recordType: 'arrears', discount: 0 }))
    ];

    if (targetRecords.length === 0) {
      return {
        valid: false,
        error: 'No matching fee records or arrears found for this discount',
        details: 'Check the academic year, student/class selection, and fee structure filters'
      };
    }

    // Validate each record for payment issues
    const validationResults = {
      totalRecords: targetRecords.length,
      validRecords: 0,
      skippedRecords: 0,
      fullyPaidStudents: 0,
      overpaidStudents: 0,
      negativeBalanceRisk: 0,
      noBenefitDiscounts: 0,
      warnings: [] as string[]
    };

    for (const record of targetRecords) {
      const totalFee = record.amount;
      const paidAmount = record.paidAmount || 0;
      const currentDiscount = record.discount || 0;
      const remainingBalance = totalFee - paidAmount - currentDiscount;
      
      // Check if student has already paid full amount
      if (paidAmount >= totalFee) {
        validationResults.fullyPaidStudents++;
        validationResults.skippedRecords++;
        validationResults.warnings.push(
          `Student ${record.student?.name || record.studentId} has already paid full amount (₹${paidAmount})`
        );
        continue;
      }
      
      // Calculate new discount
      let newDiscount = 0;
      
      if (discountData.discountType === 'percentage') {
        newDiscount = (totalFee * discountData.discountValue) / 100;
        if (discountData.maxCapAmount) {
          newDiscount = Math.min(newDiscount, discountData.maxCapAmount);
        }
      } else if (discountData.discountType === 'fixed') {
        newDiscount = discountData.discountValue;
      } else if (discountData.discountType === 'full_waiver') {
        newDiscount = totalFee;
      }

      // Ensure discount doesn't exceed amount
      newDiscount = Math.min(newDiscount, totalFee);
      const totalNewDiscount = currentDiscount + newDiscount;

      // Ensure total discount doesn't exceed total amount
      if (totalNewDiscount > totalFee) {
        newDiscount = totalFee - currentDiscount;
      }

      // Calculate new pending amount
      const newPendingAmount = totalFee - paidAmount - totalNewDiscount;
      
      // Check for negative pending amount
      if (newPendingAmount < 0) {
        validationResults.negativeBalanceRisk++;
        validationResults.skippedRecords++;
        validationResults.warnings.push(
          `Discount would create negative balance for student ${record.student?.name || record.studentId} (pending: ₹${newPendingAmount})`
        );
        continue;
      }
      
      // Check if discount provides no benefit
      if (newPendingAmount >= remainingBalance) {
        validationResults.noBenefitDiscounts++;
        validationResults.skippedRecords++;
        validationResults.warnings.push(
          `Discount provides no benefit to student ${record.student?.name || record.studentId}`
        );
        continue;
      }

      validationResults.validRecords++;
    }

    // Determine if validation passes
    let valid = true;
    let error = '';
    let details = '';
    let warning = '';

    if (validationResults.validRecords === 0) {
      valid = false;
      error = 'This discount would not benefit any students';
      details = `All ${validationResults.totalRecords} target students would be skipped`;
      
      if (validationResults.fullyPaidStudents > 0) {
        details += ` (${validationResults.fullyPaidStudents} already paid in full)`;
      }
    } else if (validationResults.skippedRecords > validationResults.validRecords) {
      // Warning but not error - most students would be skipped
      warning = `Warning: ${validationResults.skippedRecords} of ${validationResults.totalRecords} students would be skipped from this discount`;
      
      if (validationResults.fullyPaidStudents > 0) {
        warning += ` (${validationResults.fullyPaidStudents} already paid in full)`;
      }
    }

    return {
      valid,
      error,
      details,
      warning,
      validationResults
    };

  } catch (error: any) {
    console.error('Discount validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate discount application',
      details: error.message
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Rate limiting check
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 100, 60000); // 100 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize pagination parameters
    const { page, pageSize } = sanitizePaginationParams(
      searchParams.get('page'),
      searchParams.get('pageSize')
    );
    
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const scope = searchParams.get('scope');
    const mine = searchParams.get('mine') === 'true';
    const search = validateSearchQuery(searchParams.get('search') || '');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Validate date range
    const dateValidation = validateDateRange(dateFrom, dateTo);
    if (dateValidation.error) {
      return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    const where: any = tenantWhere(ctx);
    
    // Status filter
    if (status && status !== 'all') where.status = status;
    
    // Academic year filter
    if (academicYear) where.academicYear = academicYear;
    
    // Scope filter
    if (scope && scope !== 'all') where.scope = scope;
    
    // Search filter (name, description, requestedByName)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requestedByName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Date range filter
    if (dateValidation.dateFrom || dateValidation.dateTo) {
      where.createdAt = {};
      if (dateValidation.dateFrom) where.createdAt.gte = dateValidation.dateFrom;
      if (dateValidation.dateTo) where.createdAt.lte = new Date(dateValidation.dateTo!.getTime() + 86399999); // End of day
    }

    if (mine || !canApproveDiscountsAccess(ctx)) {
      where.requestedBy = ctx.userId;
    }

    const [requests, total] = await Promise.all([
      (schoolPrisma as any).DiscountRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).DiscountRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      }
    });
  } catch (error) {
    console.error('GET /api/fees/discount-requests:', error);
    return NextResponse.json({ error: 'Failed to fetch discount requests' }, { status: 500 });
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => (typeof item === 'string' ? item : String(item ?? ''))).filter(Boolean))];
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      name, description, discountType, discountValue, maxCapAmount,
      scope, targetType, feeStructureIds, studentIds, classIds, sectionIds,
      transportRouteIds, metadata,
      academicYear, reason, supportingDoc, validFrom, validTo
    } = body;

    // Validate
    if (!name || !discountType || discountValue === undefined || !scope || !targetType || !academicYear || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedScope = String(scope).toLowerCase();
    const normalizedTargetType = String(targetType).toLowerCase();
    const normalizedFeeStructures = normalizeStringArray(feeStructureIds);
    const normalizedStudents = normalizeStringArray(studentIds);
    const normalizedClasses = normalizeStringArray(classIds);
    const normalizedSections = normalizeStringArray(sectionIds);
    const normalizedRoutes = normalizeStringArray(transportRouteIds);

    if (normalizedScope === 'student' && normalizedStudents.length === 0) {
      return NextResponse.json({ error: 'Student scope requires at least one student' }, { status: 400 });
    }

    if (normalizedScope === 'class' && normalizedClasses.length === 0 && normalizedSections.length === 0) {
      return NextResponse.json({ error: 'Class scope requires classIds or sectionIds' }, { status: 400 });
    }

    if (normalizedScope === 'transport' && normalizedRoutes.length === 0) {
      return NextResponse.json({ error: 'Transport scope requires at least one transport route' }, { status: 400 });
    }

    // Validate discount value and check for potential payment issues
    const discountValidation = await validateDiscountApplication(
      {
        discountType,
        discountValue: Number(discountValue),
        maxCapAmount: maxCapAmount ? Number(maxCapAmount) : null,
        scope: normalizedScope,
        targetType: normalizedTargetType,
        feeStructureIds: normalizedFeeStructures,
        studentIds: normalizedStudents,
        classIds: normalizedClasses,
        sectionIds: normalizedSections,
        transportRouteIds: normalizedRoutes,
        academicYear
      },
      ctx
    );

    if (!discountValidation.valid) {
      return NextResponse.json({ 
        error: discountValidation.error,
        details: discountValidation.details,
        warning: discountValidation.warning
      }, { status: 400 });
    }

    // Log validation results for audit purposes
    if (discountValidation.warning) {
    }

    const requesterName = await resolveUserDisplayName(ctx.userId, ctx.email);

    // Create request in transaction to ensure audit log is also created
    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      // 1. Create the request
      const discountReq = await tx.DiscountRequest.create({
        data: {
          schoolId: ctx.schoolId,
          name,
          description,
          discountType,
          discountValue: Number(discountValue),
          maxCapAmount: maxCapAmount ? Number(maxCapAmount) : null,
          scope: normalizedScope,
          targetType: normalizedTargetType,
          feeStructureIds: JSON.stringify(normalizedFeeStructures),
          studentIds: JSON.stringify(normalizedStudents),
          classIds: JSON.stringify(normalizedClasses),
          sectionIds: JSON.stringify(normalizedSections),
          transportRouteIds: JSON.stringify(normalizedRoutes),
          metadata: metadata && typeof metadata === 'object' ? metadata : null,
          academicYear,
          reason,
          supportingDoc,
          status: 'pending',
          requestedBy: ctx.userId,
          requestedByEmail: ctx.email,
          requestedByName: requesterName,
          validFrom,
          validTo: validTo || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        }
      });

      // 2. Create Audit Log
      await tx.DiscountRequestAuditLog.create({
        data: {
          schoolId: ctx.schoolId,
          discountRequestId: discountReq.id,
          action: 'created',
          actorUserId: ctx.userId,
          actorEmail: ctx.email,
          actorName: requesterName,
          actorRole: ctx.role || 'user',
          newStatus: 'pending',
          details: JSON.stringify({ reason })
        }
      });

      return discountReq;
    });

    // Send email notifications after successful creation
    try {
      // Get school name for email
      const schoolSetting = await (schoolPrisma as any).SchoolSetting.findFirst({
        where: { group: 'school_details', key: 'name', schoolId: ctx.schoolId }
      });
      const schoolName = schoolSetting?.value || 'School';

      const approverCandidates = await (schoolPrisma as any).school_User.findMany({
        where: {
          schoolId: ctx.schoolId,
          isActive: true
        },
        include: {
          CustomRole: {
            select: {
              permissions: true,
            },
          },
        }
      });

      const approvers = approverCandidates.filter((approver: any) =>
        canApproveDiscountsAccess({
          role: approver.role,
          isSuperAdmin: approver.isSuperAdmin,
          permissions: approver.CustomRole?.permissions
            ? JSON.parse(approver.CustomRole.permissions)
            : undefined,
        })
      );

      // Get submitter user details
      const submitter = await (schoolPrisma as any).school_User.findUnique({
        where: { id: ctx.userId }
      });

      if (approvers.length > 0 && submitter) {
        // Send email to all approvers
        for (const approver of approvers) {
          const emailData = {
            discountRequest: result,
            submitter,
            approver,
            schoolName
          };
          
          const { subject, html } = generateDiscountPendingEmail(emailData);
          
          await sendSchoolEmail({
            to: approver.email || '',
            subject: subject,
            html: html,
            schoolId: ctx.schoolId || undefined
          });
          
          console.log(`✅ Discount pending email sent to approver: ${approver.email}`);
        }

        // Send confirmation email to submitter
        const submitterEmailData = {
          discountRequest: result,
          submitter,
          approver: submitter, // Self-reference for submitter email
          schoolName
        };
        
        const { subject: submitterSubject, html: submitterHtml } = generateDiscountPendingEmail(submitterEmailData);
        
        await sendSchoolEmail({
            to: submitter.email || '',
            subject: submitterSubject.replace('Pending Approval', 'Submitted - Pending Approval'),
            html: submitterHtml.replace('requires your approval', 'has been submitted and is pending approval'),
            schoolId: ctx.schoolId || undefined
          });
        
        console.log(`✅ Discount submission confirmation email sent to: ${submitter.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send discount request emails:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('POST /api/fees/discount-requests:', error);
    return NextResponse.json({ error: 'Failed to create discount request' }, { status: 500 });
  }
}
