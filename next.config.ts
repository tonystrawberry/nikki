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
};

export default nextConfig;
