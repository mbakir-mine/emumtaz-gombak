import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // cPanel Node.js App runs the generated standalone server directly.
  output: 'standalone',
};

export default nextConfig;
