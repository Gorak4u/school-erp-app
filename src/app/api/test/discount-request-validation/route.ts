import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// Copy the validation function for testing
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
    academicYear: string;
  },
  ctx: any
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

    // Build query based on scope
    if ((discountData.scope === 'student' || discountData.scope === 'bulk') && discountData.studentIds.length > 0) {
      baseWhere.studentId = { in: discountData.studentIds };
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
        baseWhere.studentId = {
          OR: [
            { class: { in: discountData.classIds } },
            { class: { in: classNames } }
          ]
        };
      }
    }

    // Filter by fee structures
    if (discountData.targetType === 'fee_structure' && discountData.feeStructureIds.length > 0) {
      baseWhere.feeStructureId = { in: discountData.feeStructureIds };
    }

    // Apply tenant scoping
    if (ctx.schoolId) {
      baseWhere.student = { schoolId: ctx.schoolId };
    }

    // Get target records for validation
    const targetRecords = await (schoolPrisma as any).FeeRecord.findMany({
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
      take: 100 // Limit validation check to 100 records for performance
    });

    if (targetRecords.length === 0) {
      return {
        valid: false,
        error: 'No matching fee records found for this discount',
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

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear') || '2025-26';
    const studentId = searchParams.get('studentId');

    // Test different discount scenarios
    const testScenarios = [
      {
        name: "20% Discount on Student with No Payment",
        discountData: {
          discountType: "percentage",
          discountValue: 20,
          maxCapAmount: null,
          scope: "student",
          targetType: "total",
          feeStructureIds: [],
          studentIds: studentId ? [studentId] : [],
          classIds: [],
          sectionIds: [],
          academicYear
        }
      },
      {
        name: "50% Discount on Student with Full Payment",
        discountData: {
          discountType: "percentage", 
          discountValue: 50,
          maxCapAmount: null,
          scope: "student",
          targetType: "total",
          feeStructureIds: [],
          studentIds: studentId ? [studentId] : [],
          classIds: [],
          sectionIds: [],
          academicYear
        }
      },
      {
        name: "Fixed ₹1000 Discount",
        discountData: {
          discountType: "fixed",
          discountValue: 1000,
          maxCapAmount: null,
          scope: "student",
          targetType: "total",
          feeStructureIds: [],
          studentIds: studentId ? [studentId] : [],
          classIds: [],
          sectionIds: [],
          academicYear
        }
      },
      {
        name: "Invalid Discount (0%)",
        discountData: {
          discountType: "percentage",
          discountValue: 0,
          maxCapAmount: null,
          scope: "student",
          targetType: "total",
          feeStructureIds: [],
          studentIds: studentId ? [studentId] : [],
          classIds: [],
          sectionIds: [],
          academicYear
        }
      },
      {
        name: "Invalid Discount (150%)",
        discountData: {
          discountType: "percentage",
          discountValue: 150,
          maxCapAmount: null,
          scope: "student", 
          targetType: "total",
          feeStructureIds: [],
          studentIds: studentId ? [studentId] : [],
          classIds: [],
          sectionIds: [],
          academicYear
        }
      }
    ];

    const results = [];

    for (const scenario of testScenarios) {
      const validation = await validateDiscountApplication(scenario.discountData, ctx);
      results.push({
        scenario: scenario.name,
        valid: validation.valid,
        error: validation.error,
        details: validation.details,
        warning: validation.warning,
        validationResults: validation.validationResults
      });
    }

    return NextResponse.json({
      testScenarios: results,
      summary: {
        total: results.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        warnings: results.filter(r => r.warning).length
      },
      validationFeatures: [
        "✅ Validates discount values (positive, percentage limits)",
        "✅ Checks for fully paid students",
        "✅ Prevents negative balance scenarios", 
        "✅ Identifies non-beneficial discounts",
        "✅ Provides detailed warnings and errors",
        "✅ Limits validation to 100 records for performance"
      ]
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to test discount validation',
      details: error.message 
    }, { status: 500 });
  }
}
