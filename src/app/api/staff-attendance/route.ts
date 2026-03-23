import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canManageStaffAttendanceAccess, canViewStaffAttendanceAccess } from '@/lib/permissions';

function getDateValue(input: string | null) {
  return input || new Date().toISOString().split('T')[0];
}

function parseAttendanceDate(date: string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET - List staff attendance records
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = getDateValue(searchParams.get('date'));
  const startDate = getDateValue(searchParams.get('startDate'));
  const endDate = getDateValue(searchParams.get('endDate'));
  const status = searchParams.get('status') || '';
  const teacherId = searchParams.get('teacherId') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '25');

  const { ctx, error } = await getSessionContext();
  if (error) return error;

  if (!canViewStaffAttendanceAccess(ctx)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : tenantWhere(ctx);

    // Build where clause
    const where: Record<string, unknown> = {
      ...schoolFilter,
    };

    // Handle single date vs date range
    if (startDate && endDate) {
      // Date range query for history
      where.attendanceDate = {
        gte: parseAttendanceDate(startDate),
        lte: parseAttendanceDate(endDate),
      };
    } else if (date) {
      // Single date query (existing behavior)
      where.attendanceDate = parseAttendanceDate(date);
    }

    if (status) where.status = status;
    if (teacherId) where.teacherId = teacherId;

    const skip = (page - 1) * pageSize;

    // Fetch attendance records, leave records, and teachers
    const [records, leaveApplications, teachers] = await Promise.all([
      (schoolPrisma as any).staffAttendanceRecord.findMany({
        where,
        orderBy: [{ attendanceDate: 'desc' }, { createdAt: 'desc' }],
      }),
      // Fetch approved leave applications for the same date range
      (startDate && endDate ? (schoolPrisma as any).leaveApplication.findMany({
        where: {
          ...schoolFilter,
          status: 'approved',
          startDate: { lte: parseAttendanceDate(endDate) },
          endDate: { gte: parseAttendanceDate(startDate) },
        },
        include: {
          leaveType: {
            select: {
              id: true,
              name: true,
              code: true,
              isPaid: true,
            },
          },
        },
        orderBy: [{ startDate: 'desc' }],
      }) : Promise.resolve([])),
      (schoolPrisma as any).teacher.findMany({
        where: schoolFilter,
        select: {
          id: true,
          name: true,
          employeeId: true,
          designation: true,
          department: true,
        },
      }),
    ]);

    // Create teacher lookup map
    const teacherMap = new Map();
    teachers.forEach((teacher: any) => {
      teacherMap.set(teacher.id, teacher);
    });

    // Convert leave applications to attendance-like records
    const leaveRecords = [];
    for (const leave of leaveApplications) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      
      // Create a record for each day of the leave
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip if outside the requested date range
        if (startDate && dateStr < startDate) continue;
        if (endDate && dateStr > endDate) continue;
        
        leaveRecords.push({
          id: `leave-${leave.id}-${dateStr}`,
          teacherId: leave.staffId,
          attendanceDate: new Date(dateStr),
          status: 'on_leave',
          remarks: `${leave.leaveType.name} - ${leave.totalDays} day(s)`,
          source: 'leave',
          checkInAt: null,
          checkOutAt: null,
          workMinutes: null,
          markedBy: leave.approverId,
          markedByRole: 'system',
          leaveType: leave.leaveType,
          leaveApplicationId: leave.id,
          createdAt: leave.createdAt,
          updatedAt: leave.updatedAt,
        });
      }
    }

    // Combine attendance and leave records
    const allRecords = [...records, ...leaveRecords];
    
    // Sort by date descending
    allRecords.sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime());
    
    // Apply pagination
    const paginatedRecords = allRecords.slice(skip, skip + pageSize);
    
    // Attach teacher data to records
    const recordsWithTeacher = paginatedRecords.map((record: any) => ({
      ...record,
      teacher: teacherMap.get(record.teacherId) || null,
    }));

    const total = allRecords.length;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      records: recordsWithTeacher,
      total,
      page,
      pageSize,
      totalPages,
      attendanceDate: date,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('GET /api/staff-attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch staff attendance records' }, { status: 500 });
  }
}

// POST - Create/update staff attendance records
export async function POST(request: NextRequest) {
  const { ctx, error } = await getSessionContext();
  if (error) return error;

  const body = await request.json();
  const { records, selfSubmit = false } = body;

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'records array is required' }, { status: 400 });
  }

  // Check permissions
  const isSuperAdmin = ctx.role === 'super_admin';
  const isStaff = ctx.role === 'staff';
  const canManageStaff = canManageStaffAttendanceAccess(ctx);

  // Staff can only submit their own attendance
  if (selfSubmit && isStaff) {
    if (records.length !== 1 || records[0].teacherId !== ctx.userId) {
      return NextResponse.json({ error: 'Staff can only submit their own attendance' }, { status: 403 });
    }
  } else if (!canManageStaff && !selfSubmit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
  const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : tenantWhere(ctx);
  const attendanceDate = parseAttendanceDate(records[0].date);

  // Check for approved leaves for all staff members
  const teacherIds = records.map(r => r.teacherId);
  const approvedLeaves = await (schoolPrisma as any).leaveApplication.findMany({
    where: {
      ...schoolFilter,
      staffId: { in: teacherIds },
      status: 'approved',
      startDate: { lte: attendanceDate },
      endDate: { gte: attendanceDate },
    },
    select: {
      staffId: true,
      leaveType: { select: { name: true, code: true } },
      startDate: true,
      endDate: true,
    },
  });

  // Create a map of approved leaves
  const leaveMap = new Map<string, any>();
  approvedLeaves.forEach((leave: any) => {
    leaveMap.set(leave.staffId, leave);
  });

  // Validate that no staff member has approved leave
  const conflicts = records.filter(record => leaveMap.has(record.teacherId));
  if (conflicts.length > 0) {
    const conflictDetails = conflicts.map(conflict => {
      const leave = leaveMap.get(conflict.teacherId);
      return `Staff member has approved leave: ${leave.leaveType.name} (${leave.startDate} to ${leave.endDate})`;
    });
    return NextResponse.json({ 
      error: 'Cannot mark attendance for staff with approved leave', 
      conflicts: conflictDetails 
    }, { status: 409 });
  }

  const results = await Promise.all(
    records.map(async (record: any) => {
      const { teacherId, date, status, remarks, checkInAt, checkOutAt } = record;

      if (!teacherId || !date || !status) {
        throw new Error('teacherId, date, and status are required');
      }

      // Check if attendance is already locked (for non-super-admin edits)
      if (!isSuperAdmin) {
        const existingRecord = await (schoolPrisma as any).staffAttendanceRecord.findFirst({
          where: {
            teacherId,
            attendanceDate: parseAttendanceDate(date),
            isLocked: true,
          },
        });

        if (existingRecord) {
          return {
            success: false,
            error: `Attendance for ${date} is locked and cannot be modified`,
            teacherId,
            date,
          };
        }
      }

      // Create attendance session key
      const attendanceSessionKey = [
        ctx.schoolId || 'school',
        'staff',
        teacherId,
        date,
      ].join(':');

      const result = await (schoolPrisma as any).staffAttendanceRecord.upsert({
        where: {
          teacherId_attendanceDate: {
            teacherId,
            attendanceDate: parseAttendanceDate(date),
          },
        },
        update: {
          status,
          remarks,
          checkInAt: checkInAt ? new Date(checkInAt) : null,
          checkOutAt: checkOutAt ? new Date(checkOutAt) : null,
          markedBy: ctx.userId,
          markedByRole: ctx.role,
          attendanceSessionKey,
          schoolId: ctx.schoolId || undefined,
          isLocked: selfSubmit, // Lock attendance when staff submits it themselves
          submittedAt: selfSubmit ? new Date() : undefined,
        },
        create: {
          teacherId,
          attendanceDate: parseAttendanceDate(date),
          status,
          remarks,
          checkInAt: checkInAt ? new Date(checkInAt) : null,
          checkOutAt: checkOutAt ? new Date(checkOutAt) : null,
          markedBy: ctx.userId,
          markedByRole: ctx.role,
          attendanceSessionKey,
          schoolId: ctx.schoolId || undefined,
          isLocked: selfSubmit, // Lock attendance when staff submits it themselves
          submittedAt: selfSubmit ? new Date() : undefined,
        },
      });

      return {
        success: true,
        result,
        teacherId,
        date,
        isLocked: selfSubmit,
      };
    })
  );

  // Check for any failed operations
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    return NextResponse.json({ 
      error: 'Some operations failed', 
      failures 
    }, { status: 400 });
  }

  return NextResponse.json({ 
    message: `Saved ${results.length} attendance records successfully`,
    records: results,
    lockedCount: results.filter(r => r.isLocked).length,
  });
  } catch (error: any) {
    console.error('POST /api/staff-attendance:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save staff attendance records' 
    }, { status: 500 });
  }
}
