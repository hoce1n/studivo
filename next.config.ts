import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["studivo.ir", "192.168.227.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
