import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Demo validation scenarios (without authentication for testing)
    const demoScenarios = [
      {
        name: "Valid 20% Discount",
        discountData: {
          discountType: "percentage",
          discountValue: 20,
          maxCapAmount: null,
          scope: "student",
          targetType: "total",
          feeStructureIds: [],
          studentIds: ["cmms2abw400036u567525wbq9"],
          classIds: [],
          sectionIds: [],
          academicYear: "2025-26"
        },
        expectedResult: "valid"
      },
      {
        name: "Invalid 0% Discount",
        discountData: {
          discountType: "percentage",
          discountValue: 0,
          maxCapAmount: null,
          scope: "student",
          targetType: "total",
          feeStructureIds: [],
          studentIds: ["cmms2abw400036u567525wbq9"],
          classIds: [],
          sectionIds: [],
          academicYear: "2025-26"
        },
        expectedResult: "invalid"
      },
      {
        name: "Invalid 150% Discount",
        discountData: {
          discountType: "percentage",
          discountValue: 150,
          maxCapAmount: null,
          scope: "student",
          targetType: "total",
          feeStructureIds: [],
          studentIds: ["cmms2abw400036u567525wbq9"],
          classIds: [],
          sectionIds: [],
          academicYear: "2025-26"
        },
        expectedResult: "invalid"
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
          studentIds: ["cmms2abw400036u567525wbq9"],
          classIds: [],
          sectionIds: [],
          academicYear: "2025-26"
        },
        expectedResult: "valid"
      }
    ];

    const results = [];

    for (const scenario of demoScenarios) {
      // Basic validation logic (simplified version)
      let valid = true;
      let error = '';
      let details = '';
      let warning = '';

      // Validate discount value
      if (scenario.discountData.discountValue <= 0) {
        valid = false;
        error = 'Discount value must be greater than 0';
        details = 'Please provide a positive discount value';
      } else if (scenario.discountData.discountType === 'percentage' && scenario.discountData.discountValue > 100) {
        valid = false;
        error = 'Percentage discount cannot exceed 100%';
        details = 'Please provide a discount percentage between 1 and 100';
      }

      // Simulate fee record validation
      const mockValidationResults = {
        totalRecords: 1,
        validRecords: valid ? 1 : 0,
        skippedRecords: valid ? 0 : 1,
        fullyPaidStudents: 0,
        overpaidStudents: 0,
        negativeBalanceRisk: 0,
        noBenefitDiscounts: valid ? 0 : 1,
        warnings: []
      };

      // Simulate warning for demonstration
      if (valid && scenario.discountData.discountType === 'fixed' && scenario.discountData.discountValue > 5000) {
        warning = `Warning: Large fixed discount (₹${scenario.discountData.discountValue}) may exceed fee amounts`;
      }

      results.push({
        scenario: scenario.name,
        valid,
        error,
        details,
        warning,
        validationResults: mockValidationResults,
        matchesExpected: (valid ? 'valid' : 'invalid') === scenario.expectedResult
      });
    }

    return NextResponse.json({
      demoScenarios: results,
      summary: {
        total: results.length,
        correct: results.filter(r => r.matchesExpected).length,
        incorrect: results.filter(r => !r.matchesExpected).length
      },
      validationLogic: {
        basicValidation: [
          "✅ Discount value > 0",
          "✅ Percentage discount ≤ 100%",
          "✅ Max cap amount validation"
        ],
        paymentValidation: [
          "✅ Checks fully paid students",
          "✅ Prevents negative balance",
          "✅ Identifies non-beneficial discounts"
        ],
        responseTypes: [
          "✅ Error for invalid requests",
          "✅ Warning for edge cases",
          "✅ Success for valid requests"
        ]
      },
      implementation: {
        where: "Discount request creation (POST /api/fees/discount-requests)",
        when: "Before creating discount request in database",
        why: "Prevent creation of problematic discount requests",
        benefit: "Users get immediate feedback instead of rejection during approval"
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to demonstrate discount validation',
      details: error.message 
    }, { status: 500 });
  }
}
