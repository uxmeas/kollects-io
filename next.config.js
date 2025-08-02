/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['assets.nflallday.com', 'media.nflallday.com'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig