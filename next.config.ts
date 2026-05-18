import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Required for ffmpeg.wasm to load WASM files correctly
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

export default nextConfig;