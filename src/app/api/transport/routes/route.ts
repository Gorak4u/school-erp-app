// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const { ctx, error } = await getSessionContext();
  if (error) return error;
  if (!ctx.schoolId) {
    return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
  }
  try {

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const academicYearId = searchParams.get('academicYearId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const includeStudents = searchParams.get('includeStudents') === 'true';

    const where: any = { schoolId: ctx.schoolId };
    if (isActive !== null && isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    if (academicYearId) where.academicYearId = academicYearId;

    // Optimized query without N+1 problem
    const [routes, totalCount] = await Promise.all([
      (schoolPrisma as any).transportRoute.findMany({
        where,
        include: {
          vehicle: true,
          ...(includeStudents && {
            students: {
              where: { isActive: true },
              select: { 
                id: true, 
                studentId: true,
                pickupStop: true,
                monthlyFee: true
              },
              take: 10 // Limit student preview per route
            }
          })
        },
        orderBy: { routeNumber: 'asc' },
        take: pageSize,
        skip: (page - 1) * pageSize
      }),
      (schoolPrisma as any).transportRoute.count({ where })
    ]);

    // If students are included, fetch them in batches to avoid N+1
    let routesWithStudents = routes;
    if (includeStudents) {
      const studentIds = routes.flatMap(r => r.students?.map(s => s.studentId) || []);
      const uniqueStudentIds = [...new Set(studentIds)];
      
      if (uniqueStudentIds.length > 0) {
        const students = await (schoolPrisma as any).student.findMany({
          where: { id: { in: uniqueStudentIds } },
          select: { id: true, name: true, class: true, section: true, admissionNo: true }
        });
        const studentMap = new Map(students.map(s => [s.id, s]));
        
        routesWithStudents = routes.map(route => ({
          ...route,
          students: route.students?.map(st => ({
            ...st,
            student: studentMap.get(st.studentId)
          })).filter(st => st.student) || []
        }));
      }
    }

    return NextResponse.json({ 
      routes: routesWithStudents,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error: any) {
    console.error('GET /api/transport/routes:', error);
    return NextResponse.json({ error: 'Failed to fetch transport routes', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await getSessionContext();
  if (error) return error;
  if (!ctx.schoolId) {
    return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
  }
  try {

    const body = await request.json();
    const { routeNumber, routeName, description, stops, vehicleId, driverName, driverPhone, capacity, monthlyFee, academicYearId, isActive } = body;

    if (!routeNumber || !routeName) {
      return NextResponse.json({ error: 'routeNumber and routeName are required' }, { status: 400 });
    }

    const existing = await (schoolPrisma as any).transportRoute.findFirst({
      where: { routeNumber, schoolId: ctx.schoolId }
    });
    if (existing) {
      return NextResponse.json({ error: `Route number '${routeNumber}' already exists` }, { status: 400 });
    }

    const route = await (schoolPrisma as any).transportRoute.create({
      data: {
        routeNumber,
        routeName,
        description: description || null,
        stops: stops ? JSON.stringify(stops) : '[]',
        vehicleId: vehicleId || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        capacity: capacity ?? 40,
        monthlyFee: monthlyFee ?? 0,
        isActive: isActive ?? true,
        schoolId: ctx.schoolId,
        academicYearId: academicYearId || null,
      },
      include: { vehicle: true }
    });

    return NextResponse.json({ route }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/transport/routes:', error);
    return NextResponse.json({ error: 'Failed to create transport route', details: error.message }, { status: 500 });
  }
}
