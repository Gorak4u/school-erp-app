import { NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection and get provider info
    const result = await (schoolPrisma as any).$queryRaw`SELECT version() as version`;
    
    // Count students
    const studentCount = await (schoolPrisma as any).student.count();
    
    // Get database info
    const dbInfo = await (schoolPrisma as any).$queryRaw`SELECT current_database() as database, current_user as user`;
    
    return NextResponse.json({
      success: true,
      databaseInfo: dbInfo,
      version: result,
      studentCount,
      databaseUrl: process.env.DATABASE_URL?.includes('neon') ? 'Neon PostgreSQL' : 'Other',
      message: 'Connected to PostgreSQL'
    });
  } catch (error: any) {
    // If PostgreSQL fails, try to check if it's using SQLite
    try {
      const studentCount = await (schoolPrisma as any).student.count();
      return NextResponse.json({
        success: false,
        error: error.message,
        studentCount,
        fallback: 'Using fallback database (likely SQLite)',
        databaseUrl: process.env.DATABASE_URL?.includes('neon') ? 'Neon PostgreSQL (configured)' : 'Other'
      });
    } catch (fallbackError: any) {
      return NextResponse.json({
        success: false,
        error: error.message,
        fallbackError: fallbackError.message,
        databaseUrl: process.env.DATABASE_URL?.includes('neon') ? 'Neon PostgreSQL (configured)' : 'Other'
      });
    }
  }
}
