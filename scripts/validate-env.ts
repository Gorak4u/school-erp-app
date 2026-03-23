#!/usr/bin/env tsx

import { validateRuntimeCriticalEnv } from '../src/lib/env-validation';

console.log('🔍 Validating critical environment variables only...\n');

try {
  // Validate only critical environment variables
  validateRuntimeCriticalEnv();
  
  console.log('✅ Critical environment validation completed successfully!');
  console.log('🚀 Application can start safely.\n');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Critical environment validation failed:', error);
  console.error('\n💡 Please check your .env file and ensure critical variables are set.');
  console.error('📝 See .env.example for reference.\n');
  
  process.exit(1);
}
