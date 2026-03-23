import { NextRequest, NextResponse } from 'next/server';
import { projectStaffAttendanceForDate } from '@/lib/staffAttendanceProjection';

function getDefaultDate() {
  return new Date().toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await projectStaffAttendanceForDate({
      date: body?.date || getDefaultDate(),
      schoolId: body?.schoolId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('POST /api/cron/project-staff-attendance:', error);
    return NextResponse.json({ error: 'Failed to project staff attendance' }, { status: 500 });
  }
}
