/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  swcMinify: false,
  experimental: { cpus: 1 },
};

module.exports = nextConfig;
