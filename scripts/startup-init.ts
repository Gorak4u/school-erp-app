#!/usr/bin/env tsx

import { ensureSuperAdmin } from '../src/lib/super-admin-init';
import { logger } from '../src/lib/logger';

console.log('🚀 Initializing application...\n');

async function initializeApp() {
  try {
    // Initialize super admin if configured
    console.log('🔧 Checking super admin configuration...');
    await ensureSuperAdmin();
    console.log('✅ Super admin configuration completed\n');
    
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
