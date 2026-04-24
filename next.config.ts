import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
    useCache: true,
  },
  typedRoutes: true,
};

export default nextConfig;
