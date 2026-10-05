import type { NextConfig } from 'next';

const backendUrl = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
const config: NextConfig = {
  turbopack: { root: __dirname },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
    ];
  },
};
export default config;
