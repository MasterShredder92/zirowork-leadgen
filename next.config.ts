import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Apex host → /home (307 to stay consistent with prior behavior)
      { source: '/', has: [{ type: 'host' as const, value: 'zirowork.com' }],     destination: '/home', permanent: false },
      { source: '/', has: [{ type: 'host' as const, value: 'www.zirowork.com' }], destination: '/home', permanent: false },
      // Legacy path aliases → App Router canonical paths
      { source: '/onboarding',       destination: '/onboard',  permanent: true },
      { source: '/privacy-policy',   destination: '/privacy',  permanent: true },
      { source: '/terms-of-service', destination: '/terms',    permanent: true },
    ];
  },
};

export default nextConfig;
