/**
 * Subdomain redirect utilities for consistent logout and navigation behavior
 */

/**
 * Get the current subdomain from the hostname
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const host = window.location.hostname;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  
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

/**
 * Check if current request is on a school subdomain
 */
export function isSchoolSubdomain(): boolean {
  return getCurrentSubdomain() !== null;
}

/**
 * Generate school login URL for current subdomain
 */
export function getSchoolLoginUrl(): string {
  if (typeof window === 'undefined') return '/login';
  
  const host = window.location.hostname;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
  const port = window.location.port || '3000';
  const subdomain = getCurrentSubdomain();
  
  if (!subdomain) {
    return '/login';
  }
  
  if (appDomain === 'localhost') {
    return `http://${subdomain}.localhost:${port}/school-login`;
  } else {
    return `https://${subdomain}.${appDomain}/school-login`;
  }
}

/**
 * Smart redirect to appropriate login page based on subdomain
 */
export function smartLoginRedirect(error?: string): void {
  if (typeof window === 'undefined') return;
  
  const baseUrl = getSchoolLoginUrl();
  const errorParam = error ? `?error=${error}` : '';
  
  window.location.href = `${baseUrl}${errorParam}`;
}

/**
 * Smart logout redirect to preserve subdomain
 */
export function smartLogoutRedirect(): void {
  if (typeof window === 'undefined') return;
  
  const baseUrl = getSchoolLoginUrl();
  window.location.href = `${baseUrl}?reason=logout`;
}
