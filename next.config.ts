import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: "/hetel-hasbaha",
  assetPrefix: "/hetel-hasbaha",
};

export default nextConfig;
