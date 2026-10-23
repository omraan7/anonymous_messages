import type { NextConfig } from "next";

// The browser only ever talks to THIS origin ("/api/*"); Next forwards to the backend.
// That makes the session cookies first-party (SameSite=Strict/Lax just work, no CORS,
// no third-party-cookie blocking) and keeps the backend URL private to the server.
const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
