#!/usr/bin/env tsx

/**
 * Migration Script: Migrate existing fines from FeeStructure/FeeRecord to new Fine system
 * 
 * This script:
 * 1. Creates default FineRule for migrated data
 * 2. Migrates FeeRecords with category='fine' to Fine model
 * 3. Migrates Payment records to FinePayment
 * 4. Preserves all payment history and receipts
 * 5. Marks old FeeStructures as migrated
 */

import { schoolPrisma } from '../src/lib/prisma';
import { getSessionContext } from '../src/lib/apiAuth';

// Helper function to generate fine numbers
function generateFineNumber(year: string, index: number): string {
  return `F-${year}-${String(index).padStart(4, '0')}`;
}

// Helper to determine fine type from description
function inferFineType(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('library') || desc.includes('book')) return 'library';
  if (desc.includes('late') && desc.includes('fee')) return 'late_fee';
  if (desc.includes('damage') || desc.includes('broken')) return 'damage';
  if (desc.includes('uniform') || desc.includes('dress')) return 'uniform';
  if (desc.includes('discipline') || desc.includes('behavior')) return 'discipline';
  if (desc.includes('transport') || desc.includes('bus')) return 'transport';
  if (desc.includes('id') || desc.includes('card')) return 'id_card';
  
  return 'other';
}

// Helper to determine fine category
function inferFineCategory(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('library') || desc.includes('book') || desc.includes('damage') || desc.includes('transport')) {
    return 'property';
  }
  if (desc.includes('late') && desc.includes('fee')) {
    return 'academic';
  }
  if (desc.includes('uniform') || desc.includes('discipline') || desc.includes('behavior')) {
    return 'behavioral';
  }
  
  return 'administrative';
}

async function migrateFines() {
  console.log('🚀 Starting fine migration...');
  
  try {
    // Get current academic year for fine numbering
    const currentAcademicYear = await schoolPrisma.academicYear.findFirst({
      where: { isActive: true }
    });
    
    if (!currentAcademicYear) {
      throw new Error('No active academic year found');
    }
    
    console.log(`📚 Using academic year: ${currentAcademicYear.name}`);
    
    // Step 1: Find all FeeStructures with category = 'fine'
    console.log('🔍 Finding existing fine fee structures...');
    const fineStructures = await schoolPrisma.feeStructure.findMany({
      where: { category: 'fine' },
      include: {
        feeRecords: {
          include: {
            student: true,
            payments: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${fineStructures.length} fine fee structures`);
    
    if (fineStructures.length === 0) {
      console.log('✅ No fines to migrate. Migration complete.');
      return;
    }
    
    // Step 2: Create default FineRule for migrated data
    console.log('📝 Creating default fine rule for migrated data...');
    const defaultRule = await schoolPrisma.fineRule.create({
      data: {
        schoolId: 'default', // Will be updated per school
        name: 'Migrated Fine (Legacy)',
        code: 'LEGACY_FINE',
        type: 'fixed',
        baseAmount: 0,
        triggerEvent: 'manual',
        applicableTo: 'all',
        autoApply: false,
        autoNotify: false,
        requiresApproval: false,
        academicYearId: currentAcademicYear.id,
        isActive: true
      }
    });
    
    console.log(`✅ Created default fine rule: ${defaultRule.id}`);
    
    // Step 3: Process each school separately
    const schools = await schoolPrisma.school.findMany({
      select: { id: true, name: true }
    });
    
    let totalMigrated = 0;
    let totalPayments = 0;
    
    for (const school of schools) {
      console.log(`\n🏫 Processing school: ${school.name}`);
      
      // Create school-specific fine rule
      const schoolRule = await schoolPrisma.fineRule.create({
        data: {
          schoolId: school.id,
          name: 'Migrated Fine (Legacy)',
          code: 'LEGACY_FINE',
          type: 'fixed',
          baseAmount: 0,
          triggerEvent: 'manual',
          applicableTo: 'all',
          autoApply: false,
          autoNotify: false,
          requiresApproval: false,
          academicYearId: currentAcademicYear.id,
          isActive: true
        }
      });
      
      // Get school's fine structures
      const schoolFineStructures = fineStructures.filter(fs => 
        fs.feeRecords.some(fr => fr.student.schoolId === school.id)
      );
      
      let schoolMigrated = 0;
      let schoolPayments = 0;
      
      // Step 4: Migrate FeeRecords to Fine model
      for (const structure of schoolFineStructures) {
        const schoolFeeRecords = structure.feeRecords.filter(fr => 
          fr.student.schoolId === school.id
        );
        
        for (const [index, record] of schoolFeeRecords.entries()) {
          // Generate fine number
          const fineNumber = generateFineNumber(
            currentAcademicYear.year,
            totalMigrated + index + 1
          );
          
          // Infer fine type and category
          const fineType = inferFineType(structure.name);
          const fineCategory = inferFineCategory(structure.name);
          
          // Determine status
          let status = 'pending';
          if (record.paidAmount >= (record.amount - record.discount)) {
            status = 'paid';
          } else if (record.paidAmount > 0) {
            status = 'partial';
          }
          
          // Create Fine record
          const fine = await schoolPrisma.fine.create({
            data: {
              schoolId: school.id,
              studentId: record.studentId,
              ruleId: schoolRule.id,
              fineNumber,
              type: fineType,
              category: fineCategory,
              description: structure.name,
              amount: record.amount,
              paidAmount: record.paidAmount,
              waivedAmount: 0,
              pendingAmount: Math.max(0, record.amount - record.paidAmount - record.discount),
              status,
              sourceType: 'manual',
              sourceId: record.id,
              issuedAt: record.createdAt,
              dueDate: new Date(record.dueDate),
              paidAt: record.paidDate ? new Date(record.paidDate) : null
            }
          });
          
          // Step 5: Migrate payments to FinePayment
          for (const payment of record.payments) {
            await schoolPrisma.finePayment.create({
              data: {
                fineId: fine.id,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                receiptNumber: payment.receiptNumber,
                collectedBy: payment.collectedBy || 'migrated',
                remarks: payment.remarks || 'Migrated from fee system',
                createdAt: payment.createdAt
              }
            });
            
            schoolPayments++;
            totalPayments++;
          }
          
          schoolMigrated++;
          totalMigrated++;
        }
        
        // Mark old FeeStructure as migrated
        await schoolPrisma.feeStructure.update({
          where: { id: structure.id },
          data: { 
            isActive: false,
            description: `MIGRATED_TO_FINE_SYSTEM: ${structure.name || 'N/A'}`
          }
        });
      }
      
      console.log(`  ✅ Migrated ${schoolMigrated} fines and ${schoolPayments} payments`);
      
      // Deactivate school-specific rule
      await schoolPrisma.fineRule.update({
        where: { id: schoolRule.id },
        data: { isActive: false }
      });
    }
    
    // Step 6: Clean up default rule
    await schoolPrisma.fineRule.delete({
      where: { id: defaultRule.id }
    });
    
    console.log('\n🎉 Migration Summary:');
    console.log(`  📊 Total fines migrated: ${totalMigrated}`);
    console.log(`  💰 Total payments migrated: ${totalPayments}`);
    console.log(`  📚 Academic year: ${currentAcademicYear.name}`);
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateFines()
    .then(() => {
      console.log('🏁 Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateFines };
