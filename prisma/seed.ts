import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  console.log('🌱 Starting seed...');

  // ─── SAAS ADMIN USER ─────────────────────────────────────────────────────
  console.log('👤 Creating SaaS admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@schoolerp.com' },
    update: {},
    create: {
      email: 'admin@schoolerp.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin',
      isSuperAdmin: true,
    },
  });
  console.log('✅ SaaS admin created: admin@schoolerp.com / admin123');

  // ─── SCHOOL 1: Delhi Public School ──────────────────────────────────────
  console.log('\n🏫 Creating School 1: Delhi Public School...');
  const school1 = await prisma.school.create({
    data: {
      name: 'Delhi Public School',
      slug: 'dps-delhi',
      domain: 'dps-delhi',
      email: 'admin@dpsdelhi.edu.in',
      phone: '+91-11-26854321',
      address: 'Mathura Road, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110076',
      isActive: true,
      subscription: {
        create: {
          plan: 'professional',
          status: 'active',
          billingCycle: 'annual',
          maxStudents: 1000,
          maxTeachers: 50,
          currentPeriodStart: new Date('2024-01-01'),
          currentPeriodEnd: new Date('2024-12-31'),
          price: 50000,
        },
      },
    },
  });

  // School 1 Admin
  await prisma.school_User.create({
    data: {
      id: `school1-admin-${Date.now()}`,
      email: 'principal@dpsdelhi.edu.in',
      password: await bcrypt.hash('dps@2024', 10),
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'admin',
      schoolId: school1.id,
      updatedAt: new Date(),
    },
  });

  // School 1: Academic Structure
  const dps_ay_2024 = await prisma.academicYear.create({
    data: {
      year: `DPS-2024-25-${Date.now()}`,
      name: 'Academic Year 2024-25',
      startDate: '2024-04-01',
      endDate: '2025-03-31',
      isActive: true,
    },
  });

  const dps_english = await prisma.medium.create({
    data: {
      code: `DPS-ENG-${Date.now()}`,
      name: 'English',
      description: 'English Medium',
      academicYearId: dps_ay_2024.id,
    },
  });

  const dps_class10 = await prisma.class.create({
    data: {
      code: `DPS-10-${Date.now()}`,
      name: 'Class 10',
      level: '10',
      mediumId: dps_english.id,
      academicYearId: dps_ay_2024.id,
    },
  });

  const dps_class9 = await prisma.class.create({
    data: {
      code: `DPS-9-${Date.now()}`,
      name: 'Class 9',
      level: '9',
      mediumId: dps_english.id,
      academicYearId: dps_ay_2024.id,
    },
  });

  const dps_sectionA = await prisma.section.create({
    data: {
      code: `DPS-10A-${Date.now()}`,
      name: 'A',
      classId: dps_class10.id,
      academicYearId: dps_ay_2024.id,
      capacity: 40,
    },
  });

  const dps_sectionB = await prisma.section.create({
    data: {
      code: `DPS-9B-${Date.now()}`,
      name: 'B',
      classId: dps_class9.id,
      academicYearId: dps_ay_2024.id,
      capacity: 35,
    },
  });

  const dps_cbse = await prisma.board.create({
    data: {
      code: `DPS-CBSE-${Date.now()}`,
      name: 'CBSE',
      description: 'Central Board of Secondary Education',
    },
  });

  // School 1: Fee Structures
  const dps_feeStruct = await prisma.feeStructure.create({
    data: {
      name: 'Class 10 Annual Fee',
      category: 'tuition',
      amount: 45000,
      frequency: 'annual',
      description: 'Annual tuition and facility fee',
      academicYearId: dps_ay_2024.id,
      boardId: dps_cbse.id,
      mediumId: dps_english.id,
      classId: dps_class10.id,
    },
  });

  const dps_feeStruct9 = await prisma.feeStructure.create({
    data: {
      name: 'Class 9 Annual Fee',
      category: 'tuition',
      amount: 42000,
      frequency: 'annual',
      description: 'Annual tuition and facility fee',
      academicYearId: dps_ay_2024.id,
      boardId: dps_cbse.id,
      mediumId: dps_english.id,
      classId: dps_class9.id,
    },
  });

  // School 1: 10 Students
  const dpsStudents = [
    { name: 'Aarav Sharma', class: 'Class 10', section: 'A', rollNo: '10A01', dob: '2009-05-15', gender: 'Male', parent: 'Mr. Rajesh Sharma', phone: '+91-9876543210', email: 'aarav.sharma@student.dps.in', city: 'Delhi', state: 'Delhi', feeStruct: dps_feeStruct },
    { name: 'Diya Patel', class: 'Class 10', section: 'A', rollNo: '10A02', dob: '2009-08-22', gender: 'Female', parent: 'Mrs. Priya Patel', phone: '+91-9876543211', email: 'diya.patel@student.dps.in', city: 'Delhi', state: 'Delhi', feeStruct: dps_feeStruct },
    { name: 'Arjun Singh', class: 'Class 10', section: 'A', rollNo: '10A03', dob: '2009-03-10', gender: 'Male', parent: 'Mr. Vikram Singh', phone: '+91-9876543212', email: 'arjun.singh@student.dps.in', city: 'Noida', state: 'Uttar Pradesh', feeStruct: dps_feeStruct },
    { name: 'Ananya Gupta', class: 'Class 10', section: 'A', rollNo: '10A04', dob: '2009-11-30', gender: 'Female', parent: 'Mr. Suresh Gupta', phone: '+91-9876543213', email: 'ananya.gupta@student.dps.in', city: 'Gurgaon', state: 'Haryana', feeStruct: dps_feeStruct },
    { name: 'Kabir Mehta', class: 'Class 10', section: 'A', rollNo: '10A05', dob: '2009-07-18', gender: 'Male', parent: 'Mrs. Neha Mehta', phone: '+91-9876543214', email: 'kabir.mehta@student.dps.in', city: 'Delhi', state: 'Delhi', feeStruct: dps_feeStruct },
    { name: 'Saanvi Reddy', class: 'Class 9', section: 'B', rollNo: '09B01', dob: '2010-02-14', gender: 'Female', parent: 'Mr. Ravi Reddy', phone: '+91-9876543215', email: 'saanvi.reddy@student.dps.in', city: 'Delhi', state: 'Delhi', feeStruct: dps_feeStruct9 },
    { name: 'Vivaan Kumar', class: 'Class 9', section: 'B', rollNo: '09B02', dob: '2010-09-05', gender: 'Male', parent: 'Mr. Amit Kumar', phone: '+91-9876543216', email: 'vivaan.kumar@student.dps.in', city: 'Faridabad', state: 'Haryana', feeStruct: dps_feeStruct9 },
    { name: 'Aisha Khan', class: 'Class 9', section: 'B', rollNo: '09B03', dob: '2010-06-20', gender: 'Female', parent: 'Mr. Salman Khan', phone: '+91-9876543217', email: 'aisha.khan@student.dps.in', city: 'Delhi', state: 'Delhi', feeStruct: dps_feeStruct9 },
    { name: 'Reyansh Joshi', class: 'Class 9', section: 'B', rollNo: '09B04', dob: '2010-12-08', gender: 'Male', parent: 'Mrs. Kavita Joshi', phone: '+91-9876543218', email: 'reyansh.joshi@student.dps.in', city: 'Delhi', state: 'Delhi', feeStruct: dps_feeStruct9 },
    { name: 'Myra Desai', class: 'Class 9', section: 'B', rollNo: '09B05', dob: '2010-04-25', gender: 'Female', parent: 'Mr. Kiran Desai', phone: '+91-9876543219', email: 'myra.desai@student.dps.in', city: 'Ghaziabad', state: 'Uttar Pradesh', feeStruct: dps_feeStruct9 },
  ];

  for (const std of dpsStudents) {
    const student = await prisma.student.create({
      data: {
        schoolId: school1.id,
        name: std.name,
        admissionNo: `DPS2024${std.rollNo.replace(/[^0-9]/g, '')}`,
        class: std.class,
        section: std.section,
        rollNo: std.rollNo,
        dateOfBirth: std.dob,
        gender: std.gender,
        email: std.email,
        phone: std.phone,
        parentName: std.parent,
        parentPhone: std.phone,
        parentEmail: std.email.replace('student', 'parent'),
        address: `House ${Math.floor(Math.random() * 500)}, Sector ${Math.floor(Math.random() * 50)}`,
        city: std.city,
        state: std.state,
        pinCode: '110001',
        status: 'active',
        academicYear: dps_ay_2024.year,
        academicYearId: dps_ay_2024.id,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
        admissionDate: '2024-04-01',
      },
    });

    const isPaid = Math.random() > 0.3;
    await prisma.feeRecord.create({
      data: {
        studentId: student.id,
        feeStructureId: std.feeStruct.id,
        amount: std.feeStruct.amount,
        paidAmount: isPaid ? std.feeStruct.amount : Math.floor(std.feeStruct.amount * 0.6),
        pendingAmount: isPaid ? 0 : Math.floor(std.feeStruct.amount * 0.4),
        dueDate: '2024-08-31',
        status: isPaid ? 'paid' : 'pending',
        academicYear: dps_ay_2024.year,
      },
    });
  }
  console.log('✅ DPS: 10 students created with fee records');

  // ─── SCHOOL 2: St. Xavier's High School ────────────────────────────────
  console.log('\n🏫 Creating School 2: St. Xavier\'s High School...');
  const school2 = await prisma.school.create({
    data: {
      name: "St. Xavier's High School",
      slug: 'stxaviers-mumbai',
      domain: 'stxaviers-mumbai',
      email: 'info@stxaviers.edu.in',
      phone: '+91-22-22620661',
      address: '5 Mahapalika Marg, Fort',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      isActive: true,
      subscription: {
        create: {
          plan: 'premium',
          status: 'active',
          billingCycle: 'annual',
          maxStudents: 1500,
          maxTeachers: 75,
          currentPeriodStart: new Date('2024-01-01'),
          currentPeriodEnd: new Date('2024-12-31'),
          price: 75000,
        },
      },
    },
  });

  await prisma.school_User.create({
    data: {
      id: `school2-admin-${Date.now()}`,
      email: 'principal@stxaviers.edu.in',
      password: await bcrypt.hash('xavier@2024', 10),
      firstName: 'Father',
      lastName: "D'Souza",
      role: 'admin',
      schoolId: school2.id,
      updatedAt: new Date(),
    },
  });

  const xavier_ay_2024 = await prisma.academicYear.create({
    data: {
      year: `XAV-2024-25-${Date.now()}`,
      name: 'Academic Year 2024-25',
      startDate: '2024-06-01',
      endDate: '2025-04-30',
      isActive: true,
    },
  });

  const xavier_english = await prisma.medium.create({
    data: {
      code: `XAV-ENG-${Date.now()}`,
      name: 'English',
      academicYearId: xavier_ay_2024.id,
    },
  });

  const xavier_class12 = await prisma.class.create({
    data: {
      code: `XAV-12-${Date.now()}`,
      name: 'Class 12',
      level: '12',
      mediumId: xavier_english.id,
      academicYearId: xavier_ay_2024.id,
    },
  });

  const xavier_class11 = await prisma.class.create({
    data: {
      code: `XAV-11-${Date.now()}`,
      name: 'Class 11',
      level: '11',
      mediumId: xavier_english.id,
      academicYearId: xavier_ay_2024.id,
    },
  });

  const xavier_sectionA = await prisma.section.create({
    data: {
      code: `XAV-12A-${Date.now()}`,
      name: 'A',
      classId: xavier_class12.id,
      academicYearId: xavier_ay_2024.id,
      capacity: 50,
    },
  });

  const xavier_sectionB = await prisma.section.create({
    data: {
      code: `XAV-11A-${Date.now()}`,
      name: 'A',
      classId: xavier_class11.id,
      academicYearId: xavier_ay_2024.id,
      capacity: 45,
    },
  });

  const xavier_icse = await prisma.board.create({
    data: {
      code: `XAV-ICSE-${Date.now()}`,
      name: 'ICSE',
      description: 'Indian Certificate of Secondary Education',
    },
  });

  const xavier_feeStruct12 = await prisma.feeStructure.create({
    data: {
      name: 'Class 12 Commerce Fee',
      category: 'tuition',
      amount: 65000,
      frequency: 'annual',
      description: 'Annual fee for Class 12 Commerce stream',
      academicYearId: xavier_ay_2024.id,
      boardId: xavier_icse.id,
      mediumId: xavier_english.id,
      classId: xavier_class12.id,
    },
  });

  const xavier_feeStruct11 = await prisma.feeStructure.create({
    data: {
      name: 'Class 11 Science Fee',
      category: 'tuition',
      amount: 68000,
      frequency: 'annual',
      description: 'Annual fee for Class 11 Science stream',
      academicYearId: xavier_ay_2024.id,
      boardId: xavier_icse.id,
      mediumId: xavier_english.id,
      classId: xavier_class11.id,
    },
  });

  const xavierStudents = [
    { name: 'Rahul Kapoor', class: 'Class 12', section: 'A', rollNo: '12A01', dob: '2007-01-15', gender: 'Male', parent: 'Mr. Anil Kapoor', phone: '+91-9123456780', email: 'rahul.kapoor@xavier.edu.in', city: 'Mumbai', state: 'Maharashtra', feeStruct: xavier_feeStruct12 },
    { name: 'Priya Nair', class: 'Class 12', section: 'A', rollNo: '12A02', dob: '2007-04-22', gender: 'Female', parent: 'Mrs. Lakshmi Nair', phone: '+91-9123456781', email: 'priya.nair@xavier.edu.in', city: 'Mumbai', state: 'Maharashtra', feeStruct: xavier_feeStruct12 },
    { name: 'Rohan Malhotra', class: 'Class 12', section: 'A', rollNo: '12A03', dob: '2007-08-10', gender: 'Male', parent: 'Mr. Vikram Malhotra', phone: '+91-9123456782', email: 'rohan.malhotra@xavier.edu.in', city: 'Navi Mumbai', state: 'Maharashtra', feeStruct: xavier_feeStruct12 },
    { name: 'Sneha Iyer', class: 'Class 12', section: 'A', rollNo: '12A04', dob: '2007-11-05', gender: 'Female', parent: 'Mr. Krishnan Iyer', phone: '+91-9123456783', email: 'sneha.iyer@xavier.edu.in', city: 'Mumbai', state: 'Maharashtra', feeStruct: xavier_feeStruct12 },
    { name: 'Aditya Verma', class: 'Class 12', section: 'A', rollNo: '12A05', dob: '2007-06-18', gender: 'Male', parent: 'Mrs. Sunita Verma', phone: '+91-9123456784', email: 'aditya.verma@xavier.edu.in', city: 'Thane', state: 'Maharashtra', feeStruct: xavier_feeStruct12 },
    { name: 'Ishita Bose', class: 'Class 11', section: 'A', rollNo: '11A01', dob: '2008-03-12', gender: 'Female', parent: 'Dr. Arnab Bose', phone: '+91-9123456785', email: 'ishita.bose@xavier.edu.in', city: 'Mumbai', state: 'Maharashtra', feeStruct: xavier_feeStruct11 },
    { name: 'Karthik Menon', class: 'Class 11', section: 'A', rollNo: '11A02', dob: '2008-09-28', gender: 'Male', parent: 'Mr. Suresh Menon', phone: '+91-9123456786', email: 'karthik.menon@xavier.edu.in', city: 'Mumbai', state: 'Maharashtra', feeStruct: xavier_feeStruct11 },
    { name: 'Tanvi Shah', class: 'Class 11', section: 'A', rollNo: '11A03', dob: '2008-07-14', gender: 'Female', parent: 'Mr. Hiren Shah', phone: '+91-9123456787', email: 'tanvi.shah@xavier.edu.in', city: 'Mumbai', state: 'Maharashtra', feeStruct: xavier_feeStruct11 },
    { name: 'Aryan Chopra', class: 'Class 11', section: 'A', rollNo: '11A04', dob: '2008-12-02', gender: 'Male', parent: 'Mrs. Meera Chopra', phone: '+91-9123456788', email: 'aryan.chopra@xavier.edu.in', city: 'Mumbai', state: 'Maharashtra', feeStruct: xavier_feeStruct11 },
    { name: 'Riya Pillai', class: 'Class 11', section: 'A', rollNo: '11A05', dob: '2008-05-20', gender: 'Female', parent: 'Mr. Raghav Pillai', phone: '+91-9123456789', email: 'riya.pillai@xavier.edu.in', city: 'Pune', state: 'Maharashtra', feeStruct: xavier_feeStruct11 },
  ];

  for (const std of xavierStudents) {
    const student = await prisma.student.create({
      data: {
        schoolId: school2.id,
        name: std.name,
        admissionNo: `XAV2024${std.rollNo.replace(/[^0-9]/g, '')}`,
        class: std.class,
        section: std.section,
        rollNo: std.rollNo,
        dateOfBirth: std.dob,
        gender: std.gender,
        email: std.email,
        phone: std.phone,
        parentName: std.parent,
        parentPhone: std.phone,
        parentEmail: std.email.replace('xavier', 'parent'),
        address: `Building ${Math.floor(Math.random() * 100)}, ${['Andheri', 'Bandra', 'Churchgate', 'Dadar'][Math.floor(Math.random() * 4)]}`,
        city: std.city,
        state: std.state,
        pinCode: '400001',
        status: 'active',
        academicYear: xavier_ay_2024.year,
        academicYearId: xavier_ay_2024.id,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][Math.floor(Math.random() * 5)],
        admissionDate: '2024-06-01',
      },
    });

    const isPaid = Math.random() > 0.3;
    await prisma.feeRecord.create({
      data: {
        studentId: student.id,
        feeStructureId: std.feeStruct.id,
        amount: std.feeStruct.amount,
        paidAmount: isPaid ? std.feeStruct.amount : Math.floor(std.feeStruct.amount * 0.5),
        pendingAmount: isPaid ? 0 : Math.floor(std.feeStruct.amount * 0.5),
        dueDate: '2024-09-30',
        status: isPaid ? 'paid' : 'pending',
        academicYear: xavier_ay_2024.year,
      },
    });
  }
  console.log('✅ St. Xavier\'s: 10 students created with fee records');

  // ─── SCHOOL 3: DAV Public School ────────────────────────────────────────
  console.log('\n🏫 Creating School 3: DAV Public School...');
  const school3 = await prisma.school.create({
    data: {
      name: 'DAV Public School',
      slug: 'dav-bangalore',
      domain: 'dav-bangalore',
      email: 'office@davbangalore.edu.in',
      phone: '+91-80-25587654',
      address: 'Jayanagar 9th Block',
      city: 'Bangalore',
      state: 'Karnataka',
      pinCode: '560069',
      isActive: true,
      subscription: {
        create: {
          plan: 'basic',
          status: 'active',
          billingCycle: 'monthly',
          maxStudents: 500,
          maxTeachers: 25,
          currentPeriodStart: new Date('2024-01-01'),
          currentPeriodEnd: new Date('2025-01-01'),
          price: 25000,
        },
      },
    },
  });

  await prisma.school_User.create({
    data: {
      id: `school3-admin-${Date.now()}`,
      email: 'principal@davbangalore.edu.in',
      password: await bcrypt.hash('dav@2024', 10),
      firstName: 'Dr. Sunita',
      lastName: 'Rao',
      role: 'admin',
      schoolId: school3.id,
      updatedAt: new Date(),
    },
  });

  const dav_ay_2024 = await prisma.academicYear.create({
    data: {
      year: `DAV-2024-25-${Date.now()}`,
      name: 'Academic Year 2024-25',
      startDate: '2024-04-01',
      endDate: '2025-03-31',
      isActive: true,
    },
  });

  const dav_english = await prisma.medium.create({
    data: {
      code: `DAV-ENG-${Date.now()}`,
      name: 'English',
      academicYearId: dav_ay_2024.id,
    },
  });

  const dav_class8 = await prisma.class.create({
    data: {
      code: `DAV-8-${Date.now()}`,
      name: 'Class 8',
      level: '8',
      mediumId: dav_english.id,
      academicYearId: dav_ay_2024.id,
    },
  });

  const dav_class7 = await prisma.class.create({
    data: {
      code: `DAV-7-${Date.now()}`,
      name: 'Class 7',
      level: '7',
      mediumId: dav_english.id,
      academicYearId: dav_ay_2024.id,
    },
  });

  const dav_sectionA = await prisma.section.create({
    data: {
      code: `DAV-8A-${Date.now()}`,
      name: 'A',
      classId: dav_class8.id,
      academicYearId: dav_ay_2024.id,
      capacity: 35,
    },
  });

  const dav_sectionB = await prisma.section.create({
    data: {
      code: `DAV-7B-${Date.now()}`,
      name: 'B',
      classId: dav_class7.id,
      academicYearId: dav_ay_2024.id,
      capacity: 30,
    },
  });

  const dav_cbse = await prisma.board.create({
    data: {
      code: `DAV-CBSE-${Date.now()}`,
      name: 'CBSE',
      description: 'Central Board of Secondary Education',
    },
  });

  const dav_feeStruct8 = await prisma.feeStructure.create({
    data: {
      name: 'Class 8 Annual Fee',
      category: 'tuition',
      amount: 35000,
      frequency: 'annual',
      description: 'Standard VIII annual fee',
      academicYearId: dav_ay_2024.id,
      boardId: dav_cbse.id,
      mediumId: dav_english.id,
      classId: dav_class8.id,
    },
  });

  const dav_feeStruct7 = await prisma.feeStructure.create({
    data: {
      name: 'Class 7 Annual Fee',
      category: 'tuition',
      amount: 32000,
      frequency: 'annual',
      description: 'Standard VII annual fee',
      academicYearId: dav_ay_2024.id,
      boardId: dav_cbse.id,
      mediumId: dav_english.id,
      classId: dav_class7.id,
    },
  });

  const davStudents = [
    { name: 'Advait Shetty', class: 'Class 8', section: 'A', rollNo: '08A01', dob: '2011-02-10', gender: 'Male', parent: 'Mr. Ganesh Shetty', phone: '+91-9845012345', email: 'advait.shetty@dav.edu.in', city: 'Bangalore', state: 'Karnataka', feeStruct: dav_feeStruct8 },
    { name: 'Nandini Hegde', class: 'Class 8', section: 'A', rollNo: '08A02', dob: '2011-06-18', gender: 'Female', parent: 'Mrs. Kavya Hegde', phone: '+91-9845012346', email: 'nandini.hegde@dav.edu.in', city: 'Bangalore', state: 'Karnataka', feeStruct: dav_feeStruct8 },
    { name: 'Dhruv Iyengar', class: 'Class 8', section: 'A', rollNo: '08A03', dob: '2011-09-25', gender: 'Male', parent: 'Mr. Raghav Iyengar', phone: '+91-9845012347', email: 'dhruv.iyengar@dav.edu.in', city: 'Bangalore', state: 'Karnataka', feeStruct: dav_feeStruct8 },
    { name: 'Vedika Nayak', class: 'Class 8', section: 'A', rollNo: '08A04', dob: '2011-04-30', gender: 'Female', parent: 'Dr. Prasad Nayak', phone: '+91-9845012348', email: 'vedika.nayak@dav.edu.in', city: 'Bangalore', state: 'Karnataka', feeStruct: dav_feeStruct8 },
    { name: 'Arnav Kulkarni', class: 'Class 8', section: 'A', rollNo: '08A05', dob: '2011-11-12', gender: 'Male', parent: 'Mrs. Priya Kulkarni', phone: '+91-9845012349', email: 'arnav.kulkarni@dav.edu.in', city: 'Mysore', state: 'Karnataka', feeStruct: dav_feeStruct8 },
    { name: 'Aarohi Bhat', class: 'Class 7', section: 'B', rollNo: '07B01', dob: '2012-01-08', gender: 'Female', parent: 'Mr. Sudhir Bhat', phone: '+91-9845012350', email: 'aarohi.bhat@dav.edu.in', city: 'Bangalore', state: 'Karnataka', feeStruct: dav_feeStruct7 },
    { name: 'Shivansh Reddy', class: 'Class 7', section: 'B', rollNo: '07B02', dob: '2012-07-22', gender: 'Male', parent: 'Mr. Kiran Reddy', phone: '+91-9845012351', email: 'shivansh.reddy@dav.edu.in', city: 'Bangalore', state: 'Karnataka', feeStruct: dav_feeStruct7 },
    { name: 'Kavya Acharya', class: 'Class 7', section: 'B', rollNo: '07B03', dob: '2012-03-15', gender: 'Female', parent: 'Mrs. Suma Acharya', phone: '+91-9845012352', email: 'kavya.acharya@dav.edu.in', city: 'Bangalore', state: 'Karnataka', feeStruct: dav_feeStruct7 },
    { name: 'Atharv Kamath', class: 'Class 7', section: 'B', rollNo: '07B04', dob: '2012-10-05', gender: 'Male', parent: 'Dr. Uday Kamath', phone: '+91-9845012353', email: 'atharv.kamath@dav.edu.in', city: 'Mangalore', state: 'Karnataka', feeStruct: dav_feeStruct7 },
    { name: 'Anvi Pai', class: 'Class 7', section: 'B', rollNo: '07B05', dob: '2012-12-28', gender: 'Female', parent: 'Mr. Mohan Pai', phone: '+91-9845012354', email: 'anvi.pai@dav.edu.in', city: 'Bangalore', state: 'Karnataka', feeStruct: dav_feeStruct7 },
  ];

  for (const std of davStudents) {
    const student = await prisma.student.create({
      data: {
        schoolId: school3.id,
        name: std.name,
        admissionNo: `DAV2024${std.rollNo.replace(/[^0-9]/g, '')}`,
        class: std.class,
        section: std.section,
        rollNo: std.rollNo,
        dateOfBirth: std.dob,
        gender: std.gender,
        email: std.email,
        phone: std.phone,
        parentName: std.parent,
        parentPhone: std.phone,
        parentEmail: std.email.replace('dav', 'parent'),
        address: `${Math.floor(Math.random() * 200)}, ${['Jayanagar', 'Koramangala', 'Indiranagar', 'Whitefield'][Math.floor(Math.random() * 4)]}`,
        city: std.city,
        state: std.state,
        pinCode: '560069',
        status: 'active',
        academicYear: dav_ay_2024.year,
        academicYearId: dav_ay_2024.id,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
        admissionDate: '2024-04-01',
      },
    });

    const isPaid = Math.random() > 0.4;
    await prisma.feeRecord.create({
      data: {
        studentId: student.id,
        feeStructureId: std.feeStruct.id,
        amount: std.feeStruct.amount,
        paidAmount: isPaid ? std.feeStruct.amount : Math.floor(std.feeStruct.amount * 0.7),
        pendingAmount: isPaid ? 0 : Math.floor(std.feeStruct.amount * 0.3),
        dueDate: '2024-07-31',
        status: isPaid ? 'paid' : 'pending',
        academicYear: dav_ay_2024.year,
      },
    });
  }
  console.log('✅ DAV: 10 students created with fee records');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   • 1 SaaS Admin: admin@schoolerp.com / admin123');
  console.log('   • 3 Schools with complete structure');
  console.log('   • 30 Students total (10 per school)');
  console.log('   • Fee structures and records for all students');
  console.log('\n🔐 School Admin Logins:');
  console.log('   • DPS Delhi: principal@dpsdelhi.edu.in / dps@2024');
  console.log('   • St. Xavier\'s: principal@stxaviers.edu.in / xavier@2024');
  console.log('   • DAV Bangalore: principal@davbangalore.edu.in / dav@2024');
  console.log('\n🌐 School Domains (for subdomain feature):');
  console.log('   • dps-delhi.localhost:3000');
  console.log('   • stxaviers-mumbai.localhost:3000');
  console.log('   • dav-bangalore.localhost:3000');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
