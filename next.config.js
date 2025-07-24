/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/flow/:path*',
        destination: '/api/flow-proxy/:path*',
      },
    ];
  },
}

module.exports = nextConfig 