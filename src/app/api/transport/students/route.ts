// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const academicYearId = searchParams.get('academicYearId');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (routeId) where.routeId = routeId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

    // Tenant isolation via student's schoolId
    const assignments = await (schoolPrisma as any).studentTransport.findMany({
      where: {
        ...where,
        student: { schoolId: ctx.schoolId }
      },
      include: {
        student: { select: { id: true, name: true, class: true, section: true, admissionNo: true, phone: true, parentPhone: true } },
        route: { select: { id: true, routeNumber: true, routeName: true, stops: true, monthlyFee: true } }
      },
      orderBy: { assignedAt: 'desc' }
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error('GET /api/transport/students:', error);
    return NextResponse.json({ error: 'Failed to fetch student transport assignments', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { studentId, routeId, pickupStop, dropStop, monthlyFee, academicYearId, generateFeeRecord } = body;

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

    const fee = monthlyFee ?? route.monthlyFee;

    const assignment = await (schoolPrisma as any).studentTransport.create({
      data: {
        studentId,
        routeId,
        pickupStop,
        dropStop: dropStop || null,
        monthlyFee: fee,
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
    if (generateFeeRecord !== false && fee > 0) {
      try {
        // Find or create a transport FeeStructure for this route
        let feeStructure = await (schoolPrisma as any).feeStructure.findFirst({
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
              frequency: 'monthly',
              dueDate: 10,
              lateFee: 0,
              description: `Monthly transport fee for route ${route.routeNumber} - ${route.routeName}`,
              applicableCategories: 'all',
              isActive: true,
              schoolId: ctx.schoolId,
              academicYearId: academicYearId || null,
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
              remarks: `Transport fee - Route ${route.routeNumber} (${pickupStop})`
            }
          });
        }
      } catch (feeErr) {
        console.error('Failed to auto-create transport FeeRecord:', feeErr);
        // Don't fail the assignment — fee record creation is best-effort
      }
    }

    return NextResponse.json({ assignment, feeRecord }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/transport/students:', error);
    return NextResponse.json({ error: 'Failed to assign student to transport', details: error.message }, { status: 500 });
  }
}
