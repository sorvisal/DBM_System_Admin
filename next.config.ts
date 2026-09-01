import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "build",
  outputFileTracingRoot: import.meta.dirname,
  allowedDevOrigins: ["localhost:5180", "127.0.0.1:5180"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
