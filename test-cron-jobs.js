#!/usr/bin/env node

/**
 * Test script to verify cron jobs are working
 * Run this script to test the cron job system
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET environment variable is required');
  process.exit(1);
}

async function testCronJobs() {
  console.log('🧪 Testing Cron Job System...\n');

  try {
    // 1. Test cron job status
    console.log('1. Getting cron job status...');
    const statusResponse = await fetch(`${BASE_URL}/api/cron/manage`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }
    
    const statusData = await statusResponse.json();
    console.log('✅ Cron job status retrieved');
    console.log(`   Total jobs: ${statusData.status?.total || 0}`);
    console.log(`   Running jobs: ${statusData.status?.running || 0}\n`);

    // 2. Test manual trigger of outbox processing
    console.log('2. Testing manual outbox processing...');
    const triggerResponse = await fetch(`${BASE_URL}/api/cron/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'trigger',
        jobName: 'process-communication-outbox'
      }),
    });
    
    if (!triggerResponse.ok) {
      throw new Error(`Manual trigger failed: ${triggerResponse.status}`);
    }
    
    const triggerData = await triggerResponse.json();
    console.log('✅ Manual trigger successful');
    console.log(`   Result: ${triggerData.message}\n`);

    // 3. Test direct outbox processing endpoint
    console.log('3. Testing direct outbox processing endpoint...');
    const outboxResponse = await fetch(`${BASE_URL}/api/cron/process-communication-outbox`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit: 10 }),
    });
    
    if (!outboxResponse.ok) {
      throw new Error(`Outbox processing failed: ${outboxResponse.status}`);
    }
    
    const outboxData = await outboxResponse.json();
    console.log('✅ Direct outbox processing successful');
    console.log(`   Processed: ${outboxData.result?.processed || 0}`);
    console.log(`   Sent: ${outboxData.result?.sent || 0}`);
    console.log(`   Failed: ${outboxData.result?.failed || 0}\n`);

    // 4. Test statistics update
    console.log('4. Testing statistics update...');
    const statsResponse = await fetch(`${BASE_URL}/api/cron/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'trigger',
        jobName: 'update-statistics'
      }),
    });
    
    if (!statsResponse.ok) {
      throw new Error(`Statistics update failed: ${statsResponse.status}`);
    }
    
    const statsData = await statsResponse.json();
    console.log('✅ Statistics update successful');
    console.log(`   Result: ${statsData.message}\n`);

    console.log('🎉 All cron job tests passed!');
    console.log('\n📋 Summary:');
    console.log('   - Cron job management API is working');
    console.log('   - Manual job triggering is working');
    console.log('   - Outbox processing is working');
    console.log('   - Statistics update is working');
    console.log('\n💡 To access the cron management UI, visit:');
    console.log(`   ${BASE_URL}/admin/cron`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your application is running');
    console.log('   2. Check that CRON_SECRET is set correctly');
    console.log('   3. Verify the BASE_URL is correct');
    console.log('   4. Check application logs for errors');
    process.exit(1);
  }
}

// Run the test
testCronJobs();
