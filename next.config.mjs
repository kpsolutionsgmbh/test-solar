/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lrczsetokgqguxzcuotb.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    const baseHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(self), geolocation=()',
      },
    ];

    return [
      {
        // Dashboard + API: strict framing protection
        source: '/dashboard/:path*',
        headers: [
          ...baseHeaders,
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/login',
        headers: [
          ...baseHeaders,
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          ...baseHeaders,
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        // Customer-facing pages: no X-Frame-Options (allows embedding if needed)
        source: '/d/:path*',
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;
