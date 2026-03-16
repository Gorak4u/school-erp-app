/**
 * Subdomain utilities for school-specific URLs
 *
 * Production: xxx.schoolerp.com  (set NEXT_PUBLIC_APP_DOMAIN=schoolerp.com)
 * Development: xxx.localhost:3000 (set NEXT_PUBLIC_APP_DOMAIN=localhost)
 */

/** Generate a URL-safe subdomain from a school name */
export function generateSubdomain(schoolName: string): string {
  return schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/^[0-9]/, (match: string) => `s${match}`);
}

/** Validate subdomain format and reserved words */
export function validateSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (!subdomain) return { valid: false, error: 'Subdomain is required' };
  if (subdomain.length < 3) return { valid: false, error: 'Must be at least 3 characters' };
  if (subdomain.length > 63) return { valid: false, error: 'Must be less than 64 characters' };
  if (!/^[a-z0-9-]+$/.test(subdomain)) return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) return { valid: false, error: 'Cannot start or end with a hyphen' };

  const reserved = [
    'www', 'mail', 'ftp', 'admin', 'api', 'app', 'blog', 'support', 'help',
    'docs', 'test', 'dev', 'staging', 'prod', 'localhost', 'example', 'demo',
    'trial', 'beta', 'alpha', 'static', 'assets', 'cdn', 'media', 'ns1', 'ns2',
    'smtp', 'pop', 'imap', 'webmail', 'saas', 'erp', 'billing', 'login',
    'register', 'signup', 'dashboard', 'panel', 'settings', 'status', 'health',
  ];

  if (reserved.includes(subdomain)) return { valid: false, error: `"${subdomain}" is reserved` };
  return { valid: true };
}

/**
 * Extract school subdomain from the hostname.
 * Works for both production (xyz.schoolerp.com) and dev (xyz.localhost:3000).
 */
export function extractSubdomain(hostname: string): string | null {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  const host = hostname.split(':')[0];

  if (appDomain === 'localhost') {
    if (host === 'localhost' || host === 'www.localhost' || host === '127.0.0.1') return null;
    if (host.endsWith('.localhost')) {
      return host.slice(0, -('.localhost'.length)) || null;
    }
    return null;
  }

  if (host === appDomain || host === `www.${appDomain}`) return null;
  if (host.endsWith(`.${appDomain}`)) {
    return host.slice(0, -(`.${appDomain}`).length) || null;
  }
  return null;
}

/** Build the full school subdomain URL */
export function getSubdomainUrl(subdomain: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  const port = process.env.NEXT_PUBLIC_APP_PORT || '';
  const portStr = port && port !== '80' && port !== '443' ? `:${port}` : '';
  const protocol = domain === 'localhost' ? 'http' : 'https';
  return `${protocol}://${subdomain}.${domain}${portStr}`;
}

/** Check if a hostname is a school subdomain request */
export function isSubdomainRequest(hostname: string): boolean {
  return extractSubdomain(hostname) !== null;
}
