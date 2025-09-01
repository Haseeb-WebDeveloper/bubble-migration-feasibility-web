import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qmytvglfwsvqnhhqwvpf.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/user-images/**",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
