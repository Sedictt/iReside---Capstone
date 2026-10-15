import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip rebundling heavy Node.js packages — reduces Turbopack compile time
  serverExternalPackages: ['sharp', 'puppeteer', 'nodemailer', 'jsonwebtoken', 'pdfjs-dist'],
  // Disable dev indicators (e.g. the floating "● Compiling..." pill that covers mobile UI)
  devIndicators: false,
  images: {
    // Disable server-side image proxying/resizing in Node.js.
    // Client browsers load remote avatars directly, preventing server hangs and 504 timeouts.
    unoptimized: true,
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
  async headers() {
    return [
      {
        // Baseline browser hardening for every response. A full Content-Security-Policy
        // is intentionally not set here (inline scripts, fonts and Supabase would need an
        // allow-list); frame-ancestors alone blocks clickjacking without that risk.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
      {
        source: '/downloads/:path*.apk',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/vnd.android.package-archive',
          },
          {
            key: 'Content-Disposition',
            value: 'attachment',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/tenant/download',
        destination: '/download',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
