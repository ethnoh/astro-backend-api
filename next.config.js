/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
