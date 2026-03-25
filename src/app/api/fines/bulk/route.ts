import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// POST /api/fines/bulk - Create bulk fines for class/medium/school
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { targetType, targetValue, fineType, amount, description, dueDate, reason } = body;

    // Validate required fields
    if (!targetType || !amount || !description || !dueDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: targetType, amount, description, dueDate'
        },
        { status: 400 }
      );
    }

    // Validate targetType
    if (!['class', 'medium', 'school'].includes(targetType)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid targetType. Must be class, medium, or school'
        },
        { status: 400 }
      );
    }

    // Validate amount
    const fineAmount = parseFloat(amount);
    if (isNaN(fineAmount) || fineAmount <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Amount must be a positive number'
        },
        { status: 400 }
      );
    }

    // Build where clause for target students
    const where: any = {
      schoolId: ctx.schoolId,
      status: 'active'  // Use status instead of isActive
    };

    if (targetType === 'class' && targetValue) {
      // targetValue is now class name (e.g., "10") from school structure
      where.class = targetValue;
      // Don't filter by section - get all sections for this class
      console.log(`🎓 Class target: ${targetValue}`); // Debug log
    } else if (targetType === 'medium' && targetValue) {
      where.languageMedium = targetValue;  // Use languageMedium instead of medium
      console.log(`🌐 Medium target: ${targetValue}`); // Debug log
    } else if (targetType === 'school') {
      console.log(`🏫 School target: All students`); // Debug log
      // No additional filter needed - will get all active students
    } else {
      console.log(`❌ Unknown target type: ${targetType}`); // Debug log
    }
    // For 'school', no additional filter needed

    console.log('Final where clause:', where); // Debug log

    // Get target students count first (for large scale operations)
    const studentCount = await (schoolPrisma as any).Student.count({
      where
    });

    console.log('Total students to process:', studentCount);

    if (studentCount === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No students found for the specified target'
        },
        { status: 404 }
      );
    }

    // For large operations (>1000 students), process in batches
    const BATCH_SIZE = 1000;
    const needsBatching = studentCount > BATCH_SIZE;
    
    if (needsBatching) {
      console.log(`🔄 Processing ${studentCount} students in batches of ${BATCH_SIZE}`);
      return await processBulkFinesInBatches(ctx, where, fineType, fineAmount, description, dueDate, reason, studentCount, BATCH_SIZE);
    }

    // For smaller operations, use existing logic
    const students = await (schoolPrisma as any).Student.findMany({
      where,
      select: {
        id: true,
        name: true,
        admissionNo: true,
        class: true,
        section: true,
        languageMedium: true  // Use languageMedium instead of medium
      }
    });

    console.log('Bulk fine request:', { targetType, targetValue, totalStudents: students.length });
    console.log('Sample students:', students.slice(0, 3));

    // Get current academic year for fine numbering
    const currentAcademicYear = await (schoolPrisma as any).AcademicYear.findFirst({
      where: { isActive: true }
    });

    const year = currentAcademicYear?.year || new Date().getFullYear().toString();

    // Create fines in bulk with atomic transaction
    const results = await (schoolPrisma as any).$transaction(async (tx: any) => {
      const createdFines = [];
      const errors = [];

      // Get existing fine numbers for this year and school
      const existingFines = await tx.Fine.findMany({
        where: {
          schoolId: ctx.schoolId!,
          fineNumber: {
            startsWith: `F-${year}-`
          }
        },
        select: { fineNumber: true },
        orderBy: { fineNumber: 'asc' }
      });

      console.log('Existing fines in database:', existingFines.map((f: any) => f.fineNumber)); // Debug log

      // Extract existing numbers - handle different year formats
      const existingNumbers = new Set();
      existingFines.forEach((fine: any) => {
        const parts = fine.fineNumber.split('-');
        if (parts.length >= 3) {
          const num = parseInt(parts[parts.length - 1]); // Get the last part (number)
          if (!isNaN(num)) {
            existingNumbers.add(num);
          }
        }
      });

      // Find next available number
      let nextIndex = 1;
      while (existingNumbers.has(nextIndex)) {
        nextIndex++;
      }

      // Generate fine numbers for all students
      const fineNumbers: string[] = [];
      const usedNumbers = new Set(existingNumbers);
      const usedFineNumbers = new Set(existingFines.map((f: any) => f.fineNumber)); // Track actual fine strings
      let currentIndex = nextIndex;
      
      console.log('Starting from index:', currentIndex, 'Used numbers:', Array.from(usedNumbers)); // Debug log
      
      for (let i = 0; i < students.length; i++) {
        // Find the next available unique number
        while (usedNumbers.has(currentIndex)) {
          currentIndex++;
        }
        
        const fineNumber = `F-${year}-${String(currentIndex).padStart(4, '0')}`;
        
        // Double-check this exact fine number doesn't exist
        if (usedFineNumbers.has(fineNumber)) {
          console.log(`Fine number ${fineNumber} already exists, skipping to next`);
          currentIndex++;
          i--; // Retry this iteration
          continue;
        }
        
        // Add to our list and mark as used
        fineNumbers.push(fineNumber);
        usedNumbers.add(currentIndex);
        usedFineNumbers.add(fineNumber);
        
        // Move to next number for next iteration
        currentIndex++;
      }
      
      console.log('Generated fine numbers:', fineNumbers); // Debug log

      // Create fines for each student
      for (let i = 0; i < students.length; i++) {
        const student: any = students[i];
        const fineNumber = fineNumbers[i];

        try {
          const fine: any = await tx.Fine.create({
            data: {
              schoolId: ctx.schoolId!,
              studentId: student.id,
              fineNumber,
              type: fineType,
              category: 'academic', // Default category
              amount: fineAmount,
              paidAmount: 0,
              waivedAmount: 0,
              pendingAmount: fineAmount,
              status: 'pending',
              description,
              sourceType: 'manual', // Manual creation
              issuedAt: new Date(),
              dueDate: new Date(dueDate),
              // Note: createdBy, createdByName, and metadata fields don't exist in Fine model
            }
          });

          createdFines.push({
            id: fine.id,
            fineNumber: fine.fineNumber,
            studentId: student.id,
            studentName: student.name,
            admissionNo: student.admissionNo,
            class: student.class,
            section: student.section,
            amount: fine.amount,
            status: fine.status
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error creating fine for student ${student.id} (${student.name}):`, errorMessage);
          errors.push({
            studentId: student.id,
            studentName: student.name,
            error: errorMessage
          });
        }
      }

      return { createdFines, errors };
    });

    // Clear cache
    const cacheKey = `fines_${ctx.schoolId}`;
    // Clear any existing cache if you have a cache system

    console.log('Bulk fine operation results:', {
      totalProcessed: students.length,
      successCount: results.createdFines.length,
      errorCount: results.errors.length,
      errors: results.errors
    });

    return NextResponse.json({
      success: true,
      message: `Successfully created ${results.createdFines.length} fines`,
      data: {
        totalProcessed: students.length,
        successCount: results.createdFines.length,
        errorCount: results.errors.length,
        targetType,
        targetValue,
        fines: results.createdFines,
        errors: results.errors.map((error: any) => ({
          ...error,
          // Add more context to error messages
          details: `Failed to create fine for ${error.studentName} (${error.admissionNo || 'N/A'}): ${error.error}`
        }))
      }
    });

  } catch (error) {
    console.error('Bulk fine creation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create bulk fines',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/fines/bulk/options - Get available classes and mediums
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Fetch classes from school structure
    const classesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/school-structure/classes?isActive=true`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    // Fetch mediums from school structure  
    const mediumsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/school-structure/mediums?isActive=true`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!classesResponse.ok || !mediumsResponse.ok) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch school structure data'
        },
        { status: 500 }
      );
    }

    const classesData = await classesResponse.json();
    const mediumsData = await mediumsResponse.json();

    // Extract class names and medium names
    const classes = classesData.classes?.map((cls: any) => cls.name) || [];
    const mediums = mediumsData.mediums?.map((m: any) => m.name) || [];

    return NextResponse.json({
      success: true,
      data: {
        classes,
        mediums,
        totalStudents: 0 // We'll calculate this separately if needed
      }
    });

  } catch (error) {
    console.error('Error fetching bulk options:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch options',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Batch processing function for large scale operations
async function processBulkFinesInBatches(
  ctx: any,
  where: any,
  fineType: string,
  fineAmount: number,
  description: string,
  dueDate: string,
  reason: string,
  totalStudents: number,
  batchSize: number
) {
  const year = new Date().getFullYear().toString();
  let totalSuccessCount = 0;
  let totalErrorCount = 0;
  const allErrors = [];
  
  console.log(`🚀 Starting batch processing for ${totalStudents} students`);

  // Get existing fine numbers once
  const existingFines = await (schoolPrisma as any).Fine.findMany({
    where: {
      schoolId: ctx.schoolId!,
      fineNumber: {
        startsWith: `F-${year}-`
      }
    },
    select: { fineNumber: true },
    orderBy: { fineNumber: 'asc' }
  });

  const existingNumbers = new Set();
  existingFines.forEach((fine: any) => {
    const parts = fine.fineNumber.split('-');
    if (parts.length >= 3) {
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) {
        existingNumbers.add(num);
      }
    }
  });

  let nextIndex = 1;
  while (existingNumbers.has(nextIndex)) {
    nextIndex++;
  }

  // Process in batches
  for (let batchStart = 0; batchStart < totalStudents; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, totalStudents);
    const currentBatch = Math.floor(batchStart / batchSize) + 1;
    const totalBatches = Math.ceil(totalStudents / batchSize);
    
    console.log(`📦 Processing batch ${currentBatch}/${totalBatches} (students ${batchStart + 1}-${batchEnd})`);

    try {
      // Get batch of students
      const students = await (schoolPrisma as any).Student.findMany({
        where,
        select: {
          id: true,
          name: true,
          admissionNo: true,
          class: true,
          section: true,
          languageMedium: true
        },
        skip: batchStart,
        take: batchSize
      });

      // Process this batch
      const batchResults = await (schoolPrisma as any).$transaction(async (tx: any) => {
        const createdFines = [];
        const errors = [];
        
        // Generate fine numbers for this batch
        const fineNumbers: string[] = [];
        let currentIndex = nextIndex + batchStart;
        
        for (let i = 0; i < students.length; i++) {
          while (existingNumbers.has(currentIndex)) {
            currentIndex++;
          }
          
          const fineNumber = `F-${year}-${String(currentIndex).padStart(4, '0')}`;
          fineNumbers.push(fineNumber);
          existingNumbers.add(currentIndex);
          currentIndex++;
        }

        // Create fines for this batch
        for (let i = 0; i < students.length; i++) {
          const student: any = students[i];
          const fineNumber = fineNumbers[i];

          try {
            const fine: any = await tx.Fine.create({
              data: {
                schoolId: ctx.schoolId!,
                studentId: student.id,
                fineNumber,
                type: fineType,
                category: 'academic',
                amount: fineAmount,
                paidAmount: 0,
                waivedAmount: 0,
                pendingAmount: fineAmount,
                status: 'pending',
                description,
                sourceType: 'manual',
                issuedAt: new Date(),
                dueDate: new Date(dueDate),
              }
            });

            createdFines.push({
              id: fine.id,
              fineNumber: fine.fineNumber,
              studentId: student.id,
              studentName: student.name,
              admissionNo: student.admissionNo,
              class: student.class,
              section: student.section,
              amount: fine.amount,
              status: fine.status
            });

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({
              studentId: student.id,
              studentName: student.name,
              error: errorMessage
            });
          }
        }

        return { createdFines, errors };
      });

      // Update totals
      totalSuccessCount += batchResults.createdFines.length;
      totalErrorCount += batchResults.errors.length;
      allErrors.push(...batchResults.errors);

      console.log(`✅ Batch ${currentBatch} completed: ${batchResults.createdFines.length} success, ${batchResults.errors.length} errors`);

    } catch (error) {
      console.error(`❌ Batch ${currentBatch} failed:`, error);
      totalErrorCount += batchSize;
      allErrors.push({
        studentId: `batch-${currentBatch}`,
        studentName: `Batch ${currentBatch}`,
        error: `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  console.log(`🎉 Batch processing completed: ${totalSuccessCount} success, ${totalErrorCount} errors`);

  return NextResponse.json({
    success: true,
    message: `Successfully created ${totalSuccessCount} fines in batches`,
    data: {
      totalProcessed: totalStudents,
      successCount: totalSuccessCount,
      errorCount: totalErrorCount,
      targetType: 'school',
      targetValue: 'all-students',
      fines: [], // Too many to return, just summary
      errors: allErrors.slice(0, 100) // Return first 100 errors only
    }
  });
}
