import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip rebundling heavy Node.js packages — reduces Turbopack compile time
  serverExternalPackages: ['sharp', 'puppeteer', 'nodemailer', 'jsonwebtoken', 'pdfjs-dist'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
};

export default nextConfig;
