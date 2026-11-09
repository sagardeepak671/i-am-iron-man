import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(process.env.GITHUB_ACTIONS
    ? {
        basePath: "/i-am-iron-man",
      }
    : {}),
};

export default nextConfig;
