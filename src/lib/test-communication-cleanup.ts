import { schoolPrisma } from '@/lib/prisma';

/**
 * Test script to create sample CommunicationOutbox data for testing cleanup
 * This should only be used in development/testing environments
 */
export async function createTestCommunicationOutboxData() {
  console.log('🧪 Creating test CommunicationOutbox data...');

  const testRecords = [];
  const now = new Date();

  // Create test records with different ages and statuses
  const testCases = [
    { status: 'sent', daysOld: 35, count: 10 }, // Should be deleted (30 days retention)
    { status: 'sent', daysOld: 25, count: 5 },  // Should be kept (30 days retention)
    { status: 'dead_letter', daysOld: 10, count: 3 }, // Should be deleted (7 days retention)
    { status: 'dead_letter', daysOld: 5, count: 2 },   // Should be kept (7 days retention)
    { status: 'failed', daysOld: 20, count: 4 },  // Should be deleted (14 days retention)
    { status: 'failed', daysOld: 10, count: 3 },  // Should be kept (14 days retention)
    { status: 'pending', daysOld: 5, count: 2 },  // Should be kept (no cleanup for pending)
    { status: 'processing', daysOld: 1, count: 1 }, // Should be kept (no cleanup for processing)
  ];

  for (const testCase of testCases) {
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - testCase.daysOld);

    for (let i = 0; i < testCase.count; i++) {
      testRecords.push({
        schoolId: 'test-school-id',
        channel: 'email',
        templateKey: 'test_template',
        recipientUserId: `test-user-${i}`,
        recipientAddress: `test${i}@example.com`,
        payloadJson: JSON.stringify({
          subject: `Test Email ${i}`,
          html: `<p>Test content ${i}</p>`,
        }),
        dedupeKey: `test-dedupe-${testCase.status}-${i}`,
        status: testCase.status,
        attemptCount: testCase.status === 'sent' ? 1 : testCase.status === 'dead_letter' ? 5 : 0,
        nextAttemptAt: testCase.status === 'failed' ? new Date(now.getTime() + 60000) : null,
        lastError: testCase.status === 'dead_letter' ? 'Max retries exceeded' : null,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  try {
    // Insert test records
    const result = await (schoolPrisma as any).communicationOutbox.createMany({
      data: testRecords,
      skipDuplicates: true,
    });

    console.log(`✅ Created ${result.count} test CommunicationOutbox records`);
    
    // Summary by status
    const summary = testCases.reduce((acc, testCase) => {
      acc[testCase.status] = (acc[testCase.status] || 0) + testCase.count;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 Test data summary:', summary);
    
    return result.count;
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    throw error;
  }
}

/**
 * Test the cleanup functionality
 */
export async function testCommunicationCleanup() {
  console.log('🧪 Testing CommunicationOutbox cleanup...');

  try {
    // First, create test data
    await createTestCommunicationOutboxData();

    // Get initial stats
    const initialStats = await (schoolPrisma as any).communicationOutbox.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    console.log('📈 Initial record counts:', 
      Object.fromEntries(initialStats.map((s: any) => [s.status, s._count.id]))
    );

    // Call cleanup endpoint (simulated)
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/cleanup-communication-outbox`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cleanup failed: ${response.statusText}`);
    }

    const cleanupResult = await response.json();
    console.log('🧹 Cleanup result:', cleanupResult.stats);

    // Get final stats
    const finalStats = await (schoolPrisma as any).communicationOutbox.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    console.log('📊 Final record counts:', 
      Object.fromEntries(finalStats.map((s: any) => [s.status, s._count.id]))
    );

    // Verify expected deletions
    const expectedDeletions = {
      sent: 10, // 35 days old > 30 day retention
      dead_letter: 3, // 10 days old > 7 day retention
      failed: 4, // 20 days old > 14 day retention
    };

    const actualDeletions = cleanupResult.stats;
    console.log('✅ Expected vs Actual deletions:', { expected: expectedDeletions, actual: actualDeletions });

    return cleanupResult;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  console.log('🧹 Cleaning up test CommunicationOutbox data...');

  try {
    const deleteResult = await (schoolPrisma as any).communicationOutbox.deleteMany({
      where: {
        recipientAddress: {
          contains: '@example.com',
        },
      },
    });

    console.log(`✅ Deleted ${deleteResult.count} test records`);
    return deleteResult.count;
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    try {
      await testCommunicationCleanup();
      console.log('✅ All tests completed successfully');
    } catch (error) {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    }
  })();
}
