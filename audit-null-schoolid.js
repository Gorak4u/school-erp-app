// Audit script to find all records with null schoolId
// Run with: node audit-null-schoolid.js

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function auditNullSchoolId() {
  console.log('🔍 Starting audit for null schoolId values...\n');
  
  try {
    // 1. Check Students with null schoolId
    console.log('📊 Checking Students table...');
    const studentsWithNullSchool = await prisma.student.findMany({
      where: { schoolId: null },
      select: {
        id: true,
        name: true,
        class: true,
        rollNo: true,
        status: true,
        createdAt: true,
      }
    });
    
    console.log(`   Found ${studentsWithNullSchool.length} students with null schoolId`);
    if (studentsWithNullSchool.length > 0) {
      console.log('   Sample records:');
      studentsWithNullSchool.slice(0, 5).forEach(s => {
        console.log(`   - ${s.name} (${s.class}) - ID: ${s.id}`);
      });
    }
    console.log('');

    // 2. Check Fee Structures with null schoolId
    console.log('📊 Checking FeeStructure table...');
    const structuresWithNullSchool = await prisma.feeStructure.findMany({
      where: { schoolId: null },
      select: {
        id: true,
        name: true,
        category: true,
        amount: true,
        isActive: true,
        createdAt: true,
      }
    });
    
    console.log(`   Found ${structuresWithNullSchool.length} fee structures with null schoolId`);
    if (structuresWithNullSchool.length > 0) {
      console.log('   Sample records:');
      structuresWithNullSchool.slice(0, 5).forEach(s => {
        console.log(`   - ${s.name} (${s.category}) - Amount: ${s.amount} - ID: ${s.id}`);
      });
    }
    console.log('');

    // 3. Check Fee Records with students having null schoolId
    console.log('📊 Checking FeeRecord table (via student relationship)...');
    const feeRecordsWithNullSchool = await prisma.feeRecord.findMany({
      where: {
        student: {
          schoolId: null
        }
      },
      select: {
        id: true,
        receiptNumber: true,
        amount: true,
        paidAmount: true,
        student: {
          select: {
            id: true,
            name: true,
            class: true,
          }
        },
        createdAt: true,
      },
      take: 100 // Limit to prevent overwhelming output
    });
    
    console.log(`   Found ${feeRecordsWithNullSchool.length} fee records linked to students with null schoolId`);
    if (feeRecordsWithNullSchool.length > 0) {
      console.log('   Sample records:');
      feeRecordsWithNullSchool.slice(0, 5).forEach(r => {
        console.log(`   - ${r.receiptNumber} - Student: ${r.student.name} - Amount: ${r.amount} - ID: ${r.id}`);
      });
    }
    console.log('');

    // 4. Check Payments linked to students with null schoolId
    console.log('📊 Checking Payment table (via fee record -> student relationship)...');
    const paymentsWithNullSchool = await prisma.payment.findMany({
      where: {
        feeRecord: {
          student: {
            schoolId: null
          }
        }
      },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        paymentDate: true,
        feeRecord: {
          select: {
            student: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      take: 100
    });
    
    console.log(`   Found ${paymentsWithNullSchool.length} payments linked to students with null schoolId`);
    if (paymentsWithNullSchool.length > 0) {
      console.log('   Sample records:');
      paymentsWithNullSchool.slice(0, 5).forEach(p => {
        console.log(`   - Amount: ${p.amount} - Method: ${p.paymentMethod} - Student: ${p.feeRecord.student.name} - ID: ${p.id}`);
      });
    }
    console.log('');

    // Summary Report
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 AUDIT SUMMARY REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Students with null schoolId:        ${studentsWithNullSchool.length}`);
    console.log(`Fee Structures with null schoolId:  ${structuresWithNullSchool.length}`);
    console.log(`Fee Records affected:                ${feeRecordsWithNullSchool.length}`);
    console.log(`Payments affected:                   ${paymentsWithNullSchool.length}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    const totalAffected = studentsWithNullSchool.length + structuresWithNullSchool.length;
    
    if (totalAffected > 0) {
      console.log('\n⚠️  WARNING: Found records with null schoolId!');
      console.log('   These records are now only visible to Super Admins.');
      console.log('   Regular school admins cannot access these records.');
      console.log('\n📝 RECOMMENDED ACTIONS:');
      console.log('   1. Assign these records to appropriate schools');
      console.log('   2. Or mark them as inactive/archived');
      console.log('   3. Add database constraint to prevent future null values');
      console.log('\n💡 To fix, run the cleanup script: node cleanup-null-schoolid.js');
    } else {
      console.log('\n✅ No records with null schoolId found!');
      console.log('   All data is properly associated with schools.');
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditNullSchoolId()
  .then(() => {
    console.log('\n✅ Audit completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  });
