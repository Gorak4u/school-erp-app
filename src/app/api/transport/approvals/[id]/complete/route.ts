import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }
    
    const { id } = await params;
    const body = await request.json();
    const { action, comments } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be approve or reject.' }, { status: 400 });
    }

    // Find the refund/waiver request
    const refundRequest = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { 
        id,
        schoolId: ctx.schoolId,
        status: 'pending'
      },
      include: {
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
    });

    if (!refundRequest) {
      return NextResponse.json({ error: 'Request not found or already processed.' }, { status: 404 });
    }

    await (schoolPrisma as any).$transaction(async (tx: any) => {
      if (action === 'approve') {
        // Update request status
        await (tx as any).RefundRequest.update({
          where: { id },
          data: {
            status: 'approved',
            approvedBy: ctx.userId || 'system',
            approvedAt: new Date()
          }
        });

        // Create approval record
        await (tx as any).RefundApproval.create({
          data: {
            refundId: id,
            approverId: ctx.userId,
            approverRole: ctx.role || 'admin',
            action: 'approved',
            comments: comments || 'Approved via transport management'
          }
        });

        // If this is a waiver, complete the transport deletion and fee record processing
        if (refundRequest.type === 'transport_fee_waiver') {
          // Delete the student transport assignment
          await (tx as any).StudentTransport.delete({
            where: { id: refundRequest.sourceId }
          });

          // Update student transport fields
          await (tx as any).Student.update({
            where: { id: refundRequest.studentId },
            data: { transport: 'No', transportRoute: null }
          });

          // Update the fee records that were pending waiver approval (preserve audit trail)
          await (tx as any).FeeRecord.updateMany({
            where: {
              studentId: refundRequest.studentId,
              feeStructure: { category: 'transport' },
              status: 'pending_waiver_approval'
            },
            data: {
              status: 'cancelled',
              remarks: `Transport fee waiver approved - Waiver ID: ${id}, Amount: ₹${refundRequest.amount} (tracked in discount field)`,
              discount: refundRequest.amount, // Using discount field to track waived amount (documented approach)
              pendingAmount: 0,
              // Note: We use 'discount' field to track waived amounts since no dedicated 'waivedAmount' field exists
              // This is documented across all transport waiver handling code for consistency
              updatedAt: new Date()
            }
          });

          // Send notification
          // TODO: Implement notification service
          console.log(`Transport waiver approved for student ${refundRequest.student.name}`);
        }

        // If this is a refund, process the refund
        else if (refundRequest.type === 'transport_fee') {
          // Create refund transaction
          await (tx as any).RefundTransaction.create({
            data: {
              refundId: id,
              amount: refundRequest.netAmount,
              method: 'bank_transfer',
              status: 'pending',
              processedBy: null,
              processedAt: null
            }
          });

          // Send notification
          // TODO: Implement notification service
          console.log(`Transport refund approved for student ${refundRequest.student.name}`);
        }

      } else if (action === 'reject') {
        // Update request status
        await (tx as any).RefundRequest.update({
          where: { id },
          data: {
            status: 'rejected',
            rejectionReason: comments || 'Rejected via transport management',
            approvedBy: ctx.userId || 'system',
            approvedAt: new Date()
          }
        });

        // Create approval record
        await (tx as any).RefundApproval.create({
          data: {
            refundId: id,
            approverId: ctx.userId,
            approverRole: ctx.role || 'admin',
            action: 'rejected',
            comments: comments || 'Rejected via transport management'
          }
        });

        // If this is a waiver, restore fee records to normal status
        if (refundRequest.type === 'transport_fee_waiver') {
          await (tx as any).FeeRecord.updateMany({
            where: {
              studentId: refundRequest.studentId,
              feeStructure: { category: 'transport' },
              status: 'pending_waiver_approval'
            },
            data: { 
              status: 'pending',
              remarks: 'Waiver request rejected - fee restored'
            }
          });

          console.log(`Transport waiver rejected for student ${refundRequest.student.name}`);
        }

        // If this is a refund, no additional action needed
        else if (refundRequest.type === 'transport_fee') {
          console.log(`Transport refund rejected for student ${refundRequest.student.name}`);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`,
      action,
      requestId: id,
      studentName: refundRequest.student.name
    });

  } catch (error: any) {
    console.error('POST /api/transport/approvals/[id]/complete:', error);
    return NextResponse.json({ 
      error: 'Failed to process approval action', 
      details: error.message 
    }, { status: 500 });
  }
}
