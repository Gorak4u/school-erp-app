import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      targetType, // 'student', 'class', 'medium', 'school'
      targetIds, // Array of student IDs, class IDs, medium IDs, or empty for school-wide
      feeName,
      amount,
      category = 'fine', // 'fee', 'fine', 'other'
      dueDate,
      academicYearId,
      description,
      isOptional = false,
      frequency = 'once', // 'once', 'monthly', 'quarterly', 'yearly'
      lateFee = 0,
      remarks
    } = body;

    // Validation
    if (!feeName || !amount || !dueDate || !academicYearId) {
      return NextResponse.json({ 
        error: 'feeName, amount, dueDate, and academicYearId are required' 
      }, { status: 400 });
    }

    if (!['student', 'class', 'medium', 'school'].includes(targetType)) {
      return NextResponse.json({ 
        error: 'targetType must be one of: student, class, medium, school' 
      }, { status: 400 });
    }

    if (targetType !== 'school' && (!targetIds || targetIds.length === 0)) {
      return NextResponse.json({ 
        error: 'targetIds are required for student, class, and medium targeting' 
      }, { status: 400 });
    }

    // Get school context
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : { schoolId: ctx.schoolId };

    // Verify academic year
    const academicYear = await (schoolPrisma as any).academicYear.findFirst({
      where: { id: academicYearId, ...schoolFilter }
    });
    if (!academicYear) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    let studentsToAssign: any[] = [];

    // Get students based on target type
    switch (targetType) {
      case 'student':
        studentsToAssign = await (schoolPrisma as any).student.findMany({
          where: { 
            id: { in: targetIds },
            ...schoolFilter 
          },
          select: { 
            id: true, 
            name: true, 
            class: true, 
            section: true,
            languageMedium: true,
            status: true
          }
        });
        break;

      case 'class':
        // Get class names from targetIds
        const classRecords = await (schoolPrisma as any).class.findMany({
          where: { id: { in: targetIds }, ...schoolFilter },
          select: { name: true }
        });
        const classNames = classRecords.map((c: any) => c.name);
        
        studentsToAssign = await (schoolPrisma as any).student.findMany({
          where: { 
            class: { in: classNames },
            ...schoolFilter 
          },
          select: { 
            id: true, 
            name: true, 
            class: true, 
            section: true,
            languageMedium: true,
            status: true
          }
        });
        break;

      case 'medium':
        // Get medium names from targetIds
        const mediumRecords = await (schoolPrisma as any).medium.findMany({
          where: { id: { in: targetIds }, ...schoolFilter },
          select: { name: true }
        });
        const mediumNames = mediumRecords.map((m: any) => m.name);
        
        studentsToAssign = await (schoolPrisma as any).student.findMany({
          where: { 
            languageMedium: { in: mediumNames },
            ...schoolFilter 
          },
          select: { 
            id: true, 
            name: true, 
            class: true, 
            section: true,
            languageMedium: true,
            status: true
          }
        });
        break;

      case 'school':
        studentsToAssign = await (schoolPrisma as any).student.findMany({
          where: schoolFilter,
          select: { 
            id: true, 
            name: true, 
            class: true, 
            section: true,
            languageMedium: true,
            status: true
          }
        });
        break;
    }

    if (studentsToAssign.length === 0) {
      return NextResponse.json({ error: 'No students found for the specified targets' }, { status: 404 });
    }

    // Filter out alumni students if this is a fine
    if (category === 'fine') {
      const alumniStatuses = ['graduated', 'transferred', 'exit', 'exited', 'suspended', 'alumni'];
      const originalCount = studentsToAssign.length;
      studentsToAssign = studentsToAssign.filter(student => {
        const status = student.status?.toLowerCase();
        return !alumniStatuses.includes(status);
      });
      
      const alumniCount = originalCount - studentsToAssign.length;
      if (alumniCount > 0) {
        console.log(`Filtered out ${alumniCount} alumni students from fine assignment`);
      }
      
      if (studentsToAssign.length === 0) {
        return NextResponse.json({ 
          error: 'No active students found for fine assignment. All students in the selected targets are alumni.' 
        }, { status: 404 });
      }
    }

    // Create a temporary fee structure for this bulk assignment
    // Extract day of month from dueDate for FeeStructure (dueDate is Int, day of month)
    const dueDateDay = new Date(dueDate).getDate() || 1;
    
    const feeStructure = await (schoolPrisma as any).feeStructure.create({
      data: {
        name: feeName,
        category,
        amount,
        frequency,
        dueDate: dueDateDay, // Use day of month as Int
        lateFee,
        description,
        applicableCategories: category, // Use category as string, not array
        isActive: true,
        schoolId: ctx.schoolId,
        academicYearId,
        // Don't set classId/mediumId for school-wide fees
        classId: targetType === 'class' ? targetIds[0] : null,
        mediumId: targetType === 'medium' ? targetIds[0] : null,
      }
    });

    // Create fee records for all students
    const feeRecords = await (schoolPrisma as any).feeRecord.createMany({
      data: studentsToAssign.map(student => ({
        studentId: student.id,
        feeStructureId: feeStructure.id,
        amount,
        paidAmount: 0,
        pendingAmount: amount,
        discount: 0,
        dueDate,
        academicYear: academicYear.name,
        status: 'pending',
        remarks: remarks || `${category} assigned to ${targetType === 'student' ? 'individual student' : targetType}`,
      }))
    });

    // Create notifications for parents/students
    const notifications = studentsToAssign.map(student => ({
      studentId: student.id,
      title: `New ${category} Assigned`,
      message: `${feeName} of amount ${amount} has been assigned. Due date: ${dueDate}`,
      type: 'fee_assigned',
      priority: 'medium',
      schoolId: ctx.schoolId,
    }));

    // In a real implementation, you would send notifications here
    // await sendBulkNotifications(notifications);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${feeName} to ${studentsToAssign.length} students`,
      summary: {
        targetType,
        feeName,
        amount,
        category,
        studentsAssigned: studentsToAssign.length,
        totalAmount: studentsToAssign.length * amount,
        dueDate,
        feeStructureId: feeStructure.id,
        recordsCreated: feeRecords.count,
        // Include alumni filtering info for fines
        ...(category === 'fine' && {
          alumniFiltered: true,
          note: 'Alumni students were automatically excluded from fine assignment'
        })
      }
    });

  } catch (error) {
    console.error('POST /api/fees/bulk-assign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign fees/fines';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
