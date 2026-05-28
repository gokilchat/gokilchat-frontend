import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'rnznjberirluwrypqonh.supabase.co',
      },
    ],
  },
  allowedDevOrigins: [
    'chat.gokilchat.online'
  ],
};

export default nextConfig;
