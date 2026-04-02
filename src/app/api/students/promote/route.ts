// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canManageStudentLifecycleAccess } from '@/lib/permissions';
import { sendBulkTransportNotification, sendRouteChangeNotification } from '@/lib/transportNotifications';
import { findAcademicYearByYear } from '@/lib/schoolScope';

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
            toAcademicYear: statusPayload.toAcademicYear,
            schoolId: statusPayload.schoolId
          }
        });
      } catch (promotionCheckErr) {
        console.warn('StudentPromotion table check failed, skipping duplicate check:', promotionCheckErr);
        // Continue without duplicate check if table doesn't exist
      }

      if (existingPromotion) {
        results.failed.push({ studentId, studentName: student.name, reason: `Already promoted from ${student.academicYear} to ${statusPayload.toAcademicYear}` });
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
              where: { year: statusPayload.toAcademicYear, schoolId: statusPayload.schoolId }
            });

            if (newAcademicYear) {
              const newClassRecord = await db.class.findFirst({
                where: {
                  name: statusPayload.toClass,
                  academicYearId: newAcademicYear.id,
                  schoolId: statusPayload.schoolId,
                  isActive: true
                }
              });

              const feeStructureWhere: any = { isActive: true, academicYearId: newAcademicYear.id };
              feeStructureWhere.schoolId = statusPayload.schoolId;
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

        // 5. Handle transport route assignment for new AY (optimized for batch)
        // Note: This is handled in batch after all students are processed
        // See batch transport processing below

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

  // Batch process transport assignments for promoted students (optimized for 10M scale)
  if (statusPayload.action === 'promote' && results.updated.length > 0) {
    try {
      const promotedStudentIds = results.updated.map(r => r.studentId);
      
      // Get all active transport assignments for promoted students
      const activeTransports = await (schoolPrisma as any).studentTransport.findMany({
        where: { 
          studentId: { in: promotedStudentIds }, 
          isActive: true 
        },
        include: { route: true }
      });

      if (activeTransports.length > 0) {
        // Batch deactivate old assignments
        await (schoolPrisma as any).studentTransport.updateMany({
          where: { studentId: { in: promotedStudentIds }, isActive: true },
          data: { isActive: false }
        });

        // Get route numbers to find in target AY
        const routeNumbers = [...new Set(activeTransports.map(t => t.route?.routeNumber).filter(Boolean))];
        
        if (routeNumbers.length > 0) {
          // Find matching routes in target AY
          const routesInTargetAY = await (schoolPrisma as any).transportRoute.findMany({
            where: {
              routeNumber: { in: routeNumbers },
              academicYearId: statusPayload.toAcademicYearId,
              schoolId: statusPayload.schoolId,
              isActive: true
            }
          });

          const routeMap = new Map(routesInTargetAY.map(r => [r.routeNumber, r]));
          
          // Prepare batch assignments
          const newAssignments: any[] = [];
          const feeStructuresToCreate: any[] = [];
          const feeRecordsToCreate: any[] = [];
          const studentsWithoutRoute: string[] = [];

          for (const transport of activeTransports) {
            if (!transport.route) continue;
            
            const targetRoute = routeMap.get(transport.route.routeNumber);
            
            if (targetRoute) {
              newAssignments.push({
                studentId: transport.studentId,
                routeId: targetRoute.id,
                pickupStop: transport.pickupStop,
                dropStop: transport.dropStop,
                monthlyFee: targetRoute.monthlyFee,
                academicYearId: statusPayload.toAcademicYearId,
                isActive: true
              });

              // Prepare fee structure if needed
              const feeStructureName = `Transport - ${targetRoute.routeName}`;
              feeStructuresToCreate.push({
                name: feeStructureName,
                category: 'transport',
                amount: targetRoute.monthlyFee,
                frequency: 'monthly',
                dueDate: 10,
                lateFee: 0,
                description: `Monthly transport fee for route ${targetRoute.routeNumber} - ${targetRoute.routeName}`,
                applicableCategories: 'all',
                isActive: true,
                schoolId: statusPayload.schoolId,
                academicYearId: statusPayload.toAcademicYearId
              });

              // Prepare fee record
              const student = results.updated.find(r => r.studentId === transport.studentId);
              if (student) {
                const academicYearLabel = student.fromAcademicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2);
                feeRecordsToCreate.push({
                  studentId: transport.studentId,
                  feeStructureName,
                  amount: targetRoute.monthlyFee,
                  academicYear: statusPayload.toAcademicYear,
                  admissionNo: student.studentName, // Will be updated with actual admissionNo
                  remarks: `Auto-applied transport fee on promotion - Route ${targetRoute.routeNumber}`
                });
              }
            } else {
              studentsWithoutRoute.push(transport.studentId);
            }
          }

          // Batch create assignments
          if (newAssignments.length > 0) {
            await (schoolPrisma as any).studentTransport.createMany({ data: newAssignments });
          }

          // Batch update students with transport info
          if (newAssignments.length > 0 || studentsWithoutRoute.length > 0) {
            const studentUpdates = [
              ...newAssignments.map(a => ({
                where: { id: a.studentId },
                data: { transport: 'Yes', transportRoute: routeMap.get(routeNumbers.find(rn => {
                  const assignment = newAssignments.find(na => na.studentId === a.studentId);
                  return assignment && routeMap.get(assignment.routeId)?.routeNumber === rn;
                }))?.routeName || '' }
              })),
              ...studentsWithoutRoute.map(studentId => ({
                where: { id: studentId },
                data: { transport: 'No', transportRoute: null }
              }))
            ];

            for (const update of studentUpdates) {
              await (schoolPrisma as any).student.update(update);
            }
          }

          // Batch create fee structures
          if (feeStructuresToCreate.length > 0) {
            // Get existing fee structures to avoid duplicates
            const existingFeeStructures = await (schoolPrisma as any).feeStructure.findMany({
              where: {
                schoolId: statusPayload.schoolId,
                category: 'transport',
                name: { in: feeStructuresToCreate.map(fs => fs.name) },
                academicYearId: statusPayload.toAcademicYearId
              }
            });
            const existingNames = new Set(existingFeeStructures.map(fs => fs.name));
            
            const newFeeStructures = feeStructuresToCreate.filter(fs => !existingNames.has(fs.name));
            if (newFeeStructures.length > 0) {
              await (schoolPrisma as any).feeStructure.createMany({ data: newFeeStructures });
            }
          }

          // Batch create fee records
          if (feeRecordsToCreate.length > 0) {
            // Get student admission numbers
            const students = await (schoolPrisma as any).student.findMany({
              where: { id: { in: feeRecordsToCreate.map(fr => fr.studentId) } },
              select: { id: true, admissionNo: true }
            });
            const studentMap = new Map(students.map(s => [s.id, s.admissionNo]));

            const actualFeeRecords = feeRecordsToCreate.map(fr => ({
              studentId: fr.studentId,
              feeStructureName: fr.feeStructureName,
              amount: fr.amount,
              paidAmount: 0,
              pendingAmount: fr.amount,
              dueDate: new Date(new Date().getFullYear(), 3, 10).toISOString().split('T')[0],
              status: 'pending',
              academicYear: fr.academicYear,
              receiptNumber: `TRNSP-${fr.academicYear}-${studentMap.get(fr.studentId)}-${Date.now()}`,
              remarks: fr.remarks
            }));

            // Create fee records one by one to handle feeStructureId lookup
            for (const feeRecord of actualFeeRecords) {
              const feeStructure = await (schoolPrisma as any).feeStructure.findFirst({
                where: {
                  name: feeRecord.feeStructureName,
                  academicYearId: statusPayload.toAcademicYearId,
                  schoolId: statusPayload.schoolId
                }
              });
              if (feeStructure) {
                await (schoolPrisma as any).feeRecord.create({
                  data: {
                    studentId: feeRecord.studentId,
                    feeStructureId: feeStructure.id,
                    amount: feeRecord.amount,
                    paidAmount: feeRecord.paidAmount,
                    pendingAmount: feeRecord.pendingAmount,
                    dueDate: feeRecord.dueDate,
                    status: feeRecord.status,
                    academicYear: feeRecord.academicYear,
                    receiptNumber: feeRecord.receiptNumber,
                    remarks: feeRecord.remarks
                  }
                });
              }
            }
          }
        }
      }
    } catch (transportErr) {
      console.error('Batch transport processing failed:', transportErr);
      // Don't fail the promotion, just log the error
    }

    // Send bulk notification about transport updates (async)
    if (results.updated.length > 0) {
      const transportStudentCount = activeTransports?.length || 0;
      if (transportStudentCount > 0) {
        sendBulkTransportNotification({
          type: 'promotion_transport',
          studentIds: results.updated.map(r => r.studentId),
          targetAcademicYear: statusPayload.toAcademicYear,
          message: `Transport auto-applied for ${transportStudentCount} students during promotion to ${statusPayload.toAcademicYear}. ${newAssignments?.length || 0} students assigned to routes, ${studentsWithoutRoute?.length || 0} students need manual assignment.`,
          schoolId: statusPayload.schoolId
        }).catch(err => console.error('Failed to send bulk notification:', err));
      }
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

    if (!canManageStudentLifecycleAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      
      // Validate: Prevent promotion to same academic year
      const activeAcademicYear = await (schoolPrisma as any).academicYear.findFirst({
        where: { isActive: true, schoolId: ctx.schoolId },
        select: { year: true }
      });
      
      if (activeAcademicYear && toAcademicYear === activeAcademicYear.year) {
        return NextResponse.json({ 
          error: 'Cannot promote to the same academic year', 
          message: `Target academic year (${toAcademicYear}) cannot be the same as the current active academic year. Please select a different target year.` 
        }, { status: 400 });
      }
    }

    // Validate target academic year exists (only for promote)
    let targetAcademicYear = null;
    if (action === 'promote') {
      targetAcademicYear = await findAcademicYearByYear(toAcademicYear, ctx.schoolId, schoolPrisma);
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
    const studentIds = (searchParams.get('studentIds') || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    const where: any = { ...tenantWhere(ctx), status: 'active' };
    if (studentIds.length > 0) {
      where.id = { in: studentIds };
    } else if (studentId) {
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
      feeBreakdown: {
        total: s.feeRecords.reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0),
        paid: s.feeRecords.reduce((sum: number, f: any) => sum + Number(f.paidAmount || 0), 0),
        discount: 0,
        pending: s.feeRecords.reduce((sum: number, f: any) => sum + Number(f.pendingAmount || 0), 0)
      },
      arrearsAmount: s.feeRecords.reduce((sum: number, f: any) => sum + (f.pendingAmount || 0), 0)
    }));

    return NextResponse.json({ success: true, data: preview, total: preview.length });
  } catch (err: any) {
    console.error('GET /api/students/promote:', err);
    return NextResponse.json({ error: 'Failed to fetch promotion preview' }, { status: 500 });
  }
}
