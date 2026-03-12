import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirect root to default locale
  async redirects() {
    return [
      {
        source: '/',
        destination: '/fr',
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
