import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy vercel.json routes → App Router canonical paths
      { source: '/onboarding',       destination: '/onboard',  permanent: true },
      { source: '/privacy-policy',   destination: '/privacy',  permanent: true },
      { source: '/terms-of-service', destination: '/terms',    permanent: true },
    ];
  },
};

export default nextConfig;
