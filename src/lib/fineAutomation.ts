import { schoolPrisma } from './prisma';

/**
 * Fine Automation Engine
 * 
 * Handles automated fine creation based on:
 * 1. Late payment fees
 * 2. Library overdue fines  
 * 3. Attendance fines (late/absence)
 */

// Helper function to generate fine numbers
function generateFineNumber(year: string, index: number): string {
  return `F-${year}-${String(index).padStart(4, '0')}`;
}

// Helper to calculate daily accumulating fines
function calculateAccumulatingFine(
  baseAmount: number,
  dailyRate: number,
  daysOverdue: number,
  maxAmount?: number
): number {
  const calculated = baseAmount + (dailyRate * daysOverdue);
  return maxAmount ? Math.min(calculated, maxAmount) : calculated;
}

// Helper to calculate percentage fines
function calculatePercentageFine(
  baseAmount: number,
  percentage: number,
  maxAmount?: number
): number {
  const calculated = baseAmount * (percentage / 100);
  return maxAmount ? Math.min(calculated, maxAmount) : calculated;
}

/**
 * Process late payment fines
 * Creates fines for overdue fee records
 */
export async function processLatePaymentFines(schoolId: string) {
  try {
    console.log(`🔍 Processing late payment fines for school: ${schoolId}`);

    // Get active late payment fine rules
    const latePaymentRules = await schoolPrisma.fineRule.findMany({
      where: {
        schoolId,
        triggerEvent: 'late_payment',
        isActive: true
      }
    });

    if (latePaymentRules.length === 0) {
      console.log('ℹ️ No active late payment fine rules found');
      return { processed: 0, created: 0, errors: [] };
    }

    // Get overdue fee records (not already fined)
    const overdueFeeRecords = await schoolPrisma.feeRecord.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: new Date().toISOString()
        }
      },
      include: {
        student: true,
        feeStructure: true
      }
    });

    console.log(`📊 Found ${overdueFeeRecords.length} overdue fee records`);

    let totalCreated = 0;
    let totalErrors = 0;
    const errors: any[] = [];

    // Get current academic year for fine numbering
    const currentAcademicYear = await schoolPrisma.academicYear.findFirst({
      where: { isActive: true }
    });

    const year = currentAcademicYear?.year || new Date().getFullYear().toString();

    // Get next fine number
    const lastFine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        fineNumber: {
          startsWith: `F-${year}-`
        }
      },
      orderBy: { fineNumber: 'desc' }
    });

    let nextNumber = 1;
    if (lastFine) {
      const parts = lastFine.fineNumber.split('-');
      nextNumber = parseInt(parts[2]) + 1;
    }

    for (const feeRecord of overdueFeeRecords) {
      try {
        // Check if fine already exists for this fee record
        const existingFine = await (schoolPrisma as any).Fine.findFirst({
          where: {
            sourceType: 'fee_system',
            sourceId: feeRecord.id
          }
        });

        if (existingFine) {
          continue; // Skip if fine already exists
        }

        // Apply each applicable late payment rule
        for (const rule of latePaymentRules) {
          // Check if rule applies to this student/class
          if (rule.applicableTo === 'specific_classes' && rule.classIds) {
            const applicableClasses = JSON.parse(rule.classIds);
            if (!applicableClasses.includes(feeRecord.student.class)) {
              continue; // Rule doesn't apply to this student's class
            }
          }

          // Calculate days overdue
          const dueDate = new Date(feeRecord.dueDate);
          const today = new Date();
          const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

          // Apply grace period
          if (daysOverdue <= rule.graceDays) {
            continue;
          }

          const effectiveDaysOverdue = daysOverdue - rule.graceDays;

          // Calculate fine amount based on rule type
          let fineAmount = rule.baseAmount;
          
          if (rule.type === 'daily_accumulating') {
            fineAmount = calculateAccumulatingFine(
              rule.baseAmount,
              rule.dailyRate || 0,
              effectiveDaysOverdue,
              rule.maxAmount || undefined
            );
          } else if (rule.type === 'percentage') {
            fineAmount = calculatePercentageFine(
              feeRecord.pendingAmount,
              rule.baseAmount,
              rule.maxAmount || undefined
            );
          }

          // Create fine
          const fine = await (schoolPrisma as any).Fine.create({
            data: {
              schoolId,
              studentId: feeRecord.studentId,
              ruleId: rule.id,
              fineNumber: generateFineNumber(year, nextNumber++),
              type: 'late_fee',
              category: 'academic',
              description: `Late payment fee for ${feeRecord.studentId}`,
              amount: fineAmount,
              paidAmount: 0,
              waivedAmount: 0,
              pendingAmount: fineAmount,
              status: 'pending',
              sourceType: 'fee_system',
              sourceId: feeRecord.id,
              issuedAt: new Date(),
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Due in 7 days
            }
          });

          totalCreated++;
          console.log(`✅ Created late payment fine: ${fine.fineNumber} for student: ${feeRecord.studentId}`);
        }

      } catch (error) {
        totalErrors++;
        errors.push({
          studentId: feeRecord.studentId,
          feeRecordId: feeRecord.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Error creating fine for fee record ${feeRecord.id}:`, error);
      }
    }

    // Log automation execution
    await schoolPrisma.fineAutomationLog.create({
      data: {
        schoolId,
        triggerType: 'late_payment',
        ruleId: latePaymentRules[0].id,
        ruleName: 'Late Payment Fine',
        executedAt: new Date(),
        status: totalErrors === 0 ? 'success' : 'partial',
        finesCreated: totalCreated,
        finesFailed: totalErrors,
        errorMessage: totalErrors > 0 ? JSON.stringify(errors.slice(0, 5)) : null,
        processedIds: JSON.stringify(overdueFeeRecords.map(fr => fr.id))
      }
    });

    console.log(`🎉 Late payment fines processed: ${totalCreated} created, ${totalErrors} errors`);

    return {
      processed: overdueFeeRecords.length,
      created: totalCreated,
      errors,
      summary: `Created ${totalCreated} late payment fines`
    };

  } catch (error) {
    console.error('❌ Error processing late payment fines:', error);
    throw error;
  }
}

/**
 * Process library overdue fines
 * Creates fines for overdue book loans
 */
export async function processLibraryOverdueFines(schoolId: string) {
  try {
    console.log(`📚 Processing library overdue fines for school: ${schoolId}`);

    // Get active library fine rules
    const libraryRules = await schoolPrisma.fineRule.findMany({
      where: {
        schoolId,
        triggerEvent: 'library_overdue',
        isActive: true
      }
    });

    if (libraryRules.length === 0) {
      console.log('ℹ️ No active library fine rules found');
      return { processed: 0, created: 0, errors: [] };
    }

    // Get overdue book loans
    const overdueLoans = await schoolPrisma.bookLoan.findMany({
      where: {
        schoolId,
        status: 'active',
        dueDate: {
          lt: new Date()
        }
      },
      include: {
        student: true
      }
    });

    console.log(`📊 Found ${overdueLoans.length} overdue book loans`);

    let totalCreated = 0;
    let totalErrors = 0;
    const errors: any[] = [];

    // Get current academic year for fine numbering
    const currentAcademicYear = await schoolPrisma.academicYear.findFirst({
      where: { isActive: true }
    });

    const year = currentAcademicYear?.year || new Date().getFullYear().toString();

    // Get next fine number
    const lastFine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        fineNumber: {
          startsWith: `F-${year}-`
        }
      },
      orderBy: { fineNumber: 'desc' }
    });

    let nextNumber = 1;
    if (lastFine) {
      const parts = lastFine.fineNumber.split('-');
      nextNumber = parseInt(parts[2]) + 1;
    }

    for (const loan of overdueLoans) {
      try {
        // Check if fine already exists for this loan
        const existingFine = await (schoolPrisma as any).Fine.findFirst({
          where: {
            sourceType: 'library_system',
            sourceId: loan.id
          }
        });

        if (existingFine) {
          continue; // Skip if fine already exists
        }

        // Apply each applicable library rule
        for (const rule of libraryRules) {
          // Calculate days overdue
          const dueDate = new Date(loan.dueDate);
          const today = new Date();
          const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

          // Apply grace period
          if (daysOverdue <= rule.graceDays) {
            continue;
          }

          const effectiveDaysOverdue = daysOverdue - rule.graceDays;

          // Calculate fine amount
          let fineAmount = rule.baseAmount;
          
          if (rule.type === 'daily_accumulating') {
            fineAmount = calculateAccumulatingFine(
              rule.baseAmount,
              rule.dailyRate || 0,
              effectiveDaysOverdue,
              rule.maxAmount || undefined
            );
          }

          // Create fine
          const fine = await (schoolPrisma as any).Fine.create({
            data: {
              schoolId,
              studentId: loan.studentId,
              ruleId: rule.id,
              fineNumber: generateFineNumber(year, nextNumber++),
              type: 'library',
              category: 'property',
              description: `Library overdue fine for "${loan.bookTitle}" (${loan.bookAccessionNo})`,
              amount: fineAmount,
              paidAmount: 0,
              waivedAmount: 0,
              pendingAmount: fineAmount,
              status: 'pending',
              sourceType: 'library_system',
              sourceId: loan.id,
              issuedAt: new Date(),
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
            }
          });

          totalCreated++;
          console.log(`✅ Created library fine: ${fine.fineNumber} for student: ${loan.student.name}`);
        }

      } catch (error) {
        totalErrors++;
        errors.push({
          studentId: loan.studentId,
          loanId: loan.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Error creating fine for loan ${loan.id}:`, error);
      }
    }

    // Log automation execution
    await schoolPrisma.fineAutomationLog.create({
      data: {
        schoolId,
        triggerType: 'library_overdue',
        ruleId: libraryRules[0].id,
        ruleName: 'Library Overdue Fine',
        executedAt: new Date(),
        status: totalErrors === 0 ? 'success' : 'partial',
        finesCreated: totalCreated,
        finesFailed: totalErrors,
        errorMessage: totalErrors > 0 ? JSON.stringify(errors.slice(0, 5)) : null,
        processedIds: JSON.stringify(overdueLoans.map(loan => loan.id))
      }
    });

    console.log(`🎉 Library overdue fines processed: ${totalCreated} created, ${totalErrors} errors`);

    return {
      processed: overdueLoans.length,
      created: totalCreated,
      errors,
      summary: `Created ${totalCreated} library overdue fines`
    };

  } catch (error) {
    console.error('❌ Error processing library overdue fines:', error);
    throw error;
  }
}

/**
 * Process attendance fines
 * Creates fines for excessive late arrivals or absences
 */
export async function processAttendanceFines(schoolId: string) {
  try {
    console.log(`📝 Processing attendance fines for school: ${schoolId}`);

    // Get active attendance fine rules
    const attendanceRules = await schoolPrisma.fineRule.findMany({
      where: {
        schoolId,
        triggerEvent: { in: ['attendance_late', 'attendance_absent'] },
        isActive: true
      }
    });

    if (attendanceRules.length === 0) {
      console.log('ℹ️ No active attendance fine rules found');
      return { processed: 0, created: 0, errors: [] };
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Get current academic year
    const currentAcademicYear = await schoolPrisma.academicYear.findFirst({
      where: { isActive: true }
    });

    if (!currentAcademicYear) {
      throw new Error('No active academic year found');
    }

    // Get attendance counters for current month
    const attendanceCounters = await schoolPrisma.attendanceFineCounter.findMany({
      where: {
        schoolId,
        academicYearId: currentAcademicYear.id,
        month: currentMonth,
        year: currentYear
      },
      include: {
        student: true
      }
    });

    console.log(`📊 Found ${attendanceCounters.length} attendance counters for current month`);

    let totalCreated = 0;
    let totalErrors = 0;
    const errors: any[] = [];

    // Get next fine number
    const year = currentAcademicYear.year;
    const lastFine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        fineNumber: {
          startsWith: `F-${year}-`
        }
      },
      orderBy: { fineNumber: 'desc' }
    });

    let nextNumber = 1;
    if (lastFine) {
      const parts = lastFine.fineNumber.split('-');
      nextNumber = parseInt(parts[2]) + 1;
    }

    for (const counter of attendanceCounters) {
      try {
        // Process late arrival fines
        const lateRules = attendanceRules.filter(rule => rule.triggerEvent === 'attendance_late');
        for (const rule of lateRules) {
          // Check if threshold is met (e.g., 3 lates = 1 fine)
          const threshold = rule.baseAmount; // Using baseAmount as threshold for attendance rules
          
          if (counter.lateCount >= threshold) {
            // Check if fine already created for this month
            if (counter.lastLateFineAt) {
              const lastFineDate = new Date(counter.lastLateFineAt);
              if (lastFineDate.getMonth() + 1 === currentMonth && lastFineDate.getFullYear() === currentYear) {
                continue; // Fine already created this month
              }
            }

            // Create fine
            const fine = await (schoolPrisma as any).Fine.create({
              data: {
                schoolId,
                studentId: counter.studentId,
                ruleId: rule.id,
                fineNumber: generateFineNumber(year, nextNumber++),
                type: 'discipline',
                category: 'behavioral',
                description: `Excessive late arrivals (${counter.lateCount} times this month)`,
                amount: rule.dailyRate || rule.baseAmount, // Use dailyRate as fine amount
                paidAmount: 0,
                waivedAmount: 0,
                pendingAmount: rule.dailyRate || rule.baseAmount,
                status: 'pending',
                sourceType: 'attendance_system',
                sourceId: counter.id,
                issuedAt: new Date(),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
              }
            });

            // Update counter
            await schoolPrisma.attendanceFineCounter.update({
              where: { id: counter.id },
              data: { lastLateFineAt: new Date() }
            });

            totalCreated++;
            console.log(`✅ Created late arrival fine: ${fine.fineNumber} for student: ${counter.student.name}`);
          }
        }

        // Process absence fines
        const absenceRules = attendanceRules.filter(rule => rule.triggerEvent === 'attendance_absent');
        for (const rule of absenceRules) {
          // Check if threshold is met
          const threshold = rule.baseAmount; // Using baseAmount as threshold
          
          if (counter.absenceCount >= threshold) {
            // Check if fine already created for this month
            if (counter.lastAbsenceFineAt) {
              const lastFineDate = new Date(counter.lastAbsenceFineAt);
              if (lastFineDate.getMonth() + 1 === currentMonth && lastFineDate.getFullYear() === currentYear) {
                continue; // Fine already created this month
              }
            }

            // Create fine
            const fine = await (schoolPrisma as any).Fine.create({
              data: {
                schoolId,
                studentId: counter.studentId,
                ruleId: rule.id,
                fineNumber: generateFineNumber(year, nextNumber++),
                type: 'discipline',
                category: 'behavioral',
                description: `Excessive absences (${counter.absenceCount} days this month)`,
                amount: rule.dailyRate || rule.baseAmount,
                paidAmount: 0,
                waivedAmount: 0,
                pendingAmount: rule.dailyRate || rule.baseAmount,
                status: 'pending',
                sourceType: 'attendance_system',
                sourceId: counter.id,
                issuedAt: new Date(),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
              }
            });

            // Update counter
            await schoolPrisma.attendanceFineCounter.update({
              where: { id: counter.id },
              data: { lastAbsenceFineAt: new Date() }
            });

            totalCreated++;
            console.log(`✅ Created absence fine: ${fine.fineNumber} for student: ${counter.student.name}`);
          }
        }

      } catch (error) {
        totalErrors++;
        errors.push({
          studentId: counter.studentId,
          counterId: counter.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Error creating fine for counter ${counter.id}:`, error);
      }
    }

    // Log automation execution
    await schoolPrisma.fineAutomationLog.create({
      data: {
        schoolId,
        triggerType: 'attendance_late',
        ruleId: attendanceRules[0].id,
        ruleName: 'Attendance Fine',
        executedAt: new Date(),
        status: totalErrors === 0 ? 'success' : 'partial',
        finesCreated: totalCreated,
        finesFailed: totalErrors,
        errorMessage: totalErrors > 0 ? JSON.stringify(errors.slice(0, 5)) : null,
        processedIds: JSON.stringify(attendanceCounters.map(counter => counter.id))
      }
    });

    console.log(`🎉 Attendance fines processed: ${totalCreated} created, ${totalErrors} errors`);

    return {
      processed: attendanceCounters.length,
      created: totalCreated,
      errors,
      summary: `Created ${totalCreated} attendance fines`
    };

  } catch (error) {
    console.error('❌ Error processing attendance fines:', error);
    throw error;
  }
}

/**
 * Run all fine automation engines
 * This is the main function to be called by cron jobs
 */
export async function runFineAutomation(schoolId: string) {
  try {
    console.log(`🚀 Starting fine automation for school: ${schoolId}`);

    const results = await Promise.allSettled([
      processLatePaymentFines(schoolId),
      processLibraryOverdueFines(schoolId),
      processAttendanceFines(schoolId)
    ]);

    const summary = {
      latePayment: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason },
      library: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason },
      attendance: results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason }
    };

    const totalCreated = Object.values(summary).reduce((sum: number, result: any) => {
      return sum + (result.created || 0);
    }, 0);

    console.log(`🎉 Fine automation completed: ${totalCreated} fines created`);

    return {
      success: true,
      totalCreated,
      summary
    };

  } catch (error) {
    console.error('❌ Error running fine automation:', error);
    throw error;
  }
}
