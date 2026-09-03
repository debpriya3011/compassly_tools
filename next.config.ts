import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  webpack(config, { dev }) {
    // OneDrive can race with Webpack's disk cache, leaving its runtime pointing
    // at chunks that have already been moved or removed. Keep build caching in
    // memory so all generated chunks remain consistent for the whole build.
    if (config.cache && !dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};
export default nextConfig;
