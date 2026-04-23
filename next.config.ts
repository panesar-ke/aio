import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  /* config options here */
  experimental: {
    useCache: true,
  },
  typedRoutes: true,
};

export default nextConfig;
