import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.69:3005", "192.168.1.69", "soft-insects-play.loca.lt", "*.loca.lt"],
  turbopack: {},
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
