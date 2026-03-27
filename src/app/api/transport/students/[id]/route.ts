// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { analyzeTransportFees, calculateRefundEligibility, validateRefundAmount } from '@/lib/transportFeeAnalyzer';
import { showToast } from '@/lib/toastUtils';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }
    const { id } = await params;

    const existing = await (schoolPrisma as any).studentTransport.findFirst({
      where: { id, student: { schoolId: ctx.schoolId } }
    });
    if (!existing) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    const body = await request.json();
    const { pickupStop, dropStop, monthlyFee, isActive } = body;

    const updated = await (schoolPrisma as any).studentTransport.update({
      where: { id },
      data: {
        ...(pickupStop !== undefined && { pickupStop }),
        ...(dropStop !== undefined && { dropStop }),
        ...(monthlyFee !== undefined && { monthlyFee }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        student: { select: { id: true, name: true, class: true, admissionNo: true } },
        route: { select: { id: true, routeNumber: true, routeName: true } }
      }
    });

    // If deactivated, update student transport field
    if (isActive === false) {
      await (schoolPrisma as any).student.update({
        where: { id: existing.studentId },
        data: { transport: 'No', transportRoute: null }
      });
    }

    return NextResponse.json({ assignment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update assignment', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }
    const { id } = await params;

    // Parse request body for refund options
    const body = await request.json().catch(() => ({}));
    const { createRefund, refundAmount, adminFee, reason, pendingAction } = body;

    // Get the student transport assignment
    const assignment = await (schoolPrisma as any).StudentTransport.findFirst({
      where: { id, student: { schoolId: ctx.schoolId } },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true,
            section: true,
            parentEmail: true,
            parentPhone: true
          }
        }
      }
    });
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    let refundCreated: any = null;
    let feeAnalysis = null;

    // Always analyze transport fees (needed for both refund and waiver decisions)
    try {
      feeAnalysis = await analyzeTransportFees(id);
      console.log('📊 Fee analysis completed:', feeAnalysis);
    } catch (analysisError) {
      console.error('Error analyzing transport fees:', analysisError);
      return NextResponse.json({ 
        error: 'Failed to analyze transport fees', 
        details: analysisError.message
      }, { status: 500 });
    }

    // Handle refund creation if requested
    if (createRefund) {
      try {
        // Use already calculated fee analysis
        const eligibility = await calculateRefundEligibility(id, feeAnalysis);

        // Validate refund amount
        const refundValidation = validateRefundAmount(
          refundAmount || eligibility.suggestedRefund,
          feeAnalysis.paidAmount,
          eligibility.existingRefunds
        );

        if (!refundValidation.isValid) {
          return NextResponse.json({ 
            error: refundValidation.error,
            feeAnalysis,
            eligibility
          }, { status: 400 });
        }

        // Determine final refund amount and admin fee
        const finalRefundAmount = refundAmount || eligibility.suggestedRefund;
        const finalAdminFee = adminFee || 0;
        const netAmount = finalRefundAmount - finalAdminFee;

        // Create refund request using existing refund system
        refundCreated = await (schoolPrisma as any).RefundRequest.create({
          data: {
            schoolId: ctx.schoolId,
            studentId: assignment.studentId,
            type: 'transport_fee',
            sourceId: id,
            sourceType: 'StudentTransport',
            amount: finalRefundAmount,
            adminFee: finalAdminFee,
            netAmount: netAmount,
            reason: reason || 'Transport cancellation refund',
            status: netAmount < 1000 ? 'approved' : 'pending', // Auto-approve small amounts
            priority: netAmount >= 5000 ? 'high' : netAmount >= 1000 ? 'normal' : 'low',
            refundMethod: 'bank_transfer'
          }
        });

        // If auto-approved, create approval and transaction records
        if (refundCreated.status === 'approved') {
          await (schoolPrisma as any).RefundApproval.create({
            data: {
              refundId: refundCreated.id,
              approverId: ctx.userId,
              approverRole: ctx.role || 'admin',
              action: 'approved',
              comments: 'Auto-approved transport refund'
            }
          });

          await (schoolPrisma as any).RefundTransaction.create({
            data: {
              refundId: refundCreated.id,
              amount: netAmount,
              method: 'bank_transfer',
              transactionId: `AUTO-${refundCreated.id.slice(-8).toUpperCase()}`,
              status: 'completed',
              processedBy: 'system',
              processedAt: new Date()
            }
          });
        }

        // Send refund notification (will use existing notification system)
        const { sendRefundStatusNotification } = await import('@/lib/refundNotifications');
        await sendRefundStatusNotification(refundCreated.id, refundCreated.status);

      } catch (refundError) {
        console.error('Error creating refund:', refundError);
        return NextResponse.json({ 
          error: 'Failed to create refund', 
          details: refundError.message,
          feeAnalysis
        }, { status: 500 });
      }
    }

    // Variable to track waiver request
    let waiverRequest: any = null;

    // Check if any operations require approval
    let requiresApproval = false;
    let approvalType = '';

    // Debug logging
    console.log('🔍 Transport Cancellation Debug:', {
      createRefund,
      refundCreated: refundCreated ? { id: refundCreated.id, status: refundCreated.status } : null,
      pendingAction,
      feeAnalysis: feeAnalysis ? {
        totalAmount: feeAnalysis.totalAmount,
        paidAmount: feeAnalysis.paidAmount,
        pendingAmount: feeAnalysis.pendingAmount,
        hasArrears: feeAnalysis.hasArrears
      } : null
    });

    if (createRefund && refundCreated && refundCreated.status === 'pending') {
      requiresApproval = true;
      approvalType = 'refund';
      console.log('✅ Refund requires approval');
    }

    if (pendingAction === 'waive' && feeAnalysis) {
      const waiverApprovalNeeded = feeAnalysis.pendingAmount >= 1000 || feeAnalysis.hasArrears;
      console.log('🔍 Waiver check:', {
        pendingAmount: feeAnalysis.pendingAmount,
        hasArrears: feeAnalysis.hasArrears,
        waiverApprovalNeeded,
        condition1: feeAnalysis.pendingAmount >= 1000,
        condition2: feeAnalysis.hasArrears
      });
      
      if (waiverApprovalNeeded) {
        requiresApproval = true;
        approvalType = approvalType ? 'both' : 'waiver';
        console.log('✅ Waiver requires approval');
      }
    }

    console.log('📊 Final approval decision:', {
      requiresApproval,
      approvalType
    });

    // If approval is required, create requests first and don't delete transport yet
    if (requiresApproval) {
      // Create waiver request if needed
      if (pendingAction === 'waive' && feeAnalysis && 
          (feeAnalysis.pendingAmount >= 1000 || feeAnalysis.hasArrears)) {
        waiverRequest = await (schoolPrisma as any).RefundRequest.create({
          data: {
            schoolId: ctx.schoolId,
            studentId: assignment.studentId,
            type: 'transport_fee_waiver',
            sourceId: assignment.id,
            sourceType: 'StudentTransport',
            amount: feeAnalysis.pendingAmount,
            adminFee: 0,
            netAmount: feeAnalysis.pendingAmount,
            reason: `Transport fee waiver - ${feeAnalysis.hasArrears ? 'includes arrears' : 'current year'}`,
            status: 'pending',
            priority: feeAnalysis.hasArrears ? 'high' : 'normal',
            refundMethod: 'waiver',
            approvedBy: null,
            approvedAt: null,
            processedBy: null,
            processedAt: null
          }
        });

        // Mark fee records as pending waiver approval
        await (schoolPrisma as any).FeeRecord.updateMany({
          where: {
            studentId: assignment.studentId,
            feeStructure: { category: 'transport' },
            status: feeAnalysis.paymentStatus === 'unpaid' ? 'pending' : undefined
          },
          data: { 
            status: 'pending_waiver_approval',
            remarks: `Waiver request ID: ${waiverRequest.id} - awaiting approval`
          }
        });
      }

      // Don't delete transport yet - wait for approval
      const response: any = { 
        success: true,
        message: approvalType === 'both' 
          ? 'Refund and waiver requests created and pending approval'
          : approvalType === 'refund'
          ? 'Refund request created and pending approval'
          : 'Waiver request created and pending approval',
        requiresApproval: true,
        approvalType
      };

      if (refundCreated) {
        response.refund = {
          id: refundCreated.id,
          amount: refundCreated.amount,
          netAmount: refundCreated.netAmount,
          status: refundCreated.status,
          requiresApproval: refundCreated.status === 'pending'
        };
      }

      if (waiverRequest) {
        response.waiverRequest = {
          id: waiverRequest.id,
          amount: waiverRequest.amount,
          status: waiverRequest.status,
          priority: waiverRequest.priority,
          requiresApproval: waiverRequest.status === 'pending',
          message: 'Waiver request requires manager approval before transport can be cancelled'
        };
      }

      if (feeAnalysis) {
        response.feeAnalysis = feeAnalysis;
      }

      return NextResponse.json(response);
    }

    // If no approval required, proceed with immediate deletion
    console.log('🚀 Proceeding with immediate deletion (no approval required)');
    await (schoolPrisma as any).$transaction(async (tx: any) => {
      console.log('🗑️ Deleting transport assignment:', id);
      // Delete the student transport assignment
      await (tx as any).StudentTransport.delete({ where: { id } });

      // Update student transport fields
      await (tx as any).Student.update({
        where: { id: assignment.studentId },
        data: { transport: 'No', transportRoute: null }
      });

      // Handle fee records based on payment status and pending action
      if (feeAnalysis) {
        if (feeAnalysis.paymentStatus === 'unpaid') {
          // Handle unpaid fee records based on pending action
          if (pendingAction === 'waive') {
            // This is auto-approved case (small amount, no arrears)
            // Create auto-approved waiver request
            waiverRequest = await (tx as any).RefundRequest.create({
              data: {
                schoolId: ctx.schoolId,
                studentId: assignment.studentId,
                type: 'transport_fee_waiver',
                sourceId: assignment.id,
                sourceType: 'StudentTransport',
                amount: feeAnalysis.pendingAmount,
                adminFee: 0,
                netAmount: feeAnalysis.pendingAmount,
                reason: 'Transport fee waiver - auto-approved (unpaid)',
                status: 'approved',
                priority: 'normal',
                refundMethod: 'waiver',
                approvedBy: ctx.user?.email || 'system',
                approvedAt: new Date(),
                processedBy: null,
                processedAt: null
              }
            });
            
            // Update fee record to reflect waiver (preserve audit trail)
            await (tx as any).FeeRecord.updateMany({
              where: {
                studentId: assignment.studentId,
                feeStructure: { category: 'transport' },
                status: 'pending'
              },
              data: { 
                status: 'cancelled',
                remarks: `Transport cancelled - full amount waived (unpaid)`,
                discount: feeAnalysis.pendingAmount, // Use discount field for waived amount
                pendingAmount: 0,
                amount: 0,
                updatedAt: new Date()
              }
            });
          } else {
            // Keep for recovery - mark as cancelled but keep record
            await (tx as any).FeeRecord.updateMany({
              where: {
                studentId: assignment.studentId,
                feeStructure: { category: 'transport' },
                status: 'pending'
              },
              data: { 
                status: 'cancelled',
                remarks: `Transport cancelled - pending amount kept for recovery`,
                // Keep original amounts for recovery tracking
                updatedAt: new Date()
              }
            });
          }
        } else if (feeAnalysis.paymentStatus === 'partial') {
          // For partial payments, preserve audit trail and handle pending portion
          if (pendingAction === 'waive') {
            // This is auto-approved case (small amount, no arrears)
            // Create auto-approved waiver request for audit trail
            waiverRequest = await (tx as any).RefundRequest.create({
              data: {
                schoolId: ctx.schoolId,
                studentId: assignment.studentId,
                type: 'transport_fee_waiver',
                sourceId: assignment.id,
                sourceType: 'StudentTransport',
                amount: feeAnalysis.pendingAmount,
                adminFee: 0,
                netAmount: feeAnalysis.pendingAmount,
                reason: 'Transport fee waiver - auto-approved (partial payment)',
                status: 'approved',
                priority: 'normal',
                refundMethod: 'waiver',
                approvedBy: ctx.user?.email || 'system',
                approvedAt: new Date(),
                processedBy: null,
                processedAt: null
              }
            });
            
            // Update fee record to reflect waiver (preserve paid amount for audit)
            await (tx as any).FeeRecord.updateMany({
              where: {
                studentId: assignment.studentId,
                feeStructure: { category: 'transport' }
              },
              data: { 
                status: 'cancelled',
                remarks: `Transport cancelled - ₹${feeAnalysis.paidAmount} paid (earned), ₹${feeAnalysis.pendingAmount} waived`,
                discount: feeAnalysis.pendingAmount, // Use discount field for waived amount
                pendingAmount: 0,
                amount: feeAnalysis.paidAmount, // Update total amount to reflect only earned portion
                updatedAt: new Date()
              }
            });
          } else {
            // Keep for recovery - mark as cancelled but keep for audit
            await (tx as any).FeeRecord.updateMany({
              where: {
                studentId: assignment.studentId,
                feeStructure: { category: 'transport' }
              },
              data: { 
                status: 'cancelled',
                remarks: `Transport cancelled - pending amount kept for recovery`,
                // Keep original amounts for recovery tracking
                updatedAt: new Date()
              }
            });
          }
        }
        // For full payments, keep records as-is for audit trail (unless waived)
        else if (feeAnalysis.paymentStatus === 'full' && pendingAction === 'waive') {
          // For full payments with waive, keep as audit trail
          // No action needed as refund is handled separately
        }
      }
    });

    // Return success response with refund details if created
    const response: any = { 
      success: true,
      message: 'Transport assignment cancelled successfully',
      requiresApproval: false
    };

    if (refundCreated) {
      response.refund = {
        id: refundCreated.id,
        amount: refundCreated.amount,
        netAmount: refundCreated.netAmount,
        status: refundCreated.status,
        requiresApproval: refundCreated.status === 'pending'
      };
    }

    // Add waiver request information if created
    if (waiverRequest) {
      response.waiverRequest = {
        id: waiverRequest.id,
        amount: waiverRequest.amount,
        status: waiverRequest.status,
        priority: waiverRequest.priority,
        requiresApproval: waiverRequest.status === 'pending',
        message: waiverRequest.status === 'pending' 
          ? 'Waiver request requires manager approval'
          : 'Waiver request auto-approved'
      };
    }

    if (refundCreated) {
      response.refund.refundNumber = `REF-${refundCreated.id.slice(-8).toUpperCase()}`;
    }

    if (feeAnalysis) {
      response.feeAnalysis = feeAnalysis;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('DELETE /api/transport/students/[id]:', error);
    return NextResponse.json({ 
      error: 'Failed to cancel transport assignment', 
      details: error.message 
    }, { status: 500 });
  }
}
