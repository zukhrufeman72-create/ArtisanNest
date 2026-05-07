import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// React + Turbopack require eval() in dev mode for source maps and fast refresh.
// In production we keep the strict script-src without unsafe-eval.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com"
  : "script-src 'self' 'unsafe-inline' https://js.stripe.com"

const nextConfig: NextConfig = {
  // ── Security headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // ── Image optimisation allowlist ─────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // ── Production hardening ─────────────────────────────────────────────────────
  poweredByHeader: false,
  serverExternalPackages: ['bcryptjs', 'nodemailer'],
}

export default nextConfig
