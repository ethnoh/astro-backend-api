/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',   // ❌ УБРАТЬ — ломает API
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
