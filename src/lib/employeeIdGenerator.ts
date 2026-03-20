import { schoolPrisma } from './prisma';

/**
 * Generates school abbreviation from school name
 * Examples:
 * - "Sri Veera School Nittur" -> "SVSN"
 * - "Delhi Public School" -> "DPS"
 * - "St. Mary's High School" -> "SMHS"
 * 
 * @param schoolName - The school name to generate abbreviation for
 * @returns string - Generated abbreviation (2-4 characters)
 */
function generateSchoolAbbreviation(schoolName: string): string {
  if (!schoolName) return 'SCH';
  
  // Remove common words and clean the name
  const commonWords = ['school', 'college', 'academy', 'institution', 'international', 'public', 'private', 'higher', 'secondary', 'primary'];
  const words = schoolName
    .toUpperCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .split(/\s+/)
    .filter(word => !commonWords.includes(word));
  
  if (words.length === 0) return 'SCH';
  
  // Take first letter of each meaningful word (max 4 letters)
  let abbreviation = '';
  for (let i = 0; i < Math.min(words.length, 4); i++) {
    abbreviation += words[i].charAt(0);
  }
  
  // If we only have one word, take first 2-4 characters
  if (words.length === 1) {
    const word = words[0];
    abbreviation = word.length >= 4 ? word.substring(0, 4) : word.substring(0, Math.min(word.length, 3));
  }
  
  return abbreviation || 'SCH';
}

/**
 * Generates the next Employee ID for a school
 * Format: {SchoolAbbreviation}{sequence} e.g., SVSN0001, DPS0001, SMHS0001
 * 
 * @param schoolId - The school ID to generate employee ID for
 * @param schoolName - The school name to generate abbreviation from
 * @returns Promise<string> - Generated employee ID like "SVSN0001"
 */
export async function generateEmployeeId(schoolId: string, schoolName?: string): Promise<string> {
  try {
    // Get school info if name not provided
    let school = schoolName ? { name: schoolName } : null;
    if (!school) {
      school = await (schoolPrisma as any).school.findUnique({
        where: { id: schoolId },
        select: { name: true }
      });
    }
    
    // Generate school abbreviation
    const schoolAbbrev = generateSchoolAbbreviation(school?.name || '');
    
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
      // Extract number from format like SVSN0001
      const match = lastEmployeeId.match(/^[A-Z]+(\d+)/);
      if (match) {
        nextSequence = parseInt(match[1], 10) + 1;
      }
    }

    // Format as SVSN0001, DPS0001, etc.
    const employeeId = `${schoolAbbrev}${String(nextSequence).padStart(4, '0')}`;
    
    console.log(`✅ Generated Employee ID: ${employeeId} for school ${school?.name} (${schoolAbbrev})`);
    return employeeId;
  } catch (error) {
    console.error('Failed to generate employee ID:', error);
    throw new Error('Failed to generate employee ID');
  }
}

/**
 * Validates if an employee ID follows the correct format
 * Format: {Abbreviation}{4-digit number} e.g., SVSN0001, DPS0001
 * 
 * @param employeeId - Employee ID to validate
 * @returns boolean - True if valid format
 */
export function isValidEmployeeIdFormat(employeeId: string): boolean {
  return /^[A-Z]{2,4}\d{4}$/.test(employeeId);
}
