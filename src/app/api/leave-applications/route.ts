import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendLeaveApprovalRequestEmail } from '@/lib/leave-approval-request-email';

// GET - Fetch leave applications with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const staffId = searchParams.get('staffId');
    const leaveTypeId = searchParams.get('leaveTypeId');
    const academicYearId = searchParams.get('academicYearId');
    const approverId = searchParams.get('approverId');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where: any = {
      schoolId: session.user.schoolId,
    };

    // Add filters
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (approverId) where.approverId = approverId;

    // Add search
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { staff: { name: { contains: search, mode: 'insensitive' } } },
        { leaveType: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [applications, total] = await Promise.all([
      schoolPrisma.leaveApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
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
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          academicYear: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
          _count: {
            select: {
              approvalHistory: true,
            },
          },
        },
      }),
      schoolPrisma.leaveApplication.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching leave applications:', error);
    return NextResponse.json({ error: 'Failed to fetch leave applications' }, { status: 500 });
  }
}

// POST - Create a new leave application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      leaveTypeId,
      startDate,
      endDate,
      reason,
      attachmentPath,
      academicYearId,
    } = body;

    // Validate required fields
    if (!leaveTypeId || !startDate || !endDate || !academicYearId) {
      return NextResponse.json({ 
        error: 'Leave type, start date, end date, and academic year are required' 
      }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    }

    // Calculate total days (excluding weekends if configured)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get staff ID from session (assuming staff is linked to user)
    const staff = await schoolPrisma.teacher.findFirst({
      where: {
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    // Check leave balance
    const leaveBalance = await schoolPrisma.leaveBalance.findUnique({
      where: {
        staffId_leaveTypeId_academicYearId: {
          staffId: staff.id,
          leaveTypeId,
          academicYearId,
        },
      },
      include: {
        leaveType: true,
      },
    });

    if (!leaveBalance || parseFloat(leaveBalance.balance.toString()) < totalDays) {
      return NextResponse.json({ 
        error: 'Insufficient leave balance',
        details: `Available: ${leaveBalance?.balance || 0}, Required: ${totalDays}`
      }, { status: 400 });
    }

    // Check for overlapping leave applications
    const overlappingApplication = await schoolPrisma.leaveApplication.findFirst({
      where: {
        staffId: staff.id,
        status: { not: 'cancelled' },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } }
            ]
          }
        ]
      },
    });

    if (overlappingApplication) {
      return NextResponse.json({ 
        error: 'Overlapping leave application exists',
        details: `You already have leave from ${overlappingApplication.startDate} to ${overlappingApplication.endDate}`
      }, { status: 400 });
    }

    // Get leave settings for auto-approval
    const leaveSettings = await schoolPrisma.leaveSettings.findUnique({
      where: {
        schoolId_academicYearId: {
          schoolId: session.user.schoolId,
          academicYearId,
        },
      },
    });

    // Determine if auto-approval applies
    let status = 'pending';
    let approverId = null;
    
    let approverCandidates: { id: string; email: string | null }[] = [];
    if (leaveSettings && totalDays <= leaveSettings.autoApproveDays) {
      status = 'approved';
      // Auto-approve to the staff themselves or system admin
    } else {
      // Find next approver based on workflow
      type WorkflowStep = {
        leaveTypeId?: string | null;
        roleId: string;
      };

      const workflow: WorkflowStep[] = await schoolPrisma.leaveWorkflow.findMany({
        where: {
          schoolId: session.user.schoolId,
          academicYearId,
          leaveTypeId: leaveTypeId, // or null for default workflow
          isActive: true,
        },
        orderBy: { sequence: 'asc' },
        include: {
          role: true,
        },
      });

      const primaryWorkflow = workflow.length > 0
        ? workflow.find(step => step.leaveTypeId && step.leaveTypeId === leaveTypeId)
          || workflow.find(step => !step.leaveTypeId)
          || workflow[0]
        : undefined;

      const findApprovers = async (roleId: string | null) => {
        if (!roleId) return [] as { id: string; email: string | null }[];
        if (roleId === 'admin') {
          return schoolPrisma.school_User.findMany({
            where: { schoolId: session.user.schoolId, role: 'admin', isActive: true },
            select: { id: true, email: true },
          });
        }
        return schoolPrisma.school_User.findMany({
          where: { schoolId: session.user.schoolId, customRoleId: roleId, isActive: true },
          select: { id: true, email: true },
        });
      };

      approverCandidates = await findApprovers(primaryWorkflow?.roleId || null);
      approverId = approverCandidates[0]?.id || null;
    }

    // Create leave application
    const application = await schoolPrisma.leaveApplication.create({
      data: {
        staffId: staff.id,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        attachmentPath,
        status,
        approverId,
        academicYearId,
        schoolId: session.user.schoolId,
      },
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
        academicYear: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    });

    // If auto-approved, update leave balance
    if (status === 'approved') {
      await schoolPrisma.leaveBalance.update({
        where: {
          staffId_leaveTypeId_academicYearId: {
            staffId: staff.id,
            leaveTypeId,
            academicYearId,
          },
        },
        data: {
          used: { increment: totalDays },
          balance: { decrement: totalDays },
        },
      });

      // Create approval history
      await schoolPrisma.leaveApprovalHistory.create({
        data: {
          leaveApplicationId: application.id,
          approverId: staff.id, // Self-approved
          action: 'approved',
          comments: 'Auto-approved',
          approverRole: 'system',
          previousStatus: 'pending',
          newStatus: 'approved',
        },
      });
    }

    if (status === 'pending' && approverCandidates.length > 0) {
      const school = await schoolPrisma.school.findUnique({
        where: { id: session.user.schoolId },
        select: { name: true },
      });

      await Promise.all(approverCandidates.map(async approver => {
        const metadata = {
          applicationId: application.id,
          staffName: application.staff.name,
          leaveType: application.leaveType.name,
          reason: application.reason,
          link: `/leave?tab=approvals&applicationId=${application.id}`,
        };
        await (schoolPrisma as any).notification.create({
          data: {
            userId: approver.id,
            type: 'leave_approval_request',
            title: 'Leave approval required',
            message: `${application.staff.name} applied for ${application.leaveType.name} leave`,
            metadata: JSON.stringify(metadata),
            schoolId: session.user.schoolId,
            isRead: false,
          }
        });

        if (approver.email && school?.name) {
          await sendLeaveApprovalRequestEmail({
            to: approver.email,
            staffName: application.staff.name,
            leaveType: application.leaveType.name,
            schoolName: school.name,
            applicationId: application.id,
            schoolId: session.user.schoolId,
          });
        }
      }));
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error creating leave application:', error);
    return NextResponse.json({ error: 'Failed to create leave application' }, { status: 500 });
  }
}
