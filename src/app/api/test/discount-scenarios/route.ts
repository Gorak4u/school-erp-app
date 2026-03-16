import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test different payment scenarios for discount application
    const scenarios = [
      {
        name: "Student with No Payment",
        feeAmount: 10000,
        paidAmount: 0,
        currentDiscount: 0,
        discountType: "percentage",
        discountValue: 20,
        expectedNewDiscount: 2000,
        expectedPendingAmount: 8000,
        shouldApply: true
      },
      {
        name: "Student with Partial Payment",
        feeAmount: 10000,
        paidAmount: 5000,
        currentDiscount: 0,
        discountType: "percentage", 
        discountValue: 20,
        expectedNewDiscount: 2000,
        expectedPendingAmount: 3000,
        shouldApply: true
      },
      {
        name: "Student with Full Payment",
        feeAmount: 10000,
        paidAmount: 10000,
        currentDiscount: 0,
        discountType: "percentage",
        discountValue: 20,
        expectedNewDiscount: 0,
        expectedPendingAmount: 0,
        shouldApply: false,
        reason: "Student already paid full amount"
      },
      {
        name: "Student with Overpayment",
        feeAmount: 10000,
        paidAmount: 12000,
        currentDiscount: 0,
        discountType: "percentage",
        discountValue: 20,
        expectedNewDiscount: 0,
        expectedPendingAmount: 0,
        shouldApply: false,
        reason: "Student already paid full amount"
      },
      {
        name: "Student with Existing Discount + Partial Payment",
        feeAmount: 10000,
        paidAmount: 6000,
        currentDiscount: 1000,
        discountType: "percentage",
        discountValue: 15,
        expectedNewDiscount: 2500,
        expectedPendingAmount: 1500,
        shouldApply: true
      },
      {
        name: "Student with Small Remaining Balance",
        feeAmount: 10000,
        paidAmount: 9500,
        currentDiscount: 0,
        discountType: "fixed",
        discountValue: 1000,
        expectedNewDiscount: 0,
        expectedPendingAmount: 500,
        shouldApply: false,
        reason: "Discount would create negative pending amount"
      }
    ];

    const results = scenarios.map(scenario => {
      const { feeAmount, paidAmount, currentDiscount, discountType, discountValue } = scenario;
      
      // Apply the same logic as in the discount application
      let newDiscount = currentDiscount;
      
      if (discountType === 'percentage') {
        const discountAmount = (feeAmount * discountValue) / 100;
        newDiscount = currentDiscount + discountAmount;
      } else {
        newDiscount = currentDiscount + discountValue;
      }
      
      const newPendingAmount = feeAmount - paidAmount - newDiscount;
      const remainingBalance = feeAmount - paidAmount - currentDiscount;
      
      // Determine if discount should be applied
      let shouldApply = true;
      let reason = '';
      
      if (paidAmount >= feeAmount) {
        shouldApply = false;
        reason = 'Student already paid full amount';
      } else if (newPendingAmount < 0) {
        shouldApply = false;
        reason = 'Discount would create negative pending amount';
      } else if (newPendingAmount >= remainingBalance) {
        shouldApply = false;
        reason = 'Discount provides no benefit';
      }
      
      return {
        ...scenario,
        calculated: {
          newDiscount,
          newPendingAmount,
          remainingBalance,
          shouldApplyCalculated: shouldApply,
          reasonCalculated: reason
        },
        matches: shouldApply === scenario.shouldApply
      };
    });

    return NextResponse.json({
      scenarios: results,
      summary: {
        total: results.length,
        correct: results.filter(r => r.matches).length,
        incorrect: results.filter(r => !r.matches).length
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to test discount scenarios',
      details: error.message 
    }, { status: 500 });
  }
}
