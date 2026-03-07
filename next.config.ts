import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OpenLayers uses large ES modules; transpile it for Next.js compatibility
  transpilePackages: ["ol"],
};

export default nextConfig;
