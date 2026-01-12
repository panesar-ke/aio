import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    useCache: true,
    reactCompiler: true,
  },
  typedRoutes: true,
};

export default nextConfig;
