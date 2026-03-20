import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['pg'],
  // Increase body size limit for email attachments
  // This needs to be configured in middleware.ts instead
};

export default nextConfig;
