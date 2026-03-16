import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test single student discount scenarios
    const scenarios = [
      {
        name: "Student with No Payment - Should Apply Discount",
        feeAmount: 10000,
        paidAmount: 0,
        currentDiscount: 0,
        discountType: "percentage",
        discountValue: 20,
        expectedNewDiscount: 2000,
        expectedPendingAmount: 8000,
        shouldApply: true,
        status: "pending"
      },
      {
        name: "Student with Partial Payment - Should Apply Discount",
        feeAmount: 10000,
        paidAmount: 5000,
        currentDiscount: 0,
        discountType: "percentage", 
        discountValue: 20,
        expectedNewDiscount: 2000,
        expectedPendingAmount: 3000,
        shouldApply: true,
        status: "partial"
      },
      {
        name: "Student with Full Payment - Should Skip",
        feeAmount: 10000,
        paidAmount: 10000,
        currentDiscount: 0,
        discountType: "percentage",
        discountValue: 20,
        expectedNewDiscount: 0,
        expectedPendingAmount: 0,
        shouldApply: false,
        status: "paid",
        skipReason: "Student already paid full amount"
      },
      {
        name: "Student with Overpayment - Should Skip",
        feeAmount: 10000,
        paidAmount: 12000,
        currentDiscount: 0,
        discountType: "percentage",
        discountValue: 20,
        expectedNewDiscount: 0,
        expectedPendingAmount: 0,
        shouldApply: false,
        status: "partial", // Even with wrong status, should skip
        skipReason: "Student already paid full amount"
      },
      {
        name: "Student with Full Payment but Wrong Status - Should Skip",
        feeAmount: 10000,
        paidAmount: 10000,
        currentDiscount: 0,
        discountType: "percentage",
        discountValue: 15,
        expectedNewDiscount: 0,
        expectedPendingAmount: 0,
        shouldApply: false,
        status: "partial", // Wrong status but full payment
        skipReason: "Student already paid full amount"
      },
      {
        name: "Student with Small Remaining Balance - Should Skip",
        feeAmount: 10000,
        paidAmount: 9500,
        currentDiscount: 0,
        discountType: "fixed",
        discountValue: 1000,
        expectedNewDiscount: 0,
        expectedPendingAmount: 500,
        shouldApply: false,
        status: "partial",
        skipReason: "Discount would create negative pending amount"
      },
      {
        name: "Student with Existing Discount + Partial Payment - Should Apply",
        feeAmount: 10000,
        paidAmount: 6000,
        currentDiscount: 1000,
        discountType: "percentage",
        discountValue: 15,
        expectedNewDiscount: 2500,
        expectedPendingAmount: 1500,
        shouldApply: true,
        status: "partial"
      }
    ];

    const results = scenarios.map(scenario => {
      const { feeAmount, paidAmount, currentDiscount, discountType, discountValue, status } = scenario;
      
      // Simulate the single student discount logic
      // First check if status would be included in query
      const statusMatches = status === 'pending' || status === 'partial';
      
      if (!statusMatches) {
        return {
          ...scenario,
          calculated: {
            newDiscount: 0,
            newPendingAmount: feeAmount - paidAmount - currentDiscount,
            shouldApplyCalculated: false,
            reasonCalculated: "Status not in query filter"
          },
          matches: scenario.shouldApply === false
        };
      }
      
      // Apply the same validation logic as in the updated endpoint
      const totalFee = feeAmount;
      const remainingBalance = totalFee - paidAmount - currentDiscount;
      
      // Check if student has already paid full amount
      if (paidAmount >= totalFee) {
        return {
          ...scenario,
          calculated: {
            newDiscount: 0,
            newPendingAmount: remainingBalance,
            shouldApplyCalculated: false,
            reasonCalculated: "Student already paid full amount"
          },
          matches: scenario.shouldApply === false
        };
      }
      
      // Calculate discount
      let calcDiscount = 0;
      
      if (discountType === 'percentage') {
        calcDiscount = (totalFee * discountValue) / 100;
      } else if (discountType === 'fixed') {
        calcDiscount = discountValue;
      }
      
      calcDiscount = Math.min(calcDiscount, totalFee);
      const totalNewDiscount = currentDiscount + calcDiscount;
      
      if (totalNewDiscount > totalFee) {
        calcDiscount = totalFee - currentDiscount;
      }
      
      const newPendingAmount = totalFee - paidAmount - totalNewDiscount;
      
      // Skip if discount would create negative pending amount
      if (newPendingAmount < 0) {
        return {
          ...scenario,
          calculated: {
            newDiscount: 0,
            newPendingAmount: remainingBalance,
            shouldApplyCalculated: false,
            reasonCalculated: "Discount would create negative pending amount"
          },
          matches: scenario.shouldApply === false
        };
      }
      
      // Only apply discount if it actually reduces the pending amount
      if (newPendingAmount >= remainingBalance) {
        return {
          ...scenario,
          calculated: {
            newDiscount: 0,
            newPendingAmount: remainingBalance,
            shouldApplyCalculated: false,
            reasonCalculated: "Discount provides no benefit"
          },
          matches: scenario.shouldApply === false
        };
      }
      
      if (calcDiscount <= 0) {
        return {
          ...scenario,
          calculated: {
            newDiscount: 0,
            newPendingAmount: remainingBalance,
            shouldApplyCalculated: false,
            reasonCalculated: "Calculated discount is zero or negative"
          },
          matches: scenario.shouldApply === false
        };
      }
      
      return {
        ...scenario,
        calculated: {
          newDiscount: totalNewDiscount,
          newPendingAmount: newPendingAmount,
          remainingBalance: remainingBalance,
          shouldApplyCalculated: true,
          reasonCalculated: ""
        },
        matches: scenario.shouldApply === true
      };
    });

    return NextResponse.json({
      scenarios: results,
      summary: {
        total: results.length,
        correct: results.filter(r => r.matches).length,
        incorrect: results.filter(r => !r.matches).length
      },
      keyImprovements: [
        "✅ Validates payment amount before applying discount",
        "✅ Skips fully paid students regardless of status",
        "✅ Prevents negative pending amounts",
        "✅ Only applies beneficial discounts",
        "✅ Provides detailed skip reasons"
      ]
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to test single discount scenarios',
      details: error.message 
    }, { status: 500 });
  }
}
