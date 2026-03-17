import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Fetch leave settings for the school
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    if (!academicYearId) {
      return NextResponse.json({ error: 'Academic year ID is required' }, { status: 400 });
    }

    const leaveSettings = await schoolPrisma.leaveSettings.findUnique({
      where: {
        schoolId_academicYearId: {
          schoolId: session.user.schoolId,
          academicYearId,
        },
      },
    });

    // If no settings exist, return default settings
    if (!leaveSettings) {
      return NextResponse.json({
        settings: {
          schoolId: session.user.schoolId,
          academicYearId,
          autoApproveDays: 1,
          requireDocumentDays: 3,
          minStaffCoverage: null,
          examPeriodRestriction: true,
          notificationEmails: null,
          workingDays: JSON.stringify([1, 2, 3, 4, 5]), // Mon-Fri
          halfDayRules: JSON.stringify({
            enabled: true,
            countAsFullDay: false,
          }),
        },
      });
    }

    return NextResponse.json({ settings: leaveSettings });
  } catch (error) {
    console.error('Error fetching leave settings:', error);
    return NextResponse.json({ error: 'Failed to fetch leave settings' }, { status: 500 });
  }
}

// POST - Create or update leave settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      academicYearId,
      autoApproveDays,
      requireDocumentDays,
      minStaffCoverage,
      examPeriodRestriction,
      notificationEmails,
      workingDays,
      halfDayRules,
    } = body;

    // Validate required fields
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

    // Validate and convert minStaffCoverage
    let convertedMinStaffCoverage = null;
    if (minStaffCoverage !== null && minStaffCoverage !== undefined && minStaffCoverage !== '') {
      const parsed = parseInt(minStaffCoverage, 10);
      if (isNaN(parsed)) {
        return NextResponse.json({ error: 'minStaffCoverage must be a valid integer or null' }, { status: 400 });
      }
      convertedMinStaffCoverage = parsed;
    }

    const settings = await schoolPrisma.leaveSettings.upsert({
      where: {
        schoolId_academicYearId: {
          schoolId: session.user.schoolId,
          academicYearId,
        },
      },
      update: {
        autoApproveDays: autoApproveDays ?? 1,
        requireDocumentDays: requireDocumentDays ?? 3,
        minStaffCoverage: convertedMinStaffCoverage,
        examPeriodRestriction: examPeriodRestriction ?? true,
        notificationEmails: notificationEmails ? JSON.stringify(notificationEmails) : null,
        workingDays: workingDays ? JSON.stringify(workingDays) : JSON.stringify([1, 2, 3, 4, 5]),
        halfDayRules: halfDayRules ? JSON.stringify(halfDayRules) : JSON.stringify({ enabled: true, countAsFullDay: false }),
      },
      create: {
        schoolId: session.user.schoolId,
        academicYearId,
        autoApproveDays: autoApproveDays ?? 1,
        requireDocumentDays: requireDocumentDays ?? 3,
        minStaffCoverage: convertedMinStaffCoverage,
        examPeriodRestriction: examPeriodRestriction ?? true,
        notificationEmails: notificationEmails ? JSON.stringify(notificationEmails) : null,
        workingDays: workingDays ? JSON.stringify(workingDays) : JSON.stringify([1, 2, 3, 4, 5]),
        halfDayRules: halfDayRules ? JSON.stringify(halfDayRules) : JSON.stringify({ enabled: true, countAsFullDay: false }),
      },
    });

    return NextResponse.json({ settings }, { status: 201 });
  } catch (error) {
    console.error('Error updating leave settings:', error);
    return NextResponse.json({ error: 'Failed to update leave settings' }, { status: 500 });
  }
}
