// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { sendAssignmentConfirmation } from '@/lib/transportNotifications';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const academicYearId = searchParams.get('academicYearId');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search');

    const where: any = { student: { schoolId: ctx.schoolId } };
    if (routeId) where.routeId = routeId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (isActive !== null && isActive !== undefined && isActive !== '') where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { admissionNo: { contains: search, mode: 'insensitive' } } },
        { pickupStop: { contains: search, mode: 'insensitive' } },
        { route: { routeNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Optimized batch query
    const [assignments, totalCount] = await Promise.all([
      (schoolPrisma as any).studentTransport.findMany({
        where,
        select: {
          id: true,
          studentId: true,
          routeId: true,
          pickupStop: true,
          dropStop: true,
          monthlyFee: true,
          isActive: true,
          assignedAt: true,
          student: { select: { id: true, name: true, class: true, section: true, admissionNo: true } },
          route: { select: { id: true, routeNumber: true, routeName: true } }
        },
        orderBy: { assignedAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize
      }),
      (schoolPrisma as any).studentTransport.count({ where })
    ]);

    return NextResponse.json({ 
      assignments,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error: any) {
    console.error('GET /api/transport/students:', error);
    return NextResponse.json({ error: 'Failed to fetch transport assignments', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }

    const body = await request.json();
    const { studentId, routeId, pickupStop, dropStop, monthlyFee, yearlyFee, annualFee, academicYearId, generateFeeRecord } = body;

    if (!studentId || !routeId || !pickupStop) {
      return NextResponse.json({ error: 'studentId, routeId, pickupStop are required' }, { status: 400 });
    }

    // Verify student belongs to this school
    const student = await (schoolPrisma as any).student.findFirst({
      where: { id: studentId, schoolId: ctx.schoolId }
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // Verify route belongs to this school
    const route = await (schoolPrisma as any).transportRoute.findFirst({
      where: { id: routeId, schoolId: ctx.schoolId }
    });
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

    // Deactivate existing assignment if any
    await (schoolPrisma as any).studentTransport.updateMany({
      where: { studentId, isActive: true },
      data: { isActive: false }
    });

    const effectiveMonthlyFee = Number(monthlyFee ?? route.monthlyFee ?? 0);
    const effectiveYearlyFee = Number(yearlyFee ?? route.yearlyFee ?? 0);
    const fee = Number(annualFee || 0) > 0
      ? Number(annualFee)
      : effectiveYearlyFee > 0
        ? effectiveYearlyFee
        : effectiveMonthlyFee;
    const feeFrequency = effectiveYearlyFee > 0 || Number(annualFee || 0) > 0 ? 'yearly' : 'monthly';

    const assignment = await (schoolPrisma as any).studentTransport.create({
      data: {
        studentId,
        routeId,
        pickupStop,
        dropStop: dropStop || null,
        monthlyFee: effectiveMonthlyFee,
        academicYearId: academicYearId || null,
        isActive: true,
      },
      include: {
        student: { select: { id: true, name: true, class: true, admissionNo: true } },
        route: { select: { id: true, routeNumber: true, routeName: true } }
      }
    });

    // Update student's transport fields for backward compat
    await (schoolPrisma as any).student.update({
      where: { id: studentId },
      data: { transport: 'Yes', transportRoute: route.routeName }
    });

    // Auto-generate transport FeeRecord if requested or fee > 0
    let feeRecord = null;
    let feeStructure = null;
    if (generateFeeRecord !== false && fee > 0) {
      try {
        feeStructure = await (schoolPrisma as any).feeStructure.findFirst({
          where: {
            schoolId: ctx.schoolId,
            category: 'transport',
            name: `Transport - ${route.routeName}`,
            ...(academicYearId ? { academicYearId } : {}),
          }
        });

        if (!feeStructure) {
          feeStructure = await (schoolPrisma as any).feeStructure.create({
            data: {
              name: `Transport - ${route.routeName}`,
              category: 'transport',
              amount: fee,
              frequency: feeFrequency,
              dueDate: 10,
              lateFee: 0,
              description: `${feeFrequency === 'yearly' ? 'Annual' : 'Monthly'} transport fee for route ${route.routeNumber} - ${route.routeName}`,
              applicableCategories: 'all',
              isActive: true,
              schoolId: ctx.schoolId,
              academicYearId: academicYearId || null,
            }
          });
        } else if (Number(feeStructure.amount || 0) !== fee || feeStructure.frequency !== feeFrequency) {
          feeStructure = await (schoolPrisma as any).feeStructure.update({
            where: { id: feeStructure.id },
            data: {
              amount: fee,
              frequency: feeFrequency,
              description: `${feeFrequency === 'yearly' ? 'Annual' : 'Monthly'} transport fee for route ${route.routeNumber} - ${route.routeName}`,
            }
          });
        }

        // Create FeeRecord (reuses existing fee infrastructure — collection, receipts, arrears all work automatically)
        const academicYearLabel = student.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2);
        const existingFeeRecord = await (schoolPrisma as any).feeRecord.findFirst({
          where: { studentId, feeStructureId: feeStructure.id, academicYear: academicYearLabel }
        });

        if (!existingFeeRecord) {
          const dueDate = new Date();
          dueDate.setDate(10);
          feeRecord = await (schoolPrisma as any).feeRecord.create({
            data: {
              studentId,
              feeStructureId: feeStructure.id,
              amount: fee,
              paidAmount: 0,
              pendingAmount: fee,
              discount: 0,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'pending',
              academicYear: academicYearLabel,
              receiptNumber: `TRNSP-${Date.now()}-${studentId.slice(-4)}`,
              remarks: `${feeFrequency === 'yearly' ? 'Annual' : 'Monthly'} transport fee - Route ${route.routeNumber} (${pickupStop})`
            }
          });
        }
      } catch (feeErr) {
        console.error('Failed to auto-create transport FeeRecord:', feeErr);
        // Don't fail the assignment — fee record creation is best-effort
      }
    }

    // Send assignment confirmation notification (async, don't wait)
    const academicYearLabel = student.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2);
    sendAssignmentConfirmation({
      studentId,
      routeId,
      academicYear: academicYearLabel,
      schoolId: ctx.schoolId!
    }).catch(err => console.error('Failed to send assignment confirmation:', err));

    return NextResponse.json({ 
      assignment, 
      feeStructure,
      feeRecord,
      message: 'Student assigned to transport successfully. Confirmation email sent to parent.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/transport/students:', error);
    return NextResponse.json({ error: 'Failed to assign student to transport', details: error.message }, { status: 500 });
  }
}

// Batch assign multiple students to routes
export async function PUT(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }

    const body = await request.json();
    const { assignments, generateFeeRecords = true } = body; // assignments: [{ studentId, routeId, pickupStop, dropStop, monthlyFee }]

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ error: 'Assignments array is required' }, { status: 400 });
    }

    if (assignments.length > 1000) {
      return NextResponse.json({ error: 'Cannot process more than 1000 assignments at once' }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] as any[] };
    const db = schoolPrisma as any;

    // Pre-fetch data to avoid N+1 queries
    const studentIds = assignments.map(a => a.studentId);
    const routeIds = [...new Set(assignments.map(a => a.routeId))];
    
    const [students, routes, existingFeeStructures] = await Promise.all([
      db.student.findMany({ 
        where: { id: { in: studentIds }, schoolId: ctx.schoolId },
        select: { id: true, name: true, academicYear: true, admissionNo: true }
      }),
      db.transportRoute.findMany({ 
        where: { id: { in: routeIds }, schoolId: ctx.schoolId },
        select: { id: true, routeNumber: true, routeName: true, monthlyFee: true }
      }),
      generateFeeRecords ? db.feeStructure.findMany({
        where: { 
          schoolId: ctx.schoolId,
          category: 'transport',
          name: { in: routes.map(r => `Transport - ${r.routeName}`) }
        }
      }) : []
    ]);

    const studentMap = new Map(students.map(s => [s.id, s]));
    const routeMap = new Map(routes.map(r => [r.id, r]));
    const feeStructureMap = new Map(existingFeeStructures.map(fs => [fs.name, fs]));

    // Process assignments in batches
    const batchSize = 100;
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      
      for (const assignment of batch) {
        try {
          const student = studentMap.get(assignment.studentId);
          const route = routeMap.get(assignment.routeId);
          
          if (!student || !route) {
            results.failed++;
            results.errors.push({ 
              assignment, 
              error: 'Student or route not found' 
            });
            continue;
          }

          // Deactivate existing assignments
          await db.studentTransport.updateMany({
            where: { studentId: assignment.studentId, isActive: true },
            data: { isActive: false }
          });

          // Create new assignment
          await db.studentTransport.create({
            data: {
              studentId: assignment.studentId,
              routeId: assignment.routeId,
              pickupStop: assignment.pickupStop,
              dropStop: assignment.dropStop || null,
              monthlyFee: Number(assignment.monthlyFee) || route.monthlyFee,
              academicYearId: assignment.academicYearId || null,
              isActive: true
            }
          });

          // Update student transport fields
          await db.student.update({
            where: { id: assignment.studentId },
            data: { transport: 'Yes', transportRoute: route.routeName }
          });

          // Generate fee record if requested
          if (generateFeeRecords) {
            const feeStructureName = `Transport - ${route.routeName}`;
            let feeStructure = feeStructureMap.get(feeStructureName);

            if (!feeStructure) {
              feeStructure = await db.feeStructure.create({
                data: {
                  name: feeStructureName,
                  category: 'transport',
                  amount: route.monthlyFee,
                  frequency: 'monthly',
                  dueDate: 10,
                  lateFee: 0,
                  description: `Monthly transport fee for route ${route.routeNumber} - ${route.routeName}`,
                  applicableCategories: 'all',
                  isActive: true,
                  schoolId: ctx.schoolId,
                  academicYearId: assignment.academicYearId || null
                }
              });
            }

            const academicYearLabel = student.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2);
            const existingFeeRecord = await db.feeRecord.findFirst({
              where: { studentId: assignment.studentId, feeStructureId: feeStructure.id, academicYear: academicYearLabel }
            });

            if (!existingFeeRecord) {
              await db.feeRecord.create({
                data: {
                  studentId: assignment.studentId,
                  feeStructureId: feeStructure.id,
                  amount: route.monthlyFee,
                  paidAmount: 0,
                  pendingAmount: route.monthlyFee,
                  dueDate: new Date(new Date().getFullYear(), 3, 10).toISOString().split('T')[0],
                  status: 'pending',
                  academicYear: academicYearLabel,
                  receiptNumber: `TRNSP-${academicYearLabel}-${student.admissionNo}-${Date.now()}`,
                  remarks: `Batch transport assignment - Route ${route.routeNumber}`
                }
              });
            }
          }

          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push({ 
            assignment, 
            error: err.message 
          });
        }
      }
    }

    return NextResponse.json({ 
      message: `Processed ${assignments.length} assignments`,
      results 
    });
  } catch (error: any) {
    console.error('PUT /api/transport/students (batch):', error);
    return NextResponse.json({ error: 'Failed to process batch assignments', details: error.message }, { status: 500 });
  }
}
