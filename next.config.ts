import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // O proxy limita o buffering do multipart antes do Route Handler.
    proxyClientMaxBodySize: "3mb",
  },
};

export default nextConfig;
