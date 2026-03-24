#!/usr/bin/env tsx

import 'dotenv/config';

console.log('🚀 Initializing application...\n');

async function initializeApp() {
  try {
    const { ensureSuperAdmin } = await import('../src/lib/super-admin-init');
    const { initializeCronScheduler } = await import('../src/lib/cronScheduler');

    // Initialize super admin if configured
    console.log('🔧 Checking super admin configuration...');
    await ensureSuperAdmin();
    console.log('✅ Super admin configuration completed\n');

    // Initialize cron scheduler at runtime only (never during build)
    console.log('⏰ Initializing cron scheduler...');
    const cronReady = await initializeCronScheduler();
    if (cronReady) {
      console.log('✅ Cron scheduler initialized\n');
    } else {
      console.warn('⚠️ Cron scheduler skipped (database unavailable)\n');
    }
    
    console.log('🚀 Application initialization completed successfully!');
    console.log('📝 Ready to start the server.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    console.error('\n💡 Please check your configuration and try again.\n');
    
    process.exit(1);
  }
}

// Run initialization
initializeApp();
