/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'silentintellect.com'],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'SilentIntellect',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Blockchain DeFi & Digital Identity Application',
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
};

module.exports = nextConfig;

