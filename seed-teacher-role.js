const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Default teacher permissions from the permissions file
const TEACHER_PERMISSIONS = [
  'view_dashboard',
  'view_students',
  'view_attendance',
  'manage_attendance',
  'view_exams',
  'view_fees',
  'view_reports',
  'view_announcements',
];

async function seedTeacherRole() {
  try {
    console.log('Checking available schools...');
    
    // First, get the actual school ID
    const schools = await prisma.school.findMany({
      select: { id: true, name: true }
    });
    
    console.log('Available schools:', schools);
    
    if (schools.length === 0) {
      console.log('No schools found. Cannot seed role.');
      return;
    }
    
    const schoolId = schools[0].id;
    console.log(`Using school ID: ${schoolId}`);
    
    console.log('Seeding default Teacher role...');
    
    // Check if Teacher role already exists
    const existingTeacher = await prisma.customRole.findFirst({
      where: { 
        schoolId: schoolId,
        name: 'Teacher' 
      },
    });

    if (existingTeacher) {
      console.log('Teacher role already exists. Updating permissions...');
      
      // Update existing role with correct permissions
      const updated = await prisma.customRole.update({
        where: { id: existingTeacher.id },
        data: {
          permissions: JSON.stringify(TEACHER_PERMISSIONS),
          description: 'Default teacher role — view-only access to students, attendance, exams, fees, and reports. No financial management or alumni access.',
          isDefault: true,
        },
      });
      
      console.log('Teacher role updated successfully!');
      console.log('Permissions:', JSON.stringify(TEACHER_PERMISSIONS));
      
    } else {
      console.log('Creating new Teacher role...');
      
      // Create new Teacher role
      const created = await prisma.customRole.create({
        data: {
          name: 'Teacher',
          description: 'Default teacher role — view-only access to students, attendance, exams, fees, and reports. No financial management or alumni access.',
          permissions: JSON.stringify(TEACHER_PERMISSIONS),
          isDefault: true,
          schoolId: schoolId,
        },
      });
      
      console.log('Teacher role created successfully!');
      console.log('Role ID:', created.id);
      console.log('Permissions:', JSON.stringify(TEACHER_PERMISSIONS));
    }

  } catch (error) {
    console.error('Error seeding Teacher role:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedTeacherRole();
