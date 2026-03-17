import { schoolPrisma } from './prisma';

/**
 * Find a user by email OR employeeId
 * Supports dual login: teachers can login with either email or employeeId
 * 
 * @param identifier - Email address or Employee ID (TCH0001 format)
 * @param schoolId - Optional school ID for school-specific lookup
 * @returns Promise<any> - User object if found, null otherwise
 */
export async function findUserByEmailOrEmployeeId(identifier: string, schoolId?: string) {
  try {
    // Check if identifier is an email or employeeId
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      // Lookup by email
      return await (schoolPrisma as any).school_User.findUnique({
        where: { email: identifier.toLowerCase() }
      });
    } else {
      // Lookup by employeeId (TCH#### format)
      const user = await (schoolPrisma as any).school_User.findUnique({
        where: { employeeId: identifier.toUpperCase() }
      });
      
      // If schoolId is provided, verify the user belongs to that school
      if (user && schoolId && user.schoolId !== schoolId) {
        return null;
      }
      
      return user;
    }
  } catch (error) {
    console.error('Error finding user by email or employeeId:', error);
    return null;
  }
}

/**
 * Validates if a string is a valid email or employeeId format
 * @param identifier - String to validate
 * @returns boolean - True if valid email or employeeId format
 */
export function isValidLoginIdentifier(identifier: string): boolean {
  // Check if it's an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(identifier)) {
    return true;
  }
  
  // Check if it's an employeeId (TCH#### format)
  const employeeIdRegex = /^TCH\d{4}$/i;
  if (employeeIdRegex.test(identifier)) {
    return true;
  }
  
  return false;
}

/**
 * Get login hint text for UI
 * @returns string - Hint text for login form
 */
export function getLoginHintText(): string {
  return 'Email address or Employee ID (e.g., TCH0001)';
}
