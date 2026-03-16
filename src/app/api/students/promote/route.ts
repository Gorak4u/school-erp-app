// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getStudentsByClass(fromClass: string, fromSection: string | null, schoolId: string) {
  const where: any = { class: fromClass, status: 'active', schoolId };
  if (fromSection) where.section = fromSection;
  return (schoolPrisma as any).student.findMany({ where, select: { id: true, name: true, class: true, section: true, academicYear: true, admissionNo: true } });
}

async function updateStudentStatus(
  studentIds: string[],
  statusPayload: {
    action: 'promote' | 'exit' | 'graduate';  // promote, exit, or graduate
    toClass?: string;
    toSection?: string;
    toAcademicYear?: string;
    toAcademicYearId?: string;  // FK id of the target AY (for promote only)
    promotionType?: string;
    remarks: string;
    updatedBy: string;
    updatedByEmail: string;
    updatedByName: string;
    schoolId: string;
    detainedApplyFees?: boolean;
  }
) {
  const results = { updated: [] as any[], failed: [] as any[], totalArrears: 0 };

  for (const studentId of studentIds) {
    try {
      const student = await (schoolPrisma as any).student.findUnique({
        where: { id: studentId },
        include: {
          feeRecords: {
            where: { status: { in: ['pending', 'partial'] } },
            select: { id: true, amount: true, paidAmount: true, pendingAmount: true, discount: true, dueDate: true, academicYear: true, feeStructureId: true }
          }
        }
      });

      if (!student) {
        results.failed.push({ studentId, reason: 'Student not found' });
        continue;
      }

      // Check if already promoted this year
      let existingPromotion = null;
      try {
        existingPromotion = await (schoolPrisma as any).studentPromotion.findFirst({
          where: {
            studentId,
            fromAcademicYear: student.academicYear,
            toAcademicYear: promotionPayload.toAcademicYear,
            schoolId: promotionPayload.schoolId
          }
        });
      } catch (promotionCheckErr) {
        console.warn('StudentPromotion table check failed, skipping duplicate check:', promotionCheckErr);
        // Continue without duplicate check if table doesn't exist
      }

      if (existingPromotion) {
        results.failed.push({ studentId, studentName: student.name, reason: `Already promoted from ${student.academicYear} to ${promotionPayload.toAcademicYear}` });
        continue;
      }

      const unpaidFees = student.feeRecords;
      const totalArrears = unpaidFees.reduce((sum: number, f: any) => sum + (f.pendingAmount || 0), 0);
      const db = schoolPrisma as any;

      // Handle different actions
      if (statusPayload.action === 'promote') {
        // 1. Create FeeArrears for unpaid fees
        for (const fee of unpaidFees) {
          await db.feeArrears.create({
            data: {
              schoolId: statusPayload.schoolId,
              studentId,
              originalFeeRecordId: fee.id,
              fromAcademicYear: fee.academicYear || student.academicYear,
              toAcademicYear: statusPayload.toAcademicYear!,
              amount: fee.amount,
              paidAmount: fee.paidAmount || 0,
              pendingAmount: fee.pendingAmount || 0,
              dueDate: fee.dueDate,
              status: fee.paidAmount > 0 ? 'partial' : 'pending',
              remarks: `Arrears from ${fee.academicYear || student.academicYear} - ${student.class} ${student.section || ''}`
            }
          });
        }

        // 2. Update student record — set academicYearId so the lock is cleared
        await db.student.update({
          where: { id: studentId },
          data: {
            class: statusPayload.toClass,
            section: statusPayload.toSection,
            academicYear: statusPayload.toAcademicYear,
            academicYearId: statusPayload.toAcademicYearId,
            status: 'active',
          }
        });

        // 3. Create promotion audit record
        try {
          await db.studentPromotion.create({
            data: {
              schoolId: statusPayload.schoolId,
              studentId,
              fromClass: student.class,
              toClass: statusPayload.toClass!,
              fromSection: student.section,
              toSection: statusPayload.toSection,
              fromAcademicYear: student.academicYear,
              toAcademicYear: statusPayload.toAcademicYear!,
              promotedBy: statusPayload.updatedBy,
              promotedByEmail: statusPayload.updatedByEmail,
              promotedByName: statusPayload.updatedByName,
              promotionType: statusPayload.promotionType,
              arrearsAmount: totalArrears,
              remarks: statusPayload.remarks || null
            }
          });
        } catch (auditErr) {
          console.warn('Failed to create promotion audit record:', auditErr);
        }

        // 4. Auto-apply new academic year fee structures for new class
        const shouldApplyFees = statusPayload.promotionType === 'detained'
          ? statusPayload.detainedApplyFees
          : true;

        if (shouldApplyFees) {
          try {
            const newAcademicYear = await db.academicYear.findFirst({
              where: { year: statusPayload.toAcademicYear }
            });

            if (newAcademicYear) {
              const newClassRecord = await db.class.findFirst({
                where: { name: statusPayload.toClass, academicYearId: newAcademicYear.id, isActive: true }
              });

              const feeStructureWhere: any = { isActive: true, academicYearId: newAcademicYear.id };
              if (newClassRecord) feeStructureWhere.classId = newClassRecord.id;

              const newFeeStructures = await db.feeStructure.findMany({ where: feeStructureWhere });

              const currentYear = new Date().getFullYear();
              for (const structure of newFeeStructures) {
                const cats = structure.applicableCategories || 'all';
                const categoryMatch = cats === 'all' || cats.includes(student.category || 'General');
                if (!categoryMatch) continue;

                const existingRecord = await db.feeRecord.findFirst({
                  where: { studentId, feeStructureId: structure.id, academicYear: statusPayload.toAcademicYear }
                });
                if (existingRecord) continue;

                await db.feeRecord.create({
                  data: {
                    studentId,
                    feeStructureId: structure.id,
                    amount: structure.amount,
                    paidAmount: 0,
                    pendingAmount: structure.amount,
                    dueDate: new Date(currentYear, 3, structure.dueDate || 1).toISOString().split('T')[0],
                    status: 'pending',
                    academicYear: statusPayload.toAcademicYear,
                    receiptNumber: `FEE-${statusPayload.toAcademicYear}-${student.admissionNo}-${structure.name.replace(/\s/g, '').toUpperCase().slice(0, 8)}-${Date.now()}`,
                    remarks: `Auto-applied on promotion to ${statusPayload.toClass}`
                  }
                });
              }
            }
          } catch (feeErr) {
            console.error(`Fee auto-apply failed for student ${studentId}:`, feeErr);
          }
        }

        // 5. Handle transport route assignment for new AY
        try {
          // Check if student has active transport
          const activeTransport = await db.studentTransport.findFirst({
            where: { studentId, isActive: true },
            include: { route: true }
          });

          if (activeTransport && activeTransport.route) {
            // Deactivate old transport assignment
            await db.studentTransport.updateMany({
              where: { studentId, isActive: true },
              data: { isActive: false }
            });

            // Check if route exists in target AY
            const routeInTargetAY = await db.transportRoute.findFirst({
              where: {
                routeNumber: activeTransport.route.routeNumber,
                academicYearId: statusPayload.toAcademicYearId,
                schoolId: statusPayload.schoolId,
                isActive: true
              }
            });

            if (routeInTargetAY) {
              // Auto-assign to route in new AY
              const newAssignment = await db.studentTransport.create({
                data: {
                  studentId,
                  routeId: routeInTargetAY.id,
                  pickupStop: activeTransport.pickupStop,
                  dropStop: activeTransport.dropStop,
                  monthlyFee: routeInTargetAY.monthlyFee,
                  academicYearId: statusPayload.toAcademicYearId,
                  isActive: true
                }
              });

              // Create transport FeeStructure if doesn't exist
              let transportFeeStructure = await db.feeStructure.findFirst({
                where: {
                  schoolId: statusPayload.schoolId,
                  category: 'transport',
                  name: `Transport - ${routeInTargetAY.routeName}`,
                  academicYearId: statusPayload.toAcademicYearId
                }
              });

              if (!transportFeeStructure) {
                transportFeeStructure = await db.feeStructure.create({
                  data: {
                    name: `Transport - ${routeInTargetAY.routeName}`,
                    category: 'transport',
                    amount: routeInTargetAY.monthlyFee,
                    frequency: 'monthly',
                    dueDate: 10,
                    lateFee: 0,
                    description: `Monthly transport fee for route ${routeInTargetAY.routeNumber} - ${routeInTargetAY.routeName}`,
                    applicableCategories: 'all',
                    isActive: true,
                    schoolId: statusPayload.schoolId,
                    academicYearId: statusPayload.toAcademicYearId
                  }
                });
              }

              // Create transport FeeRecord
              const existingTransportFee = await db.feeRecord.findFirst({
                where: { studentId, feeStructureId: transportFeeStructure.id, academicYear: statusPayload.toAcademicYear }
              });

              if (!existingTransportFee) {
                await db.feeRecord.create({
                  data: {
                    studentId,
                    feeStructureId: transportFeeStructure.id,
                    amount: routeInTargetAY.monthlyFee,
                    paidAmount: 0,
                    pendingAmount: routeInTargetAY.monthlyFee,
                    dueDate: new Date(currentYear, 3, 10).toISOString().split('T')[0],
                    status: 'pending',
                    academicYear: statusPayload.toAcademicYear,
                    receiptNumber: `TRNSP-${statusPayload.toAcademicYear}-${student.admissionNo}-${Date.now()}`,
                    remarks: `Auto-applied transport fee on promotion - Route ${routeInTargetAY.routeNumber}`
                  }
                });
              }
            } else {
              // Route doesn't exist in target AY - update student transport field
              await db.student.update({
                where: { id: studentId },
                data: { transport: 'No', transportRoute: null }
              });
            }
          }
        } catch (transportErr) {
          console.error(`Transport auto-assign failed for student ${studentId}:`, transportErr);
        }

        results.updated.push({ studentId, studentName: student.name, action: 'promote', fromClass: student.class, toClass: statusPayload.toClass, arrearsAmount: totalArrears });
        results.totalArrears += totalArrears;

      } else if (statusPayload.action === 'exit') {
        // Mark student as exited
        await db.student.update({
          where: { id: studentId },
          data: {
            status: 'exited',
            exitDate: new Date().toISOString(),
            exitReason: statusPayload.remarks || 'Student exited'
          }
        });

        results.updated.push({ studentId, studentName: student.name, action: 'exit', fromClass: student.class, arrearsAmount: totalArrears });
        results.totalArrears += totalArrears;

      } else if (statusPayload.action === 'graduate') {
        // Mark student as graduated
        await db.student.update({
          where: { id: studentId },
          data: {
            status: 'graduated',
            graduationDate: new Date().toISOString(),
            graduationRemark: statusPayload.remarks || 'Student graduated'
          }
        });

        results.updated.push({ studentId, studentName: student.name, action: 'graduate', fromClass: student.class, arrearsAmount: totalArrears });
        results.totalArrears += totalArrears;
      }
    } catch (err: any) {
      console.error(`Promotion failed for student ${studentId}:`, err);
      results.failed.push({ studentId, reason: err.message });
    }
  }

  return results;
}

// ─── POST /api/students/promote ──────────────────────────────────────────────
// Handles: single student, bulk selection, entire class
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can promote students' }, { status: 403 });
    }

    const body = await request.json();
    const {
      mode,              // "single" | "bulk" | "class"
      action = 'promote', // "promote" | "exit" | "graduate"
      studentId,         // for mode=single
      studentIds,        // for mode=bulk
      fromClass,         // for mode=class
      fromSection,       // for mode=class (optional)
      toClass,
      toSection,
      toAcademicYear,
      promotionType = 'regular',
      remarks = '',
      detainedApplyFees = false,
      skipTransportCheck = false  // User confirmed to proceed without transport routes
    } = body;

    // Validate action
    if (!['promote', 'exit', 'graduate'].includes(action)) {
      return NextResponse.json({ error: 'action must be promote, exit, or graduate' }, { status: 400 });
    }

    // Validate required fields based on action
    if (action === 'promote') {
      if (!toClass || !toAcademicYear) {
        return NextResponse.json({ error: 'toClass and toAcademicYear are required for promote action' }, { status: 400 });
      }
    }

    // Validate target academic year exists (only for promote)
    let targetAcademicYear = null;
    if (action === 'promote') {
      targetAcademicYear = await (schoolPrisma as any).academicYear.findFirst({
        where: { year: toAcademicYear }
      });
      if (!targetAcademicYear) {
        return NextResponse.json({ error: `Academic year ${toAcademicYear} not found. Please create it in Settings first.` }, { status: 400 });
      }
    }

    // Resolve student IDs based on mode FIRST
    let targetStudentIds: string[] = [];

    if (mode === 'single') {
      if (!studentId) return NextResponse.json({ error: 'studentId is required for single mode' }, { status: 400 });
      targetStudentIds = [studentId];
    } else if (mode === 'bulk') {
      if (!studentIds?.length) return NextResponse.json({ error: 'studentIds are required for bulk mode' }, { status: 400 });
      targetStudentIds = studentIds;
    } else if (mode === 'class') {
      if (!fromClass) return NextResponse.json({ error: 'fromClass is required for class mode' }, { status: 400 });
      const classStudents = await getStudentsByClass(fromClass, fromSection || null, ctx.schoolId!);
      targetStudentIds = classStudents.map((s: any) => s.id);
      if (targetStudentIds.length === 0) {
        return NextResponse.json({ error: `No active students found in class ${fromClass}${fromSection ? ` section ${fromSection}` : ''}` }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'mode must be single, bulk, or class' }, { status: 400 });
    }

    // Verify all students belong to this school
    if (ctx.schoolId) {
      const validStudents = await (schoolPrisma as any).student.findMany({
        where: { id: { in: targetStudentIds }, schoolId: ctx.schoolId },
        select: { id: true }
      });
      const validIds = new Set(validStudents.map((s: any) => s.id));
      targetStudentIds = targetStudentIds.filter(id => validIds.has(id));
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json({ error: 'No valid students to promote' }, { status: 400 });
    }

    // Check transport routes for students using transport (only for promote)
    if (action === 'promote' && !skipTransportCheck) {
      // Get students with active transport assignments
      const studentsWithTransport = await (schoolPrisma as any).student.findMany({
        where: {
          id: { in: targetStudentIds },
          schoolId: ctx.schoolId,
          transport: 'Yes'
        },
        include: {
          transportAssignments: {
            where: { isActive: true },
            include: { route: true }
          }
        }
      });

      if (studentsWithTransport.length > 0) {
        // Check if routes exist in target AY
        const routeNumbers = [...new Set(studentsWithTransport.flatMap((s: any) => 
          s.transportAssignments.map((ta: any) => ta.route?.routeNumber).filter(Boolean)
        ))];

        if (routeNumbers.length > 0) {
          const routesInTargetAY = await (schoolPrisma as any).transportRoute.findMany({
            where: {
              routeNumber: { in: routeNumbers },
              academicYearId: targetAcademicYear?.id,
              schoolId: ctx.schoolId,
              isActive: true
            }
          });

          const foundRouteNumbers = new Set(routesInTargetAY.map((r: any) => r.routeNumber));
          const missingRoutes = routeNumbers.filter(rn => !foundRouteNumbers.has(rn));

          if (missingRoutes.length > 0) {
            const affectedStudents = studentsWithTransport.filter((s: any) => 
              s.transportAssignments.some((ta: any) => missingRoutes.includes(ta.route?.routeNumber))
            );

            return NextResponse.json({
              error: 'TRANSPORT_ROUTES_NOT_FOUND',
              message: `${missingRoutes.length} transport route(s) not configured for ${toAcademicYear}`,
              details: {
                missingRoutes,
                affectedStudentCount: affectedStudents.length,
                affectedStudents: affectedStudents.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  admissionNo: s.admissionNo,
                  currentRoute: s.transportAssignments[0]?.route?.routeNumber
                })),
                instruction: `Please configure these routes for ${toAcademicYear}:\n\n1. Go to Transport → Routes tab\n2. For each missing route, click 'Copy to Next AY' button\n   OR\n3. Create new routes for ${toAcademicYear}\n\nAlternatively, you can proceed without transport routes (students will need to be manually assigned later).`
              },
              requiresConfirmation: true
            }, { status: 409 });
          }
        }
      }
    }

    const updaterName = ctx.email.split('@')[0];

    const results = await updateStudentStatus(targetStudentIds, {
      action,
      toClass,
      toSection,
      toAcademicYear,
      toAcademicYearId: targetAcademicYear?.id,
      promotionType,
      remarks,
      updatedBy: ctx.userId,
      updatedByEmail: ctx.email,
      updatedByName: updaterName,
      schoolId: ctx.schoolId!,
      detainedApplyFees
    });

    // Determine success based on results
    const allFailed = results.updated.length === 0 && results.failed.length > 0;
    const partialSuccess = results.updated.length > 0 && results.failed.length > 0;

    let message = '';
    const actionLabel = action === 'promote' ? 'promoted' : action === 'exit' ? 'exited' : 'graduated';
    const actionLabelCaps = action === 'promote' ? 'Promoted' : action === 'exit' ? 'Exited' : 'Graduated';
    
    if (allFailed) {
      message = `Failed to ${action} all ${targetStudentIds.length} students. Check errors below.`;
    } else if (partialSuccess) {
      message = `${actionLabelCaps} ${results.updated.length} of ${targetStudentIds.length} students. ${results.failed.length} failed.`;
    } else {
      message = `Successfully ${actionLabel} ${results.updated.length} of ${targetStudentIds.length} students`;
    }

    return NextResponse.json({
      success: !allFailed,
      data: {
        mode,
        action,
        totalRequested: targetStudentIds.length,
        updated: results.updated.length,
        failed: results.failed.length,
        totalArrears: results.totalArrears,
        updatedStudents: results.updated,
        failedStudents: results.failed
      },
      message
    }, { status: allFailed ? 400 : 200 });
  } catch (err: any) {
    console.error('POST /api/students/promote:', err);
    return NextResponse.json({ error: 'Failed to promote students', details: err.message }, { status: 500 });
  }
}

// ─── GET /api/students/promote ───────────────────────────────────────────────
// Preview: returns list of students that will be promoted and their arrears
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const fromClass = searchParams.get('fromClass') || '';
    const fromSection = searchParams.get('fromSection') || '';
    const studentId = searchParams.get('studentId') || '';

    const where: any = { ...tenantWhere(ctx), status: 'active' };
    if (studentId) {
      where.id = studentId;
    } else {
      if (fromClass) where.class = fromClass;
      if (fromSection) where.section = fromSection;
    }

    const students = await (schoolPrisma as any).student.findMany({
      where,
      include: {
        feeRecords: {
          where: { status: { in: ['pending', 'partial'] } },
          select: { id: true, amount: true, paidAmount: true, pendingAmount: true, academicYear: true }
        },
        promotions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { toAcademicYear: true, toClass: true, promotionDate: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const preview = students.map((s: any) => ({
      id: s.id,
      name: s.name,
      admissionNo: s.admissionNo,
      currentClass: s.class,
      currentSection: s.section,
      currentAcademicYear: s.academicYear,
      lastPromotion: s.promotions[0] || null,
      unpaidFees: s.feeRecords.length,
      arrearsAmount: s.feeRecords.reduce((sum: number, f: any) => sum + (f.pendingAmount || 0), 0)
    }));

    return NextResponse.json({ success: true, data: preview, total: preview.length });
  } catch (err: any) {
    console.error('GET /api/students/promote:', err);
    return NextResponse.json({ error: 'Failed to fetch promotion preview' }, { status: 500 });
  }
}
