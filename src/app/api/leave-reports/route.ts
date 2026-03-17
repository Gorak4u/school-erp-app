import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Generate leave reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const academicYearId = searchParams.get('academicYearId');
    const department = searchParams.get('department');
    const leaveTypeId = searchParams.get('leaveTypeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!academicYearId) {
      return NextResponse.json({ error: 'Academic year ID is required' }, { status: 400 });
    }

    switch (reportType) {
      case 'summary':
        return await generateSummaryReport(session.user.schoolId, academicYearId, {
          department,
          leaveTypeId,
          startDate,
          endDate,
        });
      
      case 'balance':
        return await generateBalanceReport(session.user.schoolId, academicYearId, {
          department,
          leaveTypeId,
        });
      
      case 'utilization':
        return await generateUtilizationReport(session.user.schoolId, academicYearId, {
          department,
          leaveTypeId,
          startDate,
          endDate,
        });
      
      case 'approval-efficiency':
        return await generateApprovalEfficiencyReport(session.user.schoolId, academicYearId, {
          startDate,
          endDate,
        });
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating leave report:', error);
    return NextResponse.json({ error: 'Failed to generate leave report' }, { status: 500 });
  }
}

async function generateSummaryReport(schoolId: string, academicYearId: string, filters: any) {
  const where: any = {
    schoolId,
    academicYearId,
  };

  if (filters.startDate || filters.endDate) {
    where.appliedAt = {};
    if (filters.startDate) where.appliedAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.appliedAt.lte = new Date(filters.endDate);
  }

  const [
    totalApplications,
    approvedApplications,
    rejectedApplications,
    pendingApplications,
    cancelledApplications,
    applicationsByType,
    applicationsByDepartment,
    applicationsByMonth,
  ] = await Promise.all([
    schoolPrisma.leaveApplication.count({ where }),
    schoolPrisma.leaveApplication.count({ where: { ...where, status: 'approved' } }),
    schoolPrisma.leaveApplication.count({ where: { ...where, status: 'rejected' } }),
    schoolPrisma.leaveApplication.count({ where: { ...where, status: 'pending' } }),
    schoolPrisma.leaveApplication.count({ where: { ...where, status: 'cancelled' } }),
    
    schoolPrisma.leaveApplication.groupBy({
      by: ['leaveTypeId'],
      where,
      _count: true,
      _sum: { totalDays: true },
    }),
    
    schoolPrisma.leaveApplication.groupBy({
      by: ['staffId'],
      where: {
        ...where,
        staff: { department: filters.department },
      },
      _count: true,
      _sum: { totalDays: true },
    }),
    
    schoolPrisma.leaveApplication.groupBy({
      by: ['appliedAt'],
      where: {
        ...where,
        appliedAt: {
          gte: filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), 0, 1),
          lte: filters.endDate ? new Date(filters.endDate) : new Date(),
        },
      },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    report: {
      type: 'summary',
      summary: {
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications,
        cancelledApplications,
        approvalRate: totalApplications > 0 ? (approvedApplications / totalApplications * 100).toFixed(2) : 0,
      },
      byType: applicationsByType,
      byDepartment: applicationsByDepartment,
      byMonth: applicationsByMonth,
    },
  });
}

async function generateBalanceReport(schoolId: string, academicYearId: string, filters: any) {
  const where: any = {
    schoolId,
    academicYearId,
  };

  if (filters.department) {
    where.staff = { department: filters.department };
  }

  if (filters.leaveTypeId) {
    where.leaveTypeId = filters.leaveTypeId;
  }

  const balances = await schoolPrisma.leaveBalance.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          department: true,
        },
      },
      leaveType: {
        select: {
          id: true,
          name: true,
          code: true,
          maxDaysPerYear: true,
          isPaid: true,
        },
      },
    },
    orderBy: [
      { staff: { department: 'asc' } },
      { staff: { name: 'asc' } },
      { leaveType: { name: 'asc' } },
    ],
  });

  // Calculate statistics
  const stats = {
    totalStaff: new Set(balances.map(b => b.staffId)).size,
    totalLeaveTypes: new Set(balances.map(b => b.leaveTypeId)).size,
    totalAllocated: balances.reduce((sum, b) => sum + parseFloat(b.totalAllocated.toString()), 0),
    totalUsed: balances.reduce((sum, b) => sum + parseFloat(b.used.toString()), 0),
    totalBalance: balances.reduce((sum, b) => sum + parseFloat(b.balance.toString()), 0),
    totalCarriedForward: balances.reduce((sum, b) => sum + parseFloat(b.carriedForward.toString()), 0),
  };

  return NextResponse.json({
    report: {
      type: 'balance',
      stats,
      balances,
    },
  });
}

async function generateUtilizationReport(schoolId: string, academicYearId: string, filters: any) {
  const where: any = {
    schoolId,
    academicYearId,
    status: 'approved',
  };

  if (filters.startDate || filters.endDate) {
    where.startDate = {};
    if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.startDate.lte = new Date(filters.endDate);
  }

  if (filters.department) {
    where.staff = { department: filters.department };
  }

  if (filters.leaveTypeId) {
    where.leaveTypeId = filters.leaveTypeId;
  }

  const utilization = await schoolPrisma.leaveApplication.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          department: true,
        },
      },
      leaveType: {
        select: {
          id: true,
          name: true,
          code: true,
          isPaid: true,
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  // Group by staff
  const byStaff = utilization.reduce((acc: any, app) => {
    const staffId = app.staffId;
    if (!acc[staffId]) {
      acc[staffId] = {
        staff: app.staff,
        totalDays: 0,
        totalLeaves: 0,
        leaveTypes: {},
      };
    }
    acc[staffId].totalDays += app.totalDays;
    acc[staffId].totalLeaves += 1;
    
    const leaveTypeName = app.leaveType.name;
    if (!acc[staffId].leaveTypes[leaveTypeName]) {
      acc[staffId].leaveTypes[leaveTypeName] = { days: 0, count: 0 };
    }
    acc[staffId].leaveTypes[leaveTypeName].days += app.totalDays;
    acc[staffId].leaveTypes[leaveTypeName].count += 1;
    
    return acc;
  }, {});

  return NextResponse.json({
    report: {
      type: 'utilization',
      summary: {
        totalApprovedLeaves: utilization.length,
        totalDaysTaken: utilization.reduce((sum, app) => sum + parseFloat(app.totalDays.toString()), 0),
        averageDaysPerLeave: utilization.length > 0 ? (utilization.reduce((sum, app) => sum + parseFloat(app.totalDays.toString()), 0) / utilization.length).toFixed(2) : 0,
      },
      byStaff: Object.values(byStaff),
    },
  });
}

async function generateApprovalEfficiencyReport(schoolId: string, academicYearId: string, filters: any) {
  const where: any = {
    schoolId,
    academicYearId,
  };

  if (filters.startDate || filters.endDate) {
    where.appliedAt = {};
    if (filters.startDate) where.appliedAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.appliedAt.lte = new Date(filters.endDate);
  }

  const applications = await schoolPrisma.leaveApplication.findMany({
    where,
    include: {
      approvalHistory: {
        orderBy: { createdAt: 'asc' },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
        },
      },
    },
  });

  // Calculate approval times
  const approvalTimes = applications
    .filter(app => app.status === 'approved' && app.approvedAt)
    .map(app => {
      const appliedAt = new Date(app.appliedAt).getTime();
      const approvedAt = new Date(app.approvedAt!).getTime();
      return Math.ceil((approvedAt - appliedAt) / (1000 * 60 * 60 * 24)); // days
    });

  const avgApprovalTime = approvalTimes.length > 0 
    ? (approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length).toFixed(2)
    : 0;

  const approverStats = applications.reduce((acc: any, app) => {
    if (app.approverId) {
      const approverId = app.approverId;
      if (!acc[approverId]) {
        acc[approverId] = {
          approver: app.approver,
          total: 0,
          approved: 0,
          rejected: 0,
        };
      }
      acc[approverId].total += 1;
      if (app.status === 'approved') acc[approverId].approved += 1;
      if (app.status === 'rejected') acc[approverId].rejected += 1;
    }
    return acc;
  }, {});

  return NextResponse.json({
    report: {
      type: 'approval-efficiency',
      summary: {
        totalApplications: applications.length,
        avgApprovalTime: parseFloat(avgApprovalTime.toString()),
        approvalRate: applications.length > 0 ? (applications.filter(app => app.status === 'approved').length / applications.length * 100).toFixed(2) : 0,
      },
      approverStats: Object.values(approverStats).map((stat: any) => ({
        ...stat,
        approvalRate: stat.total > 0 ? (stat.approved / stat.total * 100).toFixed(2) : 0,
      })),
    },
  });
}
