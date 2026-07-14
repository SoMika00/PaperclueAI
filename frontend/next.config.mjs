/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://api:8000";

const nextConfig = {
  basePath: "/paperclue",
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
