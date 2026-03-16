import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Create test students for testing discount functionality
    const testStudents = [
      {
        id: 'student-1',
        schoolId: 'test-school',
        name: 'Vishwa Kumar',
        admissionNo: 'ADM001',
        email: 'vishwa@test.com',
        class: '10-A',
        section: 'A',
        rollNo: '1',
        gender: 'male',
        status: 'active',
        phone: '1234567890',
        parentName: 'Parent Name',
        dateOfBirth: '2008-05-15',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'student-2',
        schoolId: 'test-school',
        name: 'Rahul Sharma',
        admissionNo: 'ADM002',
        email: 'rahul@test.com',
        class: '10-B',
        section: 'B',
        rollNo: '2',
        gender: 'male',
        status: 'active',
        phone: '1234567891',
        parentName: 'Parent Name 2',
        dateOfBirth: '2008-07-20',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'student-3',
        schoolId: 'test-school',
        name: 'Priya Patel',
        admissionNo: 'ADM003',
        email: 'priya@test.com',
        class: '9-A',
        section: 'A',
        rollNo: '3',
        gender: 'female',
        status: 'active',
        phone: '1234567892',
        parentName: 'Parent Name 3',
        dateOfBirth: '2009-03-10',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Insert test students
    for (const student of testStudents) {
      await (schoolPrisma as any).student.upsert({
        where: { id: student.id },
        update: student,
        create: student,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test students created successfully',
      count: testStudents.length
    });

  } catch (error: any) {
    console.error('Failed to create test students:', error);
    return NextResponse.json({ 
      error: 'Failed to create test students',
      details: error.message 
    }, { status: 500 });
  }
}
