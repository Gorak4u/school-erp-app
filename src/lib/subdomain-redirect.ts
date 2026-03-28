/**
 * Subdomain redirect utilities for consistent logout and navigation behavior
 */

/**
 * Get the current subdomain from the hostname
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const host = window.location.hostname;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  
  // If no app domain configured, assume localhost
  if (!appDomain) {
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
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  const protocol = window.location.protocol;
  const port = window.location.port;
  const subdomain = getCurrentSubdomain();
  
  if (!subdomain) {
    return '/login';
  }
  
  if (!appDomain) {
    // Local development with subdomain
    return port ? `${protocol}//${subdomain}.localhost:${port}/school-login` : `${protocol}//${subdomain}.localhost/school-login`;
  } else {
    // Production with subdomain
    return `${protocol}//${subdomain}.${appDomain}/school-login`;
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
  
  const subdomain = getCurrentSubdomain();
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  
  if (!subdomain) {
    window.location.href = '/login';
    return;
  }
  
  if (!appDomain) {
    // Local development with subdomain - use current protocol
    const protocol = window.location.protocol;
    const port = window.location.port;
    const baseUrl = `${protocol}//${subdomain}.localhost${port ? `:${port}` : ''}`;
    window.location.href = `${baseUrl}/school-login?reason=logout`;
  } else {
    // Production with subdomain
    const protocol = window.location.protocol;
    window.location.href = `${protocol}//${subdomain}.${appDomain}/school-login?reason=logout`;
  }
}
