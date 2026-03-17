import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const DEFAULT_LEAVE_TYPES = [
  {
    name: 'Sick Leave',
    code: 'SL',
    maxDaysPerYear: 12,
    isPaid: true,
    requiresDocument: true,
    accrualRate: 1,
    canCarryForward: true,
    maxCarryForwardDays: 6,
    description: 'Leave taken due to illness or medical reasons',
  },
  {
    name: 'Casual Leave',
    code: 'CL',
    maxDaysPerYear: 15,
    isPaid: true,
    requiresDocument: false,
    accrualRate: 1.25,
    canCarryForward: true,
    maxCarryForwardDays: 8,
    description: 'Leave taken for personal reasons or emergencies',
  },
  {
    name: 'Earned Leave',
    code: 'EL',
    maxDaysPerYear: 18,
    isPaid: true,
    requiresDocument: false,
    accrualRate: 1.5,
    canCarryForward: true,
    maxCarryForwardDays: 12,
    description: 'Leave earned based on years of service',
  },
  {
    name: 'Maternity Leave',
    code: 'ML',
    maxDaysPerYear: 180,
    isPaid: true,
    requiresDocument: true,
    accrualRate: 0,
    canCarryForward: false,
    maxCarryForwardDays: 0,
    description: 'Leave for female employees during pregnancy and childbirth',
  },
  {
    name: 'Paternity Leave',
    code: 'PL',
    maxDaysPerYear: 15,
    isPaid: true,
    requiresDocument: true,
    accrualRate: 0,
    canCarryForward: false,
    maxCarryForwardDays: 0,
    description: 'Leave for male employees during childbirth of their child',
  },
  {
    name: 'Leave Without Pay',
    code: 'LWP',
    maxDaysPerYear: 30,
    isPaid: false,
    requiresDocument: false,
    accrualRate: 0,
    canCarryForward: false,
    maxCarryForwardDays: 0,
    description: 'Unpaid leave for extended personal reasons',
  },
];

const DEFAULT_LEAVE_SETTINGS = {
  autoApproveDays: 1,
  requireDocumentDays: 3,
  minStaffCoverage: 2,
  examPeriodRestriction: true,
  notificationEmails: [],
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  halfDayRules: {
    enabled: true,
    countAsFullDay: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { academicYearId } = await request.json();

    if (!academicYearId) {
      return NextResponse.json({ error: 'Academic year ID is required' }, { status: 400 });
    }

    // Verify academic year exists
    const academicYear = await schoolPrisma.academicYear.findUnique({
      where: {
        id: academicYearId,
      },
    });

    if (!academicYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    const results = {
      leaveTypes: { created: 0, updated: 0, errors: [] as string[] },
      settings: { created: false, updated: false, error: null as string | null },
      workflows: { created: 0, errors: [] as string[] },
    };

    // Create default leave types
    for (const leaveType of DEFAULT_LEAVE_TYPES) {
      try {
        const existing = await schoolPrisma.leaveType.findFirst({
          where: {
            schoolId: session.user.schoolId,
            code: leaveType.code,
          },
        });

        if (existing) {
          await schoolPrisma.leaveType.update({
            where: { id: existing.id },
            data: {
              name: leaveType.name,
              maxDaysPerYear: leaveType.maxDaysPerYear,
              isPaid: leaveType.isPaid,
              requiresDocument: leaveType.requiresDocument,
              accrualRate: leaveType.accrualRate,
              canCarryForward: leaveType.canCarryForward,
              maxCarryForwardDays: leaveType.maxCarryForwardDays,
              description: leaveType.description,
            },
          });
          results.leaveTypes.updated++;
        } else {
          await schoolPrisma.leaveType.create({
            data: {
              schoolId: session.user.schoolId,
              ...leaveType,
            },
          });
          results.leaveTypes.created++;
        }
      } catch (error) {
        console.error(`Error creating leave type ${leaveType.code}:`, error);
        results.leaveTypes.errors.push(`Failed to create ${leaveType.name}: ${error}`);
      }
    }

    // Create default leave settings
    try {
      const existingSettings = await schoolPrisma.leaveSettings.findUnique({
        where: {
          schoolId_academicYearId: {
            schoolId: session.user.schoolId,
            academicYearId,
          },
        },
      });

      if (existingSettings) {
        await schoolPrisma.leaveSettings.update({
          where: {
            schoolId_academicYearId: {
              schoolId: session.user.schoolId,
              academicYearId,
            },
          },
          data: {
            autoApproveDays: DEFAULT_LEAVE_SETTINGS.autoApproveDays,
            requireDocumentDays: DEFAULT_LEAVE_SETTINGS.requireDocumentDays,
            minStaffCoverage: DEFAULT_LEAVE_SETTINGS.minStaffCoverage,
            examPeriodRestriction: DEFAULT_LEAVE_SETTINGS.examPeriodRestriction,
            notificationEmails: JSON.stringify(DEFAULT_LEAVE_SETTINGS.notificationEmails),
            workingDays: JSON.stringify(DEFAULT_LEAVE_SETTINGS.workingDays),
            halfDayRules: JSON.stringify(DEFAULT_LEAVE_SETTINGS.halfDayRules),
          },
        });
        results.settings.updated = true;
      } else {
        await schoolPrisma.leaveSettings.create({
          data: {
            schoolId: session.user.schoolId,
            academicYearId,
            autoApproveDays: DEFAULT_LEAVE_SETTINGS.autoApproveDays,
            requireDocumentDays: DEFAULT_LEAVE_SETTINGS.requireDocumentDays,
            minStaffCoverage: DEFAULT_LEAVE_SETTINGS.minStaffCoverage,
            examPeriodRestriction: DEFAULT_LEAVE_SETTINGS.examPeriodRestriction,
            notificationEmails: JSON.stringify(DEFAULT_LEAVE_SETTINGS.notificationEmails),
            workingDays: JSON.stringify(DEFAULT_LEAVE_SETTINGS.workingDays),
            halfDayRules: JSON.stringify(DEFAULT_LEAVE_SETTINGS.halfDayRules),
          },
        });
        results.settings.created = true;
      }
    } catch (error) {
      console.error('Error creating leave settings:', error);
      results.settings.error = `Failed to create settings: ${error}`;
    }

    // Create default approval workflows
    try {
      // Get custom roles for the school
      const customRoles = await schoolPrisma.customRole.findMany({
        where: {
          schoolId: session.user.schoolId,
        },
      });

      // Get created leave types
      const leaveTypes = await schoolPrisma.leaveType.findMany({
        where: {
          schoolId: session.user.schoolId,
        },
      });

      // Create default workflow for each leave type
      for (const leaveType of leaveTypes) {
        try {
          // Default workflow: Admin approval for all leave types
          const adminRole = customRoles.find(role => role.name.toLowerCase().includes('admin'));
          const hodRole = customRoles.find(role => role.name.toLowerCase().includes('hod') || role.name.toLowerCase().includes('head'));
          
          if (adminRole) {
            // Create admin approval workflow
            await schoolPrisma.leaveWorkflow.create({
              data: {
                schoolId: session.user.schoolId,
                academicYearId,
                leaveTypeId: leaveType.id,
                roleId: adminRole.id,
                requiredPermission: 'approve_all_leave',
                sequence: 1,
                isActive: true,
              },
            });
            results.workflows.created++;
          }

          if (hodRole && hodRole.id !== adminRole?.id) {
            // Create HOD approval workflow for department-specific leaves
            await schoolPrisma.leaveWorkflow.create({
              data: {
                schoolId: session.user.schoolId,
                academicYearId,
                leaveTypeId: leaveType.id,
                roleId: hodRole.id,
                requiredPermission: 'approve_department_leave',
                sequence: 2,
                isActive: true,
              },
            });
            results.workflows.created++;
          }
        } catch (error) {
          console.error(`Error creating workflow for ${leaveType.name}:`, error);
          results.workflows.errors.push(`Failed to create workflow for ${leaveType.name}: ${error}`);
        }
      }
    } catch (error) {
      console.error('Error creating workflows:', error);
      results.workflows.errors.push(`Failed to create workflows: ${error}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Leave management defaults seeded successfully',
      results,
    });
  } catch (error) {
    console.error('Error seeding leave management defaults:', error);
    return NextResponse.json({ error: 'Failed to seed leave management defaults' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if defaults are already seeded
    const leaveTypesCount = await schoolPrisma.leaveType.count({
      where: {
        schoolId: session.user.schoolId,
      },
    });

    const academicYears = await schoolPrisma.academicYear.findMany({
      select: {
        id: true,
        name: true,
        year: true,
        isActive: true,
      },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({
      isSeeded: leaveTypesCount > 0,
      leaveTypesCount,
      academicYears,
      defaultLeaveTypes: DEFAULT_LEAVE_TYPES,
    });
  } catch (error) {
    console.error('Error checking leave management defaults:', error);
    return NextResponse.json({ error: 'Failed to check leave management defaults' }, { status: 500 });
  }
}
