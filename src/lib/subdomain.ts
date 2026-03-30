/**
 * Subdomain utilities for school-specific URLs
 *
 * Production: xxx.schoolerp.com  (set NEXT_PUBLIC_APP_DOMAIN=schoolerp.com)
 * Development: xxx.localhost:3000 (set NEXT_PUBLIC_APP_DOMAIN=localhost)
 */

/** Generate a URL-safe subdomain from a school name */
export function generateSubdomain(schoolName: string): string {
  // For long names (>25 chars) or names with common words, create acronym
  if (schoolName.length > 25 || hasCommonWords(schoolName)) {
    return generateAcronymSubdomain(schoolName);
  }
  
  // For shorter names, still try to keep them concise
  const cleanName = schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // If cleaned name is still long (>20 chars), truncate it
  if (cleanName.length > 20) {
    return cleanName.slice(0, 20).replace(/-+$/, '');
  }
  
  return cleanName
    .slice(0, 63)
    .replace(/^[0-9]/, (match: string) => `s${match}`);
}

/** Check if school name contains common words that should trigger acronym generation */
function hasCommonWords(schoolName: string): boolean {
  const commonWords = ['school', 'college', 'institution', 'academy', 'international', 'public', 'government', 'private', 'higher', 'secondary', 'primary', 'elementary', 'high', 'junior', 'senior', 'sri', 'smt', 'shri', 'shrimati'];
  
  const words = schoolName.toLowerCase().split(/\s+/);
  return words.some(word => commonWords.includes(word));
}

/** Generate acronym-based subdomain for long school names */
function generateAcronymSubdomain(schoolName: string): string {
  // Remove common words and honorifics, get meaningful words
  const commonWords = ['school', 'college', 'institution', 'academy', 'international', 'public', 'government', 'private', 'higher', 'secondary', 'primary', 'elementary', 'high', 'junior', 'senior', 'sri', 'smt', 'shri', 'shrimati', 'the', 'of', 'and', 'for'];
  
  const words = schoolName
    .toLowerCase()
    .split(/\s+/)
    .filter(word => !commonWords.includes(word) && word.length > 0);
  
  // If we have enough meaningful words, take first letter of first 3-4 words
  if (words.length >= 3) {
    return words.slice(0, 4).map(word => word[0]).join(''); // SVSN for "Sri Veerabhadreswara School Nittur"
  }
  
  // If 2 words, take first 2 letters of each
  if (words.length === 2) {
    return words.map(word => word.slice(0, 2)).join(''); // SV for "Sri Veerabhadreswara", or VE for "Veerabhadreswara School"
  }
  
  // If 1 meaningful word, take first 4 letters
  if (words.length === 1) {
    return words[0].slice(0, 4); // VEEB for "Veerabhadreswara"
  }
  
  // Fallback: take first letters of all words (including common ones)
  const allWords = schoolName.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (allWords.length >= 2) {
    return allWords.slice(0, 3).map(word => word[0]).join('');
  }
  
  // Last resort: first 6 characters
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
 * 
 * NOTE: Subdomains are disabled if NEXT_PUBLIC_DISABLE_SUBDOMAINS is set.
 * This is useful for platforms like Railway that don't support wildcard SSL.
 */
export function extractSubdomain(hostname: string): string | null {
  // Disable subdomains if env var is set (Railway, Heroku, etc.)
  if (process.env.NEXT_PUBLIC_DISABLE_SUBDOMAINS === 'true') {
    return null;
  }
  
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  const host = hostname.split(':')[0]; // Remove port if present

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
