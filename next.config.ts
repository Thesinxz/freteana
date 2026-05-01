import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
