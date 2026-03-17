/**
 * Subdomain utilities for school-specific URLs
 *
 * Production: xxx.schoolerp.com  (set NEXT_PUBLIC_APP_DOMAIN=schoolerp.com)
 * Development: xxx.localhost:3000 (set NEXT_PUBLIC_APP_DOMAIN=localhost)
 */

/** Generate a URL-safe subdomain from a school name */
export function generateSubdomain(schoolName: string): string {
  // For long names (>30 chars), create acronym
  if (schoolName.length > 30) {
    return generateAcronymSubdomain(schoolName);
  }
  
  return schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/^[0-9]/, (match: string) => `s${match}`);
}

/** Generate acronym-based subdomain for long school names */
function generateAcronymSubdomain(schoolName: string): string {
  // Remove common words and get meaningful words
  const commonWords = ['school', 'college', 'institution', 'academy', 'international', 'public', 'government', 'private', 'higher', 'secondary', 'primary', 'elementary', 'high', 'junior', 'senior'];
  
  const words = schoolName
    .toLowerCase()
    .split(/\s+/)
    .filter(word => !commonWords.includes(word) && word.length > 0);
  
  // If we have enough words, take first letter of first 3-4 words
  if (words.length >= 3) {
    return words.slice(0, 4).map(word => word[0]).join(''); // SVSN for "Sri Veerabhadreswara School Nittur"
  }
  
  // If less than 3 words, take first 2-3 letters of each word
  if (words.length === 2) {
    return words.map(word => word.slice(0, 2)).join(''); // SrVe for "Sri Veerabhadreswara"
  }
  
  // If only one word, take first 4 letters
  if (words.length === 1) {
    return words[0].slice(0, 4);
  }
  
  // Fallback to first 6 characters of the full name
  return schoolName.toLowerCase().slice(0, 6).replace(/[^a-z0-9]/g, '');
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
