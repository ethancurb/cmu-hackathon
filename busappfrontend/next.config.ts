import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  devIndicators: false,
  async redirects() {
    return [{ source: "/trip", destination: "/", permanent: true }];
  },
};

export default nextConfig;
