import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    await schoolPrisma.$connect();
    
    // Test if leave management tables exist
    const leaveTypeCount = await schoolPrisma.leaveType.count();
    const leaveBalanceCount = await schoolPrisma.leaveBalance.count();
    const leaveApplicationCount = await schoolPrisma.leaveApplication.count();
    
    await schoolPrisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Leave management tables are created and accessible!',
      tables: {
        leaveType: { exists: true, count: leaveTypeCount },
        leaveBalance: { exists: true, count: leaveBalanceCount },
        leaveApplication: { exists: true, count: leaveApplicationCount },
      }
    });
  } catch (error) {
    console.error('Error testing leave tables:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Leave management tables may not exist or are not accessible'
    }, { status: 500 });
  }
}
