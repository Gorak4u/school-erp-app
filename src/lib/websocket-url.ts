/**
 * Get the correct WebSocket server URL based on current deployment and subdomain configuration
 * Ensures WebSocket connections always go to the main domain where the server is running
 */
export function getWebSocketServerUrl(): string {
  // Use explicitly configured API URL if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // For development with subdomains, always connect to main domain
  if (hostname !== 'localhost' && hostname.endsWith('.localhost')) {
    // Extract main domain from subdomain (svsn.localhost -> localhost)
    return `${protocol}//localhost${port ? ':' + port : ''}`;
  }

  // For production with subdomains, connect to main domain
  if (hostname !== 'localhost' && hostname.includes('.')) {
    // Extract main domain from subdomain (svsn.schoolerp.com -> schoolerp.com)
    const parts = hostname.split('.');
    const mainDomain = parts.slice(-2).join('.'); // Get last 2 parts: schoolerp.com
    return `${protocol}//${mainDomain}${port ? ':' + port : ''}`;
  }

  // For Railway deployment with subdomains disabled
  if (process.env.NEXT_PUBLIC_DISABLE_SUBDOMAINS === 'true' && hostname !== 'localhost') {
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  }

  // Default: use current origin
  return window.location.origin;
}
