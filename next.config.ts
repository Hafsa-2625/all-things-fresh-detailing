import type { NextConfig } from "next";
import { redirectRules } from "./src/seo/redirects";

function originOf(value: string | undefined): string {
  try {
    return value ? new URL(value).origin : "";
  } catch {
    return "";
  }
}

// Headers are resolved at build time, so NEXT_PUBLIC_SUPABASE_URL must be set when building.
const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  // The approved design runtime (public/support.js) compiles its templates with
  // new Function, and Next injects inline bootstrap scripts into static pages, so
  // this policy cannot be nonce-based without making every public page dynamic.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "frame-src https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.instagram.com https://www.tiktok.com",
  `connect-src 'self' ${supabaseOrigin} https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com${isDevelopment ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pages refresh published content every 60s (PUBLIC_CONTENT_REVALIDATE_SECONDS in
  // src/lib/supabase/public.ts). Next's default expireTime (1 year) sends
  // `stale-while-revalidate=31535940`; Chrome honours that in its own cache, and because the approved
  // design runtime fetches the page URL on load, every visit fired a background revalidation that
  // stalled for 30s. Matching the window removes the stale allowance and that request.
  expireTime: 60,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  async redirects() {
    return redirectRules.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: r.permanent,
    }));
  },
};

export default nextConfig;
