import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Required for ffmpeg.wasm to load WASM files correctly
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  // Added Cross-Origin Isolation headers for FFmpeg.wasm v0.12+
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
