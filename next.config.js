/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/signal-atlas",
  images: { unoptimized: true },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
