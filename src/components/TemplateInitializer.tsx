import { ensureDefaultTemplates } from '@/lib/communication/templates/autoSeed';

/**
 * Server-side component to auto-seed default templates on app startup
 * This runs once on the server when the app initializes
 */
export async function TemplateInitializer() {
  // Only run on server
  if (typeof window === 'undefined') {
    try {
      await ensureDefaultTemplates();
    } catch (error) {
      console.error('Template initialization failed:', error);
    }
  }
  return null;
}
