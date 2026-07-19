import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  logging: {
    fetches: {
      fullUrl: true,
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000'
      }
    ]
  },
  typedRoutes: true,
};

export default nextConfig;
