/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  // УБИРАЕМ trailingSlash, потому что он ломает API redirect → CORS
};

module.exports = nextConfig;
