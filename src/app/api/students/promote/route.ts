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

async function promoteStudents(
  studentIds: string[],
  promotionPayload: {
    toClass: string;
    toSection: string;
    toAcademicYear: string;
    promotionType: string;
    remarks: string;
    promotedBy: string;
    promotedByEmail: string;
    promotedByName: string;
    schoolId: string;
    detainedApplyFees: boolean;
  }
) {
  const results = { promoted: [] as any[], failed: [] as any[], totalArrears: 0 };

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
      const existingPromotion = await (schoolPrisma as any).studentPromotion.findFirst({
        where: {
          studentId,
          fromAcademicYear: student.academicYear,
          toAcademicYear: promotionPayload.toAcademicYear,
          schoolId: promotionPayload.schoolId
        }
      });

      if (existingPromotion) {
        results.failed.push({ studentId, studentName: student.name, reason: `Already promoted from ${student.academicYear} to ${promotionPayload.toAcademicYear}` });
        continue;
      }

      // Unpaid fee records become arrears
      const unpaidFees = student.feeRecords;
      const totalArrears = unpaidFees.reduce((sum: number, f: any) => sum + (f.pendingAmount || 0), 0);

      await (schoolPrisma as any).$transaction(async (tx: any) => {
        // 1. Create FeeArrears for unpaid fees in target academic year
        for (const fee of unpaidFees) {
          await tx.feeArrears.create({
            data: {
              schoolId: promotionPayload.schoolId,
              studentId,
              originalFeeRecordId: fee.id,
              fromAcademicYear: fee.academicYear || student.academicYear,
              toAcademicYear: promotionPayload.toAcademicYear,
              amount: fee.amount,
              paidAmount: fee.paidAmount || 0,
              pendingAmount: fee.pendingAmount || 0,
              dueDate: fee.dueDate,
              status: fee.paidAmount > 0 ? 'partial' : 'pending',
              remarks: `Arrears from ${fee.academicYear || student.academicYear} - ${student.class} ${student.section || ''}`
            }
          });
        }

        // 2. Update student record
        await tx.student.update({
          where: { id: studentId },
          data: {
            class: promotionPayload.toClass,
            section: promotionPayload.toSection,
            academicYear: promotionPayload.toAcademicYear,
          }
        });

        // 3. Create promotion audit record
        await tx.studentPromotion.create({
          data: {
            schoolId: promotionPayload.schoolId,
            studentId,
            fromClass: student.class,
            toClass: promotionPayload.toClass,
            fromSection: student.section,
            toSection: promotionPayload.toSection,
            fromAcademicYear: student.academicYear,
            toAcademicYear: promotionPayload.toAcademicYear,
            promotedBy: promotionPayload.promotedBy,
            promotedByEmail: promotionPayload.promotedByEmail,
            promotedByName: promotionPayload.promotedByName,
            promotionType: promotionPayload.promotionType,
            arrearsAmount: totalArrears,
            remarks: promotionPayload.remarks || null
          }
        });

        // 4. Auto-apply new academic year fee structures for new class
        // For detained: only apply if detainedApplyFees is true
        const shouldApplyFees = promotionPayload.promotionType === 'detained' 
          ? promotionPayload.detainedApplyFees 
          : true;

        if (shouldApplyFees) {
          try {
            const newAcademicYear = await tx.academicYear.findFirst({
              where: { year: promotionPayload.toAcademicYear }
            });

            if (newAcademicYear) {
              const newClassRecord = await tx.class.findFirst({
                where: { name: promotionPayload.toClass, academicYearId: newAcademicYear.id, isActive: true }
              });

              const feeStructureWhere: any = { isActive: true, academicYearId: newAcademicYear.id };
              if (newClassRecord) feeStructureWhere.classId = newClassRecord.id;

              const newFeeStructures = await tx.feeStructure.findMany({ where: feeStructureWhere });

              const currentYear = new Date().getFullYear();
              for (const structure of newFeeStructures) {
                const cats = structure.applicableCategories || 'all';
                const categoryMatch = cats === 'all' || cats.includes(student.category || 'General');
                if (!categoryMatch) continue;

                const existingRecord = await tx.feeRecord.findFirst({
                  where: { studentId, feeStructureId: structure.id, academicYear: promotionPayload.toAcademicYear }
                });
                if (existingRecord) continue;

                await tx.feeRecord.create({
                  data: {
                    studentId,
                    feeStructureId: structure.id,
                    amount: structure.amount,
                    paidAmount: 0,
                    pendingAmount: structure.amount,
                    dueDate: new Date(currentYear, 3, structure.dueDate || 1).toISOString().split('T')[0],
                    status: 'pending',
                    academicYear: promotionPayload.toAcademicYear,
                    receiptNumber: `FEE-${promotionPayload.toAcademicYear}-${student.admissionNo}-${structure.name.replace(/\s/g, '').toUpperCase().slice(0, 8)}-${Date.now()}`,
                    remarks: `Auto-applied on promotion to ${promotionPayload.toClass}`
                  }
                });
              }
            }
          } catch (feeErr) {
            console.error(`Fee auto-apply failed for student ${studentId}:`, feeErr);
            // Don't fail the promotion if fee application fails
          }
        }
      });

      results.promoted.push({ studentId, studentName: student.name, fromClass: student.class, toClass: promotionPayload.toClass, arrearsAmount: totalArrears });
      results.totalArrears += totalArrears;
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
      studentId,         // for mode=single
      studentIds,        // for mode=bulk
      fromClass,         // for mode=class
      fromSection,       // for mode=class (optional)
      toClass,
      toSection,
      toAcademicYear,
      promotionType = 'regular',
      remarks = '',
      detainedApplyFees = false
    } = body;

    // Validate required fields
    if (!toClass || !toAcademicYear) {
      return NextResponse.json({ error: 'toClass and toAcademicYear are required' }, { status: 400 });
    }

    // Validate target academic year exists
    const targetAcademicYear = await (schoolPrisma as any).academicYear.findFirst({
      where: { year: toAcademicYear }
    });
    if (!targetAcademicYear) {
      return NextResponse.json({ error: `Academic year ${toAcademicYear} not found. Please create it in Settings first.` }, { status: 400 });
    }

    // Validate section is optional (will be checked later based on class configuration)
    // No hard requirement here

    // Resolve student IDs based on mode
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

    const promoterName = ctx.email.split('@')[0];

    const results = await promoteStudents(targetStudentIds, {
      toClass,
      toSection,
      toAcademicYear,
      promotionType,
      remarks,
      promotedBy: ctx.userId,
      promotedByEmail: ctx.email,
      promotedByName: promoterName,
      schoolId: ctx.schoolId!,
      detainedApplyFees
    });

    return NextResponse.json({
      success: true,
      data: {
        mode,
        totalRequested: targetStudentIds.length,
        promoted: results.promoted.length,
        failed: results.failed.length,
        totalArrears: results.totalArrears,
        promotedStudents: results.promoted,
        failedStudents: results.failed
      },
      message: `Successfully promoted ${results.promoted.length} of ${targetStudentIds.length} students to ${toClass} (${toAcademicYear})`
    });
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
