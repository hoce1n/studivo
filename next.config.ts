import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["studivo.ir"],
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