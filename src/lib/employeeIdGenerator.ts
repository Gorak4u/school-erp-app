import { schoolPrisma } from './prisma';

/**
 * Generates the next Employee ID for a school
 * Format: TCH0001, TCH0002, TCH0003, etc.
 * 
 * @param schoolId - The school ID to generate employee ID for
 * @returns Promise<string> - Generated employee ID like "TCH0001"
 */
export async function generateEmployeeId(schoolId: string): Promise<string> {
  try {
    // Get the highest existing employee ID for this school
    const teachers = await (schoolPrisma as any).teacher.findMany({
      where: { schoolId },
      select: { employeeId: true },
      orderBy: { employeeId: 'desc' },
      take: 1,
    });

    let nextSequence = 1;

    if (teachers.length > 0) {
      const lastEmployeeId = teachers[0].employeeId;
      // Extract number from TCH0001 format
      const match = lastEmployeeId.match(/TCH(\d+)/);
      if (match) {
        nextSequence = parseInt(match[1], 10) + 1;
      }
    }

    // Format as TCH0001, TCH0002, etc.
    const employeeId = `TCH${String(nextSequence).padStart(4, '0')}`;
    
    console.log(`✅ Generated Employee ID: ${employeeId} for school ${schoolId}`);
    return employeeId;
  } catch (error) {
    console.error('Failed to generate employee ID:', error);
    throw new Error('Failed to generate employee ID');
  }
}

/**
 * Validates if an employee ID follows the correct format
 * @param employeeId - Employee ID to validate
 * @returns boolean - True if valid format
 */
export function isValidEmployeeIdFormat(employeeId: string): boolean {
  return /^TCH\d{4}$/.test(employeeId);
}
