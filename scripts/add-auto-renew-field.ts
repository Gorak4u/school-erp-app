import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function addAutoRenewToExistingSubscriptions() {
  try {
    console.log('🔄 Adding autoRenew field to existing subscriptions...');

    // Get all existing subscriptions
    const subscriptions = await prisma.subscription.findMany();
    
    console.log(`Found ${subscriptions.length} existing subscriptions`);

    // Update each subscription to add autoRenew field
    for (const subscription of subscriptions) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { autoRenew: false } // Default to false for safety
      });
      
      console.log(`✅ Updated subscription ${subscription.id} for school ${subscription.schoolId}`);
    }

    console.log('🎉 All subscriptions updated with autoRenew field!');
    
  } catch (error) {
    console.error('❌ Error updating subscriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAutoRenewToExistingSubscriptions();
