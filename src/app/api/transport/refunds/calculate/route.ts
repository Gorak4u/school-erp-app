import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { getTransportRefundSummary } from '@/lib/transportFeeAnalyzer';

// POST /api/transport/refunds/calculate - Calculate transport refund analysis
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }

    const body = await request.json();
    const { studentTransportId } = body;

    if (!studentTransportId) {
      return NextResponse.json({ error: 'Student transport ID is required' }, { status: 400 });
    }

    // Get comprehensive refund analysis
    const refundSummary = await getTransportRefundSummary(studentTransportId);

    return NextResponse.json({
      success: true,
      data: refundSummary
    });

  } catch (error: any) {
    console.error('POST /api/transport/refunds/calculate:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate refund analysis', 
      details: error.message 
    }, { status: 500 });
  }
}
