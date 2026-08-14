import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    useTypeScriptCli: true,
  },
  reactCompiler: true,
  typedRoutes: true,
};

export default nextConfig;
