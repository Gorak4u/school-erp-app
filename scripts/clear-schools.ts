import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  console.log('🗑️  Clearing school data (preserving SaaS admin)...');
  
  await prisma.feeRecord.deleteMany({});
  console.log('✓ Cleared fee records');
  
  await prisma.feeArrears.deleteMany({});
  console.log('✓ Cleared fee arrears');
  
  await prisma.student.deleteMany({});
  console.log('✓ Cleared students');
  
  await prisma.feeStructure.deleteMany({});
  console.log('✓ Cleared fee structures');
  
  await prisma.section.deleteMany({});
  console.log('✓ Cleared sections');
  
  await prisma.class.deleteMany({});
  console.log('✓ Cleared classes');
  
  await prisma.medium.deleteMany({});
  console.log('✓ Cleared mediums');
  
  await prisma.board.deleteMany({});
  console.log('✓ Cleared boards');
  
  await prisma.academicYear.deleteMany({});
  console.log('✓ Cleared academic years');
  
  await prisma.school_User.deleteMany({});
  console.log('✓ Cleared school users');
  
  await prisma.subscription.deleteMany({});
  console.log('✓ Cleared subscriptions');
  
  await prisma.school.deleteMany({});
  console.log('✓ Cleared schools');
  
  console.log('✅ All school data cleared. SaaS admin preserved.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Cleanup failed:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
