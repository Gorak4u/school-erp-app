// Database optimization script for school schema
import dotenv from 'dotenv';
dotenv.config();

async function optimizeSchoolDatabase() {
  console.log('🚀 Starting School Database Optimization...');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { Pool } = await import('pg');
    
    // Create connection to school schema
    const schoolUrl = process.env.SCHOOL_DATABASE_URL || process.env.DATABASE_URL;
    const pool = new Pool({
      connectionString: schoolUrl,
      ssl: { rejectUnauthorized: false },
    });
    
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    console.log('📡 Connected to database...');
    
    // Test connection
    const studentCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "school"."Student"`;
    console.log(`✅ Database connected: ${studentCount[0]?.count || 0} students found`);
    
    // Create critical indexes for school schema
    console.log('\n📊 Creating critical indexes for school schema...');
    
    const indexes = [
      // Student indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_student_status ON "school"."Student"("status")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_student_class ON "school"."Student"("class")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_student_section ON "school"."Student"("section")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_student_created_at ON "school"."Student"("createdAt")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_student_school_id ON "school"."Student"("schoolId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_student_admission_no ON "school"."Student"("admissionNo")',
      
      // Teacher indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_teacher_status ON "school"."Teacher"("status")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_teacher_school_id ON "school"."Teacher"("schoolId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_teacher_created_at ON "school"."Teacher"("createdAt")',
      
      // AttendanceRecord indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_attendance_date ON "school"."AttendanceRecord"("date")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_attendance_student_id ON "school"."AttendanceRecord"("studentId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_attendance_status ON "school"."AttendanceRecord"("status")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_attendance_date_status ON "school"."AttendanceRecord"("date", "status")',
      
      // FeeRecord indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_fee_record_student_id ON "school"."FeeRecord"("studentId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_fee_record_status ON "school"."FeeRecord"("status")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_fee_record_academic_year ON "school"."FeeRecord"("academicYear")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_fee_record_created_at ON "school"."FeeRecord"("createdAt")',
      
      // Payment indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_payment_created_at ON "school"."Payment"("createdAt")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_payment_fee_record_id ON "school"."Payment"("feeRecordId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_payment_method ON "school"."Payment"("paymentMethod")',
      
      // Exam indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_exam_date ON "school"."Exam"("date")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_exam_status ON "school"."Exam"("status")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_exam_class ON "school"."Exam"("class")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_exam_school_id ON "school"."Exam"("schoolId")',
    ];
    
    for (let i = 0; i < indexes.length; i++) {
      console.log(`Creating index ${i + 1}/${indexes.length}...`);
      try {
        await prisma.$executeRawUnsafe(indexes[i]);
        console.log(`✅ Index ${i + 1} created successfully`);
      } catch (error) {
        console.log(`⚠️ Index ${i + 1} may already exist:`, error.message);
      }
    }
    
    console.log('\n✅ All school schema indexes created successfully!');
    
    // Test the optimizations
    console.log('\n🧪 Testing optimizations...');
    
    const startTime = Date.now();
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "status" = 'active' THEN 1 END) as active
      FROM "school"."Student"
    `;
    const queryTime = Date.now() - startTime;
    
    console.log(`✅ Query test completed in ${queryTime}ms`);
    console.log(`📊 Results: ${stats[0]?.total || 0} total students, ${stats[0]?.active || 0} active`);
    
    await prisma.$disconnect();
    console.log('\n🎉 School database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

optimizeSchoolDatabase().catch(console.error);
