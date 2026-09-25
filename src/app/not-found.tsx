import Link from "next/link";

/**
 * Only reached for a URL that doesn't even resolve to a locale segment (rare — the proxy normally
 * rewrites to /en or /es first). No parent layout wraps this file, so it provides its own shell,
 * matching the same deliberately-plain, non-locked-design treatment as `[lang]/not-found.tsx`.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, display: "grid", placeItems: "center", minHeight: "100vh", padding: "40px 20px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", color: "#050505", background: "#fff" }}>
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#929292", margin: "0 0 8px" }}>404</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>We couldn&apos;t find that page.</h1>
          <Link href="/" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 999, background: "#050505", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Back to homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
