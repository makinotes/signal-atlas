/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/signal-atlas",
  images: { unoptimized: true },
  turbopack: {},
};

module.exports = nextConfig;
