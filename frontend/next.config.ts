import type { NextConfig } from 'next';

// The backend origin that /api/* and /uploads/* are proxied to. This is read at
// build time, so it has to be present in the Vercel project's environment.
const apiUrl = process.env.API_URL;

if (!apiUrl) {
  console.warn(
    '[next.config] API_URL is not set. /api/* and /uploads/* will not be proxied, ' +
      'so the app will fall back to its bundled sample listings. Set API_URL to the ' +
      'deployed backend origin and rebuild.',
  );
}

const backendUrl = (apiUrl || 'http://localhost:3001').replace(/\/$/, '');

const config: NextConfig = {
  turbopack: { root: __dirname },
  async rewrites() {
    if (!apiUrl) return [];
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
    ];
  },
};
export default config;