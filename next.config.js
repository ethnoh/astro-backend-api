/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",  // ← ← ← КРИТИЧЕСКИ ВАЖНО!!!
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
