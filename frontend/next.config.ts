import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    // Self-serve signup is closed; /login is the only way in.
    return [{ source: '/register', destination: '/login', permanent: false }];
  },
};

export default nextConfig;
