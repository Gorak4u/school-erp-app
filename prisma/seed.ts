import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding database...');

  // ─── USERS ───────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const teacherPassword = await bcrypt.hash('teacher123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@schoolerp.com' },
    update: {},
    create: { email: 'admin@schoolerp.com', password: adminPassword, firstName: 'Admin', lastName: 'User', role: 'admin' },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@schoolerp.com' },
    update: {},
    create: { email: 'teacher@schoolerp.com', password: teacherPassword, firstName: 'Priya', lastName: 'Sharma', role: 'teacher' },
  });

  console.log('✅ Users created');

  // ─── TEACHERS ───────────────────────────────────────────────────────────────
  const teacher = await prisma.teacher.upsert({
    where: { employeeId: 'EMP-001' },
    update: {},
    create: {
      employeeId: 'EMP-001', name: 'Priya Sharma', email: 'teacher@schoolerp.com',
      phone: '9876543210', gender: 'Female', dateOfBirth: '1985-06-15',
      subject: 'Mathematics', qualification: 'M.Sc Mathematics', experience: 10,
      status: 'active', joiningDate: '2015-06-01', salary: 55000,
      department: 'Science', designation: 'Senior Teacher', bloodGroup: 'B+',
      userId: teacherUser.id,
    },
  });

  await prisma.teacher.upsert({
    where: { employeeId: 'EMP-002' },
    update: {},
    create: {
      employeeId: 'EMP-002', name: 'Ramesh Kumar', email: 'ramesh@schoolerp.com',
      phone: '9876543211', gender: 'Male', dateOfBirth: '1980-03-20',
      subject: 'English', qualification: 'M.A English', experience: 14,
      status: 'active', joiningDate: '2010-07-15', salary: 60000,
      department: 'Languages', designation: 'HOD English', bloodGroup: 'A+',
    },
  });

  await prisma.teacher.upsert({
    where: { employeeId: 'EMP-003' },
    update: {},
    create: {
      employeeId: 'EMP-003', name: 'Sunita Patel', email: 'sunita@schoolerp.com',
      phone: '9876543212', gender: 'Female', dateOfBirth: '1988-09-10',
      subject: 'Science', qualification: 'M.Sc Physics', experience: 8,
      status: 'active', joiningDate: '2016-06-01', salary: 50000,
      department: 'Science', designation: 'Teacher', bloodGroup: 'O+',
    },
  });

  console.log('✅ Teachers created');

  // ─── ACADEMIC YEAR (needed for fee structures) ─────────────────────────────
  const seedAY = await (prisma as any).academicYear.upsert({
    where: { id: 'ay-2024-25' },
    update: {},
    create: {
      id: 'ay-2024-25', year: '2024-25', name: '2024-25',
      startDate: '2024-04-01', endDate: '2025-03-31', isActive: true,
    },
  });

  // ─── FEE STRUCTURES ──────────────────────────────────────────────────────────
  const tuitionFee = await (prisma as any).feeStructure.upsert({
    where: { id: 'fee-struct-tuition' },
    update: {},
    create: {
      id: 'fee-struct-tuition',
      name: 'Tuition Fee', category: 'tuition', amount: 12000,
      frequency: 'quarterly', dueDate: 10, lateFee: 500,
      description: 'Quarterly tuition fee for all classes',
      applicableCategories: 'all',
      academicYearId: seedAY.id, isActive: true,
    },
  });

  const transportFee = await (prisma as any).feeStructure.upsert({
    where: { id: 'fee-struct-transport' },
    update: {},
    create: {
      id: 'fee-struct-transport',
      name: 'Transport Fee', category: 'transport', amount: 3000,
      frequency: 'monthly', dueDate: 5, lateFee: 200,
      description: 'Monthly transport fee',
      applicableCategories: 'all',
      academicYearId: seedAY.id, isActive: true,
    },
  });

  const examFee = await (prisma as any).feeStructure.upsert({
    where: { id: 'fee-struct-exam' },
    update: {},
    create: {
      id: 'fee-struct-exam',
      name: 'Exam Fee', category: 'exam', amount: 1500,
      frequency: 'annually', dueDate: 15, lateFee: 100,
      description: 'Annual examination fee',
      applicableCategories: 'all',
      academicYearId: seedAY.id, isActive: true,
    },
  });

  console.log('✅ Fee structures created');

  // ─── STUDENTS ────────────────────────────────────────────────────────────────
  const studentsData = [
    {
      id: 'student-001', admissionNo: 'ADM-2024-001', name: 'Aarav Mehta',
      email: 'aarav.mehta@student.com', class: '10', section: 'A', rollNo: '01',
      gender: 'Male', dateOfBirth: '2009-04-12', status: 'active',
      phone: '9876543200', address: '12, MG Road', city: 'Bangalore', state: 'Karnataka',
      pinCode: '560001', nationality: 'Indian', religion: 'Hindu', category: 'General',
      languageMedium: 'English', bloodGroup: 'O+', parentName: 'Rajesh Mehta',
      parentPhone: '9876543201', parentEmail: 'rajesh.mehta@gmail.com',
      fatherName: 'Rajesh Mehta', fatherOccupation: 'Engineer', fatherPhone: '9876543201',
      motherName: 'Priya Mehta', motherOccupation: 'Teacher', motherPhone: '9876543202',
      admissionDate: '2024-06-01', gpa: 8.5, rank: 3, disciplineScore: 95,
      documents: JSON.stringify({ birthCertificate: true, aadharCard: true, passportPhoto: true, marksheet: true, transferCertificate: false, medicalCertificate: false, casteCertificate: false, incomeCertificate: false }),
    },
    {
      id: 'student-002', admissionNo: 'ADM-2024-002', name: 'Priya Sharma',
      email: 'priya.sharma@student.com', class: '10', section: 'A', rollNo: '02',
      gender: 'Female', dateOfBirth: '2009-08-22', status: 'active',
      phone: '9876543210', city: 'Bangalore', state: 'Karnataka', pinCode: '560002',
      nationality: 'Indian', religion: 'Hindu', category: 'OBC',
      languageMedium: 'English', bloodGroup: 'A+', parentName: 'Suresh Sharma',
      parentPhone: '9876543211', parentEmail: 'suresh.sharma@gmail.com',
      fatherName: 'Suresh Sharma', fatherOccupation: 'Business',
      motherName: 'Anita Sharma', motherOccupation: 'Homemaker',
      admissionDate: '2024-06-01', gpa: 9.2, rank: 1, disciplineScore: 98,
      documents: JSON.stringify({ birthCertificate: true, aadharCard: true, passportPhoto: true, marksheet: true, transferCertificate: true, medicalCertificate: false, casteCertificate: true, incomeCertificate: true }),
    },
    {
      id: 'student-003', admissionNo: 'ADM-2024-003', name: 'Rahul Verma',
      email: 'rahul.verma@student.com', class: '9', section: 'B', rollNo: '05',
      gender: 'Male', dateOfBirth: '2010-01-15', status: 'active',
      phone: '9876543220', city: 'Mysore', state: 'Karnataka', pinCode: '570001',
      nationality: 'Indian', category: 'SC', languageMedium: 'Kannada',
      bloodGroup: 'B+', parentName: 'Mohan Verma', parentPhone: '9876543221',
      fatherName: 'Mohan Verma', fatherOccupation: 'Farmer',
      motherName: 'Suman Verma', motherOccupation: 'Homemaker',
      admissionDate: '2024-06-01', gpa: 7.8, rank: 8, disciplineScore: 88,
      documents: JSON.stringify({ birthCertificate: true, aadharCard: true, passportPhoto: true, marksheet: false, transferCertificate: false, medicalCertificate: false, casteCertificate: true, incomeCertificate: true }),
    },
    {
      id: 'student-004', admissionNo: 'ADM-2024-004', name: 'Sneha Patil',
      email: 'sneha.patil@student.com', class: '11', section: 'A', rollNo: '03',
      gender: 'Female', dateOfBirth: '2008-05-30', status: 'active',
      phone: '9876543230', city: 'Pune', state: 'Maharashtra', pinCode: '411001',
      nationality: 'Indian', category: 'General', languageMedium: 'English',
      bloodGroup: 'AB+', parentName: 'Vijay Patil', parentPhone: '9876543231',
      fatherName: 'Vijay Patil', fatherOccupation: 'Doctor',
      motherName: 'Meena Patil', motherOccupation: 'Nurse',
      admissionDate: '2024-06-01', gpa: 9.0, rank: 2, disciplineScore: 96,
      documents: JSON.stringify({ birthCertificate: true, aadharCard: true, passportPhoto: true, marksheet: true, transferCertificate: true, medicalCertificate: true, casteCertificate: false, incomeCertificate: false }),
    },
    {
      id: 'student-005', admissionNo: 'ADM-2024-005', name: 'Arjun Nair',
      email: 'arjun.nair@student.com', class: '8', section: 'C', rollNo: '12',
      gender: 'Male', dateOfBirth: '2011-11-08', status: 'active',
      phone: '9876543240', city: 'Kochi', state: 'Kerala', pinCode: '682001',
      nationality: 'Indian', category: 'General', languageMedium: 'English',
      bloodGroup: 'O-', parentName: 'Krishnan Nair', parentPhone: '9876543241',
      fatherName: 'Krishnan Nair', fatherOccupation: 'Software Engineer',
      motherName: 'Lakshmi Nair', motherOccupation: 'CA',
      admissionDate: '2024-06-01', gpa: 8.9, rank: 4, disciplineScore: 92,
      documents: JSON.stringify({ birthCertificate: true, aadharCard: true, passportPhoto: true, marksheet: true, transferCertificate: false, medicalCertificate: false, casteCertificate: false, incomeCertificate: false }),
    },
  ];

  for (const s of studentsData) {
    await prisma.student.upsert({ where: { id: s.id }, update: {}, create: s as any });
  }

  console.log('✅ Students created');

  // ─── FEE RECORDS ─────────────────────────────────────────────────────────────
  const feeRecords = [
    // Student 001 - fully paid tuition
    { id: 'fr-001', studentId: 'student-001', feeStructureId: tuitionFee.id, amount: 12000, paidAmount: 12000, pendingAmount: 0, dueDate: '2024-07-10', paidDate: '2024-07-08', status: 'paid', paymentMethod: 'online', receiptNumber: 'RCPT-2024-001', academicYear: '2024-25' },
    // Student 001 - partial transport
    { id: 'fr-002', studentId: 'student-001', feeStructureId: transportFee.id, amount: 3000, paidAmount: 1500, pendingAmount: 1500, dueDate: '2024-08-05', status: 'partial', paymentMethod: 'cash', academicYear: '2024-25' },
    // Student 002 - paid tuition
    { id: 'fr-003', studentId: 'student-002', feeStructureId: tuitionFee.id, amount: 12000, paidAmount: 12000, pendingAmount: 0, dueDate: '2024-07-10', paidDate: '2024-07-05', status: 'paid', paymentMethod: 'bank_transfer', receiptNumber: 'RCPT-2024-002', academicYear: '2024-25' },
    // Student 003 - pending tuition
    { id: 'fr-004', studentId: 'student-003', feeStructureId: tuitionFee.id, amount: 12000, paidAmount: 0, pendingAmount: 12000, dueDate: '2024-07-10', status: 'overdue', academicYear: '2024-25' },
    // Student 004 - paid tuition + exam
    { id: 'fr-005', studentId: 'student-004', feeStructureId: tuitionFee.id, amount: 12000, paidAmount: 12000, pendingAmount: 0, dueDate: '2024-07-10', paidDate: '2024-07-02', status: 'paid', paymentMethod: 'online', receiptNumber: 'RCPT-2024-003', academicYear: '2024-25' },
    { id: 'fr-006', studentId: 'student-004', feeStructureId: examFee.id, amount: 1500, paidAmount: 1500, pendingAmount: 0, dueDate: '2024-08-15', paidDate: '2024-08-10', status: 'paid', paymentMethod: 'online', receiptNumber: 'RCPT-2024-004', academicYear: '2024-25' },
    // Student 005 - pending transport
    { id: 'fr-007', studentId: 'student-005', feeStructureId: transportFee.id, amount: 3000, paidAmount: 0, pendingAmount: 3000, dueDate: '2024-08-05', status: 'pending', academicYear: '2024-25' },
  ];

  for (const fr of feeRecords) {
    await prisma.feeRecord.upsert({ where: { id: fr.id }, update: {}, create: fr as any });
  }

  console.log('✅ Fee records created');

  // ─── PAYMENTS ────────────────────────────────────────────────────────────────
  await prisma.payment.upsert({
    where: { receiptNumber: 'RCPT-2024-001' },
    update: {},
    create: { feeRecordId: 'fr-001', amount: 12000, paymentMethod: 'online', receiptNumber: 'RCPT-2024-001', paymentDate: '2024-07-08', collectedBy: 'Admin User' },
  });
  await prisma.payment.upsert({
    where: { receiptNumber: 'RCPT-2024-002' },
    update: {},
    create: { feeRecordId: 'fr-003', amount: 12000, paymentMethod: 'bank_transfer', receiptNumber: 'RCPT-2024-002', paymentDate: '2024-07-05', collectedBy: 'Admin User' },
  });
  await prisma.payment.upsert({
    where: { receiptNumber: 'RCPT-2024-003' },
    update: {},
    create: { feeRecordId: 'fr-005', amount: 12000, paymentMethod: 'online', receiptNumber: 'RCPT-2024-003', paymentDate: '2024-07-02', collectedBy: 'Admin User' },
  });

  console.log('✅ Payments created');

  // ─── ATTENDANCE ──────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const attendanceRecords = [
    { studentId: 'student-001', date: today, status: 'present', class: '10', section: 'A', teacherId: teacher.id },
    { studentId: 'student-002', date: today, status: 'present', class: '10', section: 'A', teacherId: teacher.id },
    { studentId: 'student-003', date: today, status: 'absent', class: '9', section: 'B', teacherId: teacher.id },
    { studentId: 'student-004', date: today, status: 'present', class: '11', section: 'A', teacherId: teacher.id },
    { studentId: 'student-005', date: today, status: 'late', class: '8', section: 'C', teacherId: teacher.id },
    { studentId: 'student-001', date: yesterday, status: 'present', class: '10', section: 'A', teacherId: teacher.id },
    { studentId: 'student-002', date: yesterday, status: 'present', class: '10', section: 'A', teacherId: teacher.id },
    { studentId: 'student-003', date: yesterday, status: 'present', class: '9', section: 'B', teacherId: teacher.id },
  ];

  for (const rec of attendanceRecords) {
    await prisma.attendanceRecord.upsert({
      where: { studentId_date_subject: { studentId: rec.studentId, date: rec.date, subject: '' } },
      update: { status: rec.status },
      create: { ...rec, subject: '' },
    });
  }

  console.log('✅ Attendance records created');

  // ─── EXAMS ───────────────────────────────────────────────────────────────────
  const exam1 = await prisma.exam.upsert({
    where: { id: 'exam-001' },
    update: {},
    create: {
      id: 'exam-001', name: 'Mid-Term Mathematics', type: 'mid_term',
      class: '10', section: 'A', subject: 'Mathematics',
      date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      duration: 180, totalMarks: 100, passingMarks: 35,
      academicYear: '2024-25', status: 'scheduled', venue: 'Hall A',
    },
  });

  await prisma.exam.upsert({
    where: { id: 'exam-002' },
    update: {},
    create: {
      id: 'exam-002', name: 'Unit Test - English', type: 'unit_test',
      class: '9', section: 'B', subject: 'English',
      date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      duration: 90, totalMarks: 50, passingMarks: 18,
      academicYear: '2024-25', status: 'scheduled', venue: 'Room 12',
    },
  });

  console.log('✅ Exams created');

  // ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: 'ann-001' },
    update: {},
    create: {
      id: 'ann-001',
      title: 'Fee Payment Deadline Reminder',
      content: 'Q2 fee payment deadline is approaching. Please pay by the 10th to avoid late fees.',
      type: 'fee',
      targetRoles: JSON.stringify(['parent', 'student']),
      isActive: true,
    },
  });

  await prisma.announcement.upsert({
    where: { id: 'ann-002' },
    update: {},
    create: {
      id: 'ann-002',
      title: 'Mid-Term Examination Schedule',
      content: 'Mid-term examinations will begin from next week. Check the exam schedule on the portal.',
      type: 'exam',
      targetRoles: JSON.stringify(['student', 'parent', 'teacher']),
      isActive: true,
    },
  });

  console.log('✅ Announcements created');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:   admin@schoolerp.com  / admin123');
  console.log('   Teacher: teacher@schoolerp.com / teacher123');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
