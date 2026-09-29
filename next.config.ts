import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
// Only force HTTPS when the app is actually served over HTTPS, so `next start` on
// localhost keeps working. Vercel always serves HTTPS.
const servesHttps =
  isProduction &&
  (Boolean(process.env.VERCEL) || (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://"));

// A deliberately conservative CSP. Script sources are left open for now because Firebase
// Auth loads Google scripts and frames at runtime; tightening that with nonces is on the
// security roadmap. Everything below is safe to enforce today.
const contentSecurityPolicy = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  servesHttps ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Google sign-in opens a popup that needs to talk back to this window.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(servesHttps
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  experimental: {
    serverActions: {
      // Logos and avatars are capped at 2 MB by the upload validator, this leaves room
      // for the multipart overhead.
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
